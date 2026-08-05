export type ChatSchemaVersion = '2.0' | '2.1' | '3.0'

export type ChatMode =
  | 'lookup'
  | 'clarification'
  | 'analysis'
  | 'insufficient_evidence'
  | 'escalation'

export type ChatMessageStatus =
  | 'processing'
  | 'waiting_user'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type ChatAvailableAction = 'export_pdf' | 'suggest_lawyer'

export interface ChatCitation {
  evidence_id?: string
  document_title?: string
  official_code?: string
  article_no?: string
  clause_no?: string
  quoted_text?: string
  source_url?: string
}

export interface ChatBillingResult {
  taskClass: string
  estimatedCredits: number
  chargedCredits: number
  refundedCredits: number
  remainingCredits: number
  status: 'NONE' | 'RESERVED' | 'SETTLED' | 'RELEASED' | 'REFUNDED' | 'SHADOW'
}

export interface ChatReportReadiness {
  reportId: string | null
  exportPdf: boolean
  suggestLawyer: boolean
  reason?:
    | 'verified_analysis_ready'
    | 'lawyer_handoff_available'
    | 'verified_analysis_not_ready'
    | null
}

export type ChatWorkflowStage =
  | 'received' | 'understanding' | 'planning' | 'retrieving'
  | 'checking_applicability' | 'researching' | 'waiting_user'
  | 'applying_law' | 'verifying' | 'writing_report' | 'completed' | 'failed'

export interface ChatReportSection {
  section_id: string
  title: string
  markdown: string
}

export interface ChatLegalPositioningReport {
  report_id: string
  version: number
  case_id: string
  title: string
  status: 'ready' | 'conditional' | 'need_user_fact' | 'need_more_law' | 'conflicted' | 'unavailable'
  case_summary: string
  user_has: string[]
  user_questions: string[]
  preliminary_position: string[]
  issue_analyses: Array<Record<string, unknown>>
  recommended_next_steps: string[]
  missing_or_disputed: string[]
  authorities: Array<Record<string, unknown>>
  limitations: string[]
  sections: ChatReportSection[]
  rendered_markdown: string
  readiness: {
    export_pdf: boolean
    suggest_lawyer: boolean
    reason: string
  }
}

export interface ChatLawyerHandoff {
  eligible: boolean
  report_id: string | null
  summary: string
  specialty_codes: string[]
  consent_required: boolean
}

export type ChatReport = ChatReportReadiness | ChatLegalPositioningReport

export const isLegalPositioningReport = (report: ChatReport | null | undefined): report is ChatLegalPositioningReport =>
  Boolean(report && 'report_id' in report && 'readiness' in report)

export const chatReportId = (report: ChatReport | null | undefined): string | null =>
  isLegalPositioningReport(report) ? report.report_id : report?.reportId ?? null

export const chatReportCanExport = (report: ChatReport | null | undefined): boolean =>
  isLegalPositioningReport(report) ? report.readiness.export_pdf : report?.exportPdf === true

export const chatReportCanSuggestLawyer = (report: ChatReport | null | undefined): boolean =>
  isLegalPositioningReport(report) ? report.readiness.suggest_lawyer : report?.suggestLawyer === true

export interface ChatUsageSummary {
  calls: number
  inputTokens: number
  outputTokens: number
  modelTimeMs: number
  models: Record<string, {
    calls: number
    in: number
    out: number
    ms?: number
  }>
  fallbackUsed: boolean
  retrievalCalls: number
  relationEdgesVisited: number
  toolCalls: number
  documentPagesProcessed: number
}

