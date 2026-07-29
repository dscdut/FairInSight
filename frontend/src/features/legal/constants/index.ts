import type { DocumentStatus, DocumentType, IssuingAgency, LegalField, SortOption } from '../types'

export const LEGAL_FIELDS: { value: LegalField; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'civil', label: 'Dân sự' },
  { value: 'enterprise', label: 'Doanh nghiệp' },
  { value: 'administrative', label: 'Hành chính' },
  { value: 'criminal', label: 'Hình sự' },
  { value: 'labor', label: 'Lao động' },
  { value: 'tax', label: 'Thuế' },
  { value: 'land', label: 'Đất đai' },
  { value: 'environment', label: 'Môi trường' },
]

export const DOCUMENT_STATUSES: { value: DocumentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Còn hiệu lực' },
  { value: 'EXPIRED', label: 'Hết hiệu lực' },
  { value: 'REPLACED', label: 'Đã thay thế' },
]

export const DOCUMENT_TYPES: { value: DocumentType | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'law', label: 'Luật' },
  { value: 'decree', label: 'Nghị định' },
  { value: 'circular', label: 'Thông tư' },
  { value: 'resolution', label: 'Nghị quyết' },
  { value: 'decision', label: 'Quyết định' },
]

export const ISSUING_AGENCIES: { value: IssuingAgency | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'national-assembly', label: 'Quốc hội' },
  { value: 'government', label: 'Chính phủ' },
  { value: 'ministry', label: 'Bộ, ngành' },
  { value: 'peoples-committee', label: 'Ủy ban nhân dân' },
  { value: 'supreme-court', label: 'Tòa án nhân dân tối cao' },
]

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Liên quan' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'most-viewed', label: 'Xem nhiều nhất' },
]

export const DEFAULT_FILTERS = {
  search: '',
  field: 'all' as LegalField,
  status: 'all' as 'all',
  documentType: 'all' as 'all',
  issuingAgency: 'all' as 'all',
  fromDate: '',
  toDate: '',
  sort: 'newest' as SortOption,
  page: 1,
  pageSize: 10,
}

export const PAGE_SIZE = 10
