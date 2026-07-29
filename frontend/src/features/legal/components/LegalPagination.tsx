import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'

import { cn } from '@/core/lib/utils'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

interface LegalPaginationProps {
  currentPage: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  className?: string
}

function PageSizeDropdown({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className='relative'>
      <button
        onClick={() => setOpen(!open)}
        className='flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border-primary bg-background-primary text-sm text-text-secondary hover:border-primary hover:text-primary transition-colors'
      >
        <span className='font-medium'>{value}</span>
        <span className='text-text-tertiary'>/ trang</span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-text-tertiary transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className='absolute bottom-full mb-1 left-0 w-32 rounded-lg border border-border-primary bg-background-primary shadow-300 z-50 overflow-hidden'>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => { onChange(size); setOpen(false) }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm transition-colors',
                size === value
                  ? 'text-primary font-medium bg-info-50'
                  : 'text-text-secondary hover:bg-background-secondary'
              )}
            >
              {size} / trang
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PageJumpInput({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  const [value, setValue] = useState(String(currentPage))

  useEffect(() => {
    setValue(String(currentPage))
  }, [currentPage])

  const commit = () => {
    const n = parseInt(value, 10)
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      onPageChange(n)
    } else {
      setValue(String(currentPage))
    }
  }

  return (
    <div className='flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border-primary bg-background-primary text-sm text-text-secondary'>
      <input
        type='text'
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className='w-10 text-center bg-transparent text-text-primary font-medium outline-none focus:text-primary'
        aria-label='Nhảy đến trang'
      />
      <span className='text-text-tertiary shrink-0'>/ {totalPages.toLocaleString()}</span>
    </div>
  )
}

export function LegalPagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className,
}: LegalPaginationProps) {
  if (totalPages <= 1 && total <= PAGE_SIZE_OPTIONS[0]) return null

  const getPages = () => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

    const WING = 2

    if (currentPage <= WING + 2) {
      for (let i = 1; i <= Math.min(WING * 2 + 1, totalPages - 1); i++) pages.push(i)
      if (totalPages > WING * 2 + 2) pages.push('...')
      pages.push(totalPages)
      return pages
    }

    if (currentPage >= totalPages - WING - 1) {
      pages.push(1)
      if (totalPages - WING * 2 - 2 > 1) pages.push('...')
      for (let i = Math.max(2, totalPages - WING * 2); i <= totalPages; i++) pages.push(i)
      return pages
    }

    pages.push(1)
    pages.push('...')
    for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
    pages.push('...')
    pages.push(totalPages)
    return pages
  }

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-2', className)}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className='flex items-center gap-1 h-9 px-3 rounded-lg border border-border-primary text-text-tertiary text-sm hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
      >
        <ChevronLeft className='h-4 w-4' />
        <span>Trước</span>
      </button>

      {getPages().map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className='flex items-center justify-center h-9 w-7 text-text-tertiary text-sm'>
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={cn(
              'flex items-center justify-center h-9 w-9 rounded-lg border text-sm font-medium transition-colors',
              page === currentPage
                ? 'bg-primary text-white border-primary'
                : 'border-border-primary text-text-secondary hover:border-primary hover:text-primary'
            )}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className='flex items-center gap-1 h-9 px-3 rounded-lg border border-border-primary text-text-tertiary text-sm hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
      >
        <span>Sau</span>
        <ChevronRight className='h-4 w-4' />
      </button>

      {onPageSizeChange && (
        <PageSizeDropdown value={pageSize} onChange={onPageSizeChange} />
      )}

      <PageJumpInput
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  )
}
