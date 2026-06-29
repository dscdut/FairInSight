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

interface BanDialogProps {
  isOpen: boolean
  onClose: () => void
  targetUser: UserItem | null
  reason: string
  onReasonChange: (val: string) => void
  onConfirm: () => void
  isPending: boolean
}

export function BanDialog({
  isOpen,
  onClose,
  targetUser,
  reason,
  onReasonChange,
  onConfirm,
  isPending
}: BanDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[480px] border border-border-secondary bg-background-primary p-6'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-warning-primary text-h4'>
            Khóa tài khoản
          </DialogTitle>
          <DialogDescription className='text-sm text-text-description mt-1'>
            Bạn đang chuẩn bị khóa tài khoản của <strong>{targetUser?.fullName}</strong>. Người dùng này sẽ không thể đăng nhập hoặc thực hiện các hoạt động trên hệ thống.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 my-3'>
          <label className='block text-sm font-medium'>
            Lý do khóa tài khoản
          </label>
          <textarea
            className='w-full border border-border-secondary rounded-sm p-2 text-sm focus:border-warning-primary focus:outline-none min-h-[100px] text-text-primary placeholder:text-text-tertiary bg-background-primary'
            placeholder='Nhập lý do khóa tài khoản này (lý do sẽ được thông báo cho người dùng)...'
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
          />
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <DialogClose asChild>
            <Button
              variant='outline'
              className='hover:bg-background-secondary'
            >
              Hủy bỏ
            </Button>
          </DialogClose>
          <Button
            className='bg-warning-primary hover:bg-warning-secondary'
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Đang xử lý...
              </>
            ) : (
              'Khóa tài khoản'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
