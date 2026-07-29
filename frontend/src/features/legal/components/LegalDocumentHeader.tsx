import { Bookmark, BookmarkCheck, Calendar, Copy, Download, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { ROUTE } from '@/core/constants/path'
import { cn } from '@/core/lib/utils'
import type { LegalDocument } from '../types'
import { LegalStatusBadge } from './LegalStatusBadge'

interface LegalDocumentHeaderProps {
  document: LegalDocument
  onBookmark?: () => void
  className?: string
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function LegalDocumentHeader({ document: doc, onBookmark, className }: LegalDocumentHeaderProps) {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <nav className='flex items-center gap-1.5 text-small text-text-tertiary flex-wrap'>
        <Link to={ROUTE.HOME} className='hover:text-primary transition-colors'>Trang chủ</Link>
        <span>/</span>
        <Link to={ROUTE.LAW_LIBRARY} className='hover:text-primary transition-colors'>Văn bản pháp luật</Link>
        <span>/</span>
        <span className='text-text-secondary line-clamp-1 max-w-xs'>{doc.title}</span>
      </nav>

      <div>
        <h1 className='text-h3 font-bold text-text-primary leading-snug mb-3'>{doc.title}</h1>
        <div className='flex items-center gap-4 flex-wrap text-small text-text-tertiary'>
          <LegalStatusBadge status={doc.status} />
          <span className='flex items-center gap-1.5'>
            <Calendar className='h-3.5 w-3.5' />
            Ngày có hiệu lực: <span className='text-text-secondary'>{formatDate(doc.effectiveDate)}</span>
          </span>
          <span className='flex items-center gap-1.5'>
            <FileText className='h-3.5 w-3.5' />
            Ngày cập nhật: <span className='text-text-secondary'>{formatDate(doc.updatedDate)}</span>
          </span>
        </div>
      </div>

      <div className='flex items-center gap-2 flex-wrap'>
        <Button size='sm' variant='outline' iconStart={<Download className='h-3.5 w-3.5' />}>
          PDF
        </Button>
        <Button size='sm' variant='outline' iconStart={<Download className='h-3.5 w-3.5' />}>
          DOCX
        </Button>
        <Button size='sm' variant='outline' iconStart={<Copy className='h-3.5 w-3.5' />} onClick={handleCopyLink}>
          Sao chép link
        </Button>
        <Button
          size='sm'
          variant='outline'
          iconStart={doc.isBookmarked
            ? <BookmarkCheck className='h-3.5 w-3.5 text-warning-primary' />
            : <Bookmark className='h-3.5 w-3.5' />
          }
          onClick={onBookmark}
          className={doc.isBookmarked ? 'border-warning-primary text-warning-primary' : ''}
        >
          {doc.isBookmarked ? 'Đã lưu' : 'Lưu'}
        </Button>
      </div>
    </div>
  )
}
