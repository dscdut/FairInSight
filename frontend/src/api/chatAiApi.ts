import aiClient from '@/core/services/ai-client'
import {
  type ChatAiRequest,
  type ChatAiResponse,
  type ChatLegalPositioningReport,
  type ChatSessionCreateResponse,
  type ChatSessionDetail,
  type ChatSessionSummary
} from '@/models/ai-chat/contracts'

export type {
  ChatAiRequest,
  ChatAiResponse,
  ChatAvailableAction,
  ChatBillingResult,
  ChatCitation,
  ChatHistoryMessage,
  ChatMessageStatus,
  ChatReportReadiness,
  ChatLegalPositioningReport,
  ChatSessionCreateResponse,
  ChatSessionDetail,
  ChatSessionSummary
} from '@/models/ai-chat/contracts'

/**
 * Gửi câu hỏi tới AI BE. JWT (access_token) đính kèm để BE lấy user_id từ token.
 * Không set timeout: luồng deep có thể chạy 60-100s.
 */
export async function sendChatAi(req: ChatAiRequest): Promise<ChatAiResponse> {
  return aiClient.post<ChatAiResponse, ChatAiResponse>(
    '/chat',
    {
      message: req.message,
      session_id: req.session_id,
      session_token: req.session_token ?? null,
    },
    { timeout: 0 }
  )
}

export async function createChatSession(): Promise<ChatSessionCreateResponse> {
  return aiClient.post<ChatSessionCreateResponse, ChatSessionCreateResponse>(
    '/chat/sessions'
  )
}

export async function listChatSessions(): Promise<ChatSessionSummary[]> {
  const response = await aiClient.get<
    { items: ChatSessionSummary[] },
    { items: ChatSessionSummary[] }
  >('/chat/sessions')
  return response.items
}

export async function getChatSession(
  sessionId: string,
  sessionToken?: string | null,
  signal?: AbortSignal
): Promise<ChatSessionDetail> {
  return aiClient.get<ChatSessionDetail, ChatSessionDetail>(
    `/chat/sessions/${sessionId}`,
    {
      signal,
      ...(sessionToken ? { headers: { 'X-Session-Token': sessionToken } } : {})
    }
  )
}

export async function deleteChatSession(
  sessionId: string,
  sessionToken?: string | null
): Promise<void> {
  await aiClient.delete<void, void>(
    `/chat/sessions/${sessionId}`,
    sessionToken ? { headers: { 'X-Session-Token': sessionToken } } : undefined
  )
}

export async function getChatReport(
  reportId: string,
  sessionId: string,
  sessionToken?: string | null
): Promise<ChatLegalPositioningReport> {
  return aiClient.get<ChatLegalPositioningReport, ChatLegalPositioningReport>(
    `/chat/reports/${reportId}`,
    {
      params: { session_id: sessionId },
      ...(sessionToken ? { headers: { 'X-Session-Token': sessionToken } } : {})
    }
  )
}
