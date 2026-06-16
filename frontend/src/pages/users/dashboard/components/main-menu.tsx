import { Lightbulb, TrendingUp } from 'lucide-react'

import { DASHBOARD_ACTIVITY, DASHBOARD_DATA } from '@/_mocks/data-dashboard'
import { RECENT_DOCUMENTS, FEATURED_UPDATE } from '@/_mocks/recent.document.mock'
import { FadeUp } from '@/components/animated/animated-component'
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui'
import { useAuthStore } from '@/core/store/features/auth/authStore'

import RequestForm from './request-form'

export default function MainMenu() {
  const user = useAuthStore((state) => state.user)

  return (
    <main className='space-y-8'>
      {/* Hero Section */}
      <section className='w-full'>
        {/* Welcome Section Banner (Occupies full width, divided into 2 columns on lg screens) */}
        <FadeUp
          className='w-full rounded-xl border border-border-primary bg-background-primary p-6 lg:p-8 shadow-100 relative overflow-hidden text-text-main'
          style={{
            background: 'radial-gradient(circle at 50% -10%, rgba(255, 107, 107, 0.18), transparent 45%), radial-gradient(circle at 100% 50%, rgba(255, 138, 138, 0.15), transparent 40%), radial-gradient(circle at 30% 110%, rgba(255, 229, 229, 0.25), transparent 50%)'
          }}
        >
          {/* Slight glassmorphism overlay */}
          <div className='absolute inset-0 bg-white/5 backdrop-blur-[1px] pointer-events-none' aria-hidden='true' />
          
          <div className='z-10 relative w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center'>
            {/* Left Column: Introduction (7/12) */}
            <div className='lg:col-span-6 flex flex-col justify-between items-start min-h-[220px]'>
              <div>
                <span className='inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1 text-xs font-semibold text-primary backdrop-blur-md'>
                  <span className='h-1.5 w-1.5 rounded-full bg-primary animate-pulse' aria-hidden='true' />
                  LegalAI Client Portal
                </span>
                <h1 className='mt-5 text-h1 tracking-tight text-text-main leading-tight font-light'>
                  Xin chào, <br />
                  <span className='font-bold text-text-main'>
                    {user?.fullName || 'Quý khách'}!
                  </span>
                </h1>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size='lg'
                    className='group/btn relative mt-6 bg-gradient-to-r from-primary to-rose-500 text-white font-semibold rounded-full border border-white/20 shadow-[0_4px_20px_rgba(184,29,36,0.25)] hover:shadow-[0_8px_30px_rgba(244,63,94,0.4)] hover:scale-[1.03] active:scale-95 transition-all duration-300 z-10 flex items-center gap-2 cursor-pointer'
                  >
                    <span>Phân tích pháp lý</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className='bg-background-secondary max-w-4xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto'>
                  <DialogTitle>
                    <span className='text-h4 flex items-center tracking-tight text-text-main gap-2'>
                      Khởi tạo vụ việc pháp lý mới
                    </span>
                  </DialogTitle>
                  <DialogDescription className='sr-only'>
                    Mô tả chi tiết vấn đề của bạn để Trợ lý AI bóc tách cấu trúc dữ liệu luật liên quan.
                  </DialogDescription>
                  <RequestForm />
                </DialogContent>
              </Dialog>
            </div>

            {/* Right Column: 2x2 Stats Grid (5/12) */}
            <div className='lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full'>
              {DASHBOARD_DATA.map((stat, i) => (
                <div
                  key={i}
                  className='flex items-center rounded-xl bg-background-primary dark:bg-background-tertiary/20 p-6 shadow-100 hover:shadow-200 dark:hover:bg-background-tertiary/30 transition-all cursor-pointer'
                >
                  <div className={`mr-4 rounded-lg p-2.5 ${stat.color} shrink-0`}>
                    <stat.icon className='h-5 w-5' aria-hidden='true' />
                  </div>
                  <div>
                    <p className='text-sm text-main font-medium leading-tight'>{stat.label}</p>
                    <p className='text-h4 text-text-main mt-1.5'>{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </section>

      {/* Main Content Grid */}
      <section className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
        {/* Left Column: Recent Updates */}
        <div className='lg:col-span-2 space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-h5 text-text-main'>Hồ sơ của bạn</h2>
            <Button variant='link' size='sm' className='text-primary hover:underline px-0 text-xs font-semibold'>
              Xem tất cả
            </Button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            {RECENT_DOCUMENTS.map((doc, i) => (
              <FadeUp
                key={doc.id}
                delay={i * 0.1}
                className='group relative flex flex-col justify-between rounded-lg border border-border-primary bg-background-primary p-5 shadow-100 transition-all hover:shadow-200 cursor-pointer'
              >
                <div>
                  <div className='flex justify-between items-start mb-4'>
                    <span className={`font-semibold text-xs ${doc.statusColor}`}>
                      {doc.status}
                    </span>
                    <span className='text-xs text-text-description'>{doc.time}</span>
                  </div>
                  <h3 className='text-p-medium text-text-main group-hover:text-primary transition-colors'>
                    {doc.title}
                  </h3>
                  <p className='mt-2 text-sm text-text-description leading-relaxed line-clamp-2'>{doc.desc}</p>
                </div>
                <div className='flex items-center gap-2 mt-4 pt-4 border-t border-border-secondary'>
                  <img
                    alt={doc.lawyerName}
                    className='w-6 h-6 rounded-full border border-white'
                    src={doc.lawyerAvatar}
                  />
                  <span className='text-xs text-text-description font-medium'>{doc.lawyerName}</span>
                </div>
              </FadeUp>
            ))}

            {/* Featured Updates Banner (spans 2 columns) */}
            <FadeUp
              delay={0.2}
              className='group relative flex flex-col md:flex-row gap-6 items-center bg-background-primary md:col-span-2 overflow-hidden'
            >
              <img
                className='w-full md:w-1/3 h-40 object-cover rounded-sm shadow-inner shrink-0'
                alt={FEATURED_UPDATE.title}
                src={FEATURED_UPDATE.imageUrl}
              />
              <div className='flex-1'>
                <h3 className='text-p-medium text-text-main mb-1'>{FEATURED_UPDATE.title}</h3>
                <p className='text-sm text-text-description mb-4 leading-relaxed'>{FEATURED_UPDATE.desc}</p>
                <Button
                  variant='link'
                  className='text-primary font-bold p-0 flex items-center gap-1 hover:gap-2 transition-all h-auto text-btn-small'
                >
                  {FEATURED_UPDATE.actionText} →
                </Button>
              </div>
            </FadeUp>
          </div>
        </div>

        {/* Right Column: Activity Feed / Timeline */}
        <div className='space-y-4'>
          <h2 className='text-h5 text-text-main'>Hoạt động gần đây</h2>
          <div className='rounded-lg border border-border-primary bg-background-primary p-6 shadow-100'>
            <div className='flow-root'>
              <ul className='-mb-8'>
                {DASHBOARD_ACTIVITY.map((activity, i) => (
                  <li key={i}>
                    <div className='relative pb-8'>
                      {i !== DASHBOARD_ACTIVITY.length - 1 && (
                        <span
                          className='absolute left-5 top-5 -ml-px h-full w-0.5 bg-border-secondary'
                          aria-hidden='true'
                        />
                      )}
                      <div className='relative flex space-x-4'>
                        <div>
                          <span
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              activity.current
                                ? 'bg-primary text-white shadow-200 shadow-primary/20'
                                : 'bg-background-secondary text-text-description'
                            }`}
                          >
                            <TrendingUp className='h-6 w-6' aria-hidden='true' />
                          </span>
                        </div>
                        <div className='flex-1 min-w-0 pt-1.5'>
                          <p className='text-small font-semibold text-text-main'>{activity.title}</p>
                          <p className='text-sm text-text-description mt-0.5'>{activity.time}</p>
                          <p className='text-sm text-text-description mt-1 leading-relaxed'>{activity.desc}</p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Legal Tip Card */}
          <FadeUp
            delay={0.1}
            className='relative overflow-hidden rounded-xl p-6 text-white shadow-200'
            style={{
              background: 'linear-gradient(135deg, #b81d24 0%, #f43f5e 100%)'
            }}
          >
            {/* Subtle ambient circle highlights inside tip card */}
            <div
              className='absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none'
              aria-hidden='true'
            />
            <div className='relative z-10 flex flex-col gap-3'>
              <div className='inline-flex rounded-lg bg-white/15 p-2 w-fit text-white'>
                <Lightbulb className='h-5 w-5' aria-hidden='true' />
              </div>
              <div>
                <h3 className='text-p-medium font-bold text-white mb-1'>Mẹo pháp lý</h3>
                <p className='text-sm text-white/90 leading-relaxed'>
                  Hãy sử dụng tính năng &quot;Hỏi luật sư AI&quot; để tra cứu các thuật ngữ pháp lý khó hiểu ngay tức thì.
                </p>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>
    </main>
  )
}
