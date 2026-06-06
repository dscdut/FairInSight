import { ThemeToggle } from '@/components/theme/theme-toogle'

import Messages from './messages'
import Notifications from './notifications'
import QuickStats from './quick-stats'
import SearchBar from './search-bar'
import UserInfo from './user-info'

export default function AdminTopBar() {
  return (
    <header className='flex sticky top-0 z-30 justify-between items-center px-4 h-16 border-b shadow-lg backdrop-blur-xl border-slate-200/50 bg-white/80 dark:bg-gray-800 dark:border-gray-700'>
      {/* Left Section */}
      <div className='flex gap-6 items-center'>
        <SearchBar />
      </div>

      {/* Right Section */}
      <div className='flex gap-3 items-center'>
        <QuickStats />
        <Notifications />
        <Messages />
        <div className='transition-all duration-200 hover:scale-105'>
          <ThemeToggle />
        </div>
        <UserInfo />
      </div>
    </header>
  )
}
