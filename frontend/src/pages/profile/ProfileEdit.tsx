import { useState, useEffect } from 'react'

import { User, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import toastifyCommon from '@/core/lib/toastify-common'
import { authApi } from '@/core/services/auth.service'
import { useAuthStore } from '@/core/store/features/auth/authStore'

export default function ProfileEdit() {
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)

  const [fullName, setFullName] = useState(user?.fullName || '')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      try {
        const res = await authApi.getUserInfo() as any
        if (res && res.data) {
          const profile = res.data
          setFullName(profile.fullName || '')
          setEmail(profile.email || '')
          setPhone(profile.phone || '')
          setLocation(profile.location || '')
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleSave = async () => {
    if (!fullName.trim()) {
      toastifyCommon.error('Họ tên không được để trống!')
      return
    }

    try {
      await authApi.updateProfile({
        fullName,
        phone,
        location
      })

      if (user) {
        updateUser({
          ...user,
          fullName
        })
      }
      toastifyCommon.success('Cập nhật thông tin cá nhân thành công!')
    } catch (err) {
      console.error(err)
      toastifyCommon.error('Cập nhật thông tin thất bại. Vui lòng thử lại!')
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px] bg-background-primary'>
        <div className='w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  return (
    <div className='max-w-xl mx-auto lg:p-6 p-4 space-y-6'>
      <div>
        <h1 className='text-h4 font-bold text-text-main flex items-center gap-2'>
          <User className='w-6 h-6 text-primary' />
          Chỉnh sửa thông tin cá nhân
        </h1>
        <p className='text-xs text-text-description mt-1'>
          Quản lý thông tin họ tên, số điện thoại liên lạc và địa chỉ của bạn trên hệ thống.
        </p>
      </div>

      <Card className='p-6 border border-border-secondary bg-background-primary shadow-sm space-y-5 text-left'>
        <CardTitle className='text-sm uppercase tracking-wider text-text-main font-bold border-b border-border-secondary pb-3'>
          Thông tin tài khoản
        </CardTitle>

        <div className='space-y-4'>
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-text-main'>Họ và tên</label>
            <Input
              type='text'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className='rounded-lg text-sm bg-background-primary border-border-secondary'
              placeholder='Họ và tên đầy đủ'
            />
          </div>

          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-text-main'>Email tài khoản</label>
            <Input
              type='email'
              value={email}
              disabled
              className='rounded-lg text-sm bg-slate-50 border-border-secondary cursor-not-allowed opacity-75'
            />
          </div>

          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-text-main'>Số điện thoại</label>
            <Input
              type='text'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className='rounded-lg text-sm bg-background-primary border-border-secondary'
              placeholder='Số điện thoại liên lạc'
            />
          </div>

          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-text-main'>Địa chỉ sinh sống (Tỉnh/Thành phố)</label>
            <Input
              type='text'
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className='rounded-lg text-sm bg-background-primary border-border-secondary'
              placeholder='Ví dụ: Hà Nội, Việt Nam'
            />
          </div>
        </div>

        <div className='flex justify-end pt-2 border-t border-border-secondary pt-4'>
          <Button
            onClick={handleSave}
            className='bg-primary hover:bg-primary-600 text-white rounded-lg flex items-center gap-2 px-4 shadow-sm'
          >
            <Save className='w-4 h-4' />
            <span>Lưu thông tin</span>
          </Button>
        </div>
      </Card>
    </div>
  )
}
