import { type ReactNode, Suspense } from 'react'

import { Outlet, useLocation } from 'react-router-dom'

import Header from '@/components/header-nav/header-nav'
import LoadingSpinner from '@/components/ui/loading-spinner'
import { FooterSection } from '@/pages/home/components/footer-section'

interface LayoutClientProps {
  children?: ReactNode
}

export default function LayoutClient({ children }: LayoutClientProps) {
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  return (
    <>
      <Header />
      <main className={isHomePage ? '' : 'pt-[64px]'}>
        <Suspense fallback={
          <div className='flex items-center justify-center min-h-[400px] w-full'>
            <LoadingSpinner />
          </div>
        }>
          {children || <Outlet />}
        </Suspense>
      </main>
      <FooterSection />
    </>
  )
}
