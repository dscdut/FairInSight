import { type Lawyer } from "../lawyer/list-lawyer.type"

export interface Attachment {
  id: string
  name: string
  type: 'image' | 'file'
  url?: string
  size?: string
}

export interface ChatSession {
  id: string
  title: string
  date: string
  messages: Message[]
}

export interface ChatSimpleRequest {
  prompt: string
}

export interface ChatSimpleResponse {
  answer: string
  latency_ms?: number
}

export interface Message extends ChatSimpleResponse{
  id?: string
  sender: 'user' | 'ai'
  timestamp?: string
  attachments?: Attachment[]
  lawyers?: Lawyer[]
}
