'use client'

import {useState, useEffect} from 'react'
import './globals.css'
import {Toaster} from 'react-hot-toast'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { getAvailableRewards, getUserByEmail } from '@/utils/db/actions'


// header
// sidebar


export default function RootLayout({
  children,
}:{
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [totalEarnings, setTotalEarnings] = useState(10)

  useEffect(() => {
    const fetchTotalEarnings = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail')
        if (userEmail) {
          const user = await getUserByEmail(userEmail)
          console.log('user from layout', user);
          
          if (user) {
            const availableRewards = await getAvailableRewards(user.id) as any
            console.log('availableRewards from layout', availableRewards);
                        setTotalEarnings(availableRewards)
          }
        }
      } catch (error) {
        console.error('Error fetching total earnings:', error)
      }
    }

    fetchTotalEarnings()
  }, [])

  return(
    <html lang='en'> 
    <body>
      <div className='min-h-screen bg-gray-50 flex flex-col'>
        {/* header */}
        <Header onMenuClick={()=> setSidebarOpen(!sidebarOpen)} totalEarnings={totalEarnings}/>
        <div className='flex flex-1'>
          {/* {sidebar} */}
          <Sidebar open={sidebarOpen}/>
          <main className='flex-1 p-4 lg:p-8 ml-0 lg:ml-64 transition-all duration-300'>
            {children}
          </main>
        </div>
      </div>
      <Toaster/>
    </body>
    </html>
  )
}