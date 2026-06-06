import { Search } from 'lucide-react'

export default function SearchBar() {
  return (
    <div className='hidden relative md:block'>
      <Search className='absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2' />
      <input
        type='text'
        placeholder='Search anything...'
        className='py-2 pr-4 pl-10 w-80 text-sm rounded-xl border transition-all duration-300 bg-slate-100/50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 placeholder:text-gray-400'
      />
      <kbd className='absolute right-3 top-1/2 px-2 py-1 font-mono text-xs text-gray-500 rounded border transform -translate-y-1/2 bg-slate-200 dark:bg-gray-800 border-slate-300 dark:border-gray-700 dark:text-gray-400'>
        ⌘K
      </kbd>
    </div>
  )
}
