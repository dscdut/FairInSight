import { MessageSquare } from 'lucide-react'

import { Badge } from '@/components'
import { Button } from '@/components/ui/button'

export default function Messages() {
  return (
    <Button
      variant='ghost'
      size='icon'
      className='relative w-10 h-10 rounded-xl transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800 group'
      aria-label='Messages'
    >
      <MessageSquare className='w-5 h-5 transition-colors text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white' />
      <Badge className='absolute -top-1 -right-1 p-0 w-5 h-5 text-xs text-white bg-info border-2 border-white hover:bg-info dark:border-slate-900'>
        5
      </Badge>
    </Button>
  )
}
