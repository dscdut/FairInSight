import { motion } from 'framer-motion'
import {
  Calendar,
  FileText,
  FolderOpen,
  MessageSquare,
  PlusCircle,
  TrendingUp,
  UserCheck
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { ROUTE } from '@/core/constants/path'
import { useAuthStore } from '@/core/store/features/auth/authStore'

export default function UserDashboard() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className='min-h-screen bg-slate-50/50 py-8 dark:bg-slate-900/50'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='mb-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl shadow-indigo-950/10'
        >
          <div className='max-w-3xl'>
            <span className='inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300 backdrop-blur-sm'>
              <span className='h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse' />
              LegalAI Client Portal
            </span>
            <h1 className='mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl'>
              Xin chào, {user?.fullName || 'Quý khách'}!
            </h1>
            <p className='mt-3 text-lg text-slate-300'>
              Chào mừng bạn đến với Cổng thông tin Pháp lý Thông minh. Tại đây, bạn có thể tương tác với Luật sư AI, gửi yêu cầu tư vấn và quản lý tất cả hồ sơ vụ việc của mình một cách bảo mật và hiệu quả.
            </p>
          </div>
        </motion.div>

        {/* Quick Stats Grid */}
        <div className='mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
          {[
            { label: 'Vụ việc đang xử lý', value: '02', icon: FolderOpen, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
            { label: 'Yêu cầu tư vấn', value: '05', icon: MessageSquare, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30' },
            { label: 'Tài liệu lưu trữ', value: '12', icon: FileText, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
            { label: 'Lịch hẹn sắp tới', value: '01', icon: Calendar, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className='flex items-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950'
            >
              <div className={`mr-4 rounded-xl p-3 ${stat.color}`}>
                <stat.icon className='h-6 w-6' />
              </div>
              <div>
                <p className='text-sm font-medium text-slate-400 dark:text-slate-500'>{stat.label}</p>
                <p className='text-2xl font-bold text-slate-900 dark:text-slate-100'>{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Action Areas */}
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          {/* Quick Actions */}
          <div className='lg:col-span-2 space-y-6'>
            <h2 className='text-xl font-bold text-slate-900 dark:text-slate-100'>Dịch vụ của bạn</h2>
            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
              {[
                {
                  title: 'Hỏi Luật sư AI',
                  desc: 'Tra đổi trực tuyến với Trợ lý Luật sư AI thông minh để giải đáp các thắc mắc pháp lý tức thì.',
                  icon: MessageSquare,
                  link: '#',
                  actionText: 'Trò chuyện ngay'
                },
                {
                  title: 'Tạo yêu cầu tư vấn',
                  desc: 'Gửi yêu cầu chi tiết đến đội ngũ luật sư chuyên nghiệp để được tư vấn chuyên sâu.',
                  icon: PlusCircle,
                  link: '#',
                  actionText: 'Tạo yêu cầu'
                },
                {
                  title: 'Quản lý Tài liệu',
                  desc: 'Tải lên, tổ chức và lưu trữ các hợp đồng, văn bản pháp lý một cách an toàn nhất.',
                  icon: FileText,
                  link: '#',
                  actionText: 'Xem thư viện'
                },
                {
                  title: 'Hồ sơ cá nhân',
                  desc: 'Quản lý thông tin tài khoản, mật khẩu và xem các hoạt động giao dịch của bạn.',
                  icon: UserCheck,
                  link: ROUTE.PROFILE.ROOT,
                  actionText: 'Chỉnh sửa hồ sơ'
                }
              ].map((action, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className='group relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700'
                >
                  <div>
                    <div className='inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'>
                      <action.icon className='h-6 w-6' />
                    </div>
                    <h3 className='mt-4 text-lg font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400 transition-colors'>
                      {action.title}
                    </h3>
                    <p className='mt-2 text-sm text-slate-500 leading-relaxed dark:text-slate-400'>
                      {action.desc}
                    </p>
                  </div>
                  <div className='mt-6'>
                    {action.link.startsWith('#') ? (
                      <button className='inline-flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline'>
                        {action.actionText} →
                      </button>
                    ) : (
                      <Link to={action.link} className='inline-flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline'>
                        {action.actionText} →
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Activity Feed / Notifications */}
          <div>
            <h2 className='text-xl font-bold text-slate-900 dark:text-slate-100 mb-6'>Hoạt động gần đây</h2>
            <div className='rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950'>
              <div className='flow-root'>
                <ul className='-mb-8'>
                  {[
                    { title: 'Tạo yêu cầu tư vấn thành công', time: '10 phút trước', desc: 'Yêu cầu tư vấn về Hợp đồng dịch vụ của bạn đã được gửi.', current: true },
                    { title: 'AI phân tích tài liệu hoàn tất', time: '2 giờ trước', desc: 'Hợp đồng lao động mẫu đã được phân tích rủi ro pháp lý.', current: false },
                    { title: 'Cập nhật tài khoản thành công', time: '1 ngày trước', desc: 'Thông tin hồ sơ cá nhân của bạn đã được cập nhật.', current: false }
                  ].map((activity, i) => (
                    <li key={i}>
                      <div className='relative pb-8'>
                        {i !== 2 && (
                          <span className='absolute left-5 top-5 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800' aria-hidden='true' />
                        )}
                        <div className='relative flex space-x-3'>
                          <div>
                            <span className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-slate-950 ${
                              activity.current ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              <TrendingUp className='h-5 w-5' />
                            </span>
                          </div>
                          <div className='flex-1 min-w-0 pt-1.5'>
                            <p className='text-sm font-semibold text-slate-900 dark:text-slate-100'>{activity.title}</p>
                            <p className='text-xs text-slate-400 dark:text-slate-500 mt-0.5'>{activity.time}</p>
                            <p className='text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed'>{activity.desc}</p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
