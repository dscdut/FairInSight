import config from '@/core/configs/env'
import { getAccessTokenFromLS } from '@/core/shared/storage'

export interface ContractParty {
  side: string
  name: string
  role: string
  representative?: string
  position?: string
}

export interface ContractRiskCandidate {
  kind: string
  severity: 'low' | 'medium' | 'high'
  title: string
  detail: string
  source_clause_id?: string | null
}

export interface ContractModuleAResult {
  document_info: Record<string, unknown>
  parties: ContractParty[]
  clauses: Array<{ clause_id: string; title?: string; text: string }>
  obligations: Array<{ actor: string; action: string; source_clause_id?: string | null }>
  relationships: Array<{
    from_party: string
    to_party?: string | null
    relation: string
    source_clause_id?: string | null
  }>
  internal_references: Array<{
    target_label: string
    target_exists: boolean
    source_clause_id?: string | null
  }>
  risk_candidates: ContractRiskCandidate[]
  clean_context: { summary?: Record<string, unknown> }
  warnings: string[]
}

export interface ContractModuleBResult {
  question_profile: Record<string, unknown>
  selected_clause_ids: string[]
  legal_search_plan: Array<{ topic: string; query?: string; reason?: string }>
  coverage: Record<string, unknown>
}

export interface ContractModuleCResult {
  report_markdown: string
  memory_snapshot: Record<string, unknown>
}

export interface ContractAnalysisResponse {
  schema_version: 'contract-1.0'
  status: 'completed' | 'failed'
  filename: string
  session_id?: string | null
  session_token?: string | null
  assistant_message_id?: string | null
  memory_saved?: boolean
  module_a: ContractModuleAResult
  module_b?: ContractModuleBResult | null
  module_c?: ContractModuleCResult | null
  rag_evidence?: { queries?: string[]; warnings?: string[]; evidence?: unknown[] } | null
  llm_review?: {
    status?: string
    answer_markdown?: string
    warnings?: string[]
    usage?: Record<string, unknown> | null
  } | null
}

const contractAiBaseUrl = (import.meta.env.VITE_CONTRACT_AI_URL || config.aiBaseUrl).replace(/\/$/, '')

const readErrorText = async (response: Response) => {
  try {
    const body = await response.json() as { detail?: string; message?: string }
    return body.detail || body.message || `HTTP ${response.status}`
  } catch {
    return `HTTP ${response.status}`
  }
}

export async function analyzeContractDocx(params: {
  file: File
  question: string
  useLlm?: boolean
  enableRag?: boolean
  sessionId?: string | null
  sessionToken?: string | null
}): Promise<ContractAnalysisResponse> {
  const form = new FormData()
  form.append('file', params.file)
  form.append('question', params.question)
  if (params.sessionId) form.append('session_id', params.sessionId)
  if (params.sessionToken) form.append('session_token', params.sessionToken)

  const useLlm = params.useLlm ?? true
  if (useLlm) {
    form.append('enable_rag', String(params.enableRag ?? true))
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 15 * 60 * 1000)
  try {
    const token = getAccessTokenFromLS()
    const response = await fetch(`${contractAiBaseUrl}/contracts/${useLlm ? 'analyze-docx-llm' : 'analyze-docx'}`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
    if (!response.ok) {
      throw new Error(await readErrorText(response))
    }
    return await response.json() as ContractAnalysisResponse
  } finally {
    window.clearTimeout(timeout)
  }
}
