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

interface DeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  targetUser: UserItem | null
  onConfirm: () => void
  isPending: boolean
}

export function DeleteDialog({
  isOpen,
  onClose,
  targetUser,
  onConfirm,
  isPending
}: DeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[480px] rounded-2xl border border-border-secondary bg-background-primary p-6'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-error-primary text-h4'>
            Xác nhận xóa tài khoản
          </DialogTitle>
          <DialogDescription className='text-sm text-text-description mt-1'>
            Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của <strong>{targetUser?.fullName}</strong> không?
            <span className='block text-error-primary font-medium mt-2'>
              Cảnh báo: Hành động này là vĩnh viễn và KHÔNG THỂ hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa sạch khỏi hệ thống.
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className='gap-2 sm:gap-0 mt-4'>
          <DialogClose asChild>
            <Button
              variant='outline'
            >
              Hủy bỏ
            </Button>
          </DialogClose>
          <Button
            variant='destructive'
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Đang xóa...
              </>
            ) : (
              'Xác nhận xóa'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
