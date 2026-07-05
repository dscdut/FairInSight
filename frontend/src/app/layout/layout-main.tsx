import { type ReactNode, Suspense } from 'react'

import { Outlet } from 'react-router-dom'

import BottomNav from '@/components/bottom-nav/bottom-nav'
import SideBar from '@/components/side-bar/side-bar'
import TopBar from '@/components/top-bar/top-bar'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { cn } from '@/core/lib/utils'

interface LayoutMainProps {
  children?: ReactNode
}

const LayoutMain = ({ children }: LayoutMainProps) => {
  return (
    <div>
      <div className='flex min-h-screen'>
        <SideBar />
        <div className='flex flex-col flex-1 min-w-0 min-h-0 bg-background-secondary pb-20 lg:pb-0 relative'>
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
            <div className='relative z-10 sm:p-4 p-0 h-full'>
              <div className='mx-auto max-w-none h-full'>
                <div
                  className={cn(
                    'sm:rounded-2xl rounded-none sm:border border-none min-h-[calc(100vh-140px)] border-border-secondary',
                    'shadow-none sm:shadow-2xl backdrop-blur-xl bg-background-primary',
                    'h-full transition-all duration-300 hover:shadow-3xl',
                    'mx-auto',
                    'flex flex-col'
                  )}
                >
                  <Suspense fallback={
                    <div className='flex-1 flex items-center justify-center min-h-[300px]'>
                      <LoadingSpinner />
                    </div>
                  }>
                    {children || <Outlet />}
                  </Suspense>
                </div>
              </div>
            </div>
          </main>
          <BottomNav />
        </div>
      </div>
    </div>
  )
}

export default LayoutMain
