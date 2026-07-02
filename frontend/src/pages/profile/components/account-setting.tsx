import { useState, useEffect } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { QUERY_KEYS } from '@/core/helpers/key-tanstack'
import toastifyCommon from '@/core/lib/toastify-common'
import { authApi } from '@/core/services/auth.service'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { type Account } from '@/models/interface/auth.interface'

interface AccountSettingProps {
  user: Account | undefined
  isEditing: boolean
  setIsEditing: (isEditing: boolean) => void
}

export default function AccountSetting({ user, isEditing, setIsEditing }: AccountSettingProps) {
  const globalUser = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const queryClient = useQueryClient()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '')
      setPhone(user.phone || '0912832123')
    }
  }, [user])

  const handleToggleEdit = async () => {
    if (isEditing) {
      // Save profile changes
      if (!fullName.trim()) {
        toastifyCommon.error('Họ tên không được để trống!')
        return
      }

      setSubmitting(true)
      try {
        await authApi.updateProfile({
          fullName,
          phone,
          location: user?.location
        })

        if (globalUser) {
          updateUser({
            ...globalUser,
            fullName
          })
        }

        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.userInfo] })
        toastifyCommon.success('Cập nhật thông tin cá nhân thành công!')
        setIsEditing(false)
      } catch (err) {
        console.error(err)
        toastifyCommon.error('Cập nhật thông tin thất bại. Vui lòng thử lại!')
      } finally {
        setSubmitting(false)
      }
    } else {
      setIsEditing(true)
    }
  }

  return (
    <Card className='col-span-1 md:col-span-2 text-left'>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>Manage your account settings and preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue='profile' className='w-full'>
          <TabsList className='grid w-full grid-cols-2 mb-6'>
            <TabsTrigger value='profile'>Profile</TabsTrigger>
            <TabsTrigger value='security'>Security</TabsTrigger>
          </TabsList>
          <TabsContent value='profile' className='space-y-4'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Full Name</Label>
                <div className='flex gap-2'>
                  <Input
                    id='name'
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!isEditing}
                  />
                  <Button variant='outline' disabled={submitting} onClick={handleToggleEdit}>
                    {isEditing ? (submitting ? 'Saving...' : 'Save') : 'Edit'}
                  </Button>
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input id='email' defaultValue={user?.email} disabled />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='phone'>Phone</Label>
                <Input
                  id='phone'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value='security' className='space-y-4'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='current-password'>Current Password</Label>
                <Input id='current-password' type='password' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='new-password'>New Password</Label>
                <Input id='new-password' type='password' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='confirm-password'>Confirm New Password</Label>
                <Input id='confirm-password' type='password' />
              </div>
              <Button className='w-full'>Update Password</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
