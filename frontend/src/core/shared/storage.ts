import {
  ACCESS_TOKEN_LOCAL_STORAGE_KEY,
  REFRESH_TOKEN_LOCAL_STORAGE_KEY,
  USER_LOCAL_STORAGE_KEY
} from '@/core/helpers/common'
// import { type Account } from '@/models/interface/auth.interface'
import { type UserResponseType } from '@/models/interface/user.interface'

export const LocalStorageEventTarget = new EventTarget()
const AI_SESSION_TOKEN_PREFIX = 'legal_ai_session_token:'

export const clearAiSessionTokens = () => {
  for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = sessionStorage.key(index)
    if (key?.startsWith(AI_SESSION_TOKEN_PREFIX)) sessionStorage.removeItem(key)
  }
}
export const setAccessTokenToLS = (access_token: string) =>
  localStorage.setItem(ACCESS_TOKEN_LOCAL_STORAGE_KEY, access_token)

export const setRefreshTokenToLS = (refresh_token: string) =>
  localStorage.setItem(REFRESH_TOKEN_LOCAL_STORAGE_KEY, refresh_token)

export const setToken = (access_token: string, refresh_token: string) => {
  localStorage.setItem(ACCESS_TOKEN_LOCAL_STORAGE_KEY, access_token)
  localStorage.setItem(REFRESH_TOKEN_LOCAL_STORAGE_KEY, refresh_token)
}

export const clearLS = () => {
  localStorage.removeItem(ACCESS_TOKEN_LOCAL_STORAGE_KEY)
  localStorage.removeItem(REFRESH_TOKEN_LOCAL_STORAGE_KEY)
  localStorage.removeItem(USER_LOCAL_STORAGE_KEY)
  clearAiSessionTokens()
  const clearLSEvent = new Event('clearLS')
  LocalStorageEventTarget.dispatchEvent(clearLSEvent)
}

export const getAccessTokenFromLS = () => localStorage.getItem(ACCESS_TOKEN_LOCAL_STORAGE_KEY) || ''

export const getRefreshTokenFromLS = () => localStorage.getItem(REFRESH_TOKEN_LOCAL_STORAGE_KEY) || ''

export const getUserFromLocalStorage = (): UserResponseType | null => {
  return null
}

export const removeAccessTokenFromLS = () => localStorage.removeItem(ACCESS_TOKEN_LOCAL_STORAGE_KEY)

export const setUserToLS = (_user: UserResponseType) => {}

export const removeRefreshTokenFromLS = () => localStorage.removeItem(REFRESH_TOKEN_LOCAL_STORAGE_KEY)
