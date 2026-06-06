import { type ReactNode } from 'react'

import { Outlet } from 'react-router-dom'

import SideBar from '@/components/side-bar/side-bar'
import TopBar from '@/components/top-bar/top-bar'
import { cn } from '@/core/lib/utils'
import { useUserInfo } from '@/hooks/tanstack-query/auth/use-query-auth'
import { FooterSection } from '@/pages/home/components/footer-section'

interface LayoutMainProps {
  children?: ReactNode
}

const LayoutMain = ({ children }: LayoutMainProps) => {
  useUserInfo()
  return (
    <div>
      <div className='flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900'>
        <SideBar />
        <div className='flex flex-col flex-1 min-h-0'>
          <TopBar />
          <main
            className={cn(
              'relative flex-1 transition-all duration-300',
              'bg-gradient-to-br from-slate-50/50 via-white/80 to-slate-100/50',
              'dark:from-slate-900/50 dark:via-slate-800/80 dark:to-slate-900/50',
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
                    'rounded-2xl border min-h-[calc(100vh-140px)] border-white/20 dark:border-slate-700/30',
                    'shadow-2xl backdrop-blur-xl bg-white/70 dark:bg-slate-800/70',
                    'h-full transition-all duration-300 hover:shadow-3xl',
                    'mx-auto max-w-7xl px-4 lg:px-6'
                  )}
                >
                  {children || <Outlet />}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <FooterSection />
    </div>
  )
}

export default LayoutMain
