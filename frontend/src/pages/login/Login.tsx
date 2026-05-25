import { useCallback, useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { type z } from 'zod'

import { IconEye, IconNonEye } from '@/assets/icons'
import { logo } from '@/assets/images'
import { FadeUp } from '@/components/animated/animated-component'
import {
  Button,
  Checkbox,
  FormControl,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label
} from '@/components/ui'
import { REMEMBER_ME, PASSWORD_TYPE, TEXT_TYPE } from '@/core/configs/consts'
import { ROUTE } from '@/core/constants/path'
import { containerVariants, itemVariants } from '@/core/lib/variant/style-variant'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { LoginSchema } from '@/core/zod'
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import { useLoginAuth } from '@/hooks/tanstack-query/auth/use-query-auth'
import { type RememberMeData } from '@/models/interface/auth.interface'

export default function Login() {
  const { t } = useTranslation('auth')
  const { loginStart, loginSuccess, loginFailure, isLoading } = useAuthStore()

  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    const saved = localStorage.getItem(REMEMBER_ME)
    return saved ? JSON.parse(saved).isRemembered : false
  })

  useAuthRedirect()

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const { mutate: login } = useLoginAuth()

  const onSubmit = useCallback(
    (data: z.infer<typeof LoginSchema>) => {
      loginStart()
      login(data, {
        onSuccess: (res) => loginSuccess(res.data),
        onError: (err) => loginFailure(err.message)
      })
    },
    [login, loginStart, loginSuccess, loginFailure]
  )

  const togglePassword = () => setIsPasswordVisible((prev) => !prev)

  const handleRememberMe = (checked: boolean) => {
    setRememberMe(checked)
    const data = form.getValues()

    if (checked) {
      localStorage.setItem(
        REMEMBER_ME,
        JSON.stringify({
          email: data.email,
          password: data.password,
          isRemembered: true
        })
      )
    } else {
      localStorage.removeItem(REMEMBER_ME)
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_ME)
    if (saved) {
      const parsed: RememberMeData = JSON.parse(saved)
      if (parsed.isRemembered) {
        form.setValue('email', parsed.email)
        form.setValue('password', parsed.password)
      }
    }
  }, [form])

  return (
    <div
      className='relative flex min-h-screen items-center justify-center bg-cover bg-center'
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      <div className='container relative z-10 flex justify-center px-4'>
        <FadeUp
          className='w-full max-w-md rounded-lg bg-background-secondary p-8 shadow-400'
        >
          {/* Brand Logo & Title */}
          <div className='space-y-2 text-center'>
            <div className='flex justify-center mb-4'>
              <img src={logo} alt='FairInsights Logo' className='h-10 w-auto' />
            </div>
            <h1 className='text-h3 text-primary font-extrabold tracking-tight'>{t('login')}</h1>
            <p className='text-p text-text-secondary'>{t('welcomeBack')}</p>
          </div>

          <Form {...form}>
            <motion.form
              variants={containerVariants}
              initial='hidden'
              animate='visible'
              onSubmit={form.handleSubmit(onSubmit)}
              className='mt-8 space-y-5'
            >
              {/* EMAIL */}
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-small text-text-primary'>{t('email')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='nguyenvana@gmail.com'
                          type='email'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
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
                      <FormLabel className='text-small font-medium text-text-primary'>{t('passwordLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('passwordPlaceholder')}
                          type={isPasswordVisible ? TEXT_TYPE : PASSWORD_TYPE}
                          {...field}
                          icon={isPasswordVisible ? <IconNonEye /> : <IconEye />}
                          iconOnClick={togglePassword}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* REMEMBER & FORGOT PASSWORD */}
              <motion.div variants={itemVariants} className='flex items-center justify-between py-0.5'>
                <div className='flex items-center gap-2'>
                  <Checkbox
                    id='remember-me'
                    checked={rememberMe}
                    onCheckedChange={handleRememberMe}
                    className='rounded border-slate-300 text-primary focus:ring-primary h-4 w-4'
                  />
                  <Label htmlFor='remember-me' className='text-small font-medium text-text-secondary cursor-pointer select-none'>
                    {t('rememberMe')}
                  </Label>
                </div>

                <Link
                  to={ROUTE.AUTH.FORGOT_PASSWORD}
                  className='text-small font-medium text-primary hover:text-primary-600 transition-colors duration-200'
                >
                  {t('forgotPassword')}
                </Link>
              </motion.div>

              {/* LOGIN BUTTON */}
              <motion.div variants={itemVariants}>
                <Button
                  loading={isLoading}
                  variant={'default'}
                  type='submit'
                  size={'lg'}
                >
                  {t('login')}
                </Button>
              </motion.div>

              {/* SEPARATOR */}
              <motion.div variants={itemVariants} className='relative flex py-1 items-center'>
                <div className='flex-grow border-t border-slate-200 dark:border-slate-800'></div>
                <span className='flex-shrink mx-3 text-small text-text-tertiary bg-transparent px-2'>
                  {t('or')}
                </span>
                <div className='flex-grow border-t border-slate-200 dark:border-slate-800'></div>
              </motion.div>

              {/* GOOGLE SIGN IN */}
              <motion.div variants={itemVariants}>
                <Button
                  variant={'secondary'}
                  type='button'
                  size={'lg'}
                >
                  <svg className='h-5 w-5 shrink-0' viewBox='0 0 24 24'>
                    <path
                      fill='#4285F4'
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    />
                    <path
                      fill='#34A853'
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    />
                    <path
                      fill='#FBBC05'
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z'
                    />
                    <path
                      fill='#EA4335'
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z'
                    />
                  </svg>
                  <span>{t('loginGoogle')}</span>
                </Button>
              </motion.div>

              {/* REGISTER */}
              <motion.p variants={itemVariants} className='text-center text-small text-text-secondary pt-1'>
                {t('dontHaveAccount')}{' '}
                <Link
                  to={ROUTE.AUTH.REGISTER}
                  className='font-semibold text-primary hover:text-primary-600 transition-colors duration-200'
                >
                  {t('registerNow')}
                </Link>
              </motion.p>
            </motion.form>
          </Form>
        </FadeUp>
      </div>
    </div>
  )
}
