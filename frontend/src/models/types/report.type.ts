export type ReportType = 'SYSTEM' | 'LAWYER' | 'USER'
export type ReportCategory =
  | 'HARASSMENT'
  | 'UNPROFESSIONAL_BEHAVIOR'
  | 'FRAUD'
  | 'TECHNICAL_ERROR'
  | 'PAYMENT_ERROR'
  | 'FEATURE_ERROR'
  | 'OTHER'
export type ReportStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED'
export type ReportPriority = 'LOW' | 'NORMAL' | 'HIGH'
export type ReportMessageSenderRole = 'REPORTER' | 'ADMIN' | 'SYSTEM'

export interface ReportUser {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
  isLawyer: boolean
  lawyerStatus: string | null
  lawyerVerified: boolean
}

export interface ReportMessage {
  id: string
  reportId: string
  senderId: string | null
  senderRole: ReportMessageSenderRole
  message: string
  attachments: unknown[] | null
  createdAt: string
  sender: ReportUser | null
}

export interface ReportItem {
  id: string
  reporterId: string
  targetUserId: string | null
  type: ReportType
  category: ReportCategory
  customReason: string | null
  description: string
  status: ReportStatus
  priority: ReportPriority
  assignedAdminId: string | null
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  reporter: ReportUser | null
  targetUser: ReportUser | null
  assignedAdmin: ReportUser | null
  resolver: ReportUser | null
  messages: ReportMessage[]
}

export interface ReportPage {
  items: ReportItem[]
  pagination: {
    page: number
    size: number
    total: number
    totalPages: number
  }
}

export interface ReportStats {
  month: string
  total: number
  open: number
  inReview: number
  resolved: number
  system: number
  lawyer: number
  user: number
}

export interface CreateReportInput {
  targetUserId?: string | null
  type: ReportType
  category: ReportCategory
  customReason?: string | null
  description: string
  priority?: ReportPriority
  attachments?: unknown[] | null
}
