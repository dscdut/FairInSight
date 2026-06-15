import React, { useState, useEffect } from 'react'

import { AlertTriangle, Info } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/core/lib/utils'
import { type Law } from '@/models/types/law.type'

interface StatusChangeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (law: Law, reason: string) => void
  law: Law | null
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  law,
}) => {
  const [reason, setReason] = useState('')

  // Reset reason when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason('')
    }
  }, [isOpen])

  if (!law) return null

  const isCurrentActive = law.status === 'ACTIVE'

  const handleConfirm = () => {
    onConfirm(law, reason)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-md p-6 rounded-2xl border-none shadow-2xl bg-white dark:bg-neutral-900'>
        <div className='flex flex-col items-center text-center'>
          {/* Alert Icon (Peach/Orange background, no border) */}
          <div className='w-12 h-12 bg-[#FFF3EE] dark:bg-amber-950/20 rounded-2xl flex items-center justify-center mb-4'>
            <AlertTriangle className='w-6 h-6 text-[#E65F2B]' />
          </div>

          {/* Title */}
          <h2 className='text-lg font-bold text-[#111827] dark:text-white mb-5'>
            Xác nhận chuyển trạng thái hiệu lực
          </h2>

          {/* Document Summary Box (Light grey background, rounded-2xl) */}
          <div className='w-full bg-[#F3F4F6] dark:bg-neutral-800/80 p-5 rounded-2xl text-left mb-4 flex flex-col gap-1'>
            <div className='flex items-center justify-between mb-1'>
              <span className='text-[10px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider'>
                Văn bản
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold',
                  isCurrentActive
                    ? 'bg-[#E8F8EE] text-[#10B981]'
                    : 'bg-[#FCE8E6] text-[#EF4444]'
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isCurrentActive ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                  )}
                />
                {isCurrentActive ? 'Còn hiệu lực' : 'Hết hiệu lực'}
              </span>
            </div>
            <h3 className='font-extrabold text-[#111827] dark:text-white text-[15px] leading-snug'>
              {law.title}
            </h3>
            <p className='text-xs text-[#6B7280] dark:text-gray-400 font-semibold'>
              Số hiệu: {law.documentNumber}
            </p>
          </div>

          {/* Info Banner (Blue Info Icon & Blue Link Details) */}
          <div className='w-full flex gap-3 p-1.5 text-left mb-5 items-start'>
            <Info className='w-5 h-5 text-[#1D4ED8] dark:text-blue-400 shrink-0 mt-0.5' />
            <p className='text-xs text-[#374151] dark:text-gray-300 leading-relaxed font-semibold'>
              {isCurrentActive ? (
                <>
                  Sau khi chuyển sang <strong className='text-[#111827] dark:text-white font-extrabold'>Hết hiệu lực</strong>, văn bản này sẽ không xuất hiện trong kết quả tìm kiếm mặc định.
                </>
              ) : (
                <>
                  Sau khi chuyển sang <strong className='text-[#111827] dark:text-white font-extrabold'>Còn hiệu lực</strong>, văn bản này sẽ xuất hiện lại trong kết quả tìm kiếm và các báo cáo pháp lý định kỳ.
                </>
              )}
            </p>
          </div>

          {/* Reason Input */}
          <div className='w-full text-left mb-6'>
            <label className='block text-[11px] font-extrabold text-[#374151] dark:text-gray-400 uppercase tracking-widest mb-2'>
              Lý do thay đổi (Tùy chọn)
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isCurrentActive
                  ? 'Nhập lý do hoặc căn cứ pháp lý cho việc thay đổi trạng thái...'
                  : 'Nhập lý do hoặc căn cứ pháp lý để kích hoạt lại văn bản...'
              }
              className='min-h-[90px] text-xs resize-none bg-[#F9FAFB] dark:bg-neutral-800 border border-[#E5E7EB] dark:border-neutral-700 focus:bg-white rounded-xl text-text-primary placeholder-[#9CA3AF] px-4 py-3'
            />
          </div>

          {/* Action Buttons (Match exact green/red solid colors from image) */}
          <div className='w-full flex flex-col gap-2.5'>
            <Button
              onClick={handleConfirm}
              className={cn(
                'w-full h-11 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-98 border-none',
                isCurrentActive
                  ? 'bg-[#C21A1A] hover:bg-[#A31414]'
                  : 'bg-[#10B981] hover:bg-[#0D9488]'
              )}
            >
              Xác nhận chuyển
            </Button>
            <Button
              variant='outline'
              onClick={onClose}
              className='w-full h-11 border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB] dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700 font-bold text-sm rounded-xl transition-all shadow-sm'
            >
              Hủy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
