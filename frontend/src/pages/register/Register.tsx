import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { type z } from 'zod'

import { IconEye, IconNonEye } from '@/assets/icons'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PASSWORD_TYPE, TEXT_TYPE } from '@/core/configs/consts'
import { ROUTE } from '@/core/constants/path'
import { containerVariants, itemVariants } from '@/core/lib/variant/style-variant'
import { RegisterSchema } from '@/core/zod'
import { useAuthRedirect } from '@/hooks/auth/use-auth-redirect'
import { useRegisterAuth } from '@/hooks/tanstack-query/auth/use-query-auth'

const getPasswordStrength = (password: string) => {
  let score = 0

  if (!password) return 0

  // độ dài
  if (password.length >= 6) score += 2
  if (password.length >= 10) score += 2

  // ký tự
  if (/[A-Z]/.test(password)) score += 2
  if (/[0-9]/.test(password)) score += 2
  if (/[^A-Za-z0-9]/.test(password)) score += 2

  return score // max = 10
}

const getPasswordStrengthLabel = (score: number, password: string) => {
  if (!password) return 'Chưa nhập'
  if (score < 5) return 'Yếu'
  if (score < 8) return 'Trung bình'
  return 'Mạnh'
}

const getPasswordStrengthColor = (score: number, password: string) => {
  if (!password) return ''
  return 'bg-red-500'
}

export default function Register() {
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState<boolean>(false)

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

  const role = useWatch({ control: form.control, name: 'role' })
  const password = useWatch({ control: form.control, name: 'password' })
  const passwordStrength = getPasswordStrength(password ?? '')
  const passwordStrengthLabel = getPasswordStrengthLabel(passwordStrength, password ?? '')
  const passwordStrengthColor = getPasswordStrengthColor(passwordStrength, password ?? '')

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='space-y-2 text-center w-[400px] h-16'
          >
            <h1 className='text-3xl font-bold text-red-900 w-[400px] h-[32px] '>Tạo tài khoản</h1>
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
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name='role'
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className='flex justify-center w-[400px] h-[44px] '>
                          <div className='inline-flex items-center justify-between w-full  gap-1 rounded-full bg-slate-100 p-1 shadow-sm'>
                            {[
                              { value: 'client', label: 'Khách hàng' },
                              { value: 'lawyer', label: 'Luật sư' }
                            ].map((option) => (
                              <button
                                key={option.value}
                                type='button'
                                onClick={() => field.onChange(option.value)}
                                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200  ${
                                  field.value === option.value
                                    ? 'bg-white text-red-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem className='w-[400px] h-[74.5px]'>
                      <FormLabel className='font-bold'>Họ và tên</FormLabel>
                      <FormControl className='w-[400px] h-[52px]'>
                        <Input placeholder='Nhập họ và tên' {...field} className='w-full' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem className='w-[400px] h-[74.5px]'>
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
                  name={PASSWORD_TYPE}
                  render={({ field }) => (
                    <FormItem className='w-[400px] h-[74.5px]'>
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
                      <div className='mt-2'>
                        <div className='flex gap-1'>
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className={`h-[2px] flex-1 rounded ${i < passwordStrength ? 'bg-red-700' : 'bg-slate-300'}`}
                            />
                          ))}
                        </div>

                        <div className='text-[10px] font-semibold text-red-700 text-right mt-1'>
                          {passwordStrength < 2 ? 'YẾU' : passwordStrength < 3 ? 'TRUNG BÌNH' : 'MẠNH'}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem className='mt-10 -[400px] h-[69.5px]'>
                      <FormLabel className='font-bold'>Xác nhận mật khẩu</FormLabel>
                      <FormControl className='w-[400px] h-[52px]'>
                        <Input
                          placeholder='Nhập lại mật khẩu của bạn'
                          className='w-full'
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
                <>
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name='referralCode'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mã giới thiệu (không bắt buộc)</FormLabel>
                          <FormControl>
                            <Input placeholder='REF-12345' {...field} className='w-full' />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                </>
              )}

              <motion.div variants={itemVariants} className='flex items-center space-x-2'>
                <Checkbox id='terms' className='w-4 h-4' />
                <Label htmlFor='terms' className='text-sm text-gray-600 cursor-pointer'>
                  Tôi đồng ý với các <span className='text-indigo-600'>Điều khoản</span> và{' '}
                  <span className='text-indigo-600'>Chính sách bảo mật</span>
                </Label>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button
                  loading={isPending}
                  variant='default'
                  size='lg'
                  className='w-full bg-red-800 hover:bg-red-900 text-white'
                  type='submit'
                >
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

              <motion.p variants={itemVariants} className='text-sm text-center text-gray-600'>
                Đã có tài khoản?{' '}
                <Link
                  to={ROUTE.AUTH.LOGIN}
                  className='font-medium text-indigo-600 hover:text-indigo-800 hover:underline'
                >
                  Đăng nhập ngay
                </Link>
              </motion.p>
            </motion.form>
          </Form>
        </motion.div>
      </div>
    </div>
  )
}
