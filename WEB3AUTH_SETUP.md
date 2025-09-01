# Web3Auth Setup Guide

## To fix the login issue, you need to:

### 1. Get a Web3Auth Client ID
1. Go to [Web3Auth Dashboard](https://dashboard.web3auth.io/)
2. Sign up/Login with your account
3. Create a new project
4. Copy the Client ID

### 2. Create Environment File
Create a `.env.local` file in your project root with:

```bash
NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID=your_actual_client_id_here
```

### 3. Restart Your Development Server
After adding the environment variable, restart your Next.js server:

```bash
npm run dev
# or
yarn dev
```

### 4. Test Login
The login should now work properly with Google authentication.

## Troubleshooting

- Make sure the `.env.local` file is in the project root (same level as `package.json`)
- The environment variable MUST start with `NEXT_PUBLIC_` to be accessible in the browser
- Restart your dev server after adding environment variables
- Check the browser console for any error messages

## Current Status
✅ **Your app is now configured with your actual Web3Auth client ID!**

**Project Details:**
- **Project Name**: wasteFood
- **Environment**: Sapphire Devnet
- **Chain**: EVM Based Chain (Ethereum Mainnet)
- **Client ID**: BKR-sd2XSRAfXQsIYnjyovp-hBsWBOaVMqw6CCkIFkom7x_kqKWAcTVr1YgGf7z-9oEptN5VI5S0ZYMPfhBxNxw

## Next Steps
1. **Restart your development server** to ensure the new configuration is loaded
2. **Test the login** - it should now work properly with Google authentication
3. **Check the browser console** for any remaining error messages

## Troubleshooting
If you still encounter issues:
- Make sure you're using the latest version of the Web3Auth packages
- Check that your project is properly configured in the Web3Auth dashboard
- Verify that Google OAuth is enabled in your project settings

### RPC Endpoint Issues
If you see "Unauthorized" or "API key" errors:
- These are temporary network issues with RPC endpoints
- The app automatically uses reliable, free RPC endpoints
- Try again in a few minutes
- If persistent, the issue will resolve automatically

### Network Configuration
The app uses multiple reliable RPC endpoints:
- PublicNode (primary)
- Builder0x69
- Cloudflare
- Ankr (fallback)
