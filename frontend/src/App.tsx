import { useEffect, useState } from 'react'

import { Agentation } from 'agentation'

import { ThemeProvider } from '@/app/providers/theme-provider'
import AutoScrollToTop from '@/components/scroll/auto-scroll-to-top'
import { doRefresh } from '@/core/shared/auth-refresh'
import { getRefreshTokenFromLS } from '@/core/shared/storage'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import useRoutesElements from '@/hooks/routes/use-router-element'

import '@/styles/theme.css'

// Tách Routes thành component con để lắng nghe sự thay đổi của React Router (Location)
// và Zustand auth state, đảm bảo re-render và chuyển trang chính xác.
const AppContent = () => {
  const router = useRoutesElements()
  return <>{router}</>
}

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    const initializeAuth = async () => {
      const refreshToken = getRefreshTokenFromLS()
      if (refreshToken) {
        try {
          // Silent Refresh khi khởi chạy ứng dụng (F5/mở tab mới)
          await doRefresh()
        } catch (err) {
          console.error('Silent refresh failed on initialization:', err)
          logout()
        }
      } else {
        logout()
      }
      setIsInitializing(false)
    }

    initializeAuth()
  }, [logout])

  if (isInitializing) {
    return (
      <div className='h-screen w-screen flex flex-col items-center justify-center bg-background-primary'>
        <div className='animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent'></div>
        <p className='text-sm text-text-description mt-4 font-medium'>Đang khởi tạo ứng dụng...</p>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <AutoScrollToTop behavior='smooth' />
      <AppContent />
      {import.meta.env.DEV && <Agentation />}
    </ThemeProvider>
  )
}

export default App
