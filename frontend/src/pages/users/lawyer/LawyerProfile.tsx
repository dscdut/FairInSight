import { useEffect } from 'react'

import { ArrowLeft, Star, ShieldCheck, DollarSign, Briefcase, Award, MapPin, MessageSquare } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'

import { getLawyerListMock } from '@/_mocks/lawyer.mock'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getOptimizedImageUrl } from '@/core/helpers/image'
import { useLawyerDetail } from '@/hooks/lawyers/use-lawyer'

export default function LawyerProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  // Call API with React Query hook
  const { data: detailResponse, isLoading, error } = useLawyerDetail(id)

  if (isLoading) {
    return (
      <div className='p-8 text-center flex flex-col items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-primary'></div>
        <p className='text-sm text-text-description mt-4'>Đang tải thông tin luật sư...</p>
      </div>
    )
  }

  if (error || !detailResponse?.data?.summary) {
    return (
      <div className='p-8 text-center max-w-md mx-auto'>
        <h2 className='text-h3 text-text-primary mb-2'>Không tìm thấy thông tin</h2>
        <p className='text-sm text-text-description mb-6'>Đã xảy ra lỗi hoặc luật sư này không tồn tại trong hệ thống.</p>
        <Button onClick={() => navigate('/lawyers')}>Quay lại danh sách</Button>
      </div>
    )
  }

  const detail = detailResponse.data.summary

  // Find fallback avatar and bio from mock list if not present in API summary
  const mockLawyers = getLawyerListMock(1, 100).data.items
  const mockLawyer = mockLawyers.find((l) => l.id === id)
  const rawAvatarUrl = mockLawyer?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer'
  const avatarUrl = getOptimizedImageUrl(rawAvatarUrl, 200)
  const bioText = mockLawyer?.bio || 'Chuyên gia tư vấn pháp lý chuyên nghiệp.'
  const cityText = mockLawyer?.city || 'Việt Nam'

  return (
    <div className='p-4 md:p-6 max-w-7xl mx-auto space-y-6 text-left'>
      {/* Back Button */}
      <button
        onClick={() => navigate('/lawyers')}
        className='flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm font-medium cursor-pointer'
      >
        <ArrowLeft className='w-4 h-4' />
        Quay lại danh bạ
      </button>

      {/* Hero Card */}
      <Card className='p-6 border-border-secondary bg-background-primary flex flex-col md:flex-row items-center md:items-start gap-6 rounded-lg shadow-400 relative overflow-hidden'>
        <div className='w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background-secondary overflow-hidden shrink-0 shadow-200'>
          <img
            src={avatarUrl}
            alt={detail.name}
            className='w-full h-full object-cover'
            width={160}
            height={160}
            loading='eager'
            decoding='async'
          />
        </div>

        <div className='flex-1 space-y-4 text-center md:text-left w-full'>
          <div className='space-y-1.5'>
            <div className='flex flex-wrap items-center justify-center md:justify-start gap-2.5'>
              <h1 className='text-h2 font-bold text-text-primary'>{detail.name}</h1>
              {detail.licenseInfo.isVerified && (
                <Badge className='bg-success-primary/10 border-success-primary/20 text-success-secondary gap-1 hover:bg-success-primary/10 py-0.5 px-2.5 rounded-full text-xs font-semibold'>
                  <ShieldCheck className='w-3.5 h-3.5 fill-current' />
                  Đã xác thực
                </Badge>
              )}
            </div>
            <p className='text-main font-medium text-p'>{detail.role}</p>
            <p className='text-xs text-text-description flex items-center justify-center md:justify-start gap-1'>
              <MapPin className='w-3.5 h-3.5' /> {cityText}, Việt Nam
            </p>
          </div>

          <div className='flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2 border-t border-border-primary'>
            <div className='text-center md:text-left'>
              <div className='text-xs text-text-tertiary font-bold uppercase tracking-wider'>Đánh giá</div>
              <div className='flex items-center gap-1 mt-1 text-warning-secondary font-bold text-lg'>
                <Star className='w-5 h-5 fill-current' />
                {detail.averageRating.toFixed(1)}
              </div>
            </div>

            <div className='text-center md:text-left'>
              <div className='text-xs text-text-tertiary font-bold uppercase tracking-wider'>Kinh nghiệm</div>
              <div className='mt-1 text-text-primary font-bold text-lg'>
                {detail.experienceYears} năm
              </div>
            </div>

            <div className='text-center md:text-left'>
              <div className='text-xs text-text-tertiary font-bold uppercase tracking-wider'>Chứng chỉ</div>
              <div className='mt-1 text-text-secondary text-sm font-semibold'>
                {detail.licenseInfo.licenseNumber}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid Content */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column: Details */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Bio */}
          <Card className='p-6 border-border-secondary bg-background-primary space-y-4 rounded-lg'>
            <h3 className='text-h4 font-bold text-text-primary border-b border-border-primary pb-2.5'>Giới thiệu</h3>
            <p className='text-text-secondary leading-relaxed text-sm whitespace-pre-line'>{bioText}</p>
          </Card>

          {/* Specializations */}
          <Card className='p-6 border-border-secondary bg-background-primary space-y-4 rounded-lg'>
            <h3 className='text-h4 font-bold text-text-primary border-b border-border-primary pb-2.5'>Lĩnh vực chuyên môn</h3>
            <div className='flex flex-wrap gap-2.5'>
              {detail.specializations.map((spec) => (
                <Badge
                  key={spec}
                  variant='secondary'
                  className='px-3.5 py-1 text-xs font-semibold text-text-secondary border border-border-primary rounded-full bg-background-secondary'
                >
                  {spec}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Career Milestones / History */}
          <Card className='p-6 border-border-secondary bg-background-primary space-y-4 rounded-lg'>
            <h3 className='text-h4 font-bold text-text-primary border-b border-border-primary pb-2.5'>Lịch sử hoạt động</h3>
            <div className='space-y-4'>
              <div className='flex gap-3 items-start'>
                <div className='p-2 bg-primary/10 rounded-lg text-primary mt-0.5'>
                  <Briefcase className='w-4 h-4' />
                </div>
                <div>
                  <h4 className='text-sm font-bold text-text-primary'>Kinh nghiệm làm việc</h4>
                  <p className='text-xs text-text-description mt-0.5'>{detail.careerHistory}</p>
                </div>
              </div>
              <div className='flex gap-3 items-start'>
                <div className='p-2 bg-primary/10 rounded-lg text-primary mt-0.5'>
                  <Award className='w-4 h-4' />
                </div>
                <div>
                  <h4 className='text-sm font-bold text-text-primary'>Đơn vị cấp thẻ hành nghề</h4>
                  <p className='text-xs text-text-description mt-0.5'>{detail.licenseInfo.licenseIssuer}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Pricing & Booking */}
        <div className='space-y-6'>
          <Card className='p-6 border-border-secondary bg-background-primary space-y-5 rounded-lg shadow-200 sticky top-6'>
            <div className='space-y-1.5'>
              <h3 className='text-xs font-bold uppercase tracking-wider text-text-tertiary'>Phí tư vấn cơ bản</h3>
              <div className='flex items-baseline gap-1 text-primary font-bold text-2xl'>
                <DollarSign className='w-6 h-6 self-center text-primary-400' />
                {detail.consultingFee.toLocaleString('vi-VN')}
                <span className='text-xs text-text-description font-normal ml-1'>/ giờ</span>
              </div>
            </div>

            <div className='border-t border-border-primary pt-4 space-y-3'>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-text-secondary'>Hình thức</span>
                <span className='font-semibold text-text-primary'>Trực tuyến / Trực tiếp</span>
              </div>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-text-secondary'>Thời gian</span>
                <span className='font-semibold text-text-primary'>60 phút</span>
              </div>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-text-secondary'>Hỗ trợ bảo mật</span>
                <span className='font-semibold text-success-secondary flex items-center gap-0.5'>
                  <ShieldCheck className='w-4 h-4 fill-current' /> 100%
                </span>
              </div>
            </div>

            <Button className='w-full py-5 rounded-md bg-primary hover:bg-primary-600 text-white font-bold gap-2 text-sm cursor-pointer shadow-md shadow-primary/15 transition-all'>
              <MessageSquare className='w-4 h-4' />
              Yêu cầu tư vấn
            </Button>
            
            <p className='text-[11px] text-text-description text-center leading-relaxed'>
              Gửi yêu cầu để đặt lịch và nhận thông tin phản hồi từ luật sư trong vòng 24 giờ làm việc.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
