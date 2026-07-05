import { type UserStatus, type UserRole } from '../user/types'

export interface UserResponseType {
  userId: string
  fullName: string
  email: string
  avatarUrl?: string
  phone?: string
  location?: string
  roleName: UserRole
  status?: UserStatus
}
