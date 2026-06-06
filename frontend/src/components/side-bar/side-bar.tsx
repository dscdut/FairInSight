import { ROLE_ADMIN } from '@/core/configs/consts'
import isEqual from '@/core/configs/is-equal'
import { useAuthStore } from '@/core/store/features/auth/authStore'

import AdminSideBar from './components/admin-side-bar'
import SkeletonSideBar from './components/skeleton-side-bar'
import UserSideBar from './components/user-side-bar'

const SideBar = () => {
  const user = useAuthStore((state) => state.user)

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated && !user) {
    return (
      <div className='h-screen sticky top-0 hidden lg:flex dark:bg-black dark:border-black'>
        <SkeletonSideBar />
      </div>
    )
  }

  const isAdmin = isEqual(user?.roleName, ROLE_ADMIN)

  return <div className='h-screen sticky top-0 hidden lg:flex'>{isAdmin ? <AdminSideBar /> : <UserSideBar />}</div>
}

export default SideBar
