import { type ReactNode } from 'react'

import { Outlet, useLocation } from 'react-router-dom'

import SideBar from '@/components/side-bar/side-bar'
import TopBar from '@/components/top-bar/top-bar'
import { ROUTE } from '@/core/constants/path'
import { cn } from '@/core/lib/utils'
import { FooterSection } from '@/pages/home/components/footer-section'

interface LayoutMainProps {
  children?: ReactNode
}

const LayoutMain = ({ children }: LayoutMainProps) => {
  const location = useLocation()
  const isChatAiPage = location.pathname === ROUTE.USER.CHAT_AI

  return (
    <div>
      <div className='flex min-h-screen'>
        <SideBar />
        <div className='flex flex-col flex-1 min-w-0 min-h-0 bg-background-secondary'>
          <TopBar />
          <main
            className={cn(
              'relative flex-1 transition-all duration-300 min-w-0',
              'backdrop-blur-sm'
            )}
          >
            {/* Background Pattern */}
            <div className='absolute inset-0 opacity-[0.02] dark:opacity-[0.05]'>
              <div
                className='w-full h-full'
                style={{
                  backgroundImage: `radial-gradient(circle at 25px 25px, #64748b 2px, transparent 0)`,
                  backgroundSize: '50px 50px'
                }}
              />
            </div>

            {/* Content Container */}
            <div className='relative z-10 p-4 h-full'>
              <div className='mx-auto max-w-none h-full'>
                <div
                  className={cn(
                    'rounded-2xl border min-h-[calc(100vh-140px)] border-border-secondary',
                    'shadow-2xl backdrop-blur-xl bg-background-primary',
                    'h-full transition-all duration-300 hover:shadow-3xl',
                    'mx-auto',
                    'flex flex-col'
                  )}
                >
                  {children || <Outlet />}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      {!isChatAiPage && <FooterSection />}
    </div>
  )
}

export default LayoutMain
