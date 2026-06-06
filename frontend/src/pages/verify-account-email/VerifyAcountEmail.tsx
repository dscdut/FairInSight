import { useCallback, useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { type z } from 'zod'

import { logo } from '@/assets/images'
import { FadeUp } from '@/components/animated/animated-component'
import {
  Button,
  FormControl,
  Form,
  FormField,
  FormItem,
  FormMessage,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '@/components/ui'
import { containerVariants, itemVariants } from '@/core/lib/variant/style-variant'
import { VerifyAccountEmailSchema } from '@/core/zod/verify-account-email.zod'
import { useVerifyEmailAuth } from '@/hooks/tanstack-query/auth/use-query-auth'

const RESEND_COUNTDOWN = 60

export default function VerifyEmail() {
  const { t } = useTranslation('auth')
  const location = useLocation()
  // const navigate = useNavigate()

  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN)
  const [canResend, setCanResend] = useState(false)

  const form = useForm<z.infer<typeof VerifyAccountEmailSchema>>({
    resolver: zodResolver(VerifyAccountEmailSchema),
    defaultValues: {
      email: '',
      otp: ''
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

  const { mutate: verifyEmail, isPending: isVerifying } = useVerifyEmailAuth()


  const handleVerify = useCallback(
    (data: z.infer<typeof VerifyAccountEmailSchema>) => {
      const flowType = location.state?.password ? 'register' : 'forgot_password'
      
      verifyEmail({
        otp: data.otp,
        email: data.email,
        type: flowType,
        password: location.state?.password
      })
    },
    [verifyEmail, location.state]
  )
  
  return (
    <div
      className='relative flex min-h-screen w-full justify-center bg-cover bg-center'
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      <div className='absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]' />

      <div className='container relative z-10 flex justify-center items-center px-4'>
        <FadeUp
          className='w-full max-w-md rounded-lg bg-background-secondary p-8 shadow-400'
        >
          {/* HEADER */}
          <div className='space-y-2 text-center'>
            <div className='flex justify-center mb-4'>
              <img src={logo} alt='FairInsights Logo' className='h-10 w-auto' />
            </div>
            <h1 className='text-h3 text-primary font-extrabold tracking-tight'>{t('verifyOtpTitle')}</h1>
            <p className='text-small text-text-secondary mt-2'>{t('verifyOtpDesc')}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleVerify)} className='mt-8 space-y-6'>
              <motion.div variants={containerVariants} initial='hidden' animate='visible' className='space-y-5'>
                {/* OTP INPUT */}
                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name='otp'
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
                                  className='flex-1 rounded-xl border bg-background text-center text-lg font-semibold'
                                />
                              ))}
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* BUTTON */}
                <motion.div variants={itemVariants}>
                  <Button
                    loading={isVerifying}
                    type='submit'
                    variant='default'
                    size='lg'
                    className='w-full mt-2'
                  >
                    {t('verifyOtpBtn')}
                  </Button>
                </motion.div>

                {/* RESEND */}
                <motion.div variants={itemVariants} className='text-center text-small pt-2'>
                  <button
                    type='button'
                    onClick={()=>{}}
                    disabled={!canResend}
                    className={`font-semibold transition-colors duration-200 ${
                      canResend
                        ? 'text-primary hover:text-primary-600'
                        : 'cursor-not-allowed text-text-tertiary'
                    }`}
                  >
                    {/* {isResending
                      ? t('sending')
                      : canResend
                      ? t('resendCode')
                      : `${t('resendCode')} (${countdown}s)`} */}
                  </button>
                </motion.div>
              </motion.div>
            </form>
          </Form>
        </FadeUp>
      </div>
    </div>
  )
}
