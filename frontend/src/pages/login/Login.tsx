import { useCallback, useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { type z } from 'zod'

import { IconEye, IconNonEye } from '@/assets/icons'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { REMEMBER_ME, PASSWORD_TYPE, TEXT_TYPE } from '@/core/configs/consts'
import { ROUTE } from '@/core/constants/path'
import { containerVariants, itemVariants } from '@/core/lib/variant/style-variant'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { LoginSchema } from '@/core/zod'
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import { useLoginAuth } from '@/hooks/tanstack-query/auth/use-query-auth'
import { type RememberMeData } from '@/models/interface/auth.interface'

export default function Login() {
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
      <div className='absolute inset-0 bg-background-primary/80' />

      <div className='container relative z-10 flex justify-center px-4'>
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className='w-full max-w-md rounded-lg bg-background-secondary p-10 shadow-400'
        >
          {/* title */}
          <div className='space-y-2 text-center '>
            <h1 className='text-h3 text-primary font-bold'>Đăng nhập</h1>
            <p className='text-small text-secondary'>Chào mừng trở lại</p>
          </div>

          <Form {...form}>
            <motion.form
              variants={containerVariants}
              initial='hidden'
              animate='visible'
              onSubmit={form.handleSubmit(onSubmit)}
              className='mt-6 space-y-4'
            >
              {/* EMAIL */}
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-p-medium text-primary-900'>Email</FormLabel>
                      <FormControl>
                        <Input placeholder='Nhập email của bạn' type='email' {...field} />
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
                      <FormLabel className='text-p-medium text-primary-900 '>Mật khẩu</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Nhập mật khẩu'
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

              {/* REMEMBER */}
              <motion.div variants={itemVariants} className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Checkbox checked={rememberMe} onCheckedChange={handleRememberMe} />
                  <Label className='text-small text-secondary'>Ghi nhớ đăng nhập</Label>
                </div>

                <Link to={ROUTE.AUTH.FORGOT_PASSWORD} className='text-small text-primary'>
                  Quên mật khẩu?
                </Link>
              </motion.div>

              {/* LOGIN BUTTON */}
              <motion.div variants={itemVariants}>
                <Button loading={isLoading} type='submit' className='w-full' size={'lg'}>
                  Đăng nhập
                </Button>
              </motion.div>

              {/* GOOGLE */}
              <motion.div variants={itemVariants}>
                <Button
                  type='button'
                  variant='secondary'
                  size='lg'
                  className='w-full bg-slate-900 text-white hover:bg-slate-800'
                  iconStart={
                    <span className='inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-900 font-bold'>
                      G
                    </span>
                  }
                >
                  Đăng nhập với Google
                </Button>
              </motion.div>

              {/* REGISTER */}
              <motion.p variants={itemVariants} className='text-center text-small text-secondary'>
                Chưa có tài khoản?{' '}
                <Link to={ROUTE.AUTH.REGISTER} className='text-primary'>
                  Đăng ký
                </Link>
              </motion.p>
            </motion.form>
          </Form>
        </motion.div>
      </div>
    </div>
  )
}
