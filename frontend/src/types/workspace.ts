export type MessageRole = 'user' | 'assistant'
export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'
export type ReasoningLevel = 'low' | 'medium' | 'high'

export type UserProfile = {
  id: number
  username: string
  full_name: string | null
  email: string | null
  bio: string | null
  avatar_color: string | null
  created_at: string
  updated_at: string | null
}

export type ChatFolder = {
  id: string
  name: string
  chatIds: string[]
}

export type ChatItem = {
  id: string
  title: string
  updatedAt: string
  folderId: string
}

export type Citation = {
  article_ref: string | null
  doc_title: string | null
  content: string | null
  score: number
}

export type Message = {
  id: string
  role: MessageRole
  content: string
  citations?: Citation[]
  createdAt?: string
}

export type StoredUploadedPdf = {
  fileName: string
  filePages: number | null
  fileUrl: string
  previewImageUrl: string
  summary: string | null
}

export type WorkspaceData = {
  workspaceName: string
  documentTitle: string
  folders: ChatFolder[]
  chats: ChatItem[]
  messagesByChat: Record<string, Message[]>
  documentsByChat?: Record<string, StoredUploadedPdf>
  quickPrompts: string[]
  domainOptions: string[]
  summary?: string
}

export type StoredDocument = {
  id: string
  fileName: string
  filePages: number | null
  fileUrl: string
  previewImageUrl: string | null
  summary: string | null
  chatId: string | null
  createdAt: string
}
