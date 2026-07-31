import React from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { type Law } from '@/models/types/law.type'

interface DeleteConfirmModalProps {
  isOpen: boolean
  law: Law | null
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  law,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  if (!law) return null

  const displayName = law.documentNumber
    ? `${law.title} (${law.documentNumber})`
    : law.title

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent className='sm:max-w-md bg-background-primary border-border-secondary shadow-2xl rounded-2xl p-6'>
        <DialogHeader className='space-y-3'>
          <div className='w-12 h-12 rounded-full bg-error-primary/10 flex items-center justify-center text-error-primary mx-auto sm:mx-0'>
            <AlertTriangle className='w-6 h-6' />
          </div>
          <DialogTitle className='text-h3 font-bold text-text-primary text-center sm:text-left'>
            Xác nhận xóa văn bản pháp luật?
          </DialogTitle>
          <DialogDescription className='text-xs text-text-description font-medium leading-relaxed text-center sm:text-left'>
            Bạn có chắc chắn muốn xóa văn bản <strong className='text-text-primary font-bold'>{displayName}</strong> khỏi hệ thống?
            <br />
            <span className='inline-block mt-2 text-error-primary font-semibold'>
              ⚠️ Hành động này sẽ tiêu hủy file PDF gốc trên Cloudinary và xóa sạch 100% dữ liệu điều khoản & vector liên quan. Không thể hoàn tác!
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className='mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end'>
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            disabled={isDeleting}
            className='h-10 px-4 text-xs font-bold rounded-xl border-border-primary text-text-primary hover:bg-background-secondary transition-all'
          >
            Hủy bỏ
          </Button>
          <Button
            type='button'
            onClick={onConfirm}
            disabled={isDeleting}
            className='h-10 px-5 text-xs font-bold rounded-xl bg-error-primary hover:bg-error-primary/90 text-white shadow-md transition-all flex items-center justify-center gap-2'
          >
            {isDeleting ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                <span>Đang xóa...</span>
              </>
            ) : (
              <span>Xác nhận xóa</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
