import { type AxiosInstance } from 'axios'

import axiosClient from '@/core/services/axios-client'
import { type UsersApi } from '@/models/types/api/users-api.type'

const API_GET_USERS = '/users'
const API_GET_USERS_STATS = '/users/stats'
const API_DELETE_USER = (id: string) => `/users/${id}`
const API_BAN_USER = (id: string) => `/users/${id}/ban`
const API_UNBAN_USER = (id: string) => `/users/${id}/unban`
const API_ROLE = (id: string) => `/users/${id}/role`

export const createUsersApi = (client: AxiosInstance): UsersApi => ({
  getUsers(params, options) {
    return client.get(API_GET_USERS, { params, signal: options?.signal })
  },
  deleteUser(id) {
    return client.delete(API_DELETE_USER(id))
  },
  banUser(id, reason) {
    return client.patch(API_BAN_USER(id), { reason })
  },
  unbanUser(id, reason) {
    return client.patch(API_UNBAN_USER(id), { reason })
  },
  updateUserRole(id, data) {
    return client.put(API_ROLE(id), data)
  },
  getUsersStat() {
    return client.get(API_GET_USERS_STATS)
  }
})

export const usersApi = createUsersApi(axiosClient)
