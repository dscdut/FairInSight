import { type AxiosInstance } from 'axios'

import axiosClient from '@/core/services/axios-client'

export interface AnalysisHistoryItem {
  id: string
  user_id: string
  input_data: {
    question?: string
    text?: string
    [key: string]: any
  } | null
  result: string | null
  context_summary: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export const createAnalysisApi = (client: AxiosInstance) => ({
  async getAnalysisHistory(): Promise<AnalysisHistoryItem[]> {
    const res = (await client.get('/analysis/history')) as AnalysisHistoryItem[]
    return res || []
  }
})

export const analysisApi = createAnalysisApi(axiosClient)
