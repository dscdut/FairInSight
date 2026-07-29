import { useEffect, useRef, useMemo } from 'react'
import { cn } from '@/core/lib/utils'

interface LegalContentViewerProps {
  content: string
  searchKeyword?: string
  onSectionChange?: (id: string) => void
  className?: string
}

export function LegalContentViewer({
  content,
  searchKeyword,
  onSectionChange,
  className,
}: LegalContentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const highlightedContent = useMemo(() => {
    if (!searchKeyword?.trim() || !content) return content
    const escaped = searchKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return content.replace(
      new RegExp(`(${escaped})`, 'gi'),
      '<mark class="bg-warning-bg text-warning-primary rounded-sm px-0.5">$1</mark>'
    )
  }, [content, searchKeyword])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !onSectionChange) return

    const headings = container.querySelectorAll('[id]')
    if (!headings.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onSectionChange(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    )

    headings.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [content, onSectionChange])

  if (!content) {
    return (
      <div className='flex items-center justify-center h-64 text-text-tertiary text-sm'>
        Nội dung đang được cập nhật...
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn('legal-content prose max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: highlightedContent }}
    />
  )
}
