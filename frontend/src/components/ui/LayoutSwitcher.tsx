import { Grid3X3, List } from 'lucide-react'

import { cn } from '@/core/lib/utils'
import { type ViewMode } from '@/models/types/form-library'

import { Button } from './button'

interface LayoutSwitcherProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export default function LayoutSwitcher({ viewMode, onViewModeChange }: LayoutSwitcherProps) {
  return (
    <div className='gap-1 rounded-xl border border-border-secondary bg-background-secondary p-1 shrink-0 relative hidden sm:flex h-11'>
      <Button
        type='button'
        variant='ghost'
        onClick={() => onViewModeChange('grid')}
        aria-label='Xem dạng lưới'
        className={cn(
          'flex px-2 items-center justify-center rounded-lg bg-background-secondary transition-all duration-200 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none border-0 text-xs font-semibold h-auto',
          viewMode === 'grid'
            ? 'text-main bg-background-primary scale-100'
            : 'text-main hover:text-main'
        )}
        title='Xem dạng lưới'
      >
        <Grid3X3 size={12} aria-hidden='true' />
      </Button>

      <Button
        type='button'
        variant='ghost'
        onClick={() => onViewModeChange('list')}
        aria-label='Xem dạng danh sách'
        className={cn(
          'flex px-2 items-center justify-center rounded-lg transition-all duration-200  gap-1.5 text-xs font-semibold h-auto',
          viewMode === 'list'
            ? 'bg-background-primary text-main scale-100'
            : 'text-main bg-transparent'
        )}
        title='Xem dạng danh sách'
      >
        <List size={12} aria-hidden='true' />
      </Button>
    </div>
  )
}