export interface ChatAiResponse {
  schema_version: ChatSchemaVersion
  session_id: string
  session_token: string | null
  assistant_message_id: string
  status: ChatMessageStatus
  stage?: ChatWorkflowStage
  case_id: string
  answer: string
  mode: ChatMode
  task_class?: 'GREETING' | 'LOOKUP' | 'GUIDED_ANALYSIS' | 'DEEP_ANALYSIS'
  missing_questions: string[]
  citations: ChatCitation[]
  confidence: number
  confidence_reasons: string[]
  warnings: string[]
  memory_saved: boolean
  latency_ms: number
  trace: Array<{
    event: string
    node: string
    latency_ms: number | null
    data: Record<string, unknown>
  }>
  available_actions: ChatAvailableAction[]
  report?: ChatReport | null
  message?: { format: 'plain_text' | 'markdown' | 'structured_report'; text: string } | null
  clarification?: { clarification_id: string; acknowledgement: string; questions: Array<{ key: string; question: string }> } | null
  handoff?: ChatLawyerHandoff | null
  trace_public?: Array<{ stage: string; status: string; latency_ms?: number | null }>
  billing?: ChatBillingResult | null
  usage?: ChatUsageSummary | null
}

export interface ChatHistoryMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  msg_type: string
  status: ChatMessageStatus
  citations: ChatCitation[]
  available_actions: ChatAvailableAction[]
  created_at: string
  report?: ChatReport | null
  stage?: ChatWorkflowStage | null
  message?: { format: 'plain_text' | 'markdown' | 'structured_report'; text: string } | null
  clarification?: { clarification_id: string; acknowledgement: string; questions: Array<{ key: string; question: string }> } | null
  handoff?: ChatLawyerHandoff | null
  trace_public?: Array<{ stage: string; status: string; latency_ms?: number | null }>
  billing?: ChatBillingResult | null
  usage?: ChatUsageSummary | null
}

export interface ChatSessionSummary {
  session_id: string
  title: string
  created_at: string
  updated_at: string
  last_message_status: ChatMessageStatus | null
}

export interface ChatSessionDetail extends ChatSessionSummary {
  session_token: string | null
  messages: ChatHistoryMessage[]
}

export interface ChatSessionCreateResponse {
  session_id: string
  session_token: string | null
  title: string
  created_at: string
}

export interface ChatAiRequest {
  message: string
  session_id: string
  session_token?: string | null
}

export type RequestedChatMode = 'auto' | 'normal' | 'deep'

export interface ChatPreflightRequest {
  sessionId: string | null
  message: string
  attachments: string[]
  requestedMode: RequestedChatMode
}

export interface ChatPreflightResponse {
  preflightId: string
  taskClass: string
  displayName: string
  estimatedCredits: { min: number; max: number }
  availableCredits: number
  confirmationRequired: boolean
  allowed: boolean
  reason: string | null
  expiresAt: string
}

export interface ChatGatewayTurnRequest {
  preflightId: string
  message: string
  sessionId: string | null
  sessionToken: null
  confirmedMaxCredits: number | null
}

export type BillingEntitlements = Record<string, boolean | number | string | null>

export interface BillingAccountSummary {
  plan: {
    code: string
    name: string
    periodEnd: string | null
  }
  wallet: {
    availableCredits: number
    reservedCredits: number
    includedCredits: number
  }
  entitlements: BillingEntitlements
  billingMode: 'OFF' | 'SHADOW' | 'ENFORCE'
  alerts: string[]
}

export interface BillingPlanCatalogItem {
  code: string
  name: string
  audience: string
  version: number
  priceVnd: number
  billingInterval: string
  includedCredits: number
  entitlements: BillingEntitlements
}

export interface BillingLedgerItem {
  id: string
  type: string
  amount: number
  availableAfter: number
  reservedAfter: number
  sourceRef: string
  createdAt: string
}

export interface BillingLedgerPage {
  items: BillingLedgerItem[]
  nextCursor: string | null
}

export interface BillingAiUsageItem {
  id: string
  turnId: string
  sessionId: string
  workflowNode: string
  taskClass: string
  status: string
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  latencyMs: number
  fallbackUsed: boolean
  billable: boolean
  nonBillableReason: string | null
  createdAt: string
}

export interface BillingAiUsagePage {
  items: BillingAiUsageItem[]
  nextCursor: string | null
}

export interface ChatApiErrorBody {
  code?: string
  message?: string
  details?: Record<string, unknown>
}
