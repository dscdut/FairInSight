import { getRefreshTokenFromLS, getUserFromLocalStorage } from '@/core/shared/storage'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { type AuthState } from '@/core/store/features/auth/types'

export const getPersistedAuth = (): Partial<AuthState> => {
  const refresh_token = getRefreshTokenFromLS()
  const user = getUserFromLocalStorage()

  return refresh_token ? { refresh_token, user } : {}
}

export const isAuthenticated = (): boolean => !!useAuthStore.getState().isAuthenticated
export const getCurrentUser = () => useAuthStore.getState().user
