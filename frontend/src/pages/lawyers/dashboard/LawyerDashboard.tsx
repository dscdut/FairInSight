import { DollarSign, Calendar, Star, Clock, CheckCircle2, MessageSquare, Briefcase } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FadeUp } from '@/components/animated/animated-component'
import { Button } from '@/components/ui'
import { ROUTE } from '@/core/constants/path'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { useAppointmentStore } from '@/core/store/features/appointments'

export default function LawyerDashboard() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const requestsList = useAppointmentStore((state) => state.requests)

  const pendingRequests = requestsList.filter((r) => r.status === 'pending')
  const confirmedRequests = requestsList.filter((r) => r.status === 'confirmed')

  const lawyerStats = [
    {
      label: 'Tổng thu nhập',
      value: '24,500,000 đ',
      color: 'bg-emerald-500/10 text-emerald-500',
      icon: DollarSign
    },
    {
      label: 'Lịch hẹn sắp tới',
      value: `${confirmedRequests.length} cuộc hẹn`,
      color: 'bg-blue-500/10 text-blue-500',
      icon: Calendar
    },
    {
      label: 'Yêu cầu chờ duyệt',
      value: `${pendingRequests.length} yêu cầu`,
      color: 'bg-amber-500/10 text-amber-500',
      icon: Clock
    },
    {
      label: 'Đánh giá trung bình',
      value: '4.9 / 5.0 (38)',
      color: 'bg-purple-500/10 text-purple-500',
      icon: Star
    }
  ]

  return (
    <main className='lg:p-6 flex-1 flex flex-col space-y-8'>
      {/* Hero Banner Section */}
      <section className='w-full'>
        <FadeUp
          className='w-full rounded-xl border border-border-primary bg-background-primary p-6 lg:p-8 shadow-100 relative overflow-hidden text-text-main'
          style={{
            background: 'radial-gradient(circle at 50% -10%, rgba(99, 102, 241, 0.18), transparent 45%), radial-gradient(circle at 100% 50%, rgba(139, 92, 246, 0.15), transparent 40%), radial-gradient(circle at 30% 110%, rgba(244, 63, 94, 0.1), transparent 50%)'
          }}
        >
          <div className='absolute inset-0 bg-white/5 backdrop-blur-[1px] pointer-events-none' aria-hidden='true' />
          
          <div className='z-10 relative w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center'>
            <div className='lg:col-span-6 flex flex-col justify-between items-start min-h-[200px]'>
              <div>
                <span className='inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1 text-xs font-semibold text-primary backdrop-blur-md'>
                  <span className='h-1.5 w-1.5 rounded-full bg-primary animate-pulse' aria-hidden='true' />
                  Cổng Thông Tin Luật Sư
                </span>
                <h1 className='mt-5 text-h2 lg:text-h1 tracking-tight text-text-main leading-tight font-light'>
                  Xin chào, Luật sư <br />
                  <span className='font-bold text-text-main'>
                    {user?.fullName || 'Nguyễn Hồng Sơn'}!
                  </span>
                </h1>
                <p className='mt-2 text-sm text-text-description max-w-md'>
                  Quản lý cuộc hẹn, trò chuyện với khách hàng và kiểm tra lịch làm việc của bạn ngày hôm nay.
                </p>
              </div>

              <div className='flex gap-3 mt-6'>
                <Button
                  size='lg'
                  onClick={() => navigate(`${ROUTE.LAWYER.ROOT}/${ROUTE.LAWYER.APPOINTMENT}`)}
                  className='group/btn relative bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold rounded-full border border-white/20 shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] hover:scale-[1.03] active:scale-95 transition-all duration-300 z-10 flex items-center gap-2 cursor-pointer'
                >
                  <span>Duyệt yêu cầu ({pendingRequests.length})</span>
                </Button>
                <Button
                  variant='outline'
                  size='lg'
                  onClick={() => navigate(`${ROUTE.LAWYER.ROOT}/${ROUTE.LAWYER.PROFILE}`)}
                  className='rounded-full'
                >
                  Cập nhật hồ sơ
                </Button>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className='lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full'>
              {lawyerStats.map((stat, i) => (
                <div
                  key={i}
                  className='flex items-center rounded-xl bg-background-primary dark:bg-background-tertiary/20 p-6 shadow-100 hover:shadow-200 dark:hover:bg-background-tertiary/30 transition-all cursor-pointer border border-border-secondary'
                >
                  <div className={`mr-4 rounded-lg p-2.5 ${stat.color} shrink-0`}>
                    <stat.icon className='h-5 w-5' aria-hidden='true' />
                  </div>
                  <div>
                    <p className='text-xs text-text-description font-medium leading-tight'>{stat.label}</p>
                    <p className='text-h4 text-text-main mt-1.5 font-bold'>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </section>

      {/* Main Content Dashboard Grid */}
      <section className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
        {/* Left Column: Scheduled Appointments & Quick Actions */}
        <div className='lg:col-span-2 space-y-6'>
          <div className='flex items-center justify-between'>
            <h2 className='text-h5 text-text-main font-bold flex items-center gap-2'>
              <Calendar className='w-5 h-5 text-primary' />
              Lịch hẹn đã xác nhận hôm nay
            </h2>
            <Button
              variant='link'
              size='sm'
              onClick={() => navigate(`${ROUTE.LAWYER.ROOT}/${ROUTE.LAWYER.APPOINTMENT}`)}
              className='text-primary hover:underline px-0 text-xs font-semibold'
            >
              Xem tất cả
            </Button>
          </div>

          <div className='space-y-4'>
            {confirmedRequests.length === 0 ? (
              <div className='rounded-xl border border-border-secondary bg-background-primary p-8 text-center text-text-description'>
                <CheckCircle2 className='w-12 h-12 text-slate-300 mx-auto mb-3' />
                <p>Không có cuộc hẹn nào được xác nhận hôm nay.</p>
              </div>
            ) : (
              confirmedRequests.map((req) => (
                <div
                  key={req.id}
                  className='flex items-center justify-between p-4 rounded-xl border border-border-secondary bg-background-primary shadow-sm hover:shadow-md transition-all'
                >
                  <div className='flex items-center gap-4'>
                    <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0'>
                      {req.id.slice(-2)}
                    </div>
                    <div>
                      <h4 className='font-semibold text-text-main text-sm'>{req.topicVI}</h4>
                      <p className='text-xs text-text-description mt-0.5'>Yêu cầu từ mã khách: {req.id}</p>
                      <div className='flex items-center gap-3 mt-2 text-xs text-text-description'>
                        <span className='flex items-center gap-1'>
                          <Calendar className='w-3.5 h-3.5 text-primary' />
                          {req.date}
                        </span>
                        <span className='flex items-center gap-1'>
                          <Clock className='w-3.5 h-3.5 text-indigo-500' />
                          09:00 - 10:30
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => navigate(`${ROUTE.LAWYER.ROOT}/${ROUTE.LAWYER.MESSAGES}`)}
                    >
                      <MessageSquare className='w-4 h-4 mr-1.5 text-indigo-500' />
                      Nhắn tin
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Profile Status & Availability */}
        <div className='space-y-6'>
          <h2 className='text-h5 text-text-main font-bold flex items-center gap-2'>
            <Briefcase className='w-5 h-5 text-indigo-500' />
            Trạng thái hoạt động
          </h2>

          <div className='rounded-xl border border-border-secondary bg-background-primary p-6 space-y-6 shadow-sm'>
            <div className='flex items-center justify-between'>
              <div>
                <h4 className='font-bold text-sm text-text-main'>Trạng thái làm việc</h4>
                <p className='text-xs text-text-description mt-1'>Nhận yêu cầu tư vấn mới</p>
              </div>
              <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'>
                <span className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
                Đang trực tuyến
              </span>
            </div>

            <hr className='border-border-secondary' />

            <div className='space-y-3'>
              <h5 className='font-bold text-xs text-text-main uppercase tracking-wider'>Khung giờ trực tuyến</h5>
              <div className='grid grid-cols-2 gap-2 text-xs text-text-main'>
                <div className='p-2 rounded bg-background-secondary border border-border-secondary text-center'>
                  <span className='block text-text-description font-medium'>Sáng</span>
                  <span className='font-semibold mt-0.5 block'>08:00 - 11:30</span>
                </div>
                <div className='p-2 rounded bg-background-secondary border border-border-secondary text-center'>
                  <span className='block text-text-description font-medium'>Chiều</span>
                  <span className='font-semibold mt-0.5 block'>13:30 - 17:00</span>
                </div>
              </div>
            </div>

            <hr className='border-border-secondary' />

            <div className='space-y-2'>
              <h5 className='font-bold text-xs text-text-main uppercase tracking-wider'>Hồ sơ luật sư</h5>
              <p className='text-xs text-text-description'>Độ hoàn thiện hồ sơ chuyên môn của bạn:</p>
              <div className='w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mt-2'>
                <div className='bg-primary h-2.5 rounded-full' style={{ width: '85%' }}></div>
              </div>
              <div className='flex justify-between text-xs text-text-description mt-1'>
                <span>Độ hoàn thành 85%</span>
                <span className='text-primary font-bold hover:underline cursor-pointer' onClick={() => navigate(`${ROUTE.LAWYER.ROOT}/${ROUTE.LAWYER.PROFILE}`)}>Bổ sung</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
