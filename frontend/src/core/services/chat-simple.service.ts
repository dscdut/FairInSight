import aiClient from '@/core/services/ai-client'
import { type ChatSimpleRequest, type ChatSimpleResponse } from '@/models/ai-chat/chat-simple.type'
import { type AiSimpleApi } from '@/models/types/api/ai-simple.type'

const API_CHAT_SIMPLE = '/chat/simple'

export const chatSimpleApi: AiSimpleApi = {
  postAISimple: (request: ChatSimpleRequest): Promise<ChatSimpleResponse> => {
    return aiClient.post(API_CHAT_SIMPLE, request)
  }
}
