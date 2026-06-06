import { LogOut, Settings, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ROUTE } from '@/core/constants/path'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { useUserInfo } from '@/hooks/tanstack-query/auth/use-query-auth'

export default function UserInfo() {
  const { t } = useTranslation('navBar')
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const user = useAuthStore((state) => state.user)
  const { data: userInfo } = useUserInfo()

  const displayUser = userInfo || user

  const handleLogout = () => {
    logout()
    navigate(ROUTE.AUTH.LOGIN)
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className='ml-2 border-l border-slate-200 dark:border-slate-700 pl-3'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className='flex items-center gap-2 focus:outline-none group'
            aria-label='User options'
          >
            <Avatar className='w-9 h-9 border-2 border-slate-200 dark:border-slate-700 transition-all duration-300 group-hover:border-primary dark:group-hover:border-primary'>
              <AvatarImage src='/images/avatar.png' alt={displayUser?.fullName} />
              <AvatarFallback className='bg-primary text-white font-bold text-xs'>
                {getInitials(displayUser?.fullName || '')}
              </AvatarFallback>
            </Avatar>
            <div className='hidden text-left xl:block'>
              <p className='text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-none mb-0.5 max-w-[100px]'>
                {displayUser?.fullName || 'User'}
              </p>
              <p className='text-[10px] text-slate-500 dark:text-slate-400 truncate leading-none max-w-[100px]'>
                {displayUser?.email || 'user@legalai.vn'}
              </p>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          side='bottom'
          sideOffset={12}
          className='w-56 p-2 rounded-2xl border shadow-2xl backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-900/95 duration-200'
        >
          {/* Header info in dropdown for quick view */}
          <div className='px-3 py-2.5 mb-2 bg-gradient-to-br rounded-xl border-b border-slate-100 dark:border-slate-800 from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50'>
            <p className='text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1'>
              {t('account')}
            </p>
            <p className='text-sm font-semibold text-slate-800 dark:text-slate-200 truncate'>{displayUser?.fullName || 'User'}</p>
            <p className='text-xs text-slate-500 dark:text-slate-400 truncate'>{displayUser?.email || 'user@legalai.vn'}</p>
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
  )
}
