import { useState } from 'react'
import { User, Mail, Phone, MapPin, Save } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import toastifyCommon from '@/core/lib/toastify-common'

export default function LawyerProfileEdit() {
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)

  const [fullName, setFullName] = useState(user?.fullName || 'Nguyễn Hồng Sơn')
  const email = user?.email || 'lawyer.son@fairinsight.vn'
  const [phone, setPhone] = useState('0912 832 123')
  const [location, setLocation] = useState('Hà Nội, Việt Nam')
  const [specialty, setSpecialty] = useState('Hình sự, Đất đai & Dân sự')
  const [experience, setExperience] = useState('12 năm')
  const [certifications, setCertifications] = useState('Thành viên Đoàn Luật sư Hà Nội, Thẻ hành nghề số: 10452/TP/LS')
  const [fee, setFee] = useState('500,000 đ/giờ')
  const [bio, setBio] = useState('Luật sư Nguyễn Hồng Sơn đã có hơn 12 năm kinh nghiệm tư vấn và tranh tụng trong các vụ án hình sự phức tạp, tranh chấp đất đai quy mô lớn và các hợp đồng dân sự.')

  const handleSave = () => {
    if (!fullName.trim()) {
      toastifyCommon.error('Họ tên không được để trống!')
      return
    }
    
    if (user) {
      updateUser({
        ...user,
        fullName
      })
    }
    toastifyCommon.success('Cập nhật hồ sơ chuyên môn luật sư thành công!')
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
              HS
            </div>
            <div className='absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-emerald-500 border-2 border-background-primary rounded-full'></div>
          </div>
          <h3 className='font-bold text-base text-text-main mt-4 text-center'>{fullName}</h3>
          <p className='text-xs text-text-description text-center mt-1'>{specialty}</p>

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
          <Card className='p-6 border border-border-secondary bg-background-primary shadow-sm space-y-5'>
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
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-text-main'>Số năm kinh nghiệm</label>
                <Input
                  type='text'
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className='rounded-lg text-sm bg-background-primary border-border-secondary'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-text-main'>Văn phòng làm việc</label>
                <Input
                  type='text'
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className='rounded-lg text-sm bg-background-primary border-border-secondary'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-text-main'>Biểu phí tư vấn</label>
                <Input
                  type='text'
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className='rounded-lg text-sm bg-background-primary border-border-secondary'
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
              />
            </div>

            <div className='space-y-1.5'>
              <label className='text-xs font-semibold text-text-main'>Giới thiệu chi tiết (Bio)</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className='rounded-lg text-sm min-h-[100px] bg-background-primary border-border-secondary'
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
