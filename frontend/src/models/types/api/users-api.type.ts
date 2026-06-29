import { type UsersListResponse } from '@/models/user/interfaces'
import { type UserRole } from '@/models/user/types'

export type UsersApi = {
  getUsers: (
    params?: {
      page?: number
      size?: number
      roleName?: string
      status?: string
      search?: string
    },
    options?: { signal?: AbortSignal }
  ) => Promise<UsersListResponse>

  deleteUser: (id: string) => Promise<unknown>
  banUser: (id: string, reason: string) => Promise<unknown>
  unbanUser: (id: string, reason: string) => Promise<unknown>
  updateUserRole: (
    id: string,
    data: {
      role: UserRole
      licenseNumber: string
      licenseIssuer: string
    }
  ) => Promise<unknown>
  getUsersStat: () => Promise<{ data: { totalUsers: number } }>
}
