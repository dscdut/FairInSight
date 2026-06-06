import { z } from 'zod'

export const ForgotEmailSchema = z.object({
  email: z.string().email('Invalid email address')
})
