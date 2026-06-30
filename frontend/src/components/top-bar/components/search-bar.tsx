import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function SearchBar() {
  const { t } = useTranslation('navBar')

  return (
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
  )
}
