import { z } from 'zod'

import { numberConstants } from '@/core/configs/consts'

import { validator } from '../helpers/validator'

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(numberConstants.TWO, { message: 'Tên phải có ít nhất 2 ký tự.' })
      .max(numberConstants.fifty, { message: 'Tên không được vượt quá 50 ký tự.' }),

    email: z.string().min(numberConstants.TWO, { message: 'Email không hợp lệ.' }).regex(validator.email, {
      message: 'Email không đúng định dạng.'
    }),

    password: z
      .string()
      .min(numberConstants.FIVE, {
        message: 'Mật khẩu phải có ít nhất 5 ký tự.'
      })
      .regex(validator.passwordRegex, {
        message: 'Mật khẩu phải có ít nhất 1 chữ hoa và 1 số.'
      }),

    confirmPassword: z.string().min(numberConstants.FIVE, {
      message: 'Mật khẩu xác nhận phải có ít nhất 5 ký tự.'
    }),

    phone: z.string().regex(validator.phone, {
      message: 'Số điện thoại không hợp lệ.'
    }),

    role: z.enum(['client', 'lawyer'], {
      message: 'Vui lòng chọn vai trò.'
    }),

    licenseNumber: z.string().optional(),
    issuedDate: z.string().optional(),
    issuedPlace: z.string().optional(),
    certificate: z.any().optional(),
    referralCode: z.string().optional()
  })

  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        path: ['confirmPassword'],
        code: 'custom',
        message: 'Mật khẩu xác nhận không khớp.'
      })
    }

    if (data.role === 'lawyer') {
      if (!data.licenseNumber) {
        ctx.addIssue({
          path: ['licenseNumber'],
          code: 'custom',
          message: 'Số chứng chỉ hành nghề là bắt buộc.'
        })
      }

      if (!data.issuedDate) {
        ctx.addIssue({
          path: ['issuedDate'],
          code: 'custom',
          message: 'Ngày cấp là bắt buộc.'
        })
      }

      if (!data.issuedPlace) {
        ctx.addIssue({
          path: ['issuedPlace'],
          code: 'custom',
          message: 'Nơi cấp là bắt buộc.'
        })
      }

      if (!data.certificate) {
        ctx.addIssue({
          path: ['certificate'],
          code: 'custom',
          message: 'Chứng chỉ là bắt buộc.'
        })
      }
    }
  })
