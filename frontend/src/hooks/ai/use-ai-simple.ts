import { useMutation } from '@tanstack/react-query'

import { chatSimpleApi } from '@/core/services/chat-simple.service'
import { type ChatSimpleRequest } from '@/models/ai-chat/chat-simple.type'

export const useChatSimple = () => {
  return useMutation({
    mutationKey: ['chatSimple'],
    mutationFn: (data: ChatSimpleRequest) => chatSimpleApi.postAISimple(data)
  })
}
