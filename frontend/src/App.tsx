import { useEffect, useState } from 'react'

import { Agentation } from 'agentation'

import { ThemeProvider } from '@/app/providers/theme-provider'
import AutoScrollToTop from '@/components/scroll/auto-scroll-to-top'
import { authApi } from '@/core/services/auth.service'
import { scheduleTokenRefresh } from '@/core/shared/auth-refresh'
import { getAccessTokenFromLS } from '@/core/shared/storage'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import useRoutesElements from '@/hooks/routes/use-router-element'
import { type Account } from '@/models/interface/auth.interface'

import '@/styles/theme.css'
import { type UserRole } from './models/user/types'

const AppContent = () => {
  const router = useRoutesElements()
  return <>{router}</>
}

const App = () => {
  const [isAppLoading, setIsAppLoading] = useState(true)
  const logout = useAuthStore((state) => state.logout)
  const updateUser = useAuthStore((state) => state.updateUser)
  useEffect(() => {
    const initializeApp = async () => {
      const accessToken = getAccessTokenFromLS()
      if (accessToken) {
        try {
          const userData = await authApi.getUserInfo() as Account
          updateUser({
            userId: userData.id || '',
            fullName: userData.fullName || '',
            email: userData.email || '',
            phone: userData.phone || '',
            location: userData.location || '',
            avatarUrl: userData.avatarUrl || '',
            roleName: userData.roleName as UserRole,
            status: userData.status
          })
          scheduleTokenRefresh()
        } catch (error: any) {
          console.error('Failed to fetch user info on app initialize:', error)
          if (error.response && [401, 403].includes(error.response.status)) {
            logout()
          }
        }
      }
      setIsAppLoading(false)
    }

    initializeApp()
  }, [logout, updateUser])

  if (isAppLoading) {
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
