// Axios client cho AI backend_reasoning (cổng 8000). Tách khỏi axiosClient (Node :3000)
// để trang tra cứu văn bản (/legal) lấy luật từ AI/Supabase. Tự unwrap .data +
// gắn Bearer token như client chính, VÀ tự refresh token khi 401 (token Node sống 15m).
import axios, { HttpStatusCode } from 'axios'

import config from '@/core/configs/env'
import isEqual from '@/core/configs/is-equal'
import { authApi } from '@/core/services/auth.service'
import { forceLogout } from '@/core/shared/auth-refresh'
import {
  getAccessTokenFromLS,
  getRefreshTokenFromLS,
  setAccessTokenToLS,
  setRefreshTokenToLS
} from '@/core/shared/storage'

// Hàng đợi refresh: nhiều request 401 cùng lúc → chỉ refresh 1 lần, các request khác
// chờ token mới rồi retry (giống axios-client.ts của Node).
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

    // Token AI là token Node phát (sống 15m). Hết hạn → AI BE verify fail → 401.
    // Bắt 401 (1 lần/request) → refresh bằng refresh_token → retry. KHÔNG refresh cho
    // chính request refresh (tránh lặp vô hạn).
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
          forceLogout() // không còn refresh token → đá về /login
          return Promise.reject(error)
        }

        // Node BE rotate token: lưu CẢ refresh token mới (xem axios-client.ts).
        const { accessToken, refreshToken } = await authApi.refreshToken(refresh_token)
        setAccessTokenToLS(accessToken)
        if (refreshToken) setRefreshTokenToLS(refreshToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)
        return aiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        forceLogout() // refresh token hết 7 ngày / bị revoke → đá về /login
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default aiClient
