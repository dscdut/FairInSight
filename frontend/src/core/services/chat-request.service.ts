import { type AxiosInstance } from 'axios'

import axiosClient from '@/core/services/axios-client'

export interface ChatRequestItem {
  id: string
  user_id: string
  lawyer_id: string
  analysis_id: string | null
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'RESCHEDULED' | 'COMPLETED'
  proposed_date: string | null
  reschedule_reason: string | null
  advice_summary: string | null
  created_at: string
  updated_at: string
  users?: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  }
  analysis?: {
    id: string
    context_summary: string | null
    result: string | null
    input_data: any
    created_at: string
  }
}

export const createChatRequestApi = (client: AxiosInstance) => ({
  async createChatRequest(data: { lawyerId: string; analysisId: string }): Promise<ChatRequestItem> {
    const res = (await client.post('/chat-requests', data)) as ChatRequestItem
    return res
  },
  async getReceivedRequests(): Promise<ChatRequestItem[]> {
    const res = (await client.get('/chat-requests/received')) as ChatRequestItem[]
    return res || []
  },
  async getSentRequests(): Promise<ChatRequestItem[]> {
    const res = (await client.get('/chat-requests/sent')) as ChatRequestItem[]
    return res || []
  },
  async updateRequestStatus(
    id: string,
    data: {
      status: 'ACCEPTED' | 'REJECTED' | 'RESCHEDULED' | 'COMPLETED'
      proposedDate?: string
      rescheduleReason?: string
      adviceSummary?: string
    }
  ): Promise<ChatRequestItem> {
    const res = (await client.patch(`/chat-requests/${id}`, data)) as ChatRequestItem
    return res
  }
})

export const chatRequestApi = createChatRequestApi(axiosClient)
