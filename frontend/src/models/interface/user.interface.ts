import { type RoleSystem, type RoleUser } from "../types/role.type"

export interface UserResponseType {
  userId: string
  fullName: string
  email: string
  roleName: RoleSystem | RoleUser
}
