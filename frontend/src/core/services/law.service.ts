import { type AxiosInstance } from 'axios'

import axiosClient from '@/core/services/axios-client'
import { type Law, type LawVersion } from '@/models/types/law.type'

export interface LawListResponse {
  items: Law[]
  pagination: {
    page: number
    size: number
    total: number
    totalPages: number
  }
}

export interface CloudinaryPresignResponse {
  signature: string
  timestamp: number
  cloudName: string
  apiKey: string
  folder: string
}

export interface ParseDocxResponse {
  text: string
<<<<<<< HEAD
  messages: unknown[]
}

// Backend response types
interface BackendUser {
  full_name?: string
}

interface BackendLawVersion {
  id: string
  law_id: string
  version: string
  title: string
  content: string
  document_number: string
  issued_date: string
  effective_date: string
  source_url: string
  official_url?: string | null
  change_note: string | null
  user_id: string
  users?: BackendUser
  created_at: string
}

interface BackendLaw {
  id: string
  title: string
  content: string
  document_number: string
  issued_date: string
  effective_date: string
  source_url: string
  official_url?: string | null
  status: 'ACTIVE' | 'INACTIVE'
  user_id: string
  created_at: string
  updated_at: string
  users?: BackendUser
  law_versions?: BackendLawVersion[]
}

interface BackendLawListResponse {
  items?: BackendLaw[]
  pagination?: {
    page: number
    size: number
    total: number
    totalPages: number
  }
}

// Map single version from backend model
function mapVersionFromBackend(v: BackendLawVersion): LawVersion {
=======
  messages: any[]
}

// Map single version from backend model
function mapVersionFromBackend(v: any): LawVersion {
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
  return {
    id: v.id,
    lawId: v.law_id,
    version: v.version,
    title: v.title,
    content: v.content,
    documentNumber: v.document_number,
    issuedDate: v.issued_date,
    effectiveDate: v.effective_date,
    sourceUrl: v.source_url,
    officialUrl: v.official_url || undefined,
    changeNote: v.change_note,
    userId: v.user_id,
    authorName: v.users?.full_name || 'Hệ thống',
    createdAt: v.created_at
  }
}

// Map law model from backend
<<<<<<< HEAD
function mapLawFromBackend(l: BackendLaw): Law {
=======
function mapLawFromBackend(l: any): Law {
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
  const versions = l.law_versions ? l.law_versions.map(mapVersionFromBackend) : []
  return {
    id: l.id,
    title: l.title,
    content: l.content,
    documentNumber: l.document_number,
    issuedDate: l.issued_date,
    effectiveDate: l.effective_date,
    sourceUrl: l.source_url,
    officialUrl: l.official_url || undefined,
    status: l.status,
    userId: l.user_id,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
    authorName: l.users?.full_name || 'Hệ thống',
    versions
  }
}

export const createLawApi = (client: AxiosInstance) => ({
  async listLaws(params: { page?: number; size?: number; search?: string; status?: string; issuedDate?: string }) {
<<<<<<< HEAD
    const res = (await client.get('/laws', { params })) as BackendLawListResponse
=======
    const res = (await client.get('/laws', { params })) as any
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
    return {
      items: (res.items || []).map(mapLawFromBackend),
      pagination: res.pagination || { page: 1, size: 10, total: 0, totalPages: 1 }
    } as LawListResponse
  },
  async getLawById(id: string) {
<<<<<<< HEAD
    const res = (await client.get(`/laws/${id}`)) as BackendLaw
=======
    const res = (await client.get(`/laws/${id}`)) as any
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
    return mapLawFromBackend(res)
  },
  async createLaw(params: {
    title: string
    documentNumber: string
    issuedDate: string
    effectiveDate: string
    sourceUrl: string
    officialUrl: string
    content: string
  }) {
    const payload = {
      title: params.title,
      documentNumber: params.documentNumber,
      issuedDate: params.issuedDate,
      effectiveDate: params.effectiveDate,
      sourceUrl: params.sourceUrl,
      officialUrl: params.officialUrl,
      content: params.content
    }
<<<<<<< HEAD
    const res = (await client.post('/laws', payload)) as BackendLaw
=======
    const res = (await client.post('/laws', payload)) as any
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
    return mapLawFromBackend(res)
  },
  async updateLaw(
    id: string,
    params: {
      title: string
      documentNumber: string
      issuedDate: string
      effectiveDate: string
      sourceUrl: string
      officialUrl: string
      content: string
      changeNote: string
    }
  ) {
    const payload = {
      title: params.title,
      documentNumber: params.documentNumber,
      issuedDate: params.issuedDate,
      effectiveDate: params.effectiveDate,
      sourceUrl: params.sourceUrl,
      officialUrl: params.officialUrl,
      content: params.content,
      changeNote: params.changeNote
    }
<<<<<<< HEAD
    const res = (await client.put(`/laws/${id}`, payload)) as BackendLaw
    return mapLawFromBackend(res)
  },
  async toggleStatus(id: string, params: { status: 'ACTIVE' | 'INACTIVE'; reason?: string }) {
    const res = (await client.patch(`/laws/${id}/status`, params)) as BackendLaw
    return mapLawFromBackend(res)
  },
  async listVersions(id: string) {
    const res = (await client.get(`/laws/${id}/versions`)) as BackendLawVersion[]
    return (res || []).map(mapVersionFromBackend) as LawVersion[]
  },
  async restoreVersion(id: string, versionId: string) {
    const res = (await client.post(`/laws/${id}/versions/${versionId}/restore`)) as BackendLaw
    return mapLawFromBackend(res)
  },
  async parseDocx(fileUrl: string) {
    const res = (await client.post('/laws/parse-docx', { fileUrl })) as ParseDocxResponse
=======
    const res = (await client.put(`/laws/${id}`, payload)) as any
    return mapLawFromBackend(res)
  },
  async toggleStatus(id: string, params: { status: 'ACTIVE' | 'INACTIVE'; reason?: string }) {
    const res = (await client.patch(`/laws/${id}/status`, params)) as any
    return mapLawFromBackend(res)
  },
  async listVersions(id: string) {
    const res = (await client.get(`/laws/${id}/versions`)) as any
    return (res || []).map(mapVersionFromBackend) as LawVersion[]
  },
  async restoreVersion(id: string, versionId: string) {
    const res = (await client.post(`/laws/${id}/versions/${versionId}/restore`)) as any
    return mapLawFromBackend(res)
  },
  async parseDocx(fileUrl: string) {
    const res = (await client.post('/laws/parse-docx', { fileUrl })) as any
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
    return res as ParseDocxResponse
  },
  async uploadFile(file: File, folder = 'laws') {
    const formData = new FormData()
    formData.append('file', file)
    const res = (await client.post('/uploads', formData, {
      params: { folder },
      headers: {
        'Content-Type': 'multipart/form-data'
      }
<<<<<<< HEAD
    })) as unknown
=======
    })) as any
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
    return (Array.isArray(res) ? res[0] : res) as { url: string; publicId: string }
  }
})

export const lawApi = createLawApi(axiosClient)
