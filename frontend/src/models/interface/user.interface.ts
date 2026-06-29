import { type RoleSystem } from '../types/role.type'

export interface UserResponseType {
  userId: string
  fullName: string
  email: string
  roleName: RoleSystem
  status?: string
}
