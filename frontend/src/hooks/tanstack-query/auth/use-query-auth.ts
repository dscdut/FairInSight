import { useMutation, useQuery } from '@tanstack/react-query'
import { type AxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { type z } from 'zod'

import { ROUTE } from '@/core/constants/path'
import { handleError } from '@/core/helpers/error-handler'
import { MUTATION_KEYS, QUERY_KEYS } from '@/core/helpers/key-tanstack'
import { processLoginSuccess } from '@/core/helpers/process-login-success'
import toastifyCommon from '@/core/lib/toastify-common'
import { authApi } from '@/core/services/auth.service'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { type ForgotEmailSchema } from '@/core/zod/forgot-email.zod'
import { type RegisterSchema } from '@/core/zod/register.zod'
import {
  type LoginErrorResponse,
  type Account,
  type LoginApiResponse,
  type ResetPasswordReq
} from '@/models/interface/auth.interface'

// Login
export const useLoginAuth = () => {
  const navigate = useNavigate()
  return useMutation({
    mutationKey: [MUTATION_KEYS.login],
    mutationFn: (data: Account) => authApi.login(data),
    onSuccess: (response: LoginApiResponse) => {
      processLoginSuccess(response, navigate)
      toastifyCommon.success('Đăng nhập thành công')
    },
    onError: (error: AxiosError, variables) => {
      const errorResponse = error.response?.data as LoginErrorResponse
      const errorMessage = errorResponse.message || error.message || ''
      if (
        errorMessage.includes('chưa được xác thực') ||
        errorMessage.includes('chưa được kích hoạt') ||
        errorMessage.includes('Email is not verified') ||
        errorMessage.includes('not activated')
      ) {
        if (variables.email) {
          toastifyCommon.error('Tài khoản chưa xác thực!')
          navigate(ROUTE.AUTH.VERIFY_ACCOUNT_EMAIL, { state: { email: variables.email, password: variables.password } })
        }
        return
      }
      handleError(error, 'Đăng nhập thất bại')
    }
  })
}

// Register
export const useRegisterAuth = () => {
  const navigate = useNavigate()
  return useMutation({
    mutationKey: [MUTATION_KEYS.register],
    mutationFn: (data: z.infer<typeof RegisterSchema>) => authApi.register(data),
    onSuccess: (_, variables) => {
      navigate(ROUTE.AUTH.VERIFY_ACCOUNT_EMAIL, { state: { email: variables.email, password: variables.password } })
      toastifyCommon.success('Đăng ký thành công')
    },
    onError: (error: AxiosError) => {
      handleError(error, 'Đăng ký thất bại')
    }
  })
}

// FILL EMAIL FOR FORGOT PASSWORD
export const useEmailForgotPassAuth = () => {
  const navigate = useNavigate()
  return useMutation({
    mutationKey: [MUTATION_KEYS.forgotPassword],
    mutationFn: (data: z.infer<typeof ForgotEmailSchema>) => authApi.forgotPassword(data),
    onSuccess: (_, variables) => {
      toastifyCommon.success('Đã gửi mã xác thực thành công!')
      navigate(ROUTE.AUTH.VERIFY_ACCOUNT_EMAIL, { state: { email: variables.email } })
    },
    onError: (error: AxiosError) => handleError(error, 'Gửi mã thất bại!')
  })
}

// VERIFY EMAIL
export const useVerifyEmailAuth = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationKey: [MUTATION_KEYS.verifyEmail],
    mutationFn: (data: { otp: string; email?: string; type?: 'register' | 'forgot_password'; password?: string }) =>
      authApi.verifyOtp({ otp: data.otp, email: data.email, type: 'email' }),
    onSuccess: async (_, variables) => {
      toastifyCommon.success('Xác thực thành công!')
      if (variables.type === 'forgot_password') {
        navigate(ROUTE.AUTH.RESET_PASSWORD, { state: { email: variables.email } })
      } else {
        navigate(ROUTE.AUTH.LOGIN)
      }
    },
    onError: (error: AxiosError) => handleError(error, 'Xác thực thất bại!')
  })
}

// RESET PASSWORD
export const useResetPasswordAuth = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationKey: [MUTATION_KEYS.resetPassword],
    mutationFn: (data: ResetPasswordReq) => authApi.resetPassword(data),
    onSuccess: () => {
      toastifyCommon.success('Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.')
      navigate(ROUTE.AUTH.LOGIN)
    },
    onError: (error: AxiosError) => handleError(error, 'Xác thực thất bại!')
  })
}

export const useUserInfo = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: [QUERY_KEYS.userInfo],
    queryFn: async () => {
      const userData = await authApi.getUserInfo()
      return userData
    },
    enabled: isAuthenticated
  })
}