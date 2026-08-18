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
  readonly kind: 'ai-proxy' | 'node-gateway'
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

class AiProxyChatTransport implements ChatTransport {
  readonly kind = 'ai-proxy' as const
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

// Billing gateway is the default so Node owns entitlement/credit decisions.
// The fallback still goes through Node's /ai proxy; it only skips billing preflight.
export const chatTransport: ChatTransport = config.chatGatewayEnabled
  ? new NodeGatewayChatTransport()
  : new AiProxyChatTransport()
