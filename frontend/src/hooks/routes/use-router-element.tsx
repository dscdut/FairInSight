import { lazy } from 'react'

import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import LayoutClient from '@/app/layout/layout-client'
import LayoutMain from '@/app/layout/layout-main'
import SuspenseProvider from '@/app/providers/suspense-provider'
import ProtectedRoute from '@/components/auth/protected-route'
import { ROLE_ADMIN, ROLE_LAWYER } from '@/core/configs/consts'
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
const Banned = lazy(() => import('@/pages/banned/Banned'))
const Dashboard = lazy(() => import('@/pages/admin/dashboard'))
const Users = lazy(() => import('@/pages/admin/users'))
const LegalDocuments = lazy(() => import('@/pages/admin/legal-documents'))
const LawInspect = lazy(() => import('@/pages/admin/law-inspect'))
const PageNotFound = lazy(() => import('@/pages/404/PageNotFound'))
const Profile = lazy(() => import('@/pages/profile/Profile'))
const HomePage = lazy(() => import('@/pages/home/HomePage'))
const UserDashboard = lazy(() => import('@/pages/users/dashboard/Dashboard'))
const AIChat = lazy(() => import('@/pages/users/ai-chat/AIChat'))
const Messages = lazy(() => import('@/pages/users/messages/Messages'))
const LegalAnalysis = lazy(() => import('@/pages/users/legal-analysis/LegalAnalysis'))
const Report = lazy(() => import('@/pages/users/report/Report'))
const Setting = lazy(() => import('@/pages/users/setting/Setting'))
const Template = lazy(() => import('@/pages/users/template/Template'))
const User = lazy(() => import('@/pages/users/user/User'))
const LawyerList = lazy(() => import('@/pages/users/lawyer/LawyerList'))
const LawyerProfile = lazy(() => import('@/pages/users/lawyer/LawyerProfile'))
const Appointments = lazy(() => import('@/pages/users/appointments/Appointments'))
const LawLibraryPage = lazy(() => import('@/pages/law-search/LawLibraryPage'))
const LawDetail = lazy(() => import('@/pages/law-search/LawDetail'))
const Billing = lazy(() => import('@/pages/users/billing/Billing'))

// Lawyer Lazy loaded components
const LawyerDashboard = lazy(() => import('@/pages/lawyers/dashboard/LawyerDashboard'))
const LawyerAppointments = lazy(() => import('@/pages/lawyers/appointments/LawyerAppointments'))
const LawyerMessages = lazy(() => import('@/pages/lawyers/messages/LawyerMessages'))
const LawyerProfileEdit = lazy(() => import('@/pages/lawyers/profile/LawyerProfileEdit'))
const LawyerSettings = lazy(() => import('@/pages/lawyers/setting/LawyerSettings'))


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
            <Route
              path={ROUTE.LAW_LIBRARY}
              element={<LawLibraryPage />}
            />
            <Route
              path={ROUTE.LAW_DETAIL}
              element={<LawDetail />}
            />
          </Route>
        ) : (
          <Route element={<ProtectedRoute redirectPath={ROUTE.AUTH.LOGIN} />}>
            {isEqual(user?.roleName, ROLE_ADMIN) ? (
              <Route
                path={ROUTE.HOME}
                element={<Navigate to={`${ROUTE.ADMIN.ROOT}/${ROUTE.ADMIN.DASHBOARD}`} replace />}
              />
            ) : isEqual(user?.roleName, ROLE_LAWYER) ? (
              <Route
                path={ROUTE.HOME}
                element={<Navigate to={ROUTE.LAWYER.ROOT} replace />}
              />
            ) : (
              <Route path={ROUTE.USER.ROOT} element={<LayoutMain />}>
                <Route index element={<UserDashboard />} />
                <Route path={ROUTE.USER.PROFILE} element={<Profile />} />
                <Route path={ROUTE.USER.CHAT_AI} element={<AIChat />} />
                <Route path={ROUTE.USER.CHAT_AI_SESSION} element={<AIChat />} />
                <Route path={ROUTE.USER.MESSAGES} element={<Messages />} />
                <Route path={ROUTE.USER.TEMPLATE} element={<Template />} />
                <Route path={ROUTE.USER.LEGAL} element={<LegalAnalysis />} />
                <Route path={ROUTE.USER.LAWYER} element={<LawyerList />} />
                <Route path={ROUTE.USER.LAWYER_DETAIL} element={<LawyerProfile />} />
                <Route path={ROUTE.USER.APPOINTMENT} element={<Appointments />} />
                <Route path={ROUTE.USER.REPORT} element={<Report />} />
                <Route path={ROUTE.USER.INFO} element={<User />} />
                <Route path={ROUTE.USER.SETTING} element={<Setting />} />
                <Route path={ROUTE.USER.BILLING} element={<Billing />} />
              </Route>
            )}
          </Route>
        )}

        {/* Lawyer protected routes */}
        <Route element={<ProtectedRoute redirectPath={ROUTE.AUTH.LOGIN} />}>
          {isEqual(user?.roleName, ROLE_LAWYER) && (
            <Route path={ROUTE.LAWYER.ROOT} element={<LayoutMain />}>
              <Route index element={<Navigate to={ROUTE.LAWYER.DASHBOARD} replace />} />
              <Route path={ROUTE.LAWYER.DASHBOARD} element={<LawyerDashboard />} />
              <Route path={ROUTE.LAWYER.APPOINTMENT} element={<LawyerAppointments />} />
              <Route path={ROUTE.LAWYER.MESSAGES} element={<LawyerMessages />} />
              <Route path={ROUTE.LAWYER.PROFILE} element={<LawyerProfileEdit />} />
              <Route path={ROUTE.LAWYER.SETTING} element={<LawyerSettings />} />
            </Route>
          )}
        </Route>

        {/* Auth routes */}
        <Route path={ROUTE.AUTH.LOGIN} element={<Login />} />
        <Route path={ROUTE.AUTH.REGISTER} element={<Register />} />
        <Route path={ROUTE.AUTH.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTE.AUTH.VERIFY_ACCOUNT_EMAIL} element={<VerifyAcountEmail />} />
        <Route path={ROUTE.AUTH.RESET_PASSWORD} element={<ResetPassword />} />
        <Route path={ROUTE.AUTH.BANNED} element={<Banned />} />

        {/* Admin protected routes */}
        <Route element={<ProtectedRoute redirectPath={ROUTE.AUTH.LOGIN} />}>
          <Route path={ROUTE.ADMIN.ROOT} element={<LayoutMain />}>
            <Route path={ROUTE.ADMIN.DASHBOARD} element={<Dashboard />} />
            <Route path={ROUTE.ADMIN.CHAT_AI} element={<AIChat />} />
            <Route path={ROUTE.ADMIN.CHAT_AI_SESSION} element={<AIChat />} />
            <Route path={ROUTE.ADMIN.USERS} element={<Users />} />
            <Route path={ROUTE.ADMIN.LEGAL_DOCUMENTS} element={<LegalDocuments />} />
            <Route path={ROUTE.ADMIN.LAW_INSPECT} element={<LawInspect />} />
            <Route path={ROUTE.ADMIN.ANALYTICS.ROOT} element={<span>Analytics</span>} />
            <Route path={ROUTE.ADMIN.ANALYTICS.OVERVIEW} element={<span>Analytics Overview</span>} />
            <Route path={ROUTE.ADMIN.ANALYTICS.SALES} element={<span>Analytics Sales</span>} />
            <Route path={ROUTE.ADMIN.USERS} element={<span>Analytics Users</span>} />
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
