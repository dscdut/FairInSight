import { cn } from '@/core/lib/utils'

interface LegalSkeletonProps {
  count?: number
  className?: string
}

function SkeletonCard() {
  return (
    <div className='bg-background-primary border border-border-primary rounded-xl p-5 animate-pulse'>
      <div className='flex items-center gap-2 mb-3'>
        <div className='h-5 w-20 rounded-sm bg-background-secondary' />
        <div className='h-4 w-32 rounded bg-background-secondary' />
      </div>
      <div className='h-5 w-full rounded bg-background-secondary mb-1.5' />
      <div className='h-5 w-3/4 rounded bg-background-secondary mb-3' />
      <div className='flex gap-2 mb-3'>
        <div className='h-5 w-16 rounded-full bg-background-secondary' />
        <div className='h-5 w-20 rounded-full bg-background-secondary' />
        <div className='h-5 w-14 rounded-full bg-background-secondary' />
      </div>
      <div className='h-4 w-full rounded bg-background-secondary mb-1' />
      <div className='h-4 w-5/6 rounded bg-background-secondary mb-4' />
      <div className='flex items-center justify-between'>
        <div className='flex gap-4'>
          <div className='h-4 w-28 rounded bg-background-secondary' />
          <div className='h-4 w-28 rounded bg-background-secondary' />
        </div>
        <div className='h-4 w-20 rounded bg-background-secondary' />
      </div>
    </div>
  )
}

export function LegalSkeleton({ count = 5, className }: LegalSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function LegalDetailSkeleton() {
  return (
    <div className='animate-pulse space-y-6'>
      <div className='space-y-3'>
        <div className='h-4 w-64 rounded bg-background-secondary' />
        <div className='h-7 w-full rounded bg-background-secondary' />
        <div className='h-7 w-4/5 rounded bg-background-secondary' />
        <div className='flex items-center gap-4 mt-2'>
          <div className='h-5 w-24 rounded-sm bg-background-secondary' />
          <div className='h-4 w-32 rounded bg-background-secondary' />
          <div className='h-4 w-32 rounded bg-background-secondary' />
        </div>
      </div>
      <div className='flex gap-6 border-b border-border-primary pb-2'>
        {['Nội dung', 'Thuộc tính', 'Lược đồ', 'Văn bản gốc', 'Tải về'].map((tab) => (
          <div key={tab} className='h-5 w-16 rounded bg-background-secondary' />
        ))}
      </div>
      <div className='space-y-3'>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 rounded bg-background-secondary',
              i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-5/6' : 'w-4/5'
            )}
          />
        ))}
      </div>
    </div>
  )
}
