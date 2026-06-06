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
import isEqual from '@/core/configs/is-equal'
import { userSideBarLinks } from '@/core/constants/general.const'
import { ROUTE } from '@/core/constants/path'
import { cn } from '@/core/lib/utils'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import useToggleSideBar from '@/core/store/features/sidebar'
import { useUserInfo } from '@/hooks/tanstack-query/auth/use-query-auth'

export default function UserSideBar() {
  const { t } = useTranslation('navBar')
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarOpen, toggleSidebar } = useToggleSideBar()
  const { logout } = useAuthStore()
  const { data: user } = useUserInfo()

  const isActiveLink = (linkPath: string) => {
    const currentPath = location.pathname
    if (isEqual(linkPath, ROUTE.USER.ROOT)) {
      return isEqual(currentPath, ROUTE.USER.ROOT)
    }
    return isEqual(currentPath, linkPath) || currentPath.startsWith(`${linkPath}/`)
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const handleLogout = () => {
    logout()
    navigate(ROUTE.AUTH.LOGIN)
  }

  return (
    <aside
      className={cn(
        'flex relative flex-col h-full bg-white border-r border-gray-200 shadow-xl transition-all duration-500  md:flex dark:bg-gray-800 dark:border-gray-700',
        sidebarOpen ? 'w-72' : 'w-20'
      )}
      aria-label='User Sidebar navigation'
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700',
          !sidebarOpen && 'justify-center'
        )}
      >
        {sidebarOpen && (
          <div className='flex gap-3 items-center'>
            <div className='transition-all duration-200 hover:scale-105'>
              <Logo />
            </div>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className={cn(
            'flex items-center justify-center w-8 h-8 transition-all duration-300 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 group dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:border-gray-500',
            !sidebarOpen && 'w-10 h-10'
          )}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? (
            <ChevronLeft className='w-4 h-4 text-gray-600 transition-colors group-hover:text-gray-800 dark:text-gray-300 dark:group-hover:text-white' />
          ) : (
            <ChevronRight className='w-5 h-5 text-gray-600 transition-colors group-hover:text-gray-800 dark:text-gray-300 dark:group-hover:text-white' />
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
        {userSideBarLinks.map((link, index) => (
          <div key={link.title} className='space-y-1'>
            <Link
              to={link.path}
              className={cn(
                'flex items-center gap-4 rounded-xl text-small font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 group relative overflow-hidden',
                sidebarOpen ? 'px-4 py-3.5' : 'px-3 py-3.5 justify-center',
                isActiveLink(link.path)
                  ? 'bg-gradient-to-r from-primary to-primary-400 text-white shadow-lg shadow-primary/25 transform scale-[1.02]'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 hover:shadow-lg hover:transform hover:scale-[1.02] dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
              )}
              title={!sidebarOpen ? t(link.titleKey || link.title) : undefined}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Active indicator */}
              {isActiveLink(link.path) && (
                <div className='absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-primary to-primary-400 rounded-r-full' />
              )}

              {/* Icon */}
              <span
                className={cn(
                  'flex-shrink-0 transition-all duration-300 relative z-10',
                  sidebarOpen ? 'w-5 h-5' : 'w-6 h-6',
                  isActiveLink(link.path)
                    ? 'text-white'
                    : 'text-tertiary group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-white'
                )}
              >
                {link.icon}
              </span>

              {/* Text */}
              {sidebarOpen && (
                <span
                  className={cn(
                    'transition-all duration-300 relative z-10 truncate',
                    isActiveLink(link.path)
                      ? 'text-white'
                      : 'text-tertiary group-hover:text-gray-800 dark:text-gray-300 dark:group-hover:text-white'
                  )}
                >
                  {t(link.titleKey || link.title)}
                </span>
              )}

              {/* Hover effect background */}
              <div
                className={cn(
                  'absolute inset-0 bg-primary/10 transition-all duration-300 rounded-xl',
                  isActiveLink(link.path) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
              />

              {/* Tooltip for collapsed state */}
              {!sidebarOpen && (
                <div className='absolute left-full invisible z-50 px-3 py-2 ml-3 text-sm text-white whitespace-nowrap bg-gray-800 rounded-lg border border-gray-600 shadow-xl opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:visible dark:bg-gray-700 dark:border-gray-600'>
                  {t(link.titleKey || link.title)}
                  <div className='absolute left-0 top-1/2 w-2 h-2 bg-gray-800 border-b border-l border-gray-600 transform rotate-45 -translate-x-1 -translate-y-1/2 dark:bg-gray-700 dark:border-gray-600'></div>
                </div>
              )}
            </Link>
          </div>
        ))}
      </nav>

      {/* User Information Footer */}
      <div
        className={cn(
          'border-t border-gray-200 transition-all duration-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
          sidebarOpen ? 'p-4' : 'p-3'
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-left focus:outline-none focus:ring-2 focus:ring-primary/50 group relative',
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
                  <AvatarImage src='/images/avatar.png' alt={user?.fullName} />
                  <AvatarFallback className='bg-primary text-white font-bold'>
                    {getInitials(user?.fullName || '')}
                  </AvatarFallback>
                </Avatar>
                <div className='absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full'></div>
              </div>

              {sidebarOpen && (
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-semibold text-slate-800 dark:text-slate-200 truncate leading-none mb-1'>
                    {user?.fullName || 'Người dùng'}
                  </p>
                  <p className='text-xs text-slate-500 dark:text-slate-400 truncate leading-none'>
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
            className='w-56 p-2 rounded-2xl border shadow-2xl backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-900/95 duration-200'
          >
            {/* Header info in dropdown for quick view */}
            <div className='px-3 py-2.5 mb-2 bg-gradient-to-br rounded-xl border-b border-slate-100 dark:border-slate-800 from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50'>
              <p className='text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1'>
                {t('account')}
              </p>
              <p className='text-sm font-semibold text-slate-800 dark:text-slate-200 truncate'>{user?.fullName}</p>
              <p className='text-xs text-slate-500 dark:text-slate-400 truncate'>{user?.email}</p>
            </div>

            <DropdownMenuItem
              onClick={() => navigate(ROUTE.PROFILE.ROOT)}
              className='flex items-center px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300'
            >
              <User className='mr-3 w-4 h-4 text-slate-500' />
              <span>{t('profile')}</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => navigate(ROUTE.PROFILE.EDIT)}
              className='flex items-center px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300'
            >
              <Settings className='mr-3 w-4 h-4 text-slate-500' />
              <span>{t('edit_profile')}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className='my-2 bg-slate-200 dark:bg-slate-700' />

            <DropdownMenuItem
              onClick={handleLogout}
              className='flex items-center px-3 py-2 rounded-lg cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium'
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
