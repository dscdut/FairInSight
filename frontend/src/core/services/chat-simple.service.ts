import axiosAiClient from '@/core/services/axios-ai-client'
import { type ChatSimpleRequest, type ChatSimpleResponse } from '@/models/ai-chat/chat-simple.type'
import { type AiSimpleApi } from '@/models/types/api/ai-simple.type'

const API_CHAT_SIMPLE = '/chat/simple'

export const chatSimpleApi: AiSimpleApi = {
  postAISimple: (request: ChatSimpleRequest): Promise<ChatSimpleResponse> => {
    return axiosAiClient.post(API_CHAT_SIMPLE, request)
  }
}
