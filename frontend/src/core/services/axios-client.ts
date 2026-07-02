import axios, { HttpStatusCode } from 'axios'

import { queryClient } from '@/app/providers/query-provider'
import { AUTH_ENDPOINTS } from '@/core/configs/consts'
import config from '@/core/configs/env'
import isEqual from '@/core/configs/is-equal'
import { ROUTE } from '@/core/constants/path'
import { forceLogout, doRefresh } from '@/core/shared/auth-refresh'
import {
  clearLS,
  getAccessTokenFromLS,
  getRefreshTokenFromLS
} from '@/core/shared/storage'
import { useAuthStore } from '@/core/store/features/auth/authStore'

const controllers = new Map<string, AbortController>()
let isRefreshing = false
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }[] = []

export const handleBannedUser = (reason: string | null = null, bannedAt: string | null = null) => {
  clearLS()
  useAuthStore.getState().logout()
  try {
    queryClient.clear()
  } catch (e) {
    console.error('Failed to clear React Query cache', e)
  }
  const reasonParam = reason ? encodeURIComponent(reason) : ''
  const atParam = bannedAt ? encodeURIComponent(bannedAt) : ''
  window.location.href = `${ROUTE.AUTH.BANNED}?reason=${reasonParam}&at=${atParam}`
}

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

const axiosClient = axios.create({
  baseURL: config.baseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

axiosClient.interceptors.request.use(
  (config) => {
    if (config.url) {
      const prevController = controllers.get(config.url)
      if (prevController) {
        prevController.abort()
      }
    }

    const controller = new AbortController()
    config.signal = controller.signal

    if (config.url) {
      controllers.set(config.url, controller)
    }

    const token = getAccessTokenFromLS()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    if (response.config.url) {
      controllers.delete(response.config.url)
    }

    // Check if response indicates user is banned (only for current user profile/auth requests)
    const dataObj = response.data as any
    const user = dataObj?.data?.user || dataObj?.user
    const userStatus = user?.status || dataObj?.data?.status || dataObj?.status
    const isMeRequest = response.config.url && (
      response.config.url.includes('/auth/me') ||
      response.config.url.includes('/auth/login') ||
      response.config.url.includes('/auth/refresh-token')
    )
    if (isMeRequest && (userStatus === 'BANNED' || userStatus === 'banned')) {
      handleBannedUser(
        user?.banReason || dataObj?.data?.banReason || dataObj?.banReason,
        user?.bannedAt || dataObj?.data?.bannedAt || dataObj?.bannedAt
      )
      return new Promise(() => {}) // Block execution
    }

    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    // Check if error response indicates user is banned (only for current user profile/auth requests)
    const errorStatus = error.response?.status
    const errorData = error.response?.data as any
    const errorMessage = errorData?.message || ''
    const isMeRequest = originalRequest?.url && (
      originalRequest.url.includes('/auth/me') ||
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/refresh-token')
    )

    if (
      isMeRequest &&
      (errorStatus === 403 ||
      errorStatus === 401 ||
      errorMessage.toLowerCase().includes('banned') ||
      errorData?.status === 'BANNED' ||
      errorData?.status === 'banned')
    ) {
      if (
        errorMessage.toLowerCase().includes('banned') ||
        errorData?.status === 'BANNED' ||
        errorData?.status === 'banned' ||
        errorData?.code === 'BANNED'
      ) {
        handleBannedUser(
          errorData?.banReason || errorData?.reason || 'Tài khoản đã bị khóa',
          errorData?.bannedAt || errorData?.banTime
        )
        return new Promise(() => {}) // Block execution
      }
    }

    // Check if the request is an auth request (login, register...)
    const isAuthRequest = AUTH_ENDPOINTS.some(
      (endpoint) => originalRequest.url && originalRequest.url.includes(endpoint)
    )

    // Only refresh token if it's not an auth request
    if (
      error.response &&
      isEqual(error.response.status, HttpStatusCode.Unauthorized) &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refresh_token = getRefreshTokenFromLS()
        if (!refresh_token) {
          processQueue(new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại'), null)
          forceLogout() // không còn refresh token → đá về /login
          return Promise.reject(error)
        }

        const accessToken = await doRefresh()
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)
        return axiosClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    if (originalRequest?.url) {
      controllers.delete(originalRequest.url)
    }

    return Promise.reject(error)
  }
)

export default axiosClient
