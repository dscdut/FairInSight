import { Loader2 } from 'lucide-react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui'
import { type UserItem } from '@/models/user/interfaces'

interface UnBanDialogProps {
  isOpen: boolean
  onClose: () => void
  targetUser: UserItem | null
  reason: string
  onReasonChange: (val: string) => void
  onConfirm: () => void
  isPending: boolean
}

export function UnBanDialog({
  isOpen,
  onClose,
  targetUser,
  reason,
  onReasonChange,
  onConfirm,
  isPending
}: UnBanDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[480px] border border-border-secondary bg-background-primary p-6'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-success-primary text-h4'>
            Mở khóa tài khoản
          </DialogTitle>
          <DialogDescription className='text-sm text-text-description mt-1'>
            Hành động này sẽ kích hoạt lại tài khoản của <strong>{targetUser?.fullName}</strong> Họ có thể đăng nhập lại vào hệ thống bình thường.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 my-2'>
          <label className='block text-sm font-medium text-text-secondary'>
            Lý do mở khóa (Tùy chọn)
          </label>
          <textarea
            className='w-full border border-border-secondary rounded-sm p-2 text-sm focus:border-success-primary focus:outline-none min-h-[100px] text-text-primary placeholder:text-text-tertiary bg-background-primary'
            placeholder='Nhập lý do kích hoạt lại tài khoản...'
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
          />
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <DialogClose asChild>
            <Button
              variant='outline'
            >
              Hủy bỏ
            </Button>
          </DialogClose>
          <Button
            className='bg-success-primary text-white hover:bg-success-primary/90 border-transparent cursor-pointer active:scale-[0.97] transition-all'
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Đang xử lý...
              </>
            ) : (
              'Mở khóa tài khoản'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
