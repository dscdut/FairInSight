import { Loader2 } from 'lucide-react'

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui'
import { type UserItem } from '@/models/user/interfaces'
import { type UserRole } from '@/models/user/types'

interface RoleDialogProps {
  isOpen: boolean
  onClose: () => void
  targetUser: UserItem | null
  newRole: UserRole
  onRoleChange: (role: UserRole) => void
  licenseNumber: string
  onLicenseNumberChange: (val: string) => void
  licenseIssuer: string
  onLicenseIssuerChange: (val: string) => void
  onConfirm: () => void
  isPending: boolean
}

export function RoleDialog({
  isOpen,
  onClose,
  targetUser,
  newRole,
  onRoleChange,
  licenseNumber,
  onLicenseNumberChange,
  licenseIssuer,
  onLicenseIssuerChange,
  onConfirm,
  isPending
}: RoleDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[480px] rounded-2xl border border-border-secondary bg-background-primary p-6'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-text-primary text-h4'>
            Thay đổi vai trò người dùng
          </DialogTitle>
          <DialogDescription className='text-sm text-text-description mt-1'>
            Cập nhật vai trò phân quyền cho tài khoản <strong>{targetUser?.fullName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 my-2'>
          <div>
            <label className='block text-sm font-medium text-text-main'>
              Vai trò mới
            </label>
            <Select value={newRole} onValueChange={(val) => onRoleChange(val as UserRole)}>
              <SelectTrigger className='w-full border-border-secondary h-11 rounded-xl px-4 text-sm bg-background-primary mt-2'>
                <SelectValue placeholder='Chọn vai trò' />
              </SelectTrigger>
              <SelectContent className='bg-background-primary'>
                <SelectItem className='hover:bg-background-secondary cursor-pointer' value='USER'>Người dùng</SelectItem>
                <SelectItem className='hover:bg-background-secondary cursor-pointer' value='LAWYER'>Luật sư</SelectItem>
                <SelectItem className='hover:bg-background-secondary cursor-pointer' value='MODERATOR'>Kiểm duyệt viên</SelectItem>
                <SelectItem className='hover:bg-background-secondary cursor-pointer' value='ADMIN'>Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lawyer Certificate Details Conditional Fields */}
          {newRole === 'LAWYER' && (
            <div className='bg-background-secondary space-y-4 animate-in fade-in-50 duration-200'>
              <div className='flex items-center gap-1.5 text-sm font-semibold text-primary mb-1 tracking-wide'>
                Thông tin hành nghề luật sư
              </div>
              <div className='space-y-1'>
                <label className='block text-sm font-medium text-text-main'>
                  Số thẻ hành nghề <span className='text-error-primary'>*</span>
                </label>
                <Input
                  placeholder='Ví dụ: 12345/TP/LS-HN'
                  value={licenseNumber}
                  onChange={(e) => onLicenseNumberChange(e.target.value)}
                  className='border-border-secondary rounded-xl h-10 px-3'
                />
              </div>
              <div className='space-y-1'>
                <label className='block text-sm font-medium text-text-main'>
                  Cơ quan cấp phép <span className='text-error-primary'>*</span>
                </label>
                <Input
                  placeholder='Ví dụ: Bộ Tư pháp / Đoàn Luật sư Hà Nội'
                  value={licenseIssuer}
                  onChange={(e) => onLicenseIssuerChange(e.target.value)}
                  className='border-border-secondary rounded-xl h-10 px-3'
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <DialogClose asChild>
            <Button
              variant='outline'
              className='rounded-xl border-border-secondary hover:bg-background-secondary cursor-pointer active:scale-[0.97] transition-all'
            >
              Hủy bỏ
            </Button>
          </DialogClose>
          <Button
            className='rounded-xl bg-primary text-white hover:bg-primary/90 border-transparent cursor-pointer active:scale-[0.97] transition-all'
            disabled={isPending || (newRole === 'LAWYER' && (!licenseNumber.trim() || !licenseIssuer.trim()))}
            onClick={onConfirm}
          >
            {isPending ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Đang lưu...
              </>
            ) : (
              'Cập nhật'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
