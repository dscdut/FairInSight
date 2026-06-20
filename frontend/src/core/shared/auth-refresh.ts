// Auth refresh trung tâm: proactive (timer theo exp) + lưới reactive (401 ở client).
// Dùng axios RAW (không qua axios-client/ai-client) để tránh vòng lặp interceptor.
import axios from 'axios'

import config from '@/core/configs/env'
import { LOGIN_ROUTE } from '@/core/configs/consts'
import {
  clearLS,
  getAccessTokenFromLS,
  getRefreshTokenFromLS,
  setAccessTokenToLS,
  setRefreshTokenToLS
} from '@/core/shared/storage'

// Refresh KHI access token còn <= ngưỡng này (giây). 75s: an toàn cho lệch giờ + RTT.
const REFRESH_BEFORE_SEC = 75
let refreshTimer: ReturnType<typeof setTimeout> | null = null
// Chống refresh chồng (timer + nhiều 401 cùng lúc gọi doRefresh): chia sẻ 1 promise.
let inflight: Promise<string> | null = null

/** Giải mã payload JWT (base64url) → object. null nếu hỏng. KHÔNG cần lib jwt-decode. */
function decodeJwt(token: string): { exp?: number } | null {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

/** Giây còn lại tới khi access token hết hạn. Infinity nếu không đọc được exp. */
export function secondsUntilExpiry(token: string): number {
  const decoded = decodeJwt(token)
  if (!decoded?.exp) return Number.POSITIVE_INFINITY
  return decoded.exp - Math.floor(Date.now() / 1000)
}

/** Đăng xuất + đá về /login (refresh token hết / refresh fail). */
export function forceLogout(): void {
  clearTokenRefresh()
  clearLS()
  if (window.location.pathname !== LOGIN_ROUTE) {
    window.location.href = LOGIN_ROUTE
  }
}

/**
 * Gọi /auth/refresh-token → lưu CẢ access + refresh token mới (Node BE rotate token).
 * Trả access token mới. Nhiều nơi gọi đồng thời chỉ chạy 1 request (inflight). Sau khi
 * có token mới → đặt lại timer proactive. Lỗi → forceLogout + throw.
 */
export async function doRefresh(): Promise<string> {
  if (inflight) return inflight
  inflight = (async () => {
    const refresh_token = getRefreshTokenFromLS()
    if (!refresh_token) {
      forceLogout()
      throw new Error('Không có refresh token')
    }
    try {
      // axios RAW tới Node BE (config.baseUrl) — KHÔNG qua axios-client (tránh vòng lặp).
      const res = await axios.post(
        `${config.baseUrl}/auth/refresh-token`,
        { refresh_token },
        { headers: { 'Content-Type': 'application/json' } }
      )
      const data = res.data?.data ?? res.data
      const accessToken: string = data.accessToken
      const refreshToken: string | undefined = data.refreshToken
      if (!accessToken) throw new Error('Refresh response thiếu accessToken')
      setAccessTokenToLS(accessToken)
      if (refreshToken) setRefreshTokenToLS(refreshToken)
      scheduleTokenRefresh() // hẹn lại theo exp token mới
      return accessToken
    } catch (err) {
      forceLogout() // refresh token hết 7 ngày / bị revoke → đá ra login
      throw err
    }
  })()
  try {
    return await inflight
  } finally {
    inflight = null
  }
}

/**
 * PROACTIVE: hẹn timer tự refresh khi access token còn ~75s. Gọi lúc app mount (nếu có
 * token) + sau login. Clear timer cũ trước khi đặt mới (tránh nhiều timer). Nếu token đã
 * sắp/đã hết → refresh ngay.
 */
export function scheduleTokenRefresh(): void {
  clearTokenRefresh()
  const token = getAccessTokenFromLS()
  if (!token) return
  const remain = secondsUntilExpiry(token)
  if (remain === Number.POSITIVE_INFINITY) return // không đọc được exp → để reactive lo
  const delayMs = Math.max(0, (remain - REFRESH_BEFORE_SEC) * 1000)
  refreshTimer = setTimeout(() => {
    void doRefresh().catch(() => {
      /* doRefresh đã forceLogout khi lỗi */
    })
  }, delayMs)
}

/** Hủy timer (logout). */
export function clearTokenRefresh(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}
