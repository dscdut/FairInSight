// Axios client cho các API AI qua Node BE. FE không gọi AI service trực tiếp;
// Node proxy tại /ai giữ một origin/auth boundary, rồi gọi AI phía sau.
import axios, { HttpStatusCode } from 'axios'

import config from '@/core/configs/env'
import isEqual from '@/core/configs/is-equal'
import { forceLogout, doRefresh } from '@/core/shared/auth-refresh'
import {
  getAccessTokenFromLS,
  getRefreshTokenFromLS
} from '@/core/shared/storage'

// Hàng đợi refresh: nhiều request 401 cùng lúc chỉ refresh 1 lần,
// các request khác chờ token mới rồi retry.
let isRefreshing = false
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

const aiClient = axios.create({
  baseURL: config.aiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
})

aiClient.interceptors.request.use((cfg) => {
  const token = getAccessTokenFromLS()
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

aiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config
    const isRefreshCall = originalRequest?.url?.includes('refresh')
    if (
      error.response &&
      isEqual(error.response.status, HttpStatusCode.Unauthorized) &&
      !originalRequest?._retry &&
      !isRefreshCall
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return aiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refresh_token = getRefreshTokenFromLS()
        if (!refresh_token) {
          processQueue(new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại'), null)
          forceLogout()
          return Promise.reject(error)
        }

        const accessToken = await doRefresh()
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)
        return aiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default aiClient
