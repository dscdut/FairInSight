import { type UserStatus, type UserRole } from '@/models/user/types'

export interface UserMeResponse {
  id: string
  avatarUrl?: string | null
  fullName: string
  email: string
  phone?: string | null
  dateOfBirth?: string | null
  location?: string | null
  subscriptions?: {
    planName?: string | null
  }
  createdAt?: string
}

export interface UserItem {
  id: string
  userCode?: string
  avatar?: string | null
  fullName: string
  email: string
  phone?: string | null
  roleName: UserRole
  status?: UserStatus
  actions?: {
    type: 'default'
  }
}

export interface UsersListResponse {
  data: {
    items: UserItem[]
    pagination: {
      page: number
      size: number
      total: number
      totalPages: number
    }
  }
}
