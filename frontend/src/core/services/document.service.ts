import { type AxiosInstance } from 'axios'

import axiosClient from '@/core/services/axios-client'

export interface UserDocument {
  id: string
  user_id: string
  template_id: string
  content: any
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
    const res = (await client.get('/documents')) as any
    return res || []
  },
  async getDocumentById(id: string): Promise<UserDocument> {
    const res = (await client.get(`/documents/${id}`)) as any
    return res
  },
  async saveDocument(data: {
    templateId: string
    content: any
    isDraft: boolean
    documentId?: string
    fileUrl?: string | null
    html?: string
  }): Promise<UserDocument> {
    const res = (await client.post('/documents', data)) as any
    return res
  },
  async deleteDocument(id: string): Promise<any> {
    const res = (await client.delete(`/documents/${id}`)) as any
    return res
  }
})

export const documentApi = createDocumentApi(axiosClient)
