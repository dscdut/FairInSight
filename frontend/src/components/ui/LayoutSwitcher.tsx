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
    <div className='flex gap-2 rounded-lg border border-border-primary bg-background-secondary p-1'>
      <Button
        type='button'
        onClick={() => onViewModeChange('grid')}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
          viewMode === 'grid'
            ? 'bg-background-primary text-text-main shadow-sm'
            : 'text-text-secondary hover:bg-background-primary hover:text-text-main'
        )}
        title='Grid view'
      >
        <Grid3X3 size={20} />
      </Button>

      <Button
        type='button'
        onClick={() => onViewModeChange('list')}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
          viewMode === 'list'
            ? 'bg-background-primary text-text-main shadow-sm'
            : 'text-text-secondary hover:bg-background-primary hover:text-text-main'
        )}
        title='List view'
      >
        <List size={20} />
      </Button>
    </div>
  )
}
