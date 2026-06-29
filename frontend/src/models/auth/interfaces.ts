import { type UserMeResponse } from '@/models/user/interfaces'
import { type UserRole } from '@/models/user/types'

export interface TokenResponse {
  access_token: string
  refresh_token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  confirm_password: string
  role: UserRole
}

export interface AuthState {
  isAuthenticated: boolean
  user: UserMeResponse | null
  loading: boolean
}
