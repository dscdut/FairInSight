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

const API_DOCUMENTS = '/documents'
const API_DOCUMENT_DETAIL = (id: string) => `/documents/${id}`
const API_DRAFTS = '/drafts'
const API_DRAFT_DETAIL = (id: string) => `/drafts/${id}`

export const createDocumentApi = (client: AxiosInstance) => ({
  async listDocuments(): Promise<UserDocument[]> {
    const res = (await client.get(API_DOCUMENTS)) as UserDocument[]
    return res || []
  },
  async getDocumentById(id: string): Promise<UserDocument> {
    const res = (await client.get(API_DOCUMENT_DETAIL(id))) as UserDocument
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
    const res = (await client.post(API_DOCUMENTS, data)) as UserDocument
    return res
  },
  async saveDraft(data: {
    templateId: string
    content: Record<string, unknown>
  }): Promise<UserDocument> {
    const res = (await client.post(API_DRAFTS, data)) as UserDocument
    return res
  },
  async listDrafts(): Promise<UserDocument[]> {
    const res = (await client.get(API_DRAFTS)) as UserDocument[]
    return res || []
  },
  async getDraftById(id: string): Promise<UserDocument> {
    const res = (await client.get(API_DRAFT_DETAIL(id))) as UserDocument
    return res
  },
  async updateDraft(id: string, data: {
    content: Record<string, unknown>
  }): Promise<UserDocument> {
    const res = (await client.put(API_DRAFT_DETAIL(id), data)) as UserDocument
    return res
  },
  async deleteDraft(id: string): Promise<unknown> {
    const res = (await client.delete(API_DRAFT_DETAIL(id))) as unknown
    return res
  },
  async deleteDocument(id: string): Promise<unknown> {
    const res = (await client.delete(API_DOCUMENT_DETAIL(id))) as unknown
    return res
  }
})

export const documentApi = createDocumentApi(axiosClient)
