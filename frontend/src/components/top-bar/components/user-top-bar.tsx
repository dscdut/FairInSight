import { Menu } from 'lucide-react'

import { ThemeToggle } from '@/components/theme/theme-toogle'
import useToggleSideBar from '@/core/store/features/sidebar'

import Messages from './messages'
import Notifications from './notifications'
import SearchBar from './search-bar'

export default function UserTopBar() {
  const { toggleSidebar } = useToggleSideBar()

  return (
    <header className='flex sticky top-0 z-30 justify-between items-center px-4 h-16 border-b shadow-lg backdrop-blur-xl border-border-secondary bg-background-primary'>
      <div className='flex gap-4 items-center'>
        {/* Mobile Hamburger Toggle Button */}
        <button 
          onClick={toggleSidebar}
          className='lg:hidden p-2 rounded-lg hover:bg-background-secondary text-text-secondary hover:text-text-primary transition-colors border-none bg-transparent cursor-pointer'
          aria-label='Toggle sidebar'
        >
          <Menu className='w-6 h-6' />
        </button>
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
