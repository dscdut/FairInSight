import { TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

import { DASHBOARD_ACTIVITY, DASHBOARD_DATA, DASHBOARD_SERVICES } from '@/_mocks/data-dashboard'
import { FadeUp } from '@/components/animated/animated-component'
import { Button, Dialog, DialogContent, DialogTrigger } from '@/components/ui'
import { useAuthStore } from '@/core/store/features/auth/authStore'

import RequestForm from './request-form'

export default function MainMenu() {

  const user = useAuthStore((state) => state.user)
  
  return (
    <main>
      {/* Welcome Section */}
      <FadeUp>
        <div className='max-w-3xl'>
          <span className='inline-flex items-center gap-1.5 rounded-full bg-legal-500 px-4 py-1 text-xs font-medium text-white backdrop-blur-sm'>
            <span className='h-1.5 w-1.5 rounded-full bg-white animate-pulse' />
            LegalAI Client Portal
          </span>
          <h1 className='py-4 text-h1 tracking-tight'>
            Xin chào, {user?.fullName || 'Quý khách'}!
          </h1>
        </div>
      </FadeUp>

      {/* Quick Stats Grid */}
      <section className='mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
        {DASHBOARD_DATA.map((stat, i) => (
          <FadeUp
            key={i}
            delay = {i * 0.1}
            className='flex items-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950'
          >
            <div className={`mr-4 rounded-xl p-3 ${stat.color}`}>
              <stat.icon className='h-6 w-6' />
            </div>
            <div>
              <p className='text-small font-medium text-slate-400 dark:text-slate-500'>{stat.label}</p>
              <p className='text-2xl font-bold text-slate-900 dark:text-slate-100'>{stat.value}</p>
            </div>
          </FadeUp>
        ))}
      </section>

      {/* Main Action Areas */}
      <section className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
        {/* Quick Actions */}
        <div className='lg:col-span-2 space-y-4'>
          <h2 className='text-h5 text-slate-900 dark:text-slate-100'>Dịch vụ của bạn</h2>
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
            {DASHBOARD_SERVICES.map((action, i) => (
              <FadeUp
                key={i}
                delay = {i * 0.1}
                className='group relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700'
              >
                <div>
                  <div className='inline-flex rounded-xl bg-legal-50 p-3 text-legal-500 dark:bg-legal-950 dark:text-legal-400'>
                    <action.icon className='h-6 w-6' />
                  </div>
                  <h3 className='mt-4 text-small font-semibold text-slate-900 group-hover:text-legal-500 dark:text-slate-100 dark:group-hover:text-legal-400 transition-colors'>
                    {action.title}
                  </h3>
                  <p className='mt-2 text-sm text-slate-500 leading-relaxed dark:text-slate-400'>{action.desc}</p>
                </div>
                <div className='mt-4'>
                  {action.link.startsWith('#') ? (
                    <Dialog>
                      <DialogTrigger>
                        <Button
                          size={'ghost'}
                          variant={"ghost"}
                          // onClick={setIdle}
                          className='text-legal-500 dark:text-legal-500 group-hover:underline text-start'
                        >
                          {action.actionText} →
                        </Button>
                      </DialogTrigger>
                      <DialogContent
                        className='bg-white dark:bg-slate-800'
                      >
                        <RequestForm/>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Link
                      to={action.link}
                      className='inline-flex items-center text-sm font-semibold text-legal-500 dark:text-legal-500 group-hover:underline'
                    >
                      {action.actionText} →
                    </Link>
                  )}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>

        {/* Activity Feed / Notifications */}
        <div>
          <h2 className='text-h5 text-black dark:text-white mb-4'>Hoạt động gần đây</h2>
          <div className='rounded-2xl border border-white bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950'>
            <div className='flow-root'>
              <ul className='-mb-8'>
                {DASHBOARD_ACTIVITY.map((activity, i) => (
                  <li key={i}>
                    <div className='relative pb-8'>
                      {i !== 2 && (
                        <span
                          className='absolute left-5 top-5 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800'
                          aria-hidden='true'
                        />
                      )}
                      <div className='relative flex space-x-4'>
                        <div>
                          <span
                            className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-slate-950 ${
                              activity.current
                                ? 'bg-legal-500 text-white'
                                : 'bg-secondary text-text-description dark:bg-secondary dark:text-slate-400'
                            }`}
                          >
                            <TrendingUp className='h-6 w-6' />
                          </span>
                        </div>
                        <div className='flex-1 min-w-0 pt-1.5'>
                          <p className='text-small font-semibold text-slate-900 dark:text-slate-100'>{activity.title}</p>
                          <p className='text-sm text-slate-400 dark:text-slate-500 mt-0.5'>{activity.time}</p>
                          <p className='text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed'>
                            {activity.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
