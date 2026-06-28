import config from '@/core/configs/env'
import { getAccessTokenFromLS } from '@/core/shared/storage'

// Trỏ thẳng AI BE (Python, port 8000). Tách khỏi axios-client (vốn cho BE Node 3000)
// để tránh interceptor auto-abort theo URL và để mang đúng Authorization.
const AI_BASE = config.aiBaseUrl

export interface Citation {
  official_code?: string
  article_no?: string
  clause_no?: string
  quoted_text?: string
}

export interface ChatAiResponse {
  session_id: string
  answer: string
  mode: string | null
  confidence: number | null
  risk: 'low' | 'medium' | 'high' | null
  domain: string | null
  citations: Citation[]
  warnings: string[]
}

export interface ChatAiRequest {
  message: string
  session_id?: string | null
  deep_confirmed?: boolean
}

/**
 * Gửi câu hỏi tới AI BE. JWT (access_token) đính kèm để BE lấy user_id từ token.
 * Không set timeout: luồng deep có thể chạy 60-100s.
 */
export async function sendChatAi(req: ChatAiRequest): Promise<ChatAiResponse> {
  const token = getAccessTokenFromLS()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${AI_BASE}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: req.message,
      session_id: req.session_id ?? null,
      deep_confirmed: req.deep_confirmed ?? false,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Chat AI lỗi (${res.status}): ${body}`)
  }
  return (await res.json()) as ChatAiResponse
}
