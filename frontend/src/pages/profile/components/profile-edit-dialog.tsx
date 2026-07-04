import { useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateProfile } from '@/hooks/tanstack-query/auth/use-query-auth'
import { type Account } from '@/models/interface/auth.interface'

interface ProfileEditDialogProps {
  user: Account | undefined
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function ProfileEditDialog({ user, isOpen, onOpenChange }: ProfileEditDialogProps) {
  const { mutate: updateProfile, isPending } = useUpdateProfile()

  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const dobRef = useRef<HTMLInputElement>(null)
  const locationRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const fullName = nameRef.current?.value || user?.fullName
    const phone = phoneRef.current?.value || ''
    const dateOfBirth = dobRef.current?.value ? new Date(dobRef.current.value).toISOString() : undefined
    const location = locationRef.current?.value || ''

    // Sanitize payload: Joi validator on backend rejects 'null' values.
    // Replace all null/undefined values with empty string or omit them.
    const payload: Account = {
      fullName: fullName || '',
      phone: phone || '',
      location: location || '',
      avatarUrl: user?.avatarUrl || ''
    }

    if (dateOfBirth) {
      payload.dateOfBirth = dateOfBirth
    }

    updateProfile(payload, {
      onSuccess: () => {
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px] bg-background-primary border border-border-primary text-left rounded-2xl'>
        <DialogHeader>
          <DialogTitle className='text-h2 font-bold text-text-main'>Chỉnh sửa thông tin</DialogTitle>
          <DialogDescription className='text-xs text-text-description'>Cập nhật thông tin cá nhân của bạn</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          <div className='space-y-2'>
            <Label htmlFor='name' className='text-xs font-semibold text-text-secondary'>Họ và tên</Label>
            <Input ref={nameRef} id='name' defaultValue={user?.fullName} placeholder='Nhập họ tên' required />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='email' className='text-xs font-semibold text-text-secondary'>Email</Label>
            <Input id='email' defaultValue={user?.email} disabled className='bg-background-secondary cursor-not-allowed opacity-80' />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='phone' className='text-xs font-semibold text-text-secondary'>Số điện thoại</Label>
            <Input ref={phoneRef} id='phone' defaultValue={user?.phone || ''} placeholder='Chưa thiết lập số điện thoại' />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='dob' className='text-xs font-semibold text-text-secondary'>Ngày sinh</Label>
            <Input 
              ref={dobRef}
              id='dob' 
              type='date'
              defaultValue={user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : ''} 
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='location' className='text-xs font-semibold text-text-secondary'>Địa chỉ / Vị trí</Label>
            <Input 
              ref={locationRef}
              id='location' 
              defaultValue={user?.location || ''} 
              placeholder='Ví dụ: Hà Nội, Việt Nam'
            />
          </div>

          <DialogFooter className='pt-4 border-t border-border-secondary gap-2 flex-row justify-end'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}>
              Hủy
            </Button>
            <Button type='submit' disabled={isPending} className='px-6'>
              {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
