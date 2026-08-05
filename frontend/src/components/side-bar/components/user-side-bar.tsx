import { useCallback } from 'react'

import { ChevronLeft, ChevronRight, LogOut, Settings, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import Logo from '@/components/logo/logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { userSideBarLinks } from '@/core/constants/general.const'
import { ROUTE } from '@/core/constants/path'
import { getInitials } from '@/core/helpers/get-initials'
import { cn } from '@/core/lib/utils'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import useToggleSideBar from '@/core/store/features/sidebar'

export default function UserSideBar() {
  const { t } = useTranslation('navBar')
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarOpen, toggleSidebar } = useToggleSideBar()
  const { logout } = useAuthStore()
  
  const user = useAuthStore((state) => state.user)

  const isActiveLink = useCallback((linkPath: string) => {
    const currentPath = location.pathname
    if (linkPath === ROUTE.USER.ROOT) {
      return currentPath === ROUTE.USER.ROOT
    }
    return currentPath === linkPath || currentPath.startsWith(`${linkPath}/`)
  }, [location.pathname])

  const handleLogout = useCallback(() => {
    logout()
    navigate(ROUTE.AUTH.LOGIN)
  }, [logout, navigate])

  return (
    <aside
      className={cn(
        'flex relative flex-col h-full bg-background-primary backdrop-blur-xl border-r border-border-secondary shadow-xl transition-all duration-500 md:flex',
        sidebarOpen ? 'w-72' : 'w-20'
      )}
      aria-label='User Sidebar navigation'
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between h-16 px-4 border-b border-border-secondary',
          !sidebarOpen && 'justify-center'
        )}
      >
        {sidebarOpen && (
          <div className='flex gap-3 items-center animate-in fade-in duration-300'>
            <div className='transition-all duration-200 hover:scale-105'>
              <Logo />
            </div>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className={cn(
            'flex items-center justify-center w-8 h-8 transition-all duration-300 bg-background-secondary rounded-lg  border-border-secondary hover:bg-background-tertiary  group ',
            !sidebarOpen && 'w-10 h-10'
          )}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? (
            <ChevronLeft className='w-4 h-4 text-text-description transition-colors group-hover:text-gray-800' />
          ) : (
            <ChevronRight className='w-5 h-5 text-text-description transition-colors group-hover:text-gray-800' />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          'overflow-y-auto flex-1 py-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-600',
          sidebarOpen ? 'px-4' : 'px-3'
        )}
        role='navigation'
      >
        {userSideBarLinks.map((link, index) => {
          const isLinkActive = isActiveLink(link.path)
          const linkText = t(link.titleKey || link.title)

          return (
            <div key={link.title} className='space-y-1'>
              <Link
                to={link.path}
                className={cn(
                  'flex items-center gap-4 rounded-xl text-small font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary group relative overflow-hidden h-12 p-4',
                  isLinkActive
                    ? 'bg-gradient-to-r from-primary to-primary-400 text-white shadow-lg shadow-primary/25'
                    : 'text-text-description hover:text-text-main hover:bg-background-secondary hover:shadow-lg hover:transform hover:scale-[1.02]'
                )}
                title={!sidebarOpen ? linkText : undefined}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Icon */}
                <span
                  className={cn(
                    'flex-shrink-0 transition-all duration-300 relative z-10 w-5 h-5',

                    isLinkActive
                      ? 'text-white'
                      : 'text-tertiary group-hover:text-text-main'
                  )}
                >
                  {link.icon}
                </span>

                {/* Text */}
                {sidebarOpen && (
                  <span
                    className={cn(
                      'transition-all duration-300 relative z-10 truncate',
                      isLinkActive
                        ? 'text-white'
                        : 'text-tertiary group-hover:text-main'
                    )}
                  >
                    {linkText}
                  </span>
                )}

                {/* Hover effect background */}
                <div
                  className={cn(
                    'absolute inset-0 bg-primary/10 transition-all duration-300 rounded-xl',
                    isLinkActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                />

                {/* Tooltip for collapsed state */}
                {!sidebarOpen && (
                  <div className='absolute left-full invisible z-50 px-3 py-2 ml-3 text-sm text-main whitespace-nowrap bg-background-primary rounded-lg border border-border-secondary shadow-xl opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:visible'>
                    {linkText}
                    <div className='absolute left-0 top-1/2 w-2 h-2 bg-background-primary border-b border-l border-primary transform rotate-45 -translate-x-1 -translate-y-1/2'></div>
                  </div>
                )}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* User Information Footer */}
      <div
        className={cn(
          'border-t border-border-secondary transition-all duration-300 bg-background-primary',
          sidebarOpen ? 'p-4' : 'p-3'
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-300 hover:bg-secondary text-left focus:outline-none focus:ring-2 focus:ring-primary/50 group relative',
                !sidebarOpen && 'justify-center p-1.5'
              )}
              aria-label='User options'
            >
              <div className='relative flex-shrink-0'>
                <Avatar
                  className={cn(
                    'border-2 border-slate-200 dark:border-slate-700 transition-all duration-300 group-hover:border-primary dark:group-hover:border-primary',
                    sidebarOpen ? 'w-10 h-10' : 'w-8 h-8'
                  )}
                >
                  {/* Sử dụng optional chaining an toàn để tránh crash khi chưa có dữ liệu */}
                  <AvatarImage src={user?.avatarUrl || '/images/avatar.png'} alt={user?.fullName} />
                  <AvatarFallback className='bg-primary text-white font-bold'>
                    {getInitials(user?.fullName || '')}
                  </AvatarFallback>
                </Avatar>
                <div className='absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success-primary border-2 border-border-primary rounded-full'></div>
              </div>

              {sidebarOpen && (
                <div className='flex-1 min-w-0 animate-in fade-in duration-300'>
                  <p className='text-sm font-semibold text-main truncate leading-none mb-1'>
                    {user?.fullName || 'Người dùng'}
                  </p>
                  <p className='text-xs text-text-description truncate leading-none'>
                    {user?.email || 'user@legalai.vn'}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align={sidebarOpen ? 'end' : 'center'}
            side={sidebarOpen ? 'top' : 'right'}
            sideOffset={12}
            className='w-56 p-2 rounded-2xl border shadow-2xl backdrop-blur-xl border-border-secondary duration-200 bg-background-primary'
          >
            {/* Header info in dropdown for quick view */}
            <div className='px-3 py-2.5 mb-2'>
              <p className='text-xs font-medium text-text-description uppercase tracking-wider mb-1'>
                {t('account')}
              </p>
              <p className='text-sm font-semibold text-main truncate leading-none mb-1 text-text-main'>
                {user?.fullName || 'Người dùng'}
              </p>
              <p className='text-xs text-text-description truncate leading-none'>
                {user?.email || 'user@legalai.vn'}
              </p>
            </div>

            <DropdownMenuItem
              onClick={() => navigate(ROUTE.PROFILE.ROOT)}
              className='flex items-center px-3 py-2 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors text-sm font-medium text-text-main'
            >
              <User className='mr-3 w-4 h-4 text-main' />
              <span>{t('profile')}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => navigate(ROUTE.PROFILE.EDIT)}
              className='flex items-center px-3 py-2 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors text-sm font-medium text-main text-text-main'
            >
              <Settings className='mr-3 w-4 h-4 text-text-description' />
              <span>{t('edit_profile')}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className='my-2 bg-border-secondary' />

            <DropdownMenuItem
              onClick={handleLogout}
              className='flex items-center px-3 py-2 rounded-lg cursor-pointer text-main hover:text-main hover:bg-secondary/50 transition-colors text-sm font-medium text-primary'
            >
              <LogOut className='mr-3 w-4 h-4' />
              <span>{t('logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
