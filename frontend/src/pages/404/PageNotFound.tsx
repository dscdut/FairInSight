import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import { ROUTE } from '@/core/constants/path'

const PageNotFound = () => {
  return (
    <div className='relative min-h-screen overflow-hidden bg-slate-950 text-white'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.14),transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),transparent_12%)]' />
      <div className='absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.84))]' />

      <div className='relative z-10 px-6 py-6'>
        <div className='text-sm font-semibold uppercase tracking-[0.25em] text-white/70'>Your Logo</div>
      </div>

      <div className='relative z-10 flex min-h-[calc(100vh-96px)] items-center justify-center px-4 pb-24'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='w-full max-w-md rounded-[32px] border border-white/10 bg-slate-950/95 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl'
        >
          <div className='space-y-4 text-center'>
            <h1 className='text-3xl font-semibold text-white'>Quên mật khẩu</h1>
            <p className='mx-auto max-w-[30rem] text-sm leading-6 text-slate-300'>
              Nhập địa chỉ email liên kết với tài khoản của bạn. Chúng tôi sẽ gửi một mã xác thực (OTP) để thiết lập mật
              khẩu mới.
            </p>
          </div>

          <form className='mt-8 space-y-6'>
            <div className='space-y-2'>
              <label htmlFor='email' className='text-xs font-semibold uppercase tracking-[0.24em] text-slate-400'>
                Địa chỉ email
              </label>
              <div className='rounded-[28px] border border-white/10 bg-slate-900/80 px-4 py-3'>
                <input
                  id='email'
                  type='email'
                  placeholder='Nhập địa chỉ email'
                  className='w-full bg-transparent text-white outline-none placeholder:text-slate-500'
                />
              </div>
            </div>

            <button
              type='submit'
              className='inline-flex w-full items-center justify-center rounded-[28px] bg-red-950 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-900'
            >
              Gửi mã OTP →
            </button>

            <div className='text-center'>
              <Link to={ROUTE.AUTH.LOGIN} className='text-sm font-semibold text-white transition hover:text-red-300'>
                ← Quay lại đăng nhập
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default PageNotFound
