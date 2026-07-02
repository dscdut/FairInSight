import { ThemeToggle } from '@/components/theme/theme-toogle'

import Messages from './messages'
import Notifications from './notifications'
import SearchBar from './search-bar'

export default function LawyerTopBar() {
  return (
    <header className='flex sticky top-0 z-30 justify-between items-center px-4 h-16 border-b shadow-lg backdrop-blur-xl border-border-secondary bg-background-primary'>
      <div className='flex gap-6 items-center'>
        <SearchBar />
      </div>

      <div className='flex gap-3 items-center'>
        <Notifications />
        <Messages />
        <div className='transition-all duration-200 hover:scale-105'>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
