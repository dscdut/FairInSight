import { Activity, Zap } from 'lucide-react'

export default function QuickStats() {
  return (
    <div className='hidden gap-4 items-center mr-4 lg:flex'>
      <div className='flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800'>
        <Activity className='w-4 h-4 text-green-600 dark:text-green-400' />
        <span className='text-sm font-medium text-green-700 dark:text-green-300'>Online</span>
      </div>
      <div className='flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
        <Zap className='w-4 h-4 text-blue-600 dark:text-blue-400' />
        <span className='text-sm font-medium text-blue-700 dark:text-blue-300'>98% Uptime</span>
      </div>
    </div>
  )
}
