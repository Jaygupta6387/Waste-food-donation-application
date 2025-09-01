// @ts-nocheck
'use client'
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Menu, Coins, Leaf, Search, Bell, User, ChevronDown, LogIn } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base"
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { createUser, getUnreadNotifications, markNotificationAsRead, getUserByEmail, getUserBalance } from "@/utils/db/actions"

const clientId = process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID || "BKR-sd2XSRAfXQsIYnjyovp-hBsWBOaVMqw6CCkIFkom7x_kqKWAcTVr1YgGf7z-9oEptN5VI5S0ZYMPfhBxNxw";

// Log client ID status for debugging
if (!process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID) {
  console.warn("⚠️ Web3Auth Client ID not found! Please create a .env.local file with NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID");
  console.warn("📖 Check WEB3AUTH_SETUP.md for setup instructions");
}

// Multiple RPC endpoints for reliability
const rpcEndpoints = [
  "https://ethereum.publicnode.com",
  "https://rpc.builder0x69.io",
  "https://rpc.ankr.com/eth",
  "https://cloudflare-eth.com"
];

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x1", // Mainnet for better compatibility
  rpcTarget: rpcEndpoints[0], // Use the first reliable endpoint
  displayName: "Ethereum Mainnet",
  blockExplorerUrl: "https://etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET, // Match your project environment
  privateKeyProvider,
  enableLogging: true, // Enable logging for debugging
  sessionTime: 86400, // 24 hours session
});

