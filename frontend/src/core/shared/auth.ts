import { getAccessTokenFromLS, getRefreshTokenFromLS } from '@/core/shared/storage'
import { type AuthState } from '@/core/store/features/auth/types'

export const getPersistedAuth = (): Partial<AuthState> => {
  const access_token = getAccessTokenFromLS()
  const refresh_token = getRefreshTokenFromLS()

  return access_token ? { access_token, refresh_token, user: null, isAuthenticated: true } : {}
}

export const isAuthenticated = (): boolean => !!getPersistedAuth().access_token
export const getCurrentUser = () => null
