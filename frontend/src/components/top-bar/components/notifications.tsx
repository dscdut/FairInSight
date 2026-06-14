import { Bell } from 'lucide-react'

import { Badge } from '@/components'
import { Button } from '@/components/ui/button'

export default function Notifications() {
  return (
    <Button
      variant='ghost'
      size='icon'
      className='relative w-10 h-10 rounded-xl transition-all duration-300 hover:bg-slate-100 group'
      aria-label='Notifications'
    >
      <Bell className='w-5 h-5 transition-colors text-text-description group-hover:text-primary ' />
      <Badge className='absolute -top-1 -right-1 p-0 w-5 h-5 text-xs text-white bg-primary border-2 border-background-primary hover:bg-primary '>
        3
      </Badge>
    </Button>
  )
}
