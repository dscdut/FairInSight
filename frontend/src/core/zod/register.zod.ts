import { z } from 'zod'

import { numberConstants } from '@/core/configs/consts'

import { validator } from '../helpers/validator'

export const RegisterSchema = z
  .object({
    name: z.string().min(numberConstants.TWO, {
      message: 'Name is valid.'
    }),
    email: z.string().min(numberConstants.TWO, {
      message: 'Email is valid.'
    }),
    password: z
      .string()
      .min(numberConstants.ONE, {
        message: 'Password is required'
      })
      .regex(validator.passwordRegex, {
        message: 'Password must be at least 5 characters long, contain at least one uppercase letter and one number'
      }),
    confirmPassword: z
      .string()
      .min(numberConstants.ONE, {
        message: 'Password is required'
      })
      .regex(validator.passwordRegex, {
        message: 'Password must be at least 5 characters long, contain at least one uppercase letter and one number'
      }),
    phone: z.string().min(numberConstants.TEN, {
      message: 'Phone number must be at least 10 characters.'
    }),
    role: z.enum(['client', 'lawyer'], {
      message: 'Please select a role.'
    }),
    licenseNumber: z.string().optional(),
    issuedDate: z.string().optional(),
    issuedPlace: z.string().optional(),
    certificate: z.any().optional(),
    referralCode: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.role === 'lawyer') {
      if (!data.licenseNumber) {
        ctx.addIssue({ path: ['licenseNumber'], code: 'custom', message: 'Số chứng chỉ hành nghề là bắt buộc.' })
      }
      if (!data.issuedDate) {
        ctx.addIssue({ path: ['issuedDate'], code: 'custom', message: 'Ngày cấp là bắt buộc.' })
      }
      if (!data.issuedPlace) {
        ctx.addIssue({ path: ['issuedPlace'], code: 'custom', message: 'Nơi cấp là bắt buộc.' })
      }
      if (!data.certificate) {
        ctx.addIssue({ path: ['certificate'], code: 'custom', message: 'Chứng chỉ là bắt buộc.' })
      }
    }
  })
