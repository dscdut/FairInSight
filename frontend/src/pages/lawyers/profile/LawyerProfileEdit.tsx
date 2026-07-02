import { useState, useEffect } from 'react'

import { User, Mail, Phone, MapPin, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import toastifyCommon from '@/core/lib/toastify-common'
import { lawyerApi } from '@/core/services/lawyer.service'
import { usersApi } from '@/core/services/users.service'
import { useAuthStore } from '@/core/store/features/auth/authStore'

export default function LawyerProfileEdit() {
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const currentUserId = user?.userId

  const [fullName, setFullName] = useState(user?.fullName || 'Nguyễn Hồng Sơn')
  const email = user?.email || 'lawyer.son@fairinsight.vn'
  const [phone, setPhone] = useState('0912 832 123')
  const [location, setLocation] = useState('Hà Nội, Việt Nam')
  const [specialty, setSpecialty] = useState('Hình sự, Đất đai & Dân sự')
  const [experience, setExperience] = useState('12 năm')
  const [certifications, setCertifications] = useState('Thẻ hành nghề số: 10452/TP/LS, Cấp bởi: Bộ Tư Pháp')
  const [fee, setFee] = useState('500,000 đ/giờ')
  const [bio, setBio] = useState('Luật sư Nguyễn Hồng Sơn đã có hơn 12 năm kinh nghiệm tư vấn và tranh tụng.')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      if (!currentUserId) return
      setLoading(true)
      try {
        const res = await lawyerApi.getLawyerDetail(currentUserId) as any
        if (res && res.summary) {
          const s = res.summary
          setSpecialty(s.specializations?.join(', ') || '')
          setExperience(s.experienceYears ? `${s.experienceYears} năm` : '0 năm')
          setFee(s.consultingFee ? `${s.consultingFee.toLocaleString('vi-VN')} đ/giờ` : '0 đ/giờ')
          setBio(s.careerHistory || '')
          if (s.licenseInfo) {
            setCertifications(
              `Thẻ hành nghề số: ${s.licenseInfo.licenseNumber || ''}, Cấp bởi: ${s.licenseInfo.licenseIssuer || ''}`
            )
          }
        }
      } catch (err) {
        console.error('Failed to load lawyer detail:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [currentUserId])

  const handleSave = async () => {
    if (!fullName.trim()) {
      toastifyCommon.error('Họ tên không được để trống!')
      return
    }

    try {
      // Parse numeric values
      const numericFee = parseInt(fee.replace(/[^0-9]/g, '')) || 0
      const numericExp = parseInt(experience.replace(/[^0-9]/g, '')) || 0

      // Extract license number and issuer
      let licenseNumber = ''
      let licenseIssuer = ''

      if (certifications.includes('Thẻ hành nghề số:')) {
        const parts = certifications.split('Thẻ hành nghề số:')[1] || ''
        licenseNumber = parts.split(',')[0]?.trim() || ''
      } else {
        licenseNumber = certifications.trim()
      }

      if (certifications.includes('Cấp bởi:')) {
        licenseIssuer = certifications.split('Cấp bởi:')[1]?.trim() || ''
      } else {
        licenseIssuer = 'Đoàn Luật sư'
      }

      await usersApi.updateProfile({
        fullName,
        phone,
        location,
        bio,
        experienceYears: numericExp,
        pricePerHour: numericFee,
        licenseNumber,
        barAssociation: licenseIssuer
      })

      if (user) {
        updateUser({
          ...user,
          fullName
        })
      }
      toastifyCommon.success('Cập nhật hồ sơ chuyên môn luật sư thành công!')
    } catch (err) {
      console.error(err)
      toastifyCommon.error('Cập nhật hồ sơ thất bại. Vui lòng thử lại!')
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
    <div className='max-w-4xl mx-auto lg:p-6 p-4 space-y-6'>
      <div>
        <h1 className='text-h4 font-bold text-text-main flex items-center gap-2'>
          <User className='w-6 h-6 text-primary' />
          Hồ sơ chuyên môn Luật sư
        </h1>
        <p className='text-xs text-text-description mt-1'>
          Quản lý thông tin giới thiệu, chứng chỉ hành nghề và cài đặt dịch vụ của bạn trên hệ thống.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-start'>
        
        {/* Left Column: Avatar Card */}
        <Card className='col-span-1 flex flex-col items-center p-6 border border-border-secondary bg-background-primary shadow-sm'>
          <div className='relative flex-shrink-0'>
            <div className='w-24 h-24 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center border border-primary/20 shadow-inner'>
              {fullName.split(' ').pop()?.slice(0, 2).toUpperCase() || 'LS'}
            </div>
            <div className='absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-emerald-500 border-2 border-background-primary rounded-full'></div>
          </div>
          <h3 className='font-bold text-base text-text-main mt-4 text-center'>{fullName}</h3>
          <p className='text-xs text-text-description text-center mt-1'>{specialty || 'Hình sự, Dân sự'}</p>

          <div className='w-full mt-6 space-y-3.5 text-xs text-text-description border-t border-border-secondary pt-4'>
            <div className='flex items-center gap-2.5'>
              <Mail className='w-4 h-4 text-slate-400 shrink-0' />
              <span className='truncate'>{email}</span>
            </div>
            <div className='flex items-center gap-2.5'>
              <Phone className='w-4 h-4 text-slate-400 shrink-0' />
              <span>{phone}</span>
            </div>
            <div className='flex items-center gap-2.5'>
              <MapPin className='w-4 h-4 text-slate-400 shrink-0' />
              <span>{location}</span>
            </div>
          </div>
        </Card>

        {/* Right Column: Edit Forms */}
        <div className='col-span-1 md:col-span-2 space-y-6'>
          <Card className='p-6 border border-border-secondary bg-background-primary shadow-sm space-y-5 text-left'>
            <CardTitle className='text-sm uppercase tracking-wider text-text-main font-bold border-b border-border-secondary pb-3'>
              Thông tin hành nghề luật sư
            </CardTitle>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-text-main'>Họ và tên</label>
                <Input
                  type='text'
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className='rounded-lg text-sm bg-background-primary border-border-secondary'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-text-main'>Số điện thoại văn phòng</label>
                <Input
                  type='text'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className='rounded-lg text-sm bg-background-primary border-border-secondary'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-text-main'>Lĩnh vực chuyên môn</label>
                <Input
                  type='text'
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className='rounded-lg text-sm bg-background-primary border-border-secondary'
                  placeholder='Ví dụ: Hình sự, Đất đai, Dân sự'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-text-main'>Số năm kinh nghiệm</label>
                <Input
                  type='text'
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className='rounded-lg text-sm bg-background-primary border-border-secondary'
                  placeholder='Ví dụ: 12 năm'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-text-main'>Văn phòng làm việc (Tỉnh/Thành phố)</label>
                <Input
                  type='text'
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className='rounded-lg text-sm bg-background-primary border-border-secondary'
                  placeholder='Ví dụ: Hà Nội, Việt Nam'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-text-main'>Biểu phí tư vấn (đ/giờ)</label>
                <Input
                  type='text'
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className='rounded-lg text-sm bg-background-primary border-border-secondary'
                  placeholder='Ví dụ: 500,000 đ/giờ'
                />
              </div>
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-text-main'>Chứng chỉ hành nghề & Bằng cấp</label>
              <Input
                type='text'
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
                className='rounded-lg text-sm bg-background-primary border-border-secondary'
                placeholder='Thẻ hành nghề số: [Số thẻ], Cấp bởi: [Nơi cấp]'
              />
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-text-main'>Giới thiệu chi tiết (Bio)</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className='rounded-lg text-sm min-h-[100px] bg-background-primary border-border-secondary'
                placeholder='Giới thiệu tóm tắt kinh nghiệm làm việc, quá trình hành nghề của bạn...'
              />
            </div>

            <div className='flex justify-end pt-2'>
              <Button
                onClick={handleSave}
                className='bg-primary hover:bg-primary-600 text-white rounded-lg flex items-center gap-2 px-4 shadow-sm'
              >
                <Save className='w-4 h-4' />
                <span>Lưu thông tin hồ sơ</span>
              </Button>
            </div>

          </Card>
        </div>

      </div>
    </div>
  )
}
