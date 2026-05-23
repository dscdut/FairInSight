import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { type z } from 'zod'

import { IconEye, IconNonEye } from '@/assets/icons'
import PasswordStrengthBar from '@/components/PasswordStrengthBar/PasswordStrengthBar'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PASSWORD_TYPE, TEXT_TYPE } from '@/core/configs/consts'
import { ROUTE } from '@/core/constants/path'
import { containerVariants, itemVariants } from '@/core/lib/variant/style-variant'
import { RegisterSchema } from '@/core/zod'
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import { useRegisterAuth } from '@/hooks/tanstack-query/auth/use-query-auth'

export default function Register() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)

  useAuthRedirect()

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
      <div className='absolute inset-0 bg-slate-950/70' />

      <div className='relative flex justify-center items-center px-4 mx-auto my-8 w-full max-w-7xl'>
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className='relative z-10 flex flex-col p-8 space-y-6 w-full max-w-md bg-white rounded-2xl shadow-lg'
        >
          {/* HEADER */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='space-y-2 text-center'>
            <h1 className='text-3xl font-bold text-red-900'>Tạo tài khoản</h1>
            <p className='text-gray-600'>Tham gia mạng lưới AI pháp lí thông minh nhất</p>
          </motion.div>

          <Form {...form}>
            <motion.form
              variants={containerVariants}
              initial='hidden'
              animate='visible'
              onSubmit={form.handleSubmit(handleRegister)}
              className='space-y-6'
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
                          <div className='inline-flex w-full gap-1 rounded-full bg-slate-100 p-1 shadow-sm'>
                            {[
                              { value: 'client', label: 'Khách hàng' },
                              { value: 'lawyer', label: 'Luật sư' }
                            ].map((option) => {
                              const isActive = field.value === option.value

                              return (
                                <button
                                  key={option.value}
                                  type='button'
                                  onClick={() => {
                                    form.setValue('role', option.value)
                                  }}
                                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold ${
                                    isActive ? 'bg-white text-red-900 shadow-sm' : 'text-slate-500'
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
                      <FormLabel>HỌ VÀ TÊN</FormLabel>
                      <FormControl>
                        <Input placeholder='Nhập họ và tên' {...field} />
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
                      <FormLabel>EMAIL</FormLabel>
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
                      <FormLabel>MẬT KHẨU</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Nhập mật khẩu'
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
              </motion.div>

              {/* CONFIRM PASSWORD */}
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>XÁC NHẬN MẬT KHẨU</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Nhập lại mật khẩu'
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
                        <FormLabel>MÃ GIỚI THIỆU</FormLabel>
                        <FormControl>
                          <Input placeholder='Nhập mã giới thiệu (nếu có)' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}

              {/* SUBMIT */}
              <motion.div variants={itemVariants}>
                <Button loading={isPending} type='submit' className='w-full' size={'lg'}>
                  Đăng ký
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
              <motion.p className='text-sm text-center text-gray-600'>
                Đã có tài khoản?{' '}
                <Link to={ROUTE.AUTH.LOGIN} className='text-indigo-600 hover:underline'>
                  Đăng nhập
                </Link>
              </motion.p>
            </motion.form>
          </Form>
        </motion.div>
      </div>
    </div>
  )
}
