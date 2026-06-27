import { useCallback } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { bg_login, logo } from '@/assets/images'
import { FadeUp } from '@/components/animated/animated-component'
import { Button, FormControl, Form, FormField, FormItem, FormLabel, FormMessage, Input } from '@/components/ui'
import { ROUTE } from '@/core/constants/path'
import { containerVariants, itemVariants } from '@/core/lib/variant/style-variant'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { t } = useTranslation('auth')

  const ForgotPasswordSchema = z.object({
    email: z.string().email({ message: t('invalidEmail') })
  })

  type ForgotPasswordForm = z.infer<typeof ForgotPasswordSchema>

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
      className='relative flex min-h-screen items-center justify-center bg-cover bg-center'
      style={{ backgroundImage: `url(${bg_login})` }}
    >
      <div className='absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]' />
      <div className='container relative z-10 flex justify-center px-4'>
        <FadeUp className='w-full max-w-md rounded-lg bg-background-secondary p-8 shadow-400'>
          {/* Brand Logo & Title */}
          <div className='space-y-2 text-center'>
            <div className='flex justify-center mb-4'>
              <img src={logo} alt='FairInsights Logo' className='h-10 w-auto' />
            </div>
            <h1 className='text-h3 text-primary font-extrabold tracking-tight'>{t('forgotPasswordTitle')}</h1>
            <p className='text-small text-text-secondary mt-2'>{t('forgotPasswordDesc')}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='mt-8 space-y-6'>
              <motion.div variants={containerVariants} initial='hidden' animate='visible' className='space-y-5'>
                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-small text-text-primary'>{t('email')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('emailPlaceholder')} type='email' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button type='submit' variant='default' size='lg' className='w-full mt-2'>
                    {t('sendOtp')}
                  </Button>
                </motion.div>

                <motion.div variants={itemVariants} className='text-center text-small text-text-secondary pt-2'>
                  <Link
                    to={ROUTE.AUTH.LOGIN}
                    className='font-semibold text-primary hover:text-primary-600 transition-colors duration-200'
                  >
                    ← {t('backToLogin')}
                  </Link>
                </motion.div>
              </motion.div>
            </form>
          </Form>
        </FadeUp>
      </div>
    </div>
  )
}
