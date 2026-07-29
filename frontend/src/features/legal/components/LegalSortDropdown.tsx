import { ArrowUpDown, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

import { cn } from '@/core/lib/utils'
import { SORT_OPTIONS } from '../constants'
import type { SortOption } from '../types'

interface LegalSortDropdownProps {
  value: SortOption
  onChange: (value: SortOption) => void
  className?: string
}

export function LegalSortDropdown({ value, onChange, className }: LegalSortDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [])

  const selectedLabel = SORT_OPTIONS.find((o) => o.value === value)?.label || 'Sắp xếp'

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        className='flex items-center gap-2 h-9 px-3 rounded-lg border border-border-secondary bg-background-primary text-text-primary text-sm hover:border-border-primary transition-colors'
      >
        <ArrowUpDown className='h-3.5 w-3.5 text-text-tertiary' />
        <span>Sắp xếp: <span className='text-primary font-medium'>{selectedLabel}</span></span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-text-tertiary transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className='absolute right-0 top-full mt-1 w-44 rounded-lg border border-border-primary bg-background-primary shadow-300 z-50 overflow-hidden'>
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setOpen(false) }}
              className={cn(
                'w-full text-left px-3 py-2.5 text-sm hover:bg-background-secondary transition-colors',
                value === option.value ? 'text-primary font-medium bg-info-50' : 'text-text-secondary'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
