import type HttpStatusCode from "@/core/constants/http"

import { type RoleUser } from "../types/role.type"

import { type UserResponseType } from "./user.interface"

export interface APIResponse<T> {
  data: T
  message: string
  status: number
  success?: boolean
}

export interface LoginApiResponse {
  data: LoginResponse
  message: string
}

export interface LoginResponse {
  user: UserResponseType
  accessToken: string
  refreshToken: string
}

export interface LoginErrorResponse {
  code: string
  message?: string
  status: HttpStatusCode
}

// define the Account interface
export interface Account {
  email?: string
  password?: string
  confirmPassword?: string
  fullName?: string
  role?: RoleUser
  phone?: string
  referralCode?: string
  avatarUrl?: string
  dateOfBirth?: string;
  location?: string;
}

// define the RegisterReponse interface
export interface RegisterReponse {
  id: string
  fullName: string
  email: string
  roleName: RoleUser
}

export interface RegisterApiResponse {
  data: RegisterReponse
  message: string
}

export interface SendEmailReq {
  email: string
}

// define the VerifyEmailReq interface
export interface VerifyOtpReq {
  email?: string;
  otp: string
  type: string;
}

export interface ResetPasswordReq {
  token: string
  newPassword: string
  confirmNewPassword: string
}

export interface RememberMeData {
  email: string
  password: string
  isRemembered: boolean
}
