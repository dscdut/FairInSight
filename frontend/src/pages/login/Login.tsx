import { useCallback, useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { type z } from 'zod'

import { IconEye, IconNonEye } from '@/assets/icons'
import Logo from '@/components/logo/logo'
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

const techStack = [
  { name: 'React', icon: '⚛️' },
  { name: 'TypeScript', icon: '📘' },
  { name: 'TailwindCSS', icon: '🎨' },
  { name: 'Vite', icon: '⚡' },
  { name: 'React Query', icon: '🔄' },
  { name: 'Zod', icon: '✨' }
]

export default function Login() {
  const { loginStart, loginSuccess, loginFailure, isLoading } = useAuthStore()
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false)
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    const savedData = localStorage.getItem(REMEMBER_ME)
    if (savedData) {
      const parsedData = JSON.parse(savedData) as RememberMeData
      return parsedData.isRemembered
    }
    return false
  })

  useAuthRedirect()

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const { mutate: mutationLogin } = useLoginAuth()

  const onSubmit = useCallback(
    (data: z.infer<typeof LoginSchema>) => {
      loginStart()
      mutationLogin(data, {
        onSuccess: (response) => {
          loginSuccess(response.data)
        },
        onError: (error) => {
          loginFailure(error.message)
        }
      })
    },
    [mutationLogin, loginStart, loginSuccess, loginFailure]
  )

  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev)

  const handleChangeRememberMe = (event: boolean) => {
    setRememberMe(event)
    const loginData = form.getValues()

    if (event) {
      const rememberMeData: RememberMeData = {
        email: loginData.email,
        password: loginData.password,
        isRemembered: true
      }
      localStorage.setItem(REMEMBER_ME, JSON.stringify(rememberMeData))
    } else {
      localStorage.removeItem(REMEMBER_ME)
    }
  }

  useEffect(() => {
    const savedData = localStorage.getItem(REMEMBER_ME)
    if (savedData) {
      const parsedData = JSON.parse(savedData) as RememberMeData
      if (parsedData.isRemembered) {
        form.setValue('email', parsedData.email)
        form.setValue('password', parsedData.password)
      }
    }
  }, [form])

  return (
    <div
      className='relative flex justify-center w-full min-h-screen bg-cover bg-center'
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      <div className='absolute inset-0 bg-slate-950/70' />
      <div className='relative flex justify-center items-center px-4 mx-auto my-8 w-full max-w-7xl'>
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className='relative z-10 flex flex-col p-8 space-y-6 w-full max-w-md bg-white/95 rounded-2xl shadow-lg'
        >
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* <Logo /> */}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='space-y-2 text-center'
          >
            <h1 className='text-3xl font-bold  text-red-900 w-[400px] h-[32px]'>Đăng nhập</h1>
            <p className='text-gray-600 w-[400px] h-[24px]'>Chào mừng trở lại</p>
          </motion.div>

          <Form {...form}>
            <motion.form
              variants={containerVariants}
              initial='hidden'
              animate='visible'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-6'
            >
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='font-bold'>Email</FormLabel>
                      <FormControl className='w-[400px] h-[52px]'>
                        <Input placeholder='Nhập email của bạn' type='email' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='font-bold'>Mật khẩu</FormLabel>
                      <FormControl className='w-[400px] h-[52px]'>
                        <Input
                          placeholder='Nhập mật khẩu của bạn'
                          className='w-full'
                          type={isPasswordVisible ? TEXT_TYPE : PASSWORD_TYPE}
                          {...field}
                          icon={isPasswordVisible ? <IconNonEye /> : <IconEye />}
                          iconOnClick={togglePasswordVisibility}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants} className='flex justify-between items-center'>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='terms'
                    className='w-4 h-4'
                    checked={rememberMe}
                    onCheckedChange={handleChangeRememberMe}
                  />
                  <Label htmlFor='terms' className='text-sm text-gray-600 cursor-pointer'>
                    Ghi nhớ đăng nhập
                  </Label>
                </div>
                <Link
                  to={ROUTE.AUTH.FORGOT_PASSWORD}
                  className='text-sm text-indigo-600 hover:text-indigo-800 hover:underline'
                >
                  Quên mật khẩu?
                </Link>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button
                  loading={isLoading}
                  variant='default'
                  size='lg'
                  className='w-full bg-red-800 hover:bg-red-900 text-white'
                  type='submit'
                >
                  Đăng nhập
                </Button>
              </motion.div>

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

              <motion.p variants={itemVariants} className='text-sm text-center text-gray-600'>
                Chưa có tài khoản?{' '}
                <Link to='/register' className='font-medium text-indigo-600 hover:text-indigo-800 hover:underline'>
                  Đăng ký ngay
                </Link>
              </motion.p>
            </motion.form>
          </Form>
        </motion.div>
      </div>
    </div>
  )
}
