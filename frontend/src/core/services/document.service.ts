import { type AxiosInstance } from 'axios'

import axiosClient from '@/core/services/axios-client'

export interface UserDocument {
  id: string
  user_id: string
  template_id: string
  content: Record<string, unknown>
  file_url: string | null
  is_draft: boolean
  created_at: string
  updated_at: string
  templates?: {
    name: string
    description: string | null
  }
}

export const createDocumentApi = (client: AxiosInstance) => ({
  async listDocuments(): Promise<UserDocument[]> {
    const res = await client.get('/documents') as unknown
    return res || []
  },
  async getDocumentById(id: string): Promise<UserDocument> {
    const res = await client.get(`/documents/${id}`) as unknown
    return res
  },
  async saveDocument(data: {
    templateId: string
    content: Record<string, unknown>
    isDraft: boolean
    documentId?: string
    fileUrl?: string | null
    html?: string
  }): Promise<UserDocument> {
    const res = await client.post('/documents', data) as unknown
    return res
  },
  async deleteDocument(id: string): Promise<unknown> {
    const res = await client.delete(`/documents/${id}`) as unknown
    return res
  }
})

export const documentApi = createDocumentApi(axiosClient)
