import {
  createChatSession,
  deleteChatSession,
  getChatSession,
  getChatReport,
  listChatSessions,
  sendChatAi
} from '@/api/chatAiApi'
import config from '@/core/configs/env'
import axiosClient from '@/core/services/axios-client'
import {
  type ChatAiRequest,
  type ChatAiResponse,
  type ChatGatewayTurnRequest,
  type ChatLegalPositioningReport,
  type ChatPreflightRequest,
  type ChatPreflightResponse,
  type ChatSessionCreateResponse,
  type ChatSessionDetail,
  type ChatSessionSummary
} from '@/models/ai-chat/contracts'

export interface ChatTransport {
  readonly kind: 'direct-ai' | 'node-gateway'
  readonly supportsPreflight: boolean
  createSession(): Promise<ChatSessionCreateResponse>
  listSessions(): Promise<ChatSessionSummary[]>
  getSession(sessionId: string, sessionToken?: string | null, signal?: AbortSignal): Promise<ChatSessionDetail>
  deleteSession(sessionId: string, sessionToken?: string | null): Promise<void>
  getReport(reportId: string, sessionId: string, sessionToken?: string | null): Promise<ChatLegalPositioningReport>
  send(request: ChatAiRequest): Promise<ChatAiResponse>
  preflight?(request: ChatPreflightRequest, idempotencyKey: string): Promise<ChatPreflightResponse>
  sendTurn?(request: ChatGatewayTurnRequest, idempotencyKey: string): Promise<ChatAiResponse>
}

class DirectAiChatTransport implements ChatTransport {
  readonly kind = 'direct-ai' as const
  readonly supportsPreflight = false

  createSession = createChatSession
  listSessions = listChatSessions
  getSession = getChatSession
  deleteSession = deleteChatSession
  getReport = getChatReport
  send = sendChatAi
}

interface GatewayEnvelope<T> { data: T }

class NodeGatewayChatTransport implements ChatTransport {
  readonly kind = 'node-gateway' as const
  readonly supportsPreflight = true

  createSession = createChatSession
  listSessions = listChatSessions
  getSession = getChatSession
  deleteSession = deleteChatSession
  getReport = getChatReport
  send = sendChatAi

  async preflight(request: ChatPreflightRequest, idempotencyKey: string): Promise<ChatPreflightResponse> {
    const response = await axiosClient.post<GatewayEnvelope<ChatPreflightResponse>, GatewayEnvelope<ChatPreflightResponse>>(
      '/chat/preflight',
      request,
      { headers: { 'Idempotency-Key': idempotencyKey } }
    )
    return response.data
  }

  async sendTurn(request: ChatGatewayTurnRequest, idempotencyKey: string): Promise<ChatAiResponse> {
    return axiosClient.post<ChatAiResponse, ChatAiResponse>(
      '/chat/turns',
      request,
      { headers: { 'Idempotency-Key': idempotencyKey }, timeout: 0 }
    )
  }
}

// Gateway là mặc định để Node giữ quyền quyết định entitlement/credit. Direct-AI
// chỉ là rollback local có chủ đích qua VITE_CHAT_GATEWAY_ENABLED=false.
export const chatTransport: ChatTransport = config.chatGatewayEnabled
  ? new NodeGatewayChatTransport()
  : new DirectAiChatTransport()
