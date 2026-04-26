import { useCallback } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import Logo from '@/components/logo/logo'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ROUTE } from '@/core/constants/path'
import { containerVariants, itemVariants } from '@/styles/variant/style-variant'

const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Vui lòng nhập email hợp lệ' })
})

type ForgotPasswordForm = z.infer<typeof ForgotPasswordSchema>

export default function ForgotPassword() {
  const navigate = useNavigate()

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  })

  const onSubmit = useCallback(
    (data: ForgotPasswordForm) => {
      navigate(ROUTE.AUTH.VERIFY_ACCOUNT_EMAIL, { state: { email: data.email } })
    },
    [navigate]
  )

  return (
    <div
      className='relative flex justify-center w-full min-h-screen bg-cover bg-center'
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      <div className='absolute inset-0 bg-slate-950/70' />
      <div className='relative z-10 flex min-h-screen items-center justify-center px-4 pb-24'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='w-full max-w-md rounded-[32px] border border-white/10 bg-white/95 p-10 shadow-2xl shadow-black/20 backdrop-blur-xl'
        >
          <div className='space-y-4 text-center'>
            {/* <span className='inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700'>
              <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='h-6 w-6'>
                <path d='M12 8v4l3 3' />
                <circle cx='12' cy='12' r='9' />
              </svg>
            </span> */}
            <h1 className='text-3xl font-bold text-red-900'>Quên mật khẩu</h1>
            <p className='mx-auto max-w-[26rem] text-sm leading-6 text-slate-500'>
              Nhập địa chỉ email liên kết với tài khoản của bạn. Chúng tôi sẽ gửi một mã xác thực (OTP) để thiết lập mật
              khẩu mới.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='mt-8 space-y-6'>
              <motion.div variants={containerVariants} initial='hidden' animate='visible'>
                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Nhập địa chỉ email'
                            type='email'
                            {...field}
                            className='bg-slate-100 text-slate-900'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button
                    type='submit'
                    variant='default'
                    size='lg'
                    className='mt-5 w-full bg-red-950 text-white hover:bg-red-900'
                  >
                    Gửi mã OTP
                  </Button>
                </motion.div>

                <motion.div variants={itemVariants} className='mt-8 text-center text-sm text-slate-500'>
                  <Link to={ROUTE.AUTH.LOGIN} className='font-semibold text-red-950 hover:text-red-700'>
                    ← Quay lại đăng nhập
                  </Link>
                </motion.div>
              </motion.div>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  )
}
