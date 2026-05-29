import { z } from 'zod'

import { numberConstants } from '@/core/configs/consts'

export const LoginSchema = z.object({
  email: z.string().min(numberConstants.TWO, {
    message: 'Email chưa được xác thực.'
  }),
  password: z.string().min(numberConstants.EIGHT, {
    message: 'Mật khẩu phải tối thiểu 8 kí tự.'
  })
})
