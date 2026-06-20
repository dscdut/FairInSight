import React from 'react'

import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { type DuplicateCandidate } from '@/core/services/law-ai.service'

interface DuplicateWarningProps {
  candidates: DuplicateCandidate[]
  onForceCreate: () => void
  onCancel: () => void
}

// Cảnh báo TRÙNG: hiện khi duplicate.verdict === 'suspect'.
// Liệt kê các văn bản nghi trùng (mã + tên + cơ quan + độ tương đồng %),
// cho admin chọn "Vẫn tạo" (force) hoặc "Hủy" (đóng/đổi file).
export const DuplicateWarning: React.FC<DuplicateWarningProps> = ({
  candidates,
  onForceCreate,
  onCancel,
}) => {
  return (
    <div className='border border-warning-primary/30 bg-warning-primary/5 rounded-2xl p-4 flex flex-col gap-3 shrink-0'>
      <div className='flex gap-2.5'>
        <AlertTriangle className='w-4.5 h-4.5 text-warning-secondary shrink-0 mt-0.5' />
        <div className='min-w-0'>
          <p className='text-xs font-bold text-warning-secondary'>
            Phát hiện văn bản có thể đã tồn tại
          </p>
          <p className='text-[11px] text-warning-secondary/90 font-medium mt-0.5 leading-relaxed'>
            Hệ thống tìm thấy {candidates.length} văn bản tương tự trong cơ sở tri thức.
            Vui lòng kiểm tra trước khi tạo mới.
          </p>
        </div>
      </div>

      <div className='flex flex-col gap-2 max-h-44 overflow-y-auto pr-1'>
        {candidates.map((c) => (
          <div
            key={c.id}
            className='bg-background-primary border border-border-secondary rounded-xl p-3 flex items-start justify-between gap-3'
          >
            <div className='min-w-0 flex flex-col gap-0.5 text-left'>
              <span className='text-[11px] font-bold text-text-primary truncate'>
                {c.title || '(Không có tiêu đề)'}
              </span>
              <span className='text-[10px] text-text-tertiary font-semibold'>
                {c.official_code || '—'}
                {c.issuer ? ` • ${c.issuer}` : ''}
              </span>
            </div>
            <span className='shrink-0 text-[10px] font-extrabold text-warning-secondary bg-warning-primary/10 border border-warning-primary/20 rounded-lg px-2 py-1'>
              {Math.round((c.score || 0) * 100)}%
            </span>
          </div>
        ))}
      </div>

      <div className='flex items-center justify-end gap-2 pt-1'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={onCancel}
          className='h-9 text-xs font-bold rounded-xl border-border-primary text-text-primary hover:bg-background-secondary'
        >
          Hủy
        </Button>
        <Button
          type='button'
          size='sm'
          onClick={onForceCreate}
          className='h-9 text-xs font-bold rounded-xl bg-warning-secondary text-white hover:opacity-90'
        >
          Vẫn tạo
        </Button>
      </div>
    </div>
  )
}
