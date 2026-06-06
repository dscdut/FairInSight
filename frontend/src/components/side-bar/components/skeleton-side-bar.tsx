import { cn } from '@/core/lib/utils'
import useToggleSideBar from '@/core/store/features/sidebar'

export default function SkeletonSideBar() {
  const { sidebarOpen } = useToggleSideBar()

  return (
    <aside
      className={cn(
        'flex relative flex-col h-full bg-white border-r border-gray-200 shadow-xl transition-all duration-500 md:flex dark:bg-black dark:border-black animate-pulse',
        sidebarOpen ? 'w-72' : 'w-20'
      )}
      aria-label='Loading Sidebar'
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700',
          !sidebarOpen && 'justify-center'
        )}
      >
        {sidebarOpen && (
          <div className='w-28 h-6 bg-slate-200 dark:bg-slate-800 rounded-md' />
        )}
        <div className='w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg' />
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          'flex-1 py-4 space-y-2',
          sidebarOpen ? 'px-4' : 'px-3'
        )}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-4 rounded-xl px-3 py-3.5',
              sidebarOpen ? 'justify-start' : 'justify-center'
            )}
          >
            <div className={cn('bg-slate-200 dark:bg-slate-800 rounded-lg', sidebarOpen ? 'w-5 h-5' : 'w-6 h-6')} />
            {sidebarOpen && (
              <div className='h-4 bg-slate-200 dark:bg-slate-800 rounded w-28' />
            )}
          </div>
        ))}
      </nav>

      {/* User Information Footer */}
      <div
        className={cn(
          'border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
          sidebarOpen ? 'p-4' : 'p-3'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-3 p-2',
            !sidebarOpen && 'justify-center p-1.5'
          )}
        >
          <div className='relative flex-shrink-0'>
            <div
              className={cn(
                'bg-slate-200 dark:bg-slate-800 rounded-full',
                sidebarOpen ? 'w-10 h-10' : 'w-8 h-8'
              )}
            />
          </div>

          {sidebarOpen && (
            <div className='flex-1 space-y-2 min-w-0'>
              <div className='h-4 bg-slate-200 dark:bg-slate-800 rounded w-24' />
              <div className='h-3 bg-slate-200 dark:bg-slate-800 rounded w-32' />
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
