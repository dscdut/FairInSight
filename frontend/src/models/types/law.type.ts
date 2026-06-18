export interface LawVersion {
  id: string
  lawId: string
  version: string
  title: string
  content: string
  documentNumber: string
  issuedDate: string
  effectiveDate: string
  sourceUrl: string
  officialUrl?: string
  changeNote: string | null
  userId: string
  authorName: string
  createdAt: string
}

export interface LawStatusLog {
  id: string
  lawId: string
  status: 'ACTIVE' | 'INACTIVE'
  reason: string | null
  userId: string
  authorName: string
  createdAt: string
}

export interface Law {
  id: string
  title: string
  content: string
  documentNumber: string
  issuedDate: string
  effectiveDate: string
  sourceUrl: string
  officialUrl?: string
  status: 'ACTIVE' | 'INACTIVE'
  userId: string
  createdAt: string
  updatedAt: string
  authorName: string
  versions?: LawVersion[]
}
