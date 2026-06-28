import { useState, useEffect } from 'react'

import { Camera, Mail, MapPin, Phone, Calendar, Clock } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import FileUpload from '@/components/upload-file/file-upload'
import { type Account } from '@/models/interface/auth.interface'
import AccountSetting from '@/pages/profile/components/account-setting'
import RecentActivity from '@/pages/profile/components/recent-activity'

function formatDate(date?: string | null) {
  if (!date) return 'Not set'
  try {
    return new Date(date).toLocaleDateString('vi-VN')
  } catch {
    return date
  }
}

export default function Profile() {
  const [user, setUser] = useState<Account | null>(null)
  const [loading, setLoading] = useState(false)
  const fetchUser = async () => {
    try {
      setLoading(true)
      const response = await fetch('https://fairinsights-api.gdsc.dev/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Fetch user failed')
      }

      const result = await response.json()

      // nếu API trả về { data: {...} }
      setUser(result)

      // nếu API trả thẳng object
      // setUser(result)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const [isEditing, setIsEditing] = useState(false)

  const handleAvatarUpload = (files: FileList | null) => {
    if (files && files[0]) {
      // placeholder: integrate real upload flow later
      //console.log('avatar file selected', files[0])
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const planName = (user as any)?.subscriptions?.planName || (user as any)?.subscription?.planName || 'Not set'

  return (
    <div className='max-w-5xl mx-auto px-4 py-10'>
      {loading ? (
        <h1>Đang tải</h1>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
          <Card className='w-full lg:col-span-1 overflow-hidden rounded-xl shadow-200'>
            <div className='w-full h-28 bg-gradient-to-r from-info-primary to-legal-500 relative flex items-center justify-center'>
              <div className='absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2'>
                <Avatar className='h-20 w-20 sm:h-24 sm:w-24 border-4 border-white shadow-lg'>
                  <AvatarImage src={user?.avatarUrl || '/images/avatar.png'} alt={user?.fullName} />
                  <AvatarFallback className='text-lg'>{getInitials(user?.fullName || '')}</AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className='mt-14 sm:mt-16 w-full flex flex-col items-center px-4 sm:px-6 pb-6 sm:pb-8'>
              <CardTitle className='text-xl sm:text-2xl text-center break-words'>
                {user?.fullName || 'Người dùng'}
              </CardTitle>
              <CardDescription className='text-sm sm:text-base text-center break-all'>{user?.email}</CardDescription>

              <div className='flex flex-col gap-4 mt-6 w-full'>
                <div className='flex items-start gap-3 text-sm'>
                  <Mail className='h-4 w-4' />
                  <span className='text-text-main break-all'>{user?.email || 'Not set'}</span>
                </div>

                <div className='flex items-center gap-3 text-sm text-text-description'>
                  <Phone className='h-4 w-4' />
                  <span className='text-text-main'>{user?.phone || 'Not set'}</span>
                </div>

                <div className='flex items-center gap-3 text-sm text-text-description'>
                  <MapPin className='h-4 w-4' />
                  <span className='text-text-main'>{user?.location || 'Not set'}</span>
                </div>

                <div className='flex items-center gap-3 text-sm text-text-description'>
                  <Calendar className='h-4 w-4' />
                  <span className='text-text-main'>{formatDate(user?.dateOfBirth)}</span>
                </div>

                <div className='flex items-center gap-3 text-sm text-text-description'>
                  <Clock className='h-4 w-4' />
                  <span className='text-text-main'>Đã tham gia: {formatDate(user?.createdAt)}</span>
                </div>

                <div className='flex items-center gap-3 text-sm text-text-description'>
                  <span className='px-2 py-1 bg-background-secondary rounded-md text-sm text-text-main border border-border-primary'>
                    Gói: {planName}
                  </span>
                </div>
              </div>

              <FileUpload onChange={handleAvatarUpload} ariaLabel='Upload avatar'>
                <Button
                  variant='outline'
                  size='icon'
                  className='rounded-full mt-6'
                  aria-label='Upload avatar'
                  tabIndex={0}
                >
                  <Camera className='h-4 w-4' />
                </Button>
              </FileUpload>
            </div>
          </Card>

          <AccountSetting user={user} isEditing={isEditing} setIsEditing={setIsEditing} onSuccess={fetchUser} />
        </div>
      )}
      \
      <RecentActivity />
    </div>
  )
}
