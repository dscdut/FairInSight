import { useState } from 'react'

import { Camera, MapPin, Briefcase, Star, ArrowRight, Phone, Calendar, Clock, CreditCard } from 'lucide-react'


import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import FileUpload from '@/components/upload-file/file-upload'
import { getInitials } from '@/core/helpers/get-initials'
import { useUserInfo } from '@/hooks/tanstack-query/auth/use-query-auth'

import ProfileEditDialog from './components/profile-edit-dialog'

// Static array for Call-To-Action cards
const CTA_CARDS = [
  {
    title: 'Sẵn sàng làm việc',
    description: 'Hiển thị cho các nhà tuyển dụng thấy bạn đã sẵn sàng làm việc.'
  },
  {
    title: 'Chia sẻ bài đăng',
    description: 'Chia sẻ những tin tức mới nhất để kết nối với mọi người.'
  },
  {
    title: 'Cập nhật hồ sơ',
    description: 'Giúp hồ sơ luôn mới để người xem hiểu rõ hơn về bạn.'
  }
]

export default function Profile() {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const { data: user } = useUserInfo()

  const handleAvatarUpload = (files: FileList | null) => {
    if (files && files[0]) {
      // TODO: handle upload or preview here
    }
  }

  return (
    <div className='space-y-6 mx-auto'>
      {/* Profile Header Card */}
      <Card className='w-full overflow-hidden text-left bg-background-primary border-none rounded-none sm:rounded-2xl'>
        {/* Banner with colorful gradient */}
        <div className='w-full h-44 md:h-60 bg-gradient-to-r from-amber-400 via-orange-400 to-sky-400 relative group'>
          {/* Edit Banner Button */}
          <button className='absolute top-4 right-4 h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-sm cursor-pointer border-none' aria-label="Edit banner">
            <Camera className='w-6 h-6' />
          </button>
        </div>

        {/* Profile Details Area */}
        <div className='px-6 md:px-10 pb-8 relative'>
          {/* Avatar - overlaps the banner */}
          <div className='absolute -top-16 md:-top-20 left-1/2 -translate-x-1/2 md:left-10 md:translate-x-0 z-10'>
            <div className='relative group'>
              <Avatar className='h-28 w-28 md:h-36 md:w-36 border-4 border-background-primary shadow-md bg-background-primary rounded-full overflow-hidden'>
                <AvatarImage src={user?.avatarUrl || '/images/avatar.png'} alt={user?.fullName} />
                <AvatarFallback className='text-xl font-bold bg-background-secondary text-text-secondary'>
                  {getInitials(user?.fullName || '')}
                </AvatarFallback>
              </Avatar>
              {/* Upload avatar overlay */}
              <FileUpload onChange={handleAvatarUpload} ariaLabel='Upload avatar'>
                <div className='absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer'>
                  <Camera className='w-6 h-6' />
                </div>
              </FileUpload>
            </div>
          </div>

          {/* Grid layout for left/right content */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 pt-16 md:pt-20'>
            {/* Left Column: Name, Subtitle, Location, Actions */}
            <div className='lg:col-span-7 space-y-4 text-center md:text-left'>
              <div className='space-y-2 flex flex-col items-center md:items-start'>
                <h1 className='text-h2 md:text-h2 text-text-main tracking-tight'>
                  {user?.fullName || 'User'}
                </h1>
                <p className='text-sm md:text-base font-semibold text-text-main'>
                  {user?.roleName === 'LAWYER' ? 'Luật sư tư vấn' : user?.roleName === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}
                </p>
                
                {/* Meta details list */}
                <div className='text-xs md:text-sm text-text-description flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1.5 pt-1'>
                  <span className='flex items-center gap-1.5'>
                    <MapPin className='w-4 h-4 text-text-description shrink-0' /> 
                    {user?.location || 'Chưa thiết lập vị trí'}
                  </span>
                  {user?.phone && (
                    <span className='flex items-center gap-1.5'>
                      <Phone className='w-4 h-4 text-text-description shrink-0' />
                      {user.phone}
                    </span>
                  )}
                  {user?.dateOfBirth && (
                    <span className='flex items-center gap-1.5'>
                      <Calendar className='w-4 h-4 text-text-description shrink-0' />
                      {new Date(user.dateOfBirth).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                  {user?.createdAt && (
                    <span className='flex items-center gap-1.5'>
                      <Clock className='w-4 h-4 text-text-description shrink-0' />
                      {`Gia nhập: ${new Date(user.createdAt).toLocaleDateString('vi-VN')}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2'>
                <Button 
                  onClick={() => setIsEditOpen(true)}
                >
                  Edit Profile
                </Button>
                <Button 
                  variant='outline'
                >
                  Settings
                </Button>
              </div>
            </div>

            {/* Right Column: Current Role & Skills */}
            <div className='lg:col-span-5 flex flex-col justify-start items-center lg:items-end gap-5 text-center lg:text-right'>
              <div className='flex flex-wrap justify-center lg:justify-end gap-x-6 gap-y-3'>
                {/* Current Role Block */}
                <div className='space-y-1.5 flex flex-col items-center lg:items-end'>
                  <div className='flex items-center gap-1.5 text-xs font-semibold text-text-description tracking-wider justify-center lg:justify-end'>
                    <span>Vai trò</span>
                    <Briefcase className='w-3.5 h-3.5 text-text-description' />
                  </div>
                  <div className='inline-flex items-center bg-background-secondary text-text-secondary text-xs font-semibold px-4 py-1.5 rounded-full'>
                    {user?.roleName === 'LAWYER' ? 'Chuyên gia Pháp lý' : user?.roleName === 'ADMIN' ? 'Hệ thống Quản trị' : 'Thành viên sử dụng'}
                  </div>
                </div>

                {/* Subscription Plan Block */}
                <div className='space-y-1.5 flex flex-col items-center lg:items-end'>
                  <div className='flex items-center gap-1.5 text-xs font-semibold text-text-description tracking-wider justify-center lg:justify-end'>
                    <span>Gói dịch vụ</span>
                    <CreditCard className='w-3.5 h-3.5 text-text-description' />
                  </div>
                  <div className='inline-flex items-center bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full'>
                    {user?.subscription?.planName || user?.subscriptions?.planName || 'Thành viên Thường'}
                  </div>
                </div>
              </div>

              {/* Skills Block */}
              <div className='space-y-2 flex flex-col items-center lg:items-end w-full'>
                <div className='flex items-center gap-1.5 text-xs font-semibold text-text-description tracking-wider justify-center lg:justify-end'>
                  <span>Kỹ năng / Lĩnh vực</span>
                  <Star className='w-3.5 h-3.5 text-text-description' />
                </div>
                <div className='flex flex-wrap justify-center lg:justify-end gap-2'>
                  {user?.roleName === 'LAWYER' ? (
                    ['Tư vấn Luật', 'Hôn nhân & Gia đình', 'Hình sự', 'Dân sự', 'Hợp đồng'].map(skill => (
                      <span key={skill} className='bg-amber-50 text-amber-900 border border-amber-100 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap'>
                        {skill}
                      </span>
                    ))
                  ) : (
                    ['Tra cứu luật', 'Hỏi đáp AI', 'Đặt lịch Luật sư', 'Lưu biểu mẫu'].map(skill => (
                      <span key={skill} className='bg-amber-50 text-amber-900 border border-amber-100 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap'>
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 3 Call-To-Action Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 px-10'>
        {CTA_CARDS.map((card, idx) => (
          <div 
            key={idx} 
            className='bg-background-secondary p-4 rounded-sm flex items-center justify-between transition-all group cursor-pointer border-none'
          >
            <div className='space-y-1 text-left'>
              <h4 className='text-small font-semibold text-text-primary'>{card.title}</h4>
              <p className='text-sm text-text-description leading-normal'>{card.description}</p>
            </div>
            <button className='h-8 w-8 rounded-full border border-blue-200 bg-background-primary group-hover:bg-blue-50 text-blue-600 flex items-center justify-center transition-all shrink-0 ml-4 cursor-pointer'>
              <ArrowRight className='w-4 h-4' />
            </button>
          </div>
        ))}
      </div>

      <ProfileEditDialog user={user} isOpen={isEditOpen} onOpenChange={setIsEditOpen} />
    </div>
  )
}
