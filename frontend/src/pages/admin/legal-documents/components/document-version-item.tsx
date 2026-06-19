import React from 'react'

import { Eye, RotateCcw, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/core/lib/utils'
import { type LawVersion } from '@/models/types/law.type'

interface DocumentVersionItemProps {
  ver: LawVersion
  latestVersion: LawVersion
  selectedVersion: LawVersion | null
  setSelectedVersion: (ver: LawVersion) => void
  onRestoreVersion?: (version: LawVersion) => void
  readOnly?: boolean
}

export const DocumentVersionItem: React.FC<DocumentVersionItemProps> = ({
  ver,
  latestVersion,
  selectedVersion,
  setSelectedVersion,
  onRestoreVersion,
  readOnly = false,
}) => {
  const isCurrent = ver.id === latestVersion.id
  const isSelected = selectedVersion?.id === ver.id

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays === 1) return 'Hôm qua'
    if (diffDays < 7) return `${diffDays} ngày trước`

    return date.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div className='w-full text-left'>
      {/* Card Details */}
      <div
        role='button'
        tabIndex={0}
        onClick={() => setSelectedVersion(ver)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setSelectedVersion(ver)
          }
        }}
        className={cn(
          'p-4 rounded-xl border transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-ring bg-white dark:bg-background-primary',
          isSelected
            ? 'border-border-secondary border-l-[4px] border-l-[#0A2540] shadow-sm transform scale-[1.01]'
            : 'border-border-secondary hover:bg-background-primary/80 shadow-sm'
        )}
      >
        {/* Version name & Timestamp */}
        <div className='flex items-center justify-between mb-1.5'>
          <span className={cn('text-xs font-bold uppercase tracking-wider', isCurrent ? 'text-primary font-extrabold' : 'text-text-primary')}>
            {ver.version} {isCurrent && '(Hiện tại)'}
          </span>
          <span className='text-[10px] text-text-tertiary font-bold'>
            {formatTimeAgo(ver.createdAt)}
          </span>
        </div>

        {/* Change Log Text */}
        <p className='text-[11px] font-semibold text-text-secondary line-clamp-2 leading-relaxed mb-3'>
          {ver.changeNote ? `"${ver.changeNote}"` : 'Không có ghi chú thay đổi.'}
        </p>

        {/* Author avatar and details */}
        <div className='flex items-center gap-2 border-t border-border-secondary pt-2.5 mb-3'>
          <div className='w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 border border-primary/20'>
            {getInitials(ver.authorName)}
          </div>
          <span className='text-[10px] font-bold text-text-secondary truncate'>
            {ver.authorName}
          </span>
        </div>

        {/* Quick Actions inside timeline card (Only for non-current versions) */}
        {!isCurrent && (
          <div className='flex items-center gap-2 pt-1.5 border-t border-border-secondary/40'>
            {/* Preview */}
            <Button
              variant='outline'
              size='sm'
              onClick={(e) => {
                e.stopPropagation()
                setSelectedVersion(ver)
              }}
              className={cn(
                'flex-1 h-7.5 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all bg-[#EAECEF] hover:bg-[#DFE1E5] border-none text-text-primary shadow-none',
                isSelected && 'bg-primary text-white hover:bg-primary/90'
              )}
            >
              <Eye className='w-3.5 h-3.5' />
              Xem
            </Button>

            {/* Restore (Only if not current and not readOnly) */}
            {!readOnly && onRestoreVersion && (
              <Button
                variant='outline'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation()
                  onRestoreVersion(ver)
                }}
                className='flex-1 h-7.5 text-[10px] font-bold rounded-lg bg-[#EAECEF] hover:bg-[#DFE1E5] border-none text-text-primary flex items-center justify-center gap-1.5 shadow-none'
              >
                <RotateCcw className='w-3.5 h-3.5' />
                Khôi phục
              </Button>
            )}

            {/* Download PDF Document URL */}
            <Button
              variant='outline'
              size='sm'
              asChild
              className='w-7.5 h-7.5 p-0 flex items-center justify-center rounded-lg bg-[#EAECEF] hover:bg-[#DFE1E5] border-none text-text-primary shadow-none'
            >
              <a
                href={ver.sourceUrl}
                target='_blank'
                rel='noopener noreferrer'
                onClick={(e) => e.stopPropagation()}
                title='Tải về tài liệu gốc URL'
              >
                <Download className='w-4 h-4' />
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