interface HeaderProps {
  onMenuClick: () => void;
  totalEarnings: number;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Header({ onMenuClick, totalEarnings }: HeaderProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [web3AuthReady, setWeb3AuthReady] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [balance, setBalance] = useState(0)

  console.log('user info', userInfo);
  
  useEffect(() => {
    const init = async () => {
      if (!clientId || clientId === "YOUR_WEB3AUTH_CLIENT_ID") {
        console.error("Web3Auth client ID is missing or not configured");
        setLoading(false);
        return;
      }
      
      try {
        console.log("Initializing Web3Auth with client ID:", clientId);
        
        // Add retry logic with exponential backoff
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            await web3auth.initModal();
            console.log("Web3Auth modal initialized successfully");
            break; // Success, exit retry loop
          } catch (error) {
            retryCount++;
            console.warn(`Web3Auth initialization attempt ${retryCount} failed:`, error);
            
            if (retryCount >= maxRetries) {
              throw error; // Re-throw if all retries failed
            }
            
            // Wait before retrying (exponential backoff)
            const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        // Add a small delay to ensure Web3Auth is fully ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setWeb3AuthReady(true);
        setProvider(web3auth.provider);

        if (web3auth.connected) {
          console.log("Web3Auth already connected");
          setLoggedIn(true);
          const user = await web3auth.getUserInfo();
          setUserInfo(user);
          if (user.email) {
            localStorage.setItem('userEmail', user.email);
            try {
              await createUser(user.email, user.name || 'Anonymous User');
            } catch (error) {
              console.error("Error creating user:", error);
            }
          }
        } else {
          console.log("Web3Auth not connected, ready for login");
        }
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
        
        // Handle specific error types
        if (error instanceof Error) {
          if (error.message.includes("client_id")) {
            console.error("Invalid or missing Web3Auth client ID");
          } else if (error.message.includes("failed to fetch project configurations")) {
            console.error("Network error or invalid client ID. Please check your internet connection and client ID.");
          } else if (error.message.includes("Wallet is not ready yet")) {
            console.error("Web3Auth service is having issues. Please try again later.");
          } else if (error.message.includes("OAuth")) {
            console.error("OAuth configuration issue. Please check that Google OAuth is enabled in your Web3Auth project.");
          } else if (error.message.includes("redirect")) {
            console.error("Redirect URI configuration issue. Please check your Web3Auth project settings.");
          } else if (error.message.includes("Unauthorized") || error.message.includes("API key")) {
            console.error("RPC endpoint authentication issue. This is likely a temporary network issue.");
          }
        }
        
        // Set ready to false if initialization fails
        setWeb3AuthReady(false);
      } finally {
        setLoading(false);
      }
    };

    // Initialize Web3Auth but don't block the UI
    init();
  }, [clientId]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (userInfo && userInfo.email) {
        const user = await getUserByEmail(userInfo.email);
        if (user) {
          const unreadNotifications = await getUnreadNotifications(user.id);
          setNotifications(unreadNotifications);
        }
      }
    };

    fetchNotifications();

    // Set up periodic checking for new notifications
    const notificationInterval = setInterval(fetchNotifications, 30000); // Check every 30 seconds

    return () => clearInterval(notificationInterval);
  }, [userInfo]);

  useEffect(() => {
    const fetchUserBalance = async () => {
      if (userInfo && userInfo.email) {
        const user = await getUserByEmail(userInfo.email);
        if (user) {
          const userBalance = await getUserBalance(user.id);
          setBalance(userBalance);
        }
      }
    };

    fetchUserBalance();

    // Add an event listener for balance updates
    const handleBalanceUpdate = (event: CustomEvent) => {
      setBalance(event.detail);
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate as EventListener);

    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
    };
  }, [userInfo]);

  const login = async () => {
    if (!web3auth) {
      console.log("web3auth not initialized yet");
      alert("Authentication service not available. Please try again later.");
      return;
    }
    
    if (!web3AuthReady) {
      console.log("Web3Auth modal not ready yet");
      alert("Authentication service is still initializing. Please wait a moment and try again.");
      return;
    }
    
    if (!clientId || clientId === "YOUR_WEB3AUTH_CLIENT_ID") {
      console.error("Web3Auth client ID is missing. Please set NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID in your .env.local file");
      alert("Authentication configuration error. Please contact support.");
      return;
    }
    
    try {
      setLoading(true);
      console.log("Attempting to connect to Web3Auth...");
      
      const web3authProvider = await web3auth.connect();
      console.log("Web3Auth connected successfully");
      
      setProvider(web3authProvider);
      setLoggedIn(true);
      
      const user = await web3auth.getUserInfo();
      console.log("User info retrieved:", user);
      
      setUserInfo(user);
      if (user.email) {
        localStorage.setItem('userEmail', user.email);
        try {
          await createUser(user.email, user.name || 'Anonymous User');
          console.log("User created/updated in database");
        } catch (error) {
          console.error("Error creating user:", error);
          // Don't block login if user creation fails
        }
      }
    } catch (error) {
      console.error("Error during login:", error);
      
              // More specific error messages
        let errorMessage = "Login failed. Please try again.";
        
        if (error instanceof Error) {
          if (error.message.includes("popup")) {
            errorMessage = "Login popup was blocked. Please allow popups and try again.";
          } else if (error.message.includes("network")) {
            errorMessage = "Network error. Please check your internet connection.";
          } else if (error.message.includes("user rejected")) {
            errorMessage = "Login was cancelled by user.";
          } else if (error.message.includes("not ready")) {
            errorMessage = "Authentication service is still initializing. Please wait and try again.";
          } else if (error.message.includes("Unauthorized") || error.message.includes("API key")) {
            errorMessage = "Network service temporarily unavailable. Please try again in a few minutes.";
          } else {
            errorMessage = `Login error: ${error.message}`;
          }
        }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    try {
      await web3auth.logout();
      setProvider(null);
      setLoggedIn(false);
      setUserInfo(null);
      localStorage.removeItem('userEmail');
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const getUserInfo = async () => {
    if (web3auth.connected) {
      const user = await web3auth.getUserInfo();
      setUserInfo(user);
      if (user.email) {
        localStorage.setItem('userEmail', user.email);
        try {
          await createUser(user.email, user.name || 'Anonymous User');
        } catch (error) {
          console.error("Error creating user:", error);
          // Handle the error appropriately, maybe show a message to the user
        }
      }
    }
  };

  const handleNotificationClick = async (notificationId: number) => {
    await markNotificationAsRead(notificationId);
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== notificationId)
    );
  };

  if (loading) {
    return (
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2 md:mr-4" onClick={onMenuClick}>
              <Menu className="h-6 w-6" />
            </Button>
            <Link href="/" className="flex items-center">
              <Leaf className="h-6 w-6 md:h-8 md:w-8 text-green-500 mr-1 md:mr-2" />
              <div className="flex flex-col">
                <span className="font-bold text-base md:text-lg text-gray-800">Zero2Hero</span>
                <span className="text-[8px] md:text-[10px] text-gray-500 -mt-1">ETHOnline24</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center">
            <div className="mr-2 md:mr-4 flex items-center bg-gray-100 rounded-full px-2 md:px-3 py-1">
              <Coins className="h-4 w-4 md:h-5 md:w-5 mr-1 text-green-500" />
              <span className="font-semibold text-sm md:text-base text-gray-800">
                {balance.toFixed(2)}
              </span>
            </div>
            <Button disabled className="bg-gray-400 text-white text-sm md:text-base">
              Loading...
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2 md:mr-4" onClick={onMenuClick}>
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/" className="flex items-center">
            <Leaf className="h-6 w-6 md:h-8 md:w-8 text-green-500 mr-1 md:mr-2" />
            <div className="flex flex-col">
              <span className="font-bold text-base md:text-lg text-gray-800">Zero2Hero</span>
              <span className="text-[8px] md:text-[10px] text-gray-500 -mt-1">ETHOnline24</span>
            </div>
          </Link>
        </div>
        {!isMobile && (
          <div className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        )}
        <div className="flex items-center">
          {isMobile && (
            <Button variant="ghost" size="icon" className="mr-2">
              <Search className="h-5 w-5" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{notification.type}</span>
                      <span className="text-sm text-gray-500">{notification.message}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem>No new notifications</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="mr-2 md:mr-4 flex items-center bg-gray-100 rounded-full px-2 md:px-3 py-1">
            <Coins className="h-4 w-4 md:h-5 md:w-5 mr-1 text-green-500" />
            <span className="font-semibold text-sm md:text-base text-gray-800">
              {balance.toFixed(2)}
            </span>
          </div>
          {!loggedIn ? (
            <div className="flex flex-col gap-2">
              <Button 
                onClick={login} 
                disabled={loading || !web3AuthReady}
                className="bg-green-600 hover:bg-green-700 text-white text-sm md:text-base disabled:bg-gray-400"
              >
                {loading ? 'Connecting...' : !web3AuthReady ? 'Initializing...' : 'Login with Web3Auth'}
                <LogIn className="ml-1 md:ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>
                             {(!clientId || clientId === "YOUR_WEB3AUTH_CLIENT_ID") && (
                 <Button 
                   onClick={() => {
                     alert("Please set up Web3Auth client ID first. Check WEB3AUTH_SETUP.md for instructions.");
                   }}
                   variant="outline"
                   size="sm"
                   className="text-xs"
                 >
                   Setup Required
                 </Button>
               )}


               {!web3AuthReady && loading && (clientId && clientId !== "YOUR_WEB3AUTH_CLIENT_ID") && (
                 <div className="text-xs text-blue-600 text-center">
                   🔄 Initializing Web3Auth...
                 </div>
               )}
               {!web3AuthReady && !loading && (clientId && clientId !== "YOUR_WEB3AUTH_CLIENT_ID") && (
                 <div className="text-xs text-orange-600 text-center">
                   ⚠️ Initialization failed
                 </div>
               )}
                             {!web3AuthReady && !loading && (clientId && clientId !== "YOUR_WEB3AUTH_CLIENT_ID") && (
                 <Button 
                   onClick={() => {
                     setLoading(true);
                     setWeb3AuthReady(false);
                     // Retry initialization with better error handling
                     setTimeout(() => {
                       const retryInit = async () => {
                         try {
                           console.log("Retrying Web3Auth initialization...");
                           await web3auth.initModal();
                           console.log("Retry successful!");
                           setWeb3AuthReady(true);
                         } catch (error) {
                           console.error("Retry failed:", error);
                           if (error instanceof Error && error.message.includes("failed to fetch project configurations")) {
                             alert("Configuration fetch failed. Please check your internet connection and verify your client ID is correct.");
                           } else {
                             alert("Retry failed. Please check your Web3Auth configuration.");
                           }
                         } finally {
                           setLoading(false);
                         }
                       };
                       retryInit();
                     }, 1000);
                   }}
                   variant="outline"
                   size="sm"
                   className="text-xs text-orange-600"
                 >
                   Retry Initialization
                 </Button>
               )}
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex items-center">
                  <User className="h-5 w-5 mr-1" />
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={getUserInfo}>
                  {userInfo ? userInfo.name : "Fetch User Info"}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}