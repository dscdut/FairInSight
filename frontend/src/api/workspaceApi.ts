import config from '@/core/configs/env'
import { getAccessTokenFromLS } from '@/core/shared/storage'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import  { type Message, type ReasoningLevel, type WorkspaceData, type StoredDocument, type UserProfile, type Citation } from '@/types/workspace'
import { makeId } from '@/utils/id'

export function getApiBase() {
  return config.aiBaseUrl
}

export function getToken(): string | null {
  // First attempt: check for GovDoc specific token
  const govdocToken = localStorage.getItem('govdoc.token')
  if (govdocToken) {
    return govdocToken
  }
  // Fallback: use the authenticated access token of FairInSight
  return getAccessTokenFromLS()
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...extraHeaders }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export function logout(): void {
  localStorage.removeItem('govdoc.token')
  localStorage.removeItem('govdoc.username')
  localStorage.removeItem('govdoc.uploadedPdf')
  // Trigger FairInSight sign out
  useAuthStore.getState().logout()
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const response = await fetch(`${getApiBase()}/auth/me`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    // If not authenticated, return a default mock/fallback profile instead of throwing,
    // to prevent blank screens if the backend doesn't support profile details.
    const state = useAuthStore.getState()
    if (state.user) {
      return {
        id: 1,
        username: state.user.email.split('@')[0],
        full_name: state.user.fullName,
        email: state.user.email,
        bio: 'FairInSight User',
        avatar_color: '#00685f',
        created_at: new Date().toISOString(),
        updated_at: null,
      }
    }
    throw new Error(`Failed to fetch profile (${response.status})`)
  }
  return (await response.json()) as UserProfile
}

export async function updateUserProfile(
  data: Partial<Pick<UserProfile, 'full_name' | 'email' | 'bio' | 'avatar_color'>>,
): Promise<UserProfile> {
  const response = await fetch(`${getApiBase()}/auth/me`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error(`Failed to update profile (${response.status})`)
  return (await response.json()) as UserProfile
}

function normalizeAssistantContent(raw: string | undefined, fallbackPrompt: string): string {
  const initial = (raw ?? '').trim()
  if (!initial) {
    return `No response returned for: "${fallbackPrompt}"`
  }

  let text = initial
  const startsWithQuote = text.startsWith('"')
  const endsWithQuote = text.endsWith('"')
  if (startsWithQuote && endsWithQuote) {
    try {
      const parsed = JSON.parse(text)
      if (typeof parsed === 'string') {
        text = parsed
      }
    } catch {
      text = text.slice(1, -1)
    }
  }

  text = text
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')

  if (text.startsWith('"') && text.endsWith('"')) {
    text = text.slice(1, -1)
  }

  return text
}

export async function fetchWorkspaceData(): Promise<WorkspaceData> {
  const response = await fetch(`${getApiBase()}/workspace`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('govdoc.token')
      // Instead of reload which might loop, just throw error
    }
    const errorBody = await response.text()
    throw new Error(`Failed to fetch workspace data (${response.status}): ${errorBody}`)
  }

  return (await response.json()) as WorkspaceData
}

export async function requestAssistantReply(
  prompt: string,
  _reasoning: ReasoningLevel,
  history: { role: 'user' | 'assistant'; content: string }[] = [],
  summary: string | null = null,
  chatId?: string,
  topK: number = 5,
  legalDomain?: string,
  isActiveOnly: boolean = true
): Promise<Message> {
  const response = await fetch(`${getApiBase()}/query`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      question: prompt,
      top_k: topK,
      history: history.map((m) => ({ role: m.role, content: m.content })),
      doc_summary: summary || null,
      chatId: chatId || null,
      legal_domain: legalDomain && legalDomain !== 'All' ? legalDomain : null,
      is_active_only: isActiveOnly,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`RAG query failed (${response.status}): ${errorBody}`)
  }

  const data = await response.json() as { answer: string; citations: Citation[] }

  return {
    id: makeId('m-assistant'),
    role: 'assistant',
    content: normalizeAssistantContent(data.answer, prompt),
    citations: data.citations || [],
  }
}

type CloudinaryUploadResponse = {
  secure_url: string
  pages?: number
  original_filename?: string
  public_id?: string
  preview_image_url?: string
  summary?: string
}

export type UploadedPdf = {
  secureUrl: string
  pages: number | null
  originalFilename: string | null
  publicId: string | null
  previewImageUrl: string | null
  summary: string | null
}

export async function uploadPdfToCloudinary(file: File, chatId?: string, clientId?: string): Promise<UploadedPdf> {
  const formData = new FormData()
  formData.append('file', file)
  if (chatId) {
    formData.append('chatId', chatId)
  }
  if (clientId) {
    formData.append('clientId', clientId)
  }

  const response = await fetch(`${getApiBase()}/cloudinary/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Cloudinary upload failed (${response.status}): ${errorBody}`)
  }

  const data = (await response.json()) as CloudinaryUploadResponse
  return {
    secureUrl: data.secure_url,
    pages: data.pages ?? null,
    originalFilename: data.original_filename ?? null,
    publicId: data.public_id ?? null,
    previewImageUrl: data.preview_image_url ?? null,
    summary: data.summary ?? null,
  }
}

export async function createFolderApi(id: string, name: string): Promise<void> {
  const response = await fetch(`${getApiBase()}/folders`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ id, name }),
  })
  if (!response.ok) {
    throw new Error(`Failed to create folder: ${await response.text()}`)
  }
}

export async function deleteFolderApi(folderId: string): Promise<void> {
  const response = await fetch(`${getApiBase()}/folders/${folderId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw new Error(`Failed to delete folder: ${await response.text()}`)
  }
}

export async function createChatApi(id: string, title: string, folderId?: string): Promise<void> {
  const response = await fetch(`${getApiBase()}/chats`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ id, title, folderId }),
  })
  if (!response.ok) {
    throw new Error(`Failed to create chat: ${await response.text()}`)
  }
}

export async function deleteChatApi(chatId: string): Promise<void> {
  const response = await fetch(`${getApiBase()}/chats/${chatId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw new Error(`Failed to delete chat: ${await response.text()}`)
  }
}

export async function fetchChatMessages(chatId: string): Promise<Message[]> {
  const response = await fetch(`${getApiBase()}/chats/${chatId}/messages`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) throw new Error(`Failed to load messages (${response.status})`)
  return (await response.json()) as Message[]
}

export async function fetchDocumentsApi(): Promise<StoredDocument[]> {
  const response = await fetch(`${getApiBase()}/documents`, {
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch documents (${response.status}): ${await response.text()}`)
  }
  return (await response.json()) as StoredDocument[]
}

export async function deleteDocumentApi(docId: string): Promise<void> {
  const response = await fetch(`${getApiBase()}/documents/${docId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw new Error(`Failed to delete document (${response.status}): ${await response.text()}`)
  }
}

export async function updateChatApi(chatId: string, title?: string, folderId?: string | null): Promise<void> {
  const response = await fetch(`${getApiBase()}/chats/${chatId}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title, folderId: folderId === null ? "" : folderId }),
  })
  if (!response.ok) {
    throw new Error(`Failed to update chat (${response.status}): ${await response.text()}`)
  }
}

export async function linkDocumentApi(docId: string, chatId?: string | null): Promise<void> {
  const query = chatId ? `?chat_id=${chatId}` : ''
  const response = await fetch(`${getApiBase()}/documents/${docId}/link${query}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    throw new Error(`Failed to link document (${response.status}): ${await response.text()}`)
  }
}
