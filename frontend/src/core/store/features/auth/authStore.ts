import { create } from 'zustand'

import { queryClient } from '@/app/providers/query-provider'
import { getPersistedAuth } from '@/core/shared/auth'
import { clearTokenRefresh, scheduleTokenRefresh } from '@/core/shared/auth-refresh'
import { clearLS, setToken } from '@/core/shared/storage'
import { type LoginResponse } from '@/models/interface/auth.interface'

import { type AuthState, type AuthStore } from './types'

const initialState: AuthState = {
  user: null,
  access_token: null,
  refresh_token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
}

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,
  ...getPersistedAuth(),

  loginStart: () => {
    set({
      isLoading: true,
      error: null
    })
  },

  loginSuccess: (data: LoginResponse) => {
    if (data?.accessToken && data?.refreshToken) {
      setToken(data.accessToken, data.refreshToken)
    }
    set({
      isLoading: false,
      isAuthenticated: true,
      user: data?.user,
      access_token: data?.accessToken,
      refresh_token: data?.refreshToken,
      error: null
    })
    scheduleTokenRefresh() // proactive: hẹn tự refresh trước khi access token hết hạn
  },

  loginFailure: (error: string) => {
    set({
      isLoading: false,
      error
    })
  },

  logout: () => {
    clearTokenRefresh() // hủy timer proactive
    clearLS()
    queryClient.clear()
    set({
      ...initialState
    })
  },

  registerStart: () => {
    set({
      isLoading: true,
      error: null
    })
  },

  registerSuccess: () => {
    set({
      isLoading: false,
      error: null
    })
  },

  registerFailure: (error: string) => {
    set({
      isLoading: false,
      error
    })
  },

  updateUser: (user: LoginResponse['user']) => {
    set({
      user
    })
  }
}))
