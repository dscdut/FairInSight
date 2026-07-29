export type DocumentStatus = 'ACTIVE' | 'EXPIRED' | 'REPLACED'

export type LegalField =
  | 'all'
  | 'civil'
  | 'enterprise'
  | 'administrative'
  | 'criminal'
  | 'labor'
  | 'tax'
  | 'land'
  | 'environment'

export type DocumentType =
  | 'law'
  | 'decree'
  | 'circular'
  | 'resolution'
  | 'decision'

export type IssuingAgency =
  | 'national-assembly'
  | 'government'
  | 'ministry'
  | 'peoples-committee'
  | 'supreme-court'

export type SortOption = 'relevance' | 'newest' | 'oldest' | 'most-viewed'

export interface LegalDocument {
  id: string
  title: string
  code: string
  summary: string
  documentType: DocumentType
  issuingAgency: string
  issueDate: string
  effectiveDate: string
  updatedDate: string
  status: DocumentStatus
  categories: string[]
  content: string
  viewCount?: number
  isBookmarked?: boolean
}

export interface LegalDocumentFilters {
  search: string
  field: LegalField
  status: DocumentStatus | 'all'
  documentType: DocumentType | 'all'
  issuingAgency: IssuingAgency | 'all'
  fromDate: string
  toDate: string
  sort: SortOption
  page: number
  pageSize: number
}

export interface LegalDocumentListResponse {
  data: LegalDocument[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface TocItem {
  id: string
  label: string
  level: 'chapter' | 'article' | 'clause' | 'point'
  children?: TocItem[]
}
