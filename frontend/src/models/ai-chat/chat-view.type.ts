import { type Lawyer } from '@/models/types/case.types'

import {
  type ChatAvailableAction,
  type ChatBillingResult,
  type ChatCitation,
  type ChatMessageStatus,
  type ChatLawyerHandoff,
  type ChatReport,
  type ChatWorkflowStage,
  type ChatUsageSummary
} from './contracts'

export interface ChatMessageView {
  id: string
  sender: 'user' | 'ai'
  content: string
  timestamp: string
  lawyers?: Lawyer[]
  mode?: string | null
  citations?: ChatCitation[]
  status?: ChatMessageStatus
  availableActions?: ChatAvailableAction[]
  report?: ChatReport | null
  handoff?: ChatLawyerHandoff | null
  stage?: ChatWorkflowStage | null
  billing?: ChatBillingResult | null
  usage?: ChatUsageSummary | null
}

export interface ChatSessionView {
  id: string
  title: string
  date: string
  messages: ChatMessageView[]
  aiSessionId?: string | null
  aiSessionToken?: string | null
  lastMessageStatus?: ChatMessageStatus | null
  detailLoaded?: boolean
}
