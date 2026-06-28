import {
  type Account,
  type LoginApiResponse,
  type LoginResponse,
  type RegisterReponse,
  type ResetPasswordReq,
  type SendEmailReq,
  type VerifyOtpReq,
  type UpdateProfileDto
} from '../../interface/auth.interface'

export type AuthApi = {
  login: (params: Account) => Promise<LoginApiResponse>
  register: (params: Account) => Promise<RegisterReponse>
  refreshToken: (refreshToken: string) => Promise<LoginResponse>
  forgotPassword: (params: SendEmailReq) => Promise<{ message: string }>
  verifyOtp: (params: VerifyOtpReq) => Promise<{ message: string }>
  resendVerificationCode: (email: string) => Promise<{ message: string }>
  resetPassword: (params: ResetPasswordReq) => Promise<{ message: string }>
  logout: (refresh_token: string) => Promise<void>

  getUserInfo: () => Promise<Account>
  updateProfile: (params: UpdateProfileDto) => Promise<UpdateProfileDto>
}
