import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import { ROUTE } from '@/core/constants/path'

const PageNotFound = () => {
  return (
    <div className='min-h-screen bg-background-primary text-text-primary'>
      {/* Header */}
      <div className='container py-4'>
        <div className='text-p-medium text-text-secondary uppercase tracking-wide'>Your Logo</div>
      </div>

      {/* Content */}
      <div className='container flex items-center justify-center'>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='w-full max-w-md rounded-lg border border-border-primary bg-background-secondary p-8 shadow-400'
        >
          <div className='space-y-2 text-center'>
            <h1 className='text-h3'>Quên mật khẩu</h1>
            <p className='text-p text-text-secondary'>
              Nhập email của bạn. Chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
            </p>
          </div>

          <form className='mt-8 space-y-4'>
            <div className='space-y-1'>
              <label className='text-small text-text-secondary'>Địa chỉ email</label>

              <div className='rounded-md border border-border-secondary bg-background-tertiary px-4 py-2 focus-within:ring-1 ring-ring'>
                <input
                  type='email'
                  placeholder='Nhập email'
                  className='w-full bg-transparent text-text-primary outline-none placeholder:text-text-tertiary'
                />
              </div>
            </div>

            <button
              type='submit'
              className='w-full rounded-md bg-primary py-4 text-btn-medium text-primary-foreground transition hover:opacity-90'
            >
              Gửi mã OTP →
            </button>

            <div className='text-center'>
              <Link to={ROUTE.AUTH.LOGIN} className='text-small text-text-secondary hover:text-text-primary'>
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
