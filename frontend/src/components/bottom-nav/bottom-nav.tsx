import { Home, MessageCircle, MessageSquare, Scale, User } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { ROUTE } from '@/core/constants/path'
import { cn } from '@/core/lib/utils'

export default function BottomNav() {
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === ROUTE.USER.ROOT) {
      return location.pathname === ROUTE.USER.ROOT
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  const items = [
    {
      icon: Home,
      path: ROUTE.USER.ROOT,
      label: 'Trang chủ'
    },
    {
      icon: MessageCircle,
      path: ROUTE.USER.MESSAGES,
      label: 'Tin nhắn'
    },
    {
      icon: MessageSquare,
      path: ROUTE.USER.CHAT_AI,
      label: 'Phân tích pháp luật',
      isCenter: true
    },
    {
      icon: Scale,
      path: ROUTE.USER.LEGAL,
      label: 'Văn bản pháp luật'
    },
    {
      icon: User,
      path: ROUTE.PROFILE.ROOT,
      label: 'Trang cá nhân'
    }
  ]

  return (
    <div className='lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-[420px]'>
      <div className='h-16 rounded-full bg-white/30 dark:bg-black/30 border border-white/25 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] backdrop-blur-2xl flex items-center justify-around px-2 relative'>
        {items.map((item, idx) => {
          const Icon = item.icon
          const active = isActive(item.path)

          const handleClick = (e: React.MouseEvent) => {
            if (active && item.path === ROUTE.USER.ROOT) {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
              setTimeout(() => {
                window.location.reload()
              }, 150)
            }
          }

          if (item.isCenter) {
            return (
              <Link
                key={idx}
                to={item.path}
                onClick={handleClick}
                className='relative -translate-y-5 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 text-white shadow-[0_8px_20px_0_rgba(244,63,94,0.4)] hover:scale-105 active:scale-95 transition-all duration-300'
                aria-label={item.label}
              >
                {/* Glow Ring Effect */}
                <span className='absolute inset-0 rounded-full border border-white/30 animate-pulse' />
                <Icon className='w-6 h-6' />
              </Link>
            )
          }

          return (
            <Link
              key={idx}
              to={item.path}
              onClick={handleClick}
              className={cn(
                'flex items-center justify-center p-3 rounded-full transition-all duration-200',
                active 
                  ? 'text-primary dark:text-blue-400 bg-primary/10 dark:bg-blue-500/10' 
                  : 'text-text-description hover:text-text-primary'
              )}
              aria-label={item.label}
            >
              <Icon className='w-5 h-5' />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
