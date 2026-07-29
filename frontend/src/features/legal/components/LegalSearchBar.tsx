import { Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/core/lib/utils'

interface LegalSearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  resultCount?: number
  isLoading?: boolean
  className?: string
}

export function LegalSearchBar({
  value,
  onChange,
  onSearch,
  resultCount,
  isLoading,
  className,
}: LegalSearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch()
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className='flex gap-2'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none' />
          <input
            type='text'
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Nhập từ khóa tìm kiếm...'
            className='w-full h-11 pl-10 pr-10 rounded-lg border border-border-secondary bg-background-primary text-text-primary text-sm focus:outline-none focus:border-info-primary focus:ring-1 focus:ring-info-primary/30 transition-colors'
          />
          {value && (
            <button
              onClick={() => onChange('')}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors'
            >
              <X className='h-4 w-4' />
            </button>
          )}
        </div>
        <Button
          onClick={onSearch}
          loading={isLoading}
          iconStart={<Search className='h-4 w-4' />}
          className='px-5 shrink-0'
        >
          Tìm kiếm
        </Button>
      </div>

      {resultCount !== undefined && (
        <p className='text-small text-text-tertiary'>
          {resultCount > 0 ? (
            <>
              Tìm thấy{' '}
              <span className='font-semibold text-text-primary'>{resultCount.toLocaleString()}</span>{' '}
              kết quả
              {value && (
                <>
                  {' '}cho{' '}
                  <span className='font-semibold text-info-primary'>"{value}"</span>
                </>
              )}
            </>
          ) : (
            'Không tìm thấy kết quả nào'
          )}
        </p>
      )}
    </div>
  )
}
