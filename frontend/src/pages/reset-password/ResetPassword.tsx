import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { type z } from 'zod'

import { bg_login, logo } from '@/assets/images'
import { FadeUp } from '@/components/animated/animated-component'
import PasswordStrengthBar from '@/components/PasswordStrengthBar/PasswordStrengthBar'
import { Button, FormControl, Form, FormField, FormItem, FormLabel, FormMessage, Input } from '@/components/ui'
import { ROUTE } from '@/core/constants/path'
import { containerVariants, itemVariants } from '@/core/lib/variant/style-variant'
import { ResetPasswordSchema } from '@/core/zod/reset-password.zod'
// import { useResetPasswordAuth } from '@/hooks/tanstack-query/auth/use-query-auth'

type ResetPasswordForm = z.infer<typeof ResetPasswordSchema>

export default function ResetPassword() {
  const { t } = useTranslation('auth')
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

  // const { mutate: resetPassword, isPending: isResetting } = useResetPasswordAuth()

  // const handleResetPassword = useCallback(
  //   (data: ResetPasswordForm) => {
  //     resetPassword(data)
  //   },
  //   [resetPassword]
  // )

  const handleResetPassword = () => {}

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
            <h1 className='text-h3 text-primary font-extrabold tracking-tight'>{t('resetPasswordTitle')}</h1>
            <p className='text-small text-text-secondary mt-2'>{t('resetPasswordDesc')}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleResetPassword)} className='mt-8 space-y-6'>
              <motion.div variants={containerVariants} initial='hidden' animate='visible' className='space-y-5'>
                {/* EMAIL */}
                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-small text-text-primary'>{t('email')}</FormLabel>
                        <FormControl>
                          <Input type='email' {...field} disabled />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* PASSWORD */}
                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name='password'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-small text-text-primary'>{t('newPasswordLabel')}</FormLabel>
                        <FormControl>
                          <Input type='password' placeholder={t('newPasswordPlaceholder')} {...field} />
                        </FormControl>
                        <PasswordStrengthBar password={form.watch('password') || ''} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* CONFIRM PASSWORD */}
                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name='confirmPassword'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-small text-text-primary'>{t('confirmPasswordLabel')}</FormLabel>
                        <FormControl>
                          <Input type='password' placeholder={t('confirmPasswordPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                {/* BUTTON */}
                <motion.div variants={itemVariants}>
                  <Button
                    // loading={isResetting}
                    type='submit'
                    variant='default'
                    size='lg'
                    className='w-full mt-2'
                  >
                    {t('changePasswordBtn')}
                  </Button>
                </motion.div>

                {/* FOOTER */}
                <motion.div
                  variants={itemVariants}
                  className='text-center text-small text-text-secondary pt-2 space-y-4'
                >
                  <p>
                    {t('havingTrouble')}{' '}
                    <span className='text-primary font-semibold hover:underline cursor-pointer'>
                      {t('contactSupport')}
                    </span>
                  </p>
                  <div>
                    <Link
                      to={ROUTE.AUTH.LOGIN}
                      className='font-semibold text-primary hover:text-primary-600 transition-colors duration-200'
                    >
                      ← {t('backToLogin')}
                    </Link>
                  </div>
                </motion.div>
              </motion.div>
            </form>
          </Form>
        </FadeUp>
      </div>
    </div>
  )
}
