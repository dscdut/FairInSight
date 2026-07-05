import { ROLE_ADMIN, ROLE_LAWYER } from '@/core/configs/consts'
import isEqual from '@/core/configs/is-equal'
import { cn } from '@/core/lib/utils'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import useToggleSideBar from '@/core/store/features/sidebar'

import AdminSideBar from './components/admin-side-bar'
import LawyerSideBar from './components/lawyer-side-bar'
import SkeletonSideBar from './components/skeleton-side-bar'
import UserSideBar from './components/user-side-bar'

const SideBar = () => {
  const user = useAuthStore((state) => state.user)
  const { sidebarOpen, toggleSidebar } = useToggleSideBar()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated && !user) {
    return (
      <div className='h-screen sticky top-0 hidden lg:flex dark:bg-black dark:border-black'>
        <SkeletonSideBar />
      </div>
    )
  }

  const isAdmin = isEqual(user?.roleName, ROLE_ADMIN)
  const isLawyer = isEqual(user?.roleName, ROLE_LAWYER)

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <button 
          className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden animate-in fade-in duration-200 border-none cursor-pointer' 
          onClick={toggleSidebar}
          aria-label='Close sidebar'
        />
      )}

      {/* Sidebar Container */}
      <div
        className={cn(
          'h-screen sticky top-0 z-50 transition-all duration-300',
          'lg:flex hidden',
          sidebarOpen && 'flex fixed inset-y-0 left-0 lg:sticky shadow-2xl lg:shadow-none'
        )}
      >
        {isAdmin ? (
          <AdminSideBar />
        ) : isLawyer ? (
          <LawyerSideBar />
        ) : (
          <UserSideBar />
        )}
      </div>
    </>
  )
}

export default SideBar
