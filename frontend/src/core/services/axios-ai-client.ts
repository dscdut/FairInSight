import axios from 'axios'

import config from '@/core/configs/env'
import { getAccessTokenFromLS } from '@/core/shared/storage'

const axiosAiClient = axios.create({
  baseURL: config.aiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for propagating Authorization token
axiosAiClient.interceptors.request.use(
  (config) => {
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

// Response interceptor to extract data directly
axiosAiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default axiosAiClient
