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

export interface Point {
  id: string
  title: string
  content: string
  isUpdated?: boolean
}

export interface Clause {
  id: string
  title: string
  content?: string
  points?: Point[]
  isUpdated?: boolean
}

export interface Article {
  id: string
  title: string
  clauses?: Clause[]
  isUpdated?: boolean
}

export interface Chapter {
  id: string
  title: string
  articles?: Article[]
  isUpdated?: boolean
}

export interface LawRelation {
  type: 'huongdan_apdung' | 'quydinh_chitiet' | 'hopnhat' | 'suadoi_bosung' | 'dinhchinh' | 'thaythe'
  flow: 'incoming' | 'outgoing'
  title: string
  url?: string
}

export interface LawFile {
  name: string
  size: string
  date: string
}

export interface Law {
  id: string
  title: string
  content: string
  docType?: string
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
  chapters?: Chapter[]
  nganh?: string
  linhVuc?: string
  chucDanh?: string
  loaiVanBan?: string
  nguoiKy?: string
  ngayHetHieuLuc?: string
  pdfFile?: LawFile
  docxFile?: LawFile
  relations?: LawRelation[]
}
