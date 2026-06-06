import { z } from 'zod'

import { numberConstants } from '@/core/configs/consts'

import { validator } from '../helpers/validator'
export const ResetPasswordSchema = z
  .object({
    email: z.string().email('Vui lòng nhập email hợp lệ').regex(validator.email, {
      message: 'Email không đúng định dạng.'
    }),
    password: z.string().min(numberConstants.FIVE, 'Mật khẩu phải có ít nhất 5 ký tự').regex(validator.passwordRegex, {
      message: 'Mật khẩu phải có ít nhất 1 chữ hoa và 1 số.'
    }),
    confirmPassword: z.string().min(numberConstants.FIVE, 'Vui lòng xác nhận mật khẩu')
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận không khớp'
  })
