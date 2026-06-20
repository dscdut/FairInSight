// Axios client cho AI backend_reasoning (cổng 8000). Tách khỏi axiosClient (Node :3000)
// để trang tra cứu văn bản (/legal) lấy 392 luật từ AI/Supabase. Tự unwrap .data +
// gắn Bearer token như client chính.
import axios from 'axios'

import config from '@/core/configs/env'
import { getAccessTokenFromLS } from '@/core/shared/storage'

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
  (error) => Promise.reject(error)
)

export default aiClient
