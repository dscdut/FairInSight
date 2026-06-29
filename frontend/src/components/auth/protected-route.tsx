import { type ReactNode, useEffect } from 'react'

import { ShieldAlert, LogOut, Mail } from 'lucide-react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui'
import { ROUTE } from '@/core/constants/path'
import { STATUS } from '@/core/helpers/key-tanstack'
import { getAccessTokenFromLS } from '@/core/shared/storage'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { useAuth } from '@/hooks/auth/use-auth'

interface ProtectedRouteProps {
  children?: ReactNode
  redirectPath?: string
}

const BannedScreen = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-background-secondary/35 p-6 animate-in fade-in duration-300'>
      <div className='max-w-md w-full bg-background-primary border border-border-secondary p-8 rounded-3xl shadow-xl flex flex-col items-center text-center space-y-6'>
        {/* Pulsing Lock Icon */}
        <div className='p-4.5 bg-error-primary/10 rounded-full border border-error-primary/20 text-error-primary animate-pulse shadow-inner'>
          <ShieldAlert className='w-10 h-10' />
        </div>

        {/* Text Details */}
        <div className='space-y-2.5'>
          <h2 className='text-xl font-bold text-text-primary tracking-tight'>
            Tài khoản của bạn đã bị khóa
          </h2>
          <p className='text-sm text-text-description leading-relaxed'>
            Hệ thống phát hiện tài khoản của bạn đang trong trạng thái bị tạm khóa do vi phạm điều khoản dịch vụ hoặc theo yêu cầu của ban quản trị.
          </p>
        </div>

        {/* Action Buttons */}
        <div className='w-full pt-2 flex flex-col gap-3'>
          <a
            href='mailto:support@fairinsight.vn'
            className='w-full flex items-center justify-center gap-2 py-3 px-4 bg-background-secondary hover:bg-background-secondary/80 border border-border-secondary rounded-2xl text-sm font-bold text-text-primary transition-all duration-200 cursor-pointer'
          >
            <Mail className='w-4 h-4' />
            Liên hệ hỗ trợ
          </a>
          <Button
            onClick={onLogout}
            variant='destructive'
            className='w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-error-primary text-white hover:bg-error-primary/95 transition-all duration-200 cursor-pointer font-bold border-transparent'
          >
            <LogOut className='w-4 h-4' />
            Đăng xuất tài khoản
          </Button>
        </div>
      </div>
    </div>
  )
}

const ProtectedRoute = ({ children, redirectPath = ROUTE.AUTH.LOGIN }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const accessToken = getAccessTokenFromLS()
    if (!accessToken) {
      navigate(ROUTE.HOME, { replace: true })
    }
  }, [location.pathname, navigate])

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />
  }

  // Intercept banned users
  if (user?.status === STATUS.BANNED) {
    return <BannedScreen onLogout={logout} />
  }

  return children ? <>{children}</> : <Outlet />
}

export default ProtectedRoute
