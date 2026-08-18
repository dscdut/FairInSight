import { motion } from 'framer-motion'
import { Clock, Edit2, Trash2, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/core/lib/utils'
import { type ViewMode } from '@/models/types/form-library'

interface Draft {
  id: string
  templateId: string
  templateTitle: string
  templateCategory: string
  lastModified: Date
  progress: number
  formData: Record<string, string>
}

interface DraftCardProps {
  draft: Draft
  viewMode: ViewMode
  onEdit?: (draft: Draft) => void
  onDelete?: (draft: Draft) => void
}

const formatDate = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) {
    return `${diffMins} phút trước`
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`
  }

  return date.toLocaleDateString('vi-VN')
}

export default function DraftCard({ draft, viewMode, onEdit, onDelete }: DraftCardProps) {
  const handleEdit = () => {
    if (onEdit) onEdit(draft)
  }

  const handleDelete = () => {
    if (onDelete) onDelete(draft)
  }

  const cardClass = cn(
    'bg-background-secondary rounded-lg p-4 border border-border-secondary shadow-200 transition-all hover:shadow-300',
    'hover:border-border-focus',
    viewMode === 'list' && 'flex items-center justify-between'
  )

  const contentClass = cn(viewMode === 'list' && 'flex-1')

  const progressPercentageColor = draft.progress < 50 ? 'bg-warning-primary' : 'bg-success-primary'

  return (
    <motion.div className={cardClass} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <div className={cn('space-y-3', contentClass)}>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-2'>
              <FileText size={18} className='text-text-secondary' aria-hidden='true' />
              <h3 className='text-p-medium font-semibold text-text-primary line-clamp-2'>{draft.templateTitle}</h3>
            </div>
            <p className='text-small text-text-secondary mt-1'>{draft.templateCategory}</p>
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <span className='text-small text-text-secondary'>Tiến độ</span>
            <span className='text-small font-medium text-text-primary'>{draft.progress}%</span>
          </div>
          <div className='w-full h-2 bg-background-tertiary rounded-full overflow-hidden'>
            <div
              className={cn('h-full rounded-full transition-all duration-300', progressPercentageColor)}
              style={{ width: `${draft.progress}%` }}
              role='progressbar'
              aria-valuenow={draft.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        <div className='flex items-center gap-2 text-text-description'>
          <Clock size={16} aria-hidden='true' />
          <span className='text-small'>{formatDate(draft.lastModified)}</span>
        </div>

        <div className={cn('flex gap-2 pt-2', viewMode === 'list' && 'ml-auto')}>
          <Button
            variant='outline'
            size='sm'
            onClick={handleEdit}
            className='flex-1 sm:flex-none'
            title='Tiếp tục chỉnh sửa'
          >
            <Edit2 size={16} className='mr-1' aria-hidden='true' />
            <span className='hidden sm:inline'>Chỉnh sửa</span>
            <span className='sm:hidden'>Sửa</span>
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleDelete}
            className='text-error-primary hover:bg-error-bg'
            title='Xóa bản nháp'
          >
            <Trash2 size={16} aria-hidden='true' />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
