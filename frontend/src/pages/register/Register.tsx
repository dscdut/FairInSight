import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { type z } from 'zod'

import { IconEye, IconNonEye } from '@/assets/icons'
import { logo } from '@/assets/images'
import { FadeUp } from '@/components/animated/animated-component'
import PasswordStrengthBar from '@/components/PasswordStrengthBar/PasswordStrengthBar'
import {
  Button,
  FormControl,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@/components/ui'
import { PASSWORD_TYPE, TEXT_TYPE } from '@/core/configs/consts'
import { ROUTE } from '@/core/constants/path'
import { containerVariants, itemVariants } from '@/core/lib/variant/style-variant'
import { RegisterSchema } from '@/core/zod'
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import { useRegisterAuth } from '@/hooks/tanstack-query/auth/use-query-auth'
import { type RoleType } from '@/models/types/role.type'

export default function Register() {
  const { t } = useTranslation('auth')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)

  useAuthRedirect()
  const roleOptions: RoleType[] = [
    { value: 'client', label: t('roleClient') },
    { value: 'lawyer', label: t('roleLawyer') }
  ]
  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: '',
      role: 'client',
      licenseNumber: '',
      issuedDate: '',
      issuedPlace: '',
      certificate: null,
      referralCode: ''
    }
  })

  const { mutate: mutationRegister, isPending } = useRegisterAuth()
  const role = form.watch('role')

  const handleRegister = () => {
    mutationRegister(form.getValues())
  }

  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev)
  const toggleConfirmPasswordVisibility = () => setIsConfirmPasswordVisible((prev) => !prev)

  return (
    <div
      className='relative flex justify-center w-full min-h-screen bg-cover bg-center'
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      <div className='absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]' />

      <div className='relative flex justify-center items-center px-4 my-8 w-full max-w-7xl'>
        <FadeUp
          className='w-full max-w-xl rounded-lg bg-background-secondary p-8 shadow-400'
        >
          {/* HEADER */}
          <div className='space-y-2 text-center'>
            <img src={logo} alt='Logo' className='w-auto h-12 mx-auto' />
            <h1 className='text-h3 text-primary font-extrabold tracking-tight'>{t('createAccount')}</h1>
            <p className='text-p text-text-secondary'>{t('joinNetwork')}</p>
          </div>

          <Form {...form}>
            <motion.form
              variants={containerVariants}
              initial='hidden'
              animate='visible'
              onSubmit={form.handleSubmit(handleRegister)}
              className='space-y-5 mt-8'
            >
              {/* ROLE */}
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name='role'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className='flex justify-center'>
                          <div className='inline-flex w-full gap-1 rounded-full bg-slate-100 dark:bg-slate-800 p-1 shadow-sm'>
                            {roleOptions.map((option) => {
                              const isActive = field.value === option.value
                              return (
                                <button
                                  key={option.value}
                                  type='button'
                                  onClick={() => {
                                    form.setValue('role', option.value)
                                  }}
                                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-250 ${
                                    isActive ? 'bg-white dark:bg-slate-900 text-primary shadow-sm' : 'text-slate-500'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* NAME */}
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-small text-text-primary'>{t('fullNameLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('fullNamePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* EMAIL */}
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

              {/* PASSWORD & CONFIRM PASSWORD */}
              <motion.div variants={itemVariants} className='grid grid-cols-2 gap-4'>
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
                          iconOnClick={togglePasswordVisibility}
                        />
                      </FormControl>

                      <PasswordStrengthBar password={field.value || ''} />

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-small font-medium text-text-primary'>{t('confirmPasswordLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('confirmPasswordPlaceholder')}
                          type={isConfirmPasswordVisible ? TEXT_TYPE : PASSWORD_TYPE}
                          {...field}
                          icon={isConfirmPasswordVisible ? <IconNonEye /> : <IconEye />}
                          iconOnClick={toggleConfirmPasswordVisibility}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {role === 'lawyer' && (
                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name='referralCode'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-small font-medium text-text-primary'>{t('referralCodeLabel')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('referralCodePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}

              {/* SUBMIT */}
              <motion.div variants={itemVariants}>
                <Button loading={isPending} type='submit' size={'lg'}>
                  {t('register')}
                </Button>
              </motion.div>

              {/* REDIRECT TO LOGIN */}
              <motion.p variants={itemVariants} className='text-center text-small text-text-secondary pt-1'>
                {t('alreadyHaveAccount')}{' '}
                <Link
                  to={ROUTE.AUTH.LOGIN}
                  className='font-semibold text-primary hover:text-primary-600 transition-colors duration-200'
                >
                  {t('login')}
                </Link>
              </motion.p>
            </motion.form>
          </Form>
        </FadeUp>
      </div>
    </div>
  )
}
