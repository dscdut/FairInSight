import { type AxiosInstance } from 'axios'

import axiosClient from '@/core/services/axios-client'
import { type AuthApi } from '@/models/types/api/auth-api.type'

const API_LOGIN_URL = '/auth/login'
const API_REGISTER_URL = '/auth/register'
const API_REFRESH_TOKEN_URL = '/auth/refresh-token'
const API_VERIFY_OTP = '/auth/verify-otp'
const API_FORGOT_PASSWORD = '/auth/forgot-password'
const API_RESEND_CODE_URL = '/auth/resend-verification-email'
const API_RESET_PASSWORD_URL = '/auth/reset-password'
const API_LOGOUT_URL = '/auth/logout'

const API_USER = '/auth/me'

export const createAuthApi = (client: AxiosInstance): AuthApi => ({
  // Auth
  login(params) {
    return client.post(API_LOGIN_URL, params)
  },
  register(params) {
    return client.post(API_REGISTER_URL, params)
  },
  refreshToken(refreshToken) {
    return client.post(API_REFRESH_TOKEN_URL, { refresh_token: refreshToken })
  },
  forgotPassword(params) {
    return client.post(API_FORGOT_PASSWORD, params)
  },
  verifyOtp(params) {
    return client.post(API_VERIFY_OTP, params)
  },
  resendVerificationCode(email) {
    return client.post(API_RESEND_CODE_URL, { email })
  },
  resetPassword(params) {
    return client.post(API_RESET_PASSWORD_URL, params)
  },
  logout(refresh_token) {
    return client.post(API_LOGOUT_URL, { refresh_token })
  },
  // User
  getUserInfo() {
    return client.get(API_USER)
  },
  updateProfile(params) {
    return client.patch(API_USER, params)
  }
})

export const authApi: AuthApi = createAuthApi(axiosClient)
