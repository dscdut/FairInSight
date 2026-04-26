import { useCallback, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { type z } from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { ROUTE } from '@/core/constants/path'
import { VerifyAccountEmailSchema } from '@/core/zod/verify-account-email.zod'
import { useResendVerificationCode } from '@/hooks/tanstack-query/auth/use-query-auth'

const RESEND_COUNTDOWN = 60

export default function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()

  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN)
  const [canResend, setCanResend] = useState(false)

  const form = useForm<z.infer<typeof VerifyAccountEmailSchema>>({
    resolver: zodResolver(VerifyAccountEmailSchema),
    defaultValues: {
      email: '',
      verificationCode: ''
    }
  })

  // set email từ state
  useEffect(() => {
    const email = location.state?.email
    if (email) form.setValue('email', email)
  }, [location.state, form])

  // countdown resend
  useEffect(() => {
    if (countdown === 0) {
      setCanResend(true)
      return
    }

    if (!canResend) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [countdown, canResend])

  const { mutate: resendCode, isPending: isResending } = useResendVerificationCode({
    setCountdown,
    setCanResend
  })

  // fake verify
  const handleVerify = useCallback(
    (data: z.infer<typeof VerifyAccountEmailSchema>) => {
      setTimeout(() => {
        navigate(ROUTE.AUTH.RESET_PASSWORD, {
          state: { email: data.email }
        })
      }, 800)
    },
    [navigate]
  )

  const handleResendCode = useCallback(() => {
    const email = form.getValues('email')
    if (email) resendCode(email)
  }, [form, resendCode])

  return (
    <div
      className='relative flex min-h-screen w-full justify-center bg-cover bg-center'
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      <div className='absolute inset-0 bg-slate-950/70' />

      <div className='relative z-10 flex items-center justify-center px-4'>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='w-full max-w-md rounded-2xl bg-white/95 p-8 shadow-xl backdrop-blur'
        >
          {/* HEADER */}
          <div className='space-y-3 text-center'>
            <h1 className='text-2xl font-bold text-red-900'>Xác nhận OTP</h1>
            <p className='text-sm text-slate-500'>Mã OTP 6 chữ số đã được gửi tới email của bạn.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleVerify)} className='mt-6 space-y-6'>
              {/* OTP INPUT */}
              <FormField
                control={form.control}
                name='verificationCode'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <InputOTP
                        maxLength={6}
                        value={field.value}
                        onChange={field.onChange}
                        containerClassName='w-full gap-2'
                      >
                        <InputOTPGroup className='w-full justify-between'>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <InputOTPSlot
                              key={i}
                              index={i}
                              className='flex-1 rounded-xl border bg-slate-100 text-center text-lg font-semibold'
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* BUTTON */}
              <Button
                type='submit'
                className='w-full rounded-md bg-red-900 py-3 font-semibold text-white hover:bg-red-800'
              >
                Xác nhận OTP
              </Button>

              {/* RESEND */}
              <div className='text-center text-sm'>
                <button
                  type='button'
                  onClick={handleResendCode}
                  disabled={!canResend || isResending}
                  className={`font-semibold ${
                    canResend && !isResending ? 'text-red-900 hover:text-red-700' : 'cursor-not-allowed text-slate-400'
                  }`}
                >
                  {isResending ? 'Đang gửi...' : canResend ? 'Gửi lại mã' : `Gửi lại mã (${countdown}s)`}
                </button>
              </div>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  )
}
