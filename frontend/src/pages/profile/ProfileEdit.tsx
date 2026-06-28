import { useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { ROUTE } from '@/core/constants/path'
import { useUserInfo } from '@/hooks/tanstack-query/auth/use-query-auth'
import AccountSetting from '@/pages/profile/components/account-setting'

export default function ProfileEdit() {
  const { data: user, isLoading, error } = useUserInfo()
  const [isEditing, setIsEditing] = useState(true)
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className='max-w-5xl mx-auto px-4 py-10'>
        <div className='text-sm text-text-description'>Đang tải thông tin hồ sơ...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='max-w-5xl mx-auto px-4 py-10'>
        <div className='text-sm text-destructive'>Không thể tải dữ liệu hồ sơ. Vui lòng thử lại.</div>
      </div>
    )
  }

  return (
    <div className='max-w-5xl mx-auto px-4 py-10'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-semibold text-text-main'>Chỉnh sửa hồ sơ</h1>
          <p className='mt-2 text-sm text-text-description'>
            Cập nhật thông tin cá nhân của bạn và lưu lại để hiển thị trong trang hồ sơ.
          </p>
        </div>
      </div>

      <AccountSetting
        user={user}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onSuccess={() => navigate(ROUTE.PROFILE.ROOT)}
      />
    </div>
  )
}
