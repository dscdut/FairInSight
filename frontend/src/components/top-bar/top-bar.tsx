import { ROLE_ADMIN, ROLE_LAWYER } from '@/core/configs/consts'
import isEqual from '@/core/configs/is-equal'
import { useAuthStore } from '@/core/store/features/auth/authStore'

import AdminTopBar from './components/admin-top-bar'
import LawyerTopBar from './components/lawyer-top-bar'
import UserTopBar from './components/user-top-bar'

const TopBar = () => {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated && !user) {
    return (
      <header className='flex sticky top-0 z-30 justify-between items-center px-4 h-16 border-b shadow-lg backdrop-blur-xl border-slate-200 bg-white dark:bg-black dark:border-black animate-pulse'>
        <div className='h-8 bg-slate-200 dark:bg-black rounded w-1/4' />
      </header>
    )
  }

  const isAdmin = isEqual(user?.roleName, ROLE_ADMIN)
  const isLawyer = isEqual(user?.roleName, ROLE_LAWYER)

  return isAdmin ? <AdminTopBar /> : isLawyer ? <LawyerTopBar /> : <UserTopBar />
}

export default TopBar

