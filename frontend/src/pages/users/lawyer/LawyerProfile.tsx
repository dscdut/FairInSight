import { useEffect, useState, useMemo } from 'react'

import { ArrowLeft, Star, ShieldCheck, DollarSign, MapPin, Mail, Phone, CheckCircle2 } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getOptimizedImageUrl } from '@/core/helpers/image'
import { cn } from '@/core/lib/utils'
import { useLawyerDetail } from '@/hooks/lawyers/use-lawyer'
import { type Lawyer } from '@/models/lawyer/list-lawyer.type'

import { LawyerContactDialog } from './components/LawyerContactDialog'

export default function LawyerProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'bio' | 'specializations' | 'history' | 'reviews'>('bio')
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  // Call API with React Query hook
  const { data: detailResponse, isLoading, error } = useLawyerDetail(id)

  const detailSummary = detailResponse?.data?.summary

  const contactLawyer = useMemo<Lawyer | null>(() => {
    if (!detailSummary) return null
    const rawUrl = detailSummary.avatarUrl || detailSummary.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer'
    return {
      id: id || '',
      fullName: detailSummary.name || '',
      avatar: rawUrl,
      avatarUrl: getOptimizedImageUrl(rawUrl, 200),
      careerHistory: detailSummary.careerHistory || '',
      bio: detailSummary.bio || 'Chuyên gia tư vấn pháp lý chuyên nghiệp.',
      averageRating: detailSummary.averageRating || 0,
      successfulCases: detailSummary.successfulCases || 0,
      specializations: detailSummary.specializations || [],
      city: detailSummary.location || 'Việt Nam'
    }
  }, [id, detailSummary])

  const mockReviews = useMemo(() => {
    if (!detailSummary) return []
    return [
      {
        id: 'r1',
        userName: 'Nguyễn Văn Nam',
        rating: 5,
        date: '2026-06-15',
        comment: `Luật sư ${detailSummary.name} tư vấn rất tận tâm, giải thích chi tiết các quy định pháp luật và đưa ra phương án giải quyết vụ việc rất rõ ràng. Cảm ơn luật sư rất nhiều!`
      },
      {
        id: 'r2',
        userName: 'Trần Thị Mai',
        rating: Math.floor(detailSummary.averageRating),
        date: '2026-05-20',
        comment: 'Tôi rất hài lòng về phong cách làm việc chuyên nghiệp và nhanh chóng của luật sư. Sẽ tiếp tục nhờ luật sư hỗ trợ nếu có vấn đề phát sinh.'
      },
      {
        id: 'r3',
        userName: 'Phạm Minh Đức',
        rating: 5,
        date: '2026-04-12',
        comment: 'Tư vấn nhiệt tình, có chuyên môn cao và am hiểu sâu sắc về lĩnh vực doanh nghiệp. Rất đáng tin cậy!'
      }
    ]
  }, [detailSummary])

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

  // Extract avatar and bio from API summary
  const rawAvatarUrl = detail.avatarUrl || detail.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer'
  const avatarUrl = getOptimizedImageUrl(rawAvatarUrl, 200)
  const bioText = detail.bio || 'Chuyên gia tư vấn pháp lý chuyên nghiệp.'
  const cityText = detail.location || 'Việt Nam'

  const statusMap = {
    AVAILABLE: { label: 'Sẵn sàng tư vấn', className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    BUSY: { label: 'Đang bận', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    OFFLINE: { label: 'Ngoại tuyến', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20' }
  }
  const statusKey = detail.lawyerStatus || detail.status
  const currentStatus = statusMap[statusKey as keyof typeof statusMap] || {
    label: statusKey || 'Ngoại tuyến',
    className: 'bg-slate-500/10 text-slate-500 border-slate-500/20'
  }

  const stats = [
    {
      label: 'Đánh giá',
      labelClass: 'text-sm',
      value: (
        <div className='flex items-center gap-1 mt-1 text-warning-primary font-semibold text-small'>
          <Star className='w-5 h-5 fill-current' />
          {detail.averageRating.toFixed(1)}
        </div>
      )
    },
    {
      label: 'Kinh nghiệm',
      labelClass: 'text-sm',
      value: (
        <div className='mt-1 text-text-primary font-semibold text-small'>
          {detail.experienceYears} năm
        </div>
      )
    },
    {
      label: 'Vụ thành công',
      labelClass: 'text-sm',
      value: (
        <div className='mt-1 text-text-main font-semibold text-small'>
          {detail.successfulCases} vụ
        </div>
      )
    },
    {
      label: 'Chứng chỉ',
      labelClass: 'text-sm',
      value: (
        <div className='mt-1 text-text-main font-semibold text-small'>
          {detail.licenseInfo?.licenseNumber}
        </div>
      )
    }
  ]

  const tabItems = [
    { id: 'bio', label: 'Giới thiệu' },
    { id: 'specializations', label: 'Lĩnh vực chuyên môn' },
    { id: 'history', label: 'Lịch sử hoạt động' },
    { id: 'reviews', label: 'Đánh giá' }
  ] as const
  
  return (
    <div className=' text-left'>
      {/* Back Button */}
      <button
        onClick={() => navigate('/lawyers')}
        className='p-4 md:p-6 flex items-center gap-2 text-text-description hover:text-text-primary transition-colors text-small font-medium cursor-pointer border-none bg-transparent'
      >
        <ArrowLeft className='w-6 h-6' />
        Quay lại danh bạ
      </button>

      {/* Hero Card */}
      <Card className='px-4 py-8 bg-background-secondary flex flex-col md:flex-row items-center md:items-start gap-6 border-none shadow-none relative overflow-hidden'>
        <div className='w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shrink-0 shadow-none border-4 border-background-primary'>
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
          <div className='space-y-2.5'>
            <div className='flex flex-wrap items-center justify-center md:justify-start gap-2.5'>
              <h1 className='text-h2 font-bold text-text-primary'>{detail.name}</h1>
              {detail.licenseInfo?.isVerified && (
                <span className='text-success-secondary flex items-center justify-center' title='Đã xác thực'>
                  <ShieldCheck className='w-5 h-5 fill-current' />
                </span>
              )}
              <Badge className={`gap-1 py-0.5 px-2.5 rounded-full text-xs font-semibold border ${currentStatus.className}`}>
                {currentStatus.label}
              </Badge>
            </div>
            
            <p className='text-main font-medium text-p'>{detail.roleName === 'LAWYER' ? 'Luật sư tư vấn' : (detail.roleName || 'Luật sư')}</p>
            
            {/* Contact & Location details */}
            <div className='flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-xs text-text-description pt-0.5'>
              {cityText && (
                <span className='flex items-center gap-1.5'>
                  <MapPin className='w-3.5 h-3.5 shrink-0 text-text-description' /> {cityText}
                </span>
              )}
              {detail.email && (
                <span className='flex items-center gap-1.5'>
                  <Mail className='w-3.5 h-3.5 shrink-0 text-text-description' /> {detail.email}
                </span>
              )}
              {detail.phone && (
                <span className='flex items-center gap-1.5'>
                  <Phone className='w-3.5 h-3.5 shrink-0 text-text-description' /> {detail.phone}
                </span>
              )}
            </div>
          </div>

          <div className='flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2 border-t border-border-primary'>
            {stats.map((stat, idx) => (
              <div key={idx} className='text-center md:text-left'>
                <div className={cn(stat.labelClass, 'text-text-description font-medium tracking-wider')}>
                  {stat.label}
                </div>
                {stat.value}
              </div>
            ))}
          </div>

        </div>
      </Card>

      {/* Main Grid Content */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6'>
        {/* Left Column: Details */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Tab Navigation */}
          <div className='flex border-b border-border-primary gap-6 mb-4'>
            {tabItems.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "text-small font-medium text-text-description transition-all duration-200 pb-2 rounded-none border-b-2 border-transparent bg-transparent shadow-none cursor-pointer",
                    "hover:text-info",
                    "data-[state=active]:border-b-info",
                    "data-[state=active]:bg-transparent",
                    "data-[state=active]:shadow-none",
                    "dark:text-info dark:data-[state=active]:text-info dark:data-[state=active]:border-info",
                    isActive
                      ? 'text-info border-info'
                      : 'text-text-description hover:text-text-primary border-transparent'
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Contents */}
          <div className='transition-all duration-300'>
            {activeTab === 'bio' && (
              <Card className='space-y-4 rounded-lg border-none shadow-none'>
                <h3 className='text-h4 font-semibold text-text-main border-b border-border-primary pb-2'>Giới thiệu</h3>
                <p className='text-text-secondary leading-relaxed text-sm whitespace-pre-line'>{bioText}</p>
              </Card>
            )}

            {activeTab === 'specializations' && (
              <Card className='space-y-4 rounded-lg border-none shadow-none'>
                <h3 className='text-h4 font-semibold text-text-main border-b border-border-primary pb-2'>Lĩnh vực chuyên môn</h3>
                <div className='flex flex-wrap gap-2.5'>
                  {detail.specializations && detail.specializations.length > 0 ? (
                    detail.specializations.map((spec) => (
                      <Badge
                        key={spec}
                        variant='secondary'
                        className='px-3.5 py-1 text-xs font-semibold text-text-secondary border border-border-primary rounded-full bg-background-secondary'
                      >
                        {spec}
                      </Badge>
                    ))
                  ) : (
                    <span className='text-sm text-text-description'>Chưa cập nhật lĩnh vực chuyên môn</span>
                  )}
                </div>
              </Card>
            )}

            {activeTab === 'history' && (
              <Card className=' space-y-4 rounded-lg border-none shadow-none'>
                <h3 className='text-h4 font-semibold text-text-main border-b border-border-primary pb-2'>Lịch sử hoạt động</h3>
                <div className='space-y-5'>
                  {/* Working history */}
                  {detail.careerHistory && (
                    <div className='gap-3 items-start'>
                      <h4 className='text-small font-semibold text-text-main'>Kinh nghiệm làm việc</h4>
                      <p className='text-sm text-text-description mt-1 leading-relaxed'>{detail.careerHistory}</p>
                    </div>
                  )}

                  {/* License issuer */}
                  {detail.licenseInfo?.licenseIssuer && (
                    <div className='gap-3 items-start'>
                      <h4 className='text-small font-semibold text-text-main'>Đơn vị cấp thẻ hành nghề</h4>
                      <p className='text-sm text-text-description mt-1'>{detail.licenseInfo.licenseIssuer}</p>
                    </div>
                  )}

                  {/* License file URL if available */}
                  {detail.licenseInfo?.licenseFileUrl && (
                    <div className='flex gap-3 items-start pt-1'>
                      <div>
                        <h4 className='text-sm font-bold text-text-primary'>Bằng cấp / Chứng chỉ số</h4>
                        <a 
                          href={detail.licenseInfo.licenseFileUrl} 
                          target='_blank' 
                          rel='noopener noreferrer'
                          className='text-xs text-primary hover:underline mt-1 block font-medium'
                        >
                          Xem chứng chỉ hành nghề đính kèm
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Career Milestones */}
                  {detail.careerMilestones && detail.careerMilestones.length > 0 && (
                    <div className='border-t border-border-secondary pt-4 mt-4 space-y-3'>
                      <h4 className='text-sm font-bold text-text-primary flex items-center gap-2'>
                        <CheckCircle2 className='w-4 h-4 text-emerald-500 shrink-0' />
                        Mốc sự nghiệp nổi bật
                      </h4>
                      <ul className='list-disc pl-5 text-xs text-text-description space-y-1.5'>
                        {detail.careerMilestones.map((milestone, idx) => (
                          <li key={idx} className='leading-relaxed'>{milestone}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {activeTab === 'reviews' && (
              <Card className='space-y-6 rounded-lg border-none shadow-none'>
                <div className='border-b border-border-primary pb-4'>
                  <h3 className='text-h4 font-semibold text-text-main pb-2'>Đánh giá từ khách hàng</h3>
                  <div className='flex flex-col sm:flex-row items-start sm:items-center gap-6 mt-2 bg-background-secondary p-4 rounded-xl border border-border-primary/50'>
                    <div className='text-center border-r border-border-primary pr-6 shrink-0'>
                      <div className='text-4xl font-extrabold text-text-primary'>{detail.averageRating.toFixed(1)}</div>
                      <div className='flex items-center gap-0.5 justify-center mt-1 text-warning-primary'>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < Math.round(detail.averageRating) ? 'fill-current' : 'text-text-description'}`} 
                          />
                        ))}
                      </div>
                      <div className='text-xs text-text-description mt-1.5 font-medium'>
                        {mockReviews.length} đánh giá
                      </div>
                    </div>
                    <div className='text-sm text-text-secondary leading-relaxed'>
                      Đánh giá trung bình phản ánh sự hài lòng của khách hàng sau khi nhận tư vấn trực tiếp và trực tuyến từ Luật sư {detail.name}.
                    </div>
                  </div>
                </div>

                <div className='space-y-5 divide-y divide-border-primary/50'>
                  {mockReviews.map((review) => (
                    <div key={review.id} className='pt-5 first:pt-0 space-y-2.5'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/25 shadow-sm'>
                            {review.userName.charAt(0)}
                          </div>
                          <div>
                            <h4 className='text-sm font-semibold text-text-primary'>{review.userName}</h4>
                            <div className='flex items-center gap-0.5 mt-0.5 text-warning-primary'>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-text-description'}`} 
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className='text-xs text-text-description font-medium'>
                          {new Date(review.date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className='text-sm text-text-secondary leading-relaxed pl-12 italic'>
                        "{review.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Right Column: Pricing & Booking */}
        <div className='space-y-6'>
          <Card className='p-6 bg-background-secondary space-y-5 rounded-sm border-none sticky top-6'>
            <div className='space-y-1.5'>
              <h3 className='text-small font-semibold text-text-main'>Phí tư vấn cơ bản</h3>
              <div className='flex items-baseline gap-1 text-primary font-bold text-2xl'>
                <DollarSign className='w-6 h-6 self-center text-primary-400' />
                {detail.consultingFee.toLocaleString('vi-VN')}
                <span className='text-sm text-text-description font-normal ml-1'>/ giờ</span>
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
                  100%
                </span>
              </div>
            </div>

            <Button className='w-full' onClick={() => setIsContactModalOpen(true)}>
              Yêu cầu tư vấn
            </Button>
            
            <p className='text-[11px] text-text-description text-center leading-relaxed'>
              Gửi yêu cầu để đặt lịch và nhận thông tin phản hồi từ luật sư trong vòng 24 giờ làm việc.
            </p>
          </Card>
        </div>
      </div>
      <LawyerContactDialog
        lawyer={contactLawyer}
        isOpen={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
      />
    </div>
  )
}
