import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import toastifyCommon from '@/core/lib/toastify-common'
import { type Account } from '@/models/interface/auth.interface'

function formatDateForInput(date?: string | null) {
  if (!date) return ''
  try {
    return new Date(date).toISOString().substring(0, 10)
  } catch {
    return ''
  }
}

interface AccountSettingProps {
  user: Account | null
  isEditing: boolean
  setIsEditing: (isEditing: boolean) => void
  onSuccess?: () => void
}

export default function AccountSetting({ user, isEditing, setIsEditing, onSuccess }: AccountSettingProps) {
  const [name, setName] = useState(user?.fullName || '')

  const [email, setEmail] = useState(user?.email || '')

  const [phone, setPhone] = useState(user?.phone || '')

  const [dateOfBirth, setDateOfBirth] = useState(formatDateForInput(user?.dateOfBirth))

  const [location, setLocation] = useState(user?.location || '')
  const maxDob = `${new Date().getFullYear()}-12-31`

  useEffect(() => {
    if (!isEditing) {
      setName(user?.fullName || '')
      setEmail(user?.email || '')
      setPhone(user?.phone || '')
      setDateOfBirth(formatDateForInput(user?.dateOfBirth))
      setLocation(user?.location || '')
    }
  }, [user, isEditing])

  const handleSave = async () => {
    const payload = {
      fullName: name,
      phone: phone,
      dateOfBirth: dateOfBirth,
      location: location
    }

    try {
      const response = await fetch('https://fairinsights-api.gdsc.dev/api/v1/auth/me', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Update failed')
      }

      // object trả về sau PATCH
      const result = await response.json()

      console.log(result)

      setIsEditing(false)

      // gọi lại GET
      await onSuccess?.()

      toastifyCommon.success('Cập nhật thành công')
    } catch (error) {
      console.log(error)
      toastifyCommon.error('Cập nhật thất bại')
    }
  }

  return (
    <Card className='col-span-1 md:col-span-2'>
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
          <TabsContent value='profile' className='space-y-6'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Full Name</Label>
                <div className='flex gap-2'>
                  <Input
                    id='name'
                    value={name}
                    onChange={(e) => setName((e.target as HTMLInputElement).value)}
                    disabled={!isEditing}
                  />
                  <Button
                    variant='outline'
                    onClick={() => {
                      if (isEditing) {
                        handleSave()
                      } else {
                        setIsEditing(true)
                      }
                    }}
                  >
                    {isEditing ? 'Save' : 'Edit'}
                  </Button>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input id='email' value={email} disabled />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='phone'>Phone</Label>
                  <Input
                    id='phone'
                    value={phone}
                    onChange={(e) => setPhone((e.target as HTMLInputElement).value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='dateOfBirth'>Date of Birth</Label>
                  <Input
                    id='dateOfBirth'
                    type='date'
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth((e.target as HTMLInputElement).value)}
                    min='1950-01-01'
                    max={maxDob}
                    disabled={!isEditing}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='location'>Location</Label>
                  <Input
                    id='location'
                    value={location}
                    onChange={(e) => setLocation((e.target as HTMLInputElement).value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Subscription Plan</Label>
                <div className='px-3 py-2 bg-background-secondary rounded-md border border-border-primary text-text-main'>
                  {user?.subscription?.planName || 'Not set'}
                </div>
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
