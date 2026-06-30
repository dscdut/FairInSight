import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { handleError } from '@/core/helpers/error-handler'
import { MUTATION_KEYS, QUERY_KEYS } from '@/core/helpers/key-tanstack'
import toastifyCommon from '@/core/lib/toastify-common'
import { usersApi } from '@/core/services/users.service'
import { type UsersListResponse } from '@/models/user/interfaces'
import { type UserRole } from '@/models/user/types'

export const useUsers = (params?: {
    page?: number
    size?: number
    roleName?: string
    status?: string
    search?: string
}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.users, params],
    queryFn: ({ signal }) => {
      const formattedParams = {
        page: params?.page,
        size: params?.size,
        roleName: params?.roleName === 'Tất cả' || params?.roleName === '' ? undefined : params?.roleName,
        status: params?.status === 'Tất cả' || params?.status === '' ? undefined : params?.status,
        search: params?.search || undefined
      }
      return usersApi.getUsers(formattedParams, { signal })
    },
    placeholderData: (prev) => prev,
    staleTime: 30000,
  })
}

export const useUsersStat = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.usersStat],
    queryFn: () => usersApi.getUsersStat(),
    staleTime: 30000,
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MUTATION_KEYS.deleteUser],
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: (_, variables) => {
      toastifyCommon.success('Xóa tài khoản thành công')
      queryClient.setQueriesData<UsersListResponse>({ queryKey: [QUERY_KEYS.users] }, (oldData) => {
        if (!oldData) return oldData
        const newItems = oldData.data.items.filter((user) => user.id !== variables)
        const newTotal = Math.max(0, oldData.data.pagination.total - 1)
        const newTotalPages = Math.ceil(newTotal / oldData.data.pagination.size)
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: newItems,
            pagination: {
              ...oldData.data.pagination,
              total: newTotal,
              totalPages: newTotalPages
            }
          }
        }
      })
    },
    onError: (error) => {
      handleError(error, 'Xóa tài khoản thất bại')
    }
  })
}

export const useBanUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MUTATION_KEYS.banUser],
    mutationFn: ({ id, reason }: { id: string; reason: string }) => usersApi.banUser(id, reason),
    onSuccess: (_, variables) => {
      toastifyCommon.success('Khóa tài khoản thành công')
      queryClient.setQueriesData<UsersListResponse>({ queryKey: [QUERY_KEYS.users] }, (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: oldData.data.items.map((user) =>
              user.id === variables.id ? { ...user, status: 'banned' } : user
            )
          }
        }
      })
    },
    onError: (error) => {
      handleError(error, 'Khóa tài khoản thất bại')
    }
  })
}

export const useUnbanUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MUTATION_KEYS.unbanUser],
    mutationFn: ({ id, reason }: { id: string; reason: string }) => usersApi.unbanUser(id, reason),
    onSuccess: (_, variables) => {
      toastifyCommon.success('Kích hoạt tài khoản thành công')
      queryClient.setQueriesData<UsersListResponse>({ queryKey: [QUERY_KEYS.users] }, (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: oldData.data.items.map((user) =>
              user.id === variables.id ? { ...user, status: 'active' } : user
            )
          }
        }
      })
    },
    onError: (error) => {
      handleError(error, 'Kích hoạt tài khoản thất bại')
    }
  })
}

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: [MUTATION_KEYS.updateUserRole],
    mutationFn: ({
      id,
      data
    }: {
      id: string
      data: {
        role: UserRole
        licenseNumber: string
        licenseIssuer: string
      }
    }) => usersApi.updateUserRole(id, data),
    onSuccess: (_, variables) => {
      toastifyCommon.success('Cập nhật vai trò thành công')
      queryClient.setQueriesData<UsersListResponse>({ queryKey: [QUERY_KEYS.users] }, (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: oldData.data.items.map((user) =>
              user.id === variables.id ? { ...user, roleName: variables.data.role } : user
            )
          }
        }
      })
    },
    onError: (error) => {
      handleError(error, 'Cập nhật vai trò thất bại')
    }
  })
}
