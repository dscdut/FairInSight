import { useEffect } from 'react'

import { ThemeProvider } from '@/app/providers/theme-provider'
import AutoScrollToTop from '@/components/scroll/auto-scroll-to-top'
import { scheduleTokenRefresh } from '@/core/shared/auth-refresh'
import { getAccessTokenFromLS } from '@/core/shared/storage'
import useRoutesElements from '@/hooks/routes/use-router-element'
import '@/styles/theme.css'
import { Agentation } from 'agentation'

const App = () => {
  const router = useRoutesElements()

  // F5/mở lại tab mà còn token → khởi động timer proactive refresh theo exp.
  useEffect(() => {
    if (getAccessTokenFromLS()) scheduleTokenRefresh()
  }, [])

  return (
    <ThemeProvider>
      <AutoScrollToTop behavior='smooth' />
      {router}
      {import.meta.env.DEV && <Agentation />}
    </ThemeProvider>
  )
}

export default App
