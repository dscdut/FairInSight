import { lazy } from 'react'

import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import LayoutClient from '@/app/layout/layout-client'
import LayoutMain from '@/app/layout/layout-main'
import SuspenseProvider from '@/app/providers/suspense-provider'
import ProtectedRoute from '@/components/auth/protected-route'
import { ROLE_ADMIN } from '@/core/configs/consts'
import isEqual from '@/core/configs/is-equal'
import { ROUTE } from '@/core/constants/path'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { useAuth } from '@/hooks/auth/use-auth'

// Lazy load components
const Login = lazy(() => import('@/pages/login/Login'))
const Register = lazy(() => import('@/pages/register/Register'))
const VerifyAcountEmail = lazy(() => import('@/pages/verify-account-email/VerifyAcountEmail'))
const ForgotPassword = lazy(() => import('@/pages/forgot-password/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/reset-password/ResetPassword'))
const Dashboard = lazy(() => import('@/pages/admin/dashboard'))
const Users = lazy(() => import('@/pages/admin/users'))
const LegalDocuments = lazy(() => import('@/pages/admin/legal-documents'))
const PageNotFound = lazy(() => import('@/pages/404/PageNotFound'))
const Profile = lazy(() => import('@/pages/profile/Profile'))
const HomePage = lazy(() => import('@/pages/home/HomePage'))
const UserDashboard = lazy(() => import('@/pages/users/dashboard/Dashboard'))
const ProfileEdit = lazy(() => import('@/pages/profile/ProfileEdit'))
const AIChat = lazy(() => import('@/pages/users/ai-chat/AIChat'))
const LegalAnalysis = lazy(() => import('@/pages/users/legal-analysis/LegalAnalysis'))
const Report = lazy(() => import('@/pages/users/report/Report'))
const Setting = lazy(() => import('@/pages/users/setting/Setting'))
const Template = lazy(() => import('@/pages/users/template/Template'))
const User = lazy(() => import('@/pages/users/user/User'))
const LawyerList = lazy(() => import('@/pages/users/lawyer/LawyerList'))
const LawyerProfile = lazy(() => import('@/pages/users/lawyer/LawyerProfile'))

export default function useRoutesElements() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const user = useAuthStore((state) => state.user)

  const isAdminPath = location.pathname.startsWith('/admin')

  const routeElements = (
    <SuspenseProvider>
      <Routes>
        {!isAuthenticated ? (
          <Route element={<LayoutClient />}>
            <Route path={ROUTE.HOME} element={<HomePage />} />
          </Route>
        ) : (
          <Route element={<ProtectedRoute redirectPath={ROUTE.AUTH.LOGIN} />}>
            {isEqual(user?.roleName, ROLE_ADMIN) ? (
              <Route
                path={ROUTE.HOME}
                element={<Navigate to={`${ROUTE.ADMIN.ROOT}/${ROUTE.ADMIN.DASHBOARD}`} replace />}
              />
            ) : (
              <Route path={ROUTE.USER.ROOT} element={<LayoutMain />}>
                <Route index element={<UserDashboard />} />
                <Route path={ROUTE.USER.PROFILE} element={<Profile />} />
                <Route path={ROUTE.USER.EDIT} element={<ProfileEdit />} />
                <Route path={ROUTE.USER.CHAT_AI} element={<AIChat />} />
                <Route path={ROUTE.USER.TEMPLATE} element={<Template />} />
                <Route path={ROUTE.USER.LEGAL} element={<LegalAnalysis />} />
                <Route path={ROUTE.USER.LAWYER} element={<LawyerList />} />
                <Route path={ROUTE.USER.LAWYER_DETAIL} element={<LawyerProfile />} />
                <Route path={ROUTE.USER.REPORT} element={<Report />} />
                <Route path={ROUTE.USER.INFO} element={<User />} />
                <Route path={ROUTE.USER.SETTING} element={<Setting />} />
              </Route>
            )}
          </Route>
        )}

        {/* Auth routes */}
        <Route path={ROUTE.AUTH.LOGIN} element={<Login />} />
        <Route path={ROUTE.AUTH.REGISTER} element={<Register />} />
        <Route path={ROUTE.AUTH.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTE.AUTH.VERIFY_ACCOUNT_EMAIL} element={<VerifyAcountEmail />} />
        <Route path={ROUTE.AUTH.RESET_PASSWORD} element={<ResetPassword />} />

        {/* Client protected routes */}
        <Route element={<ProtectedRoute redirectPath={ROUTE.AUTH.LOGIN} />}>
          <Route path={ROUTE.PROFILE.ROOT} element={<LayoutClient />}>
            <Route index element={<Profile />} />
            <Route path='edit' element={<ProfileEdit />} />
          </Route>
        </Route>

        {/* Admin protected routes */}
        <Route element={<ProtectedRoute redirectPath={ROUTE.AUTH.LOGIN} />}>
          <Route path={ROUTE.ADMIN.ROOT} element={<LayoutMain />}>
            <Route path={ROUTE.ADMIN.DASHBOARD} element={<Dashboard />} />
            <Route path={ROUTE.ADMIN.USERS} element={<Users />} />
            <Route path={ROUTE.ADMIN.LEGAL_DOCUMENTS} element={<LegalDocuments />} />
            <Route path={ROUTE.ADMIN.ANALYTICS.ROOT} element={<span>Analytics</span>} />
            <Route path={ROUTE.ADMIN.ANALYTICS.OVERVIEW} element={<span>Analytics Overview</span>} />
            <Route path={ROUTE.ADMIN.ANALYTICS.SALES} element={<span>Analytics Sales</span>} />
            <Route path={ROUTE.ADMIN.ANALYTICS.USERS} element={<span>Analytics Users</span>} />
            <Route path={ROUTE.ADMIN.ANALYTICS.PERFORMANCE} element={<span>Analytics Performance</span>} />
          </Route>
        </Route>

        <Route path={ROUTE.NOT_FOUND} element={<PageNotFound />} />
      </Routes>
    </SuspenseProvider>
  )

  if (isAdminPath) {
    return routeElements
  }

  return <>{routeElements}</>
  // return <AnimatedLayout isAuthPath={isAuthPath}>
  //   </AnimatedLayout>
}
