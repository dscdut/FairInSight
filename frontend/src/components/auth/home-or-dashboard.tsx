import { lazy } from 'react'

import { Navigate } from "react-router-dom"

import LayoutClient from "@/app/layout/layout-client"
import { ROUTE } from "@/core/constants/path"
import { useAuthStore } from "@/core/store/features/auth/authStore"
import { useAuth } from "@/hooks/auth/use-auth"
const HomePage = lazy(() => import('@/pages/home/HomePage'))
const UserDashboard = lazy(() => import('@/pages/users/dashboard/Dashboard'))

const HomeOrDashboard = () => {
  const { isAuthenticated } = useAuth()
  const user = useAuthStore((state) => state.user)

  if (isAuthenticated) {
    if (user?.roleName === 'ADMIN') {
      return <Navigate to={`${ROUTE.ADMIN.ROOT}/${ROUTE.ADMIN.DASHBOARD}`} replace />
    }
    return (
      <LayoutClient>
        <UserDashboard />
      </LayoutClient>
    )
  }

  return <HomePage />
}

export default HomeOrDashboard