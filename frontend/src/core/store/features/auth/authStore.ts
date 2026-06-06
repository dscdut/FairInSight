import { create } from 'zustand'

import { getPersistedAuth } from '@/core/shared/auth'
import { clearLS, setToken, setUserToLS } from '@/core/shared/storage'
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
    if (data?.user) setUserToLS(data?.user)
  },

  loginFailure: (error: string) => {
    set({
      isLoading: false,
      error
    })
  },

  logout: () => {
    clearLS()
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
    if (user) {
      setUserToLS(user)
    }
    set({
      user
    })
  }
}))
