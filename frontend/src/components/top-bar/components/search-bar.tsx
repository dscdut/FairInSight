import { useState } from 'react'

import { Search, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function SearchBar() {
  const { t } = useTranslation('navBar')
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      {/* Desktop Search Bar (always visible) */}
      <div className='hidden relative md:block'>
        <Search className='absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2' />
        <input
          type='text'
          placeholder={t('search_placeholder')}
          className='py-2 pr-4 pl-10 w-80 text-sm rounded-xl border transition-all duration-300 bg-background-secondary dark:bg-gray-800/50 border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-info/20 focus:border-info placeholder:text-gray-400'
        />
        <kbd className='absolute right-3 top-1/2 px-2 py-1 font-mono text-xs text-text-description rounded border transform -translate-y-1/2 bg-background-secondary border-border-secondary'>
          ⌘K
        </kbd>
      </div>

      {/* Mobile Search Button (collapsed icon) */}
      <button 
        onClick={() => setIsExpanded(true)}
        className='md:hidden p-2 rounded-lg hover:bg-background-secondary text-text-secondary hover:text-text-primary transition-colors border-none bg-transparent cursor-pointer'
        aria-label='Search'
      >
        <Search className='w-5 h-5' />
      </button>

      {/* Mobile Search Overlay (expanded overlay) */}
      {isExpanded && (
        <div className='fixed inset-x-0 top-0 h-16 bg-background-primary px-4 flex items-center gap-3 z-50 md:hidden animate-in fade-in slide-in-from-top duration-200'>
          <button 
            onClick={() => setIsExpanded(false)}
            className='p-2 rounded-lg hover:bg-background-secondary text-text-secondary hover:text-text-primary transition-colors border-none bg-transparent cursor-pointer'
            aria-label='Close search'
          >
            <ArrowLeft className='w-5 h-5' />
          </button>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2' />
            <input
              autoFocus
              type='text'
              placeholder={t('search_placeholder')}
              className='py-2 pr-4 pl-10 w-full text-sm rounded-xl border transition-all duration-300 bg-background-secondary dark:bg-gray-800/50 border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-info/20 focus:border-info placeholder:text-gray-400'
            />
          </div>
        </div>
      )}
    </>
  )
}
