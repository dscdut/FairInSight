import { Bookmark, BookmarkCheck, Calendar, ChevronRight, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { cn } from '@/core/lib/utils'
import { ROUTE } from '@/core/constants/path'
import type { LegalDocument } from '../types'
import { LegalStatusBadge } from './LegalStatusBadge'

interface LegalResultCardProps {
  document: LegalDocument
  searchKeyword?: string
  onBookmark?: (id: string) => void
  className?: string
}

function highlightText(text: string, keyword: string) {
  if (!keyword.trim()) return text
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className='bg-warning-bg text-warning-primary rounded-sm px-0.5 not-italic'>
        {part}
      </mark>
    ) : (
      part
    )
  )
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function LegalResultCard({
  document: doc,
  searchKeyword = '',
  onBookmark,
  className,
}: LegalResultCardProps) {
  const navigate = useNavigate()

  const handleViewDetail = () => {
    navigate(`/law-library/${doc.id}`)
  }

  return (
    <div
      className={cn(
        'group bg-background-primary border border-border-primary rounded-xl p-5 hover:border-info-primary/40 hover:shadow-200 transition-all duration-200 cursor-pointer',
        className
      )}
      onClick={handleViewDetail}
    >
      <div className='flex items-start justify-between gap-3 mb-3'>
        <div className='flex items-center gap-2 flex-wrap min-w-0'>
          <LegalStatusBadge status={doc.status} />
          <span className='text-xs text-text-tertiary font-mono shrink-0'>Số hiệu: {doc.code}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onBookmark?.(doc.id)
          }}
          className='shrink-0 text-text-tertiary hover:text-warning-primary transition-colors mt-0.5'
          title={doc.isBookmarked ? 'Bỏ lưu' : 'Lưu tài liệu'}
        >
          {doc.isBookmarked ? (
            <BookmarkCheck className='h-4 w-4 text-warning-primary' />
          ) : (
            <Bookmark className='h-4 w-4' />
          )}
        </button>
      </div>

      <h3 className='text-p font-semibold text-info-600 group-hover:text-primary transition-colors leading-snug mb-2 line-clamp-2'>
        {highlightText(doc.title, searchKeyword)}
      </h3>

      <div className='flex flex-wrap gap-1.5 mb-3'>
        {doc.categories.map((cat) => (
          <span
            key={cat}
            className='inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-info-50 text-info-600 border border-info-400/20'
          >
            {cat}
          </span>
        ))}
      </div>

      <p className='text-small text-text-secondary line-clamp-2 mb-4'>
        {highlightText(doc.summary, searchKeyword)}
      </p>

      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4 text-xs text-text-tertiary'>
          <span className='flex items-center gap-1'>
            <FileText className='h-3.5 w-3.5' />
            Ban hành: {formatDate(doc.issueDate)}
          </span>
          <span className='flex items-center gap-1'>
            <Calendar className='h-3.5 w-3.5' />
            Hiệu lực: {formatDate(doc.effectiveDate)}
          </span>
        </div>
        <span className='flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all'>
          Xem chi tiết <ChevronRight className='h-3.5 w-3.5' />
        </span>
      </div>
    </div>
  )
}
