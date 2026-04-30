import { useCallback, useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'
import { type z } from 'zod'

import PasswordStrengthBar from '@/components/PasswordStrengthBar/PasswordStrengthBar'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ROUTE } from '@/core/constants/path'
import { ResetPasswordSchema } from '@/core/zod/reset-password.zod'
import { useResetPasswordAuth } from '@/hooks/tanstack-query/auth/use-query-auth'

type ResetPasswordForm = z.infer<typeof ResetPasswordSchema>

export default function ResetPassword() {
  const location = useLocation()
  const emailFromState = location.state?.email as string | undefined

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      email: emailFromState ?? '',
      password: '',
      confirmPassword: ''
    }
  })

  useEffect(() => {
    if (emailFromState) {
      form.setValue('email', emailFromState)
    }
  }, [emailFromState, form])

  const { mutate: resetPassword, isPending: isResetting } = useResetPasswordAuth()

  const handleResetPassword = useCallback(
    (data: ResetPasswordForm) => {
      resetPassword(data)
    },
    [resetPassword]
  )

  return (
    <div
      className='relative flex justify-center w-full min-h-screen bg-cover bg-center'
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      <div className='absolute inset-0 bg-slate-950/70' />

      <div className='relative z-10 flex min-h-screen items-center justify-center px-4'>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='w-full max-w-md rounded-2xl bg-white p-8 shadow-xl'
        >
          <div className='space-y-3 text-left'>
            <h1 className='text-3xl font-bold text-red-900'>Tạo mật khẩu mới</h1>
            <p className='text-sm text-slate-500'>
              Vui lòng nhập mật khẩu mới của bạn bên dưới. Hãy đảm bảo mật khẩu này khác với các mật khẩu cũ để tăng
              cường bảo mật.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleResetPassword)} className='mt-6 space-y-5'>
              {/* EMAIL */}
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='font-bold'>EMAIL</FormLabel>
                    <FormControl>
                      <Input type='email' {...field} disabled className='bg-slate-100' />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* PASSWORD */}
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-semibold font-bold'>MẬT KHẨU MỚI</FormLabel>

                    <FormControl>
                      <Input
                        type='password'
                        placeholder='Nhập mật khẩu mới'
                        {...field}
                        className='bg-slate-100 h-[45px]'
                      />
                    </FormControl>

                    <PasswordStrengthBar password={form.watch('password') || ''} />

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CONFIRM PASSWORD */}
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='font-bold'>XÁC NHẬN MẬT KHẨU</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='Nhập lại mật khẩu'
                        {...field}
                        className='bg-slate-100 h-[45px]'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* BUTTON */}
              <Button
                loading={isResetting}
                type='submit'
                className='w-full rounded-md bg-red-800 py-3 text-white font-semibold hover:bg-red-900'
              >
                Đổi mật khẩu
              </Button>

              {/* FOOTER */}
              <p className='text-center text-sm text-slate-500'>
                Gặp vấn đề? <span className='text-red-700 font-medium cursor-pointer'>Liên hệ tư vấn viên</span>
              </p>

              <div className='text-center'>
                <Link to={ROUTE.AUTH.LOGIN} className='text-sm text-slate-500 hover:text-red-700'>
                  ← Quay lại đăng nhập
                </Link>
              </div>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  )
}
