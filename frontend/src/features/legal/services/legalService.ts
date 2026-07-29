import type { LegalDocument, LegalDocumentFilters, LegalDocumentListResponse } from '../types'
import { MOCK_DOCUMENT_DETAIL, MOCK_LEGAL_DOCUMENTS } from '../utils/mockData'
import { PAGE_SIZE } from '../constants'

const applyFilters = (docs: LegalDocument[], filters: Partial<LegalDocumentFilters>): LegalDocument[] => {
  let result = [...docs]

  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q)
    )
  }

  if (filters.status && filters.status !== 'all') {
    result = result.filter((d) => d.status === filters.status)
  }

  if (filters.documentType && filters.documentType !== 'all') {
    result = result.filter((d) => d.documentType === filters.documentType)
  }

  if (filters.fromDate) {
    result = result.filter((d) => new Date(d.issueDate) >= new Date(filters.fromDate!))
  }

  if (filters.toDate) {
    result = result.filter((d) => new Date(d.issueDate) <= new Date(filters.toDate!))
  }

  if (filters.sort === 'newest') {
    result.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
  } else if (filters.sort === 'oldest') {
    result.sort((a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime())
  } else if (filters.sort === 'most-viewed') {
    result.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
  }

  return result
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const legalService = {
  async getDocuments(filters: Partial<LegalDocumentFilters>): Promise<LegalDocumentListResponse> {
    await delay(600)
    const filtered = applyFilters(MOCK_LEGAL_DOCUMENTS, filters)
    const page = filters.page || 1
    const limit = filters.pageSize || PAGE_SIZE
    const start = (page - 1) * limit
    const end = start + limit
    const data = filtered.slice(start, end)
    return {
      data,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    }
  },

  async getDocumentById(id: string): Promise<LegalDocument> {
    await delay(400)
    const found = MOCK_LEGAL_DOCUMENTS.find((d) => d.id === id)
    if (!found) throw new Error('Document not found')
    if (id === '1') return { ...MOCK_DOCUMENT_DETAIL }
    return { ...found, content: MOCK_DOCUMENT_DETAIL.content }
  },
}
