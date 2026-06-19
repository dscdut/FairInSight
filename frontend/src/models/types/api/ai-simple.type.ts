import { type ChatSimpleRequest, type ChatSimpleResponse } from '@/models/ai-chat/chat-simple.type'

export type AiSimpleApi = {
  postAISimple: (request: ChatSimpleRequest) => Promise<ChatSimpleResponse>
}