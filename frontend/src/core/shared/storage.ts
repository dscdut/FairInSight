import {
  USER_LOCAL_STORAGE_KEY
} from '@/core/helpers/common'
import { type UserResponseType } from '@/models/interface/user.interface'

export const REFRESH_TOKEN_KEY = 'rt_token'

export const LocalStorageEventTarget = new EventTarget()

export const setAccessTokenToLS = (_access_token: string) => {}

export const setRefreshTokenToLS = (refresh_token: string) =>
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)

export const setToken = (_access_token: string, refresh_token: string) => {
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
}

export const clearLS = () => {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_LOCAL_STORAGE_KEY)
  const clearLSEvent = new Event('clearLS')
  LocalStorageEventTarget.dispatchEvent(clearLSEvent)
}

export const getAccessTokenFromLS = () => ''

export const getRefreshTokenFromLS = () => localStorage.getItem(REFRESH_TOKEN_KEY) || ''

export const getUserFromLocalStorage = (): UserResponseType | null => {
  const user = localStorage.getItem(USER_LOCAL_STORAGE_KEY)
  if (!user || user === 'undefined' || user === 'null') {
    return null
  }
  try {
    return JSON.parse(user)
  } catch (error) {
    localStorage.removeItem(USER_LOCAL_STORAGE_KEY)
    return null
  }
}

export const removeAccessTokenFromLS = () => {}

export const setUserToLS = (user: UserResponseType) =>
  localStorage.setItem(USER_LOCAL_STORAGE_KEY, JSON.stringify(user))

export const removeRefreshTokenFromLS = () => localStorage.removeItem(REFRESH_TOKEN_KEY)
