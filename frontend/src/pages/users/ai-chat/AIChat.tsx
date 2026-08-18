import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AxiosError } from 'axios'
import { History } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { hasBillingEntitlement } from '@/api/billingApi'
import { type ChatHistoryMessage, type ChatSessionDetail, type ChatSessionSummary } from '@/api/chatAiApi'
import { chatTransport } from '@/api/chatTransport'
import { analyzeContractDocx, type ContractAnalysisResponse } from '@/api/contractAnalysisApi'
import { fetchRecommendedLawyers } from '@/api/lawyerApi'
import ReportDialog from '@/components/reports/ReportDialog'
import { Button } from '@/components/ui'
import { ROUTE } from '@/core/constants/path'
import { cn } from '@/core/lib/utils'
import { clearAiSessionTokens } from '@/core/shared/storage'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { useMyBilling } from '@/hooks/billing/use-billing'
import { type ChatMessageView, type ChatSessionView } from '@/models/ai-chat/chat-view.type'
import {
  chatReportId,
  isLegalPositioningReport,
  type ChatPreflightResponse
} from '@/models/ai-chat/contracts'
import { exportAnalysisPdf } from '@/utils/pdfExport'

import ChatInput, { CHAT_MAX_CHARS } from './components/ChatInput'
import ChatMessages from './components/ChatMessages'
import HistorySidebar from './components/HistorySidebar'
import PlanCreditSummary from './components/PlanCreditSummary'

const NEW_SESSION_ID = 'new'
const SESSION_TOKEN_PREFIX = 'legal_ai_session_token:'
const PROCESSING_POLL_MS = 2000
type ChatMode = 'legal' | 'contract'

interface PendingGatewayTurn {
  message: string
  sessionId: string
  idempotencyKey: string
  preflight: ChatPreflightResponse
  state: 'confirmation' | 'retry'
}

const makeEmptySession = (): ChatSessionView => ({
  id: NEW_SESSION_ID,
  title: 'Cuộc trò chuyện mới',
  date: '',
  messages: [],
  aiSessionId: null,
  detailLoaded: true
})

const sessionTokenKey = (sessionId: string) => `${SESSION_TOKEN_PREFIX}${sessionId}`

const getStoredSessionToken = (sessionId: string): string | null =>
  sessionStorage.getItem(sessionTokenKey(sessionId))

const formatTime = (value: string | Date) => new Date(value).toLocaleTimeString('vi-VN', {
  hour: '2-digit',
  minute: '2-digit'
})

const toMessage = (message: ChatHistoryMessage): ChatMessageView => ({
  id: message.id,
  sender: message.role === 'user' ? 'user' : 'ai',
  content: message.message?.text || message.content,
  timestamp: formatTime(message.created_at),
  mode: message.msg_type,
  citations: message.citations,
  status: message.status,
  availableActions: message.available_actions,
  report: message.report,
  handoff: message.handoff,
  stage: message.stage,
  billing: message.billing,
  usage: message.usage
})

const toSessionSummary = (session: ChatSessionSummary): ChatSessionView => ({
  id: session.session_id,
  title: session.title || 'Cuộc trò chuyện chưa đặt tên',
  date: session.updated_at,
  messages: [],
  aiSessionId: session.session_id,
  aiSessionToken: getStoredSessionToken(session.session_id),
  lastMessageStatus: session.last_message_status,
  detailLoaded: false
})

const toSessionDetail = (session: ChatSessionDetail): ChatSessionView => ({
  ...toSessionSummary(session),
  messages: session.messages.map(toMessage),
  aiSessionToken: session.session_token ?? getStoredSessionToken(session.session_id),
  detailLoaded: true
})

const titleFromMessage = (message: string) => {
  const normalized = message.trim()
  return normalized.length > 44 ? `${normalized.slice(0, 44)}…` : normalized
}

const formatContractAnalysisAnswer = (result: ContractAnalysisResponse) => {
  const moduleA = result.module_a
  const moduleB = result.module_b
  const summary = moduleA.clean_context?.summary ?? {}
  const ragWarnings = result.rag_evidence?.warnings?.length
    ? `\n\n## Cảnh báo RAG\n${result.rag_evidence.warnings.map((item) => `- ${item}`).join('\n')}`
    : ''
  const llmWarnings = result.llm_review?.warnings?.length
    ? `\n\n## Cảnh báo LLM\n${result.llm_review.warnings.map((item) => `- ${item}`).join('\n')}`
    : ''
  const fallbackReport = [
    '# Kết quả kiểm tra hợp đồng',
    '',
    '## 1. Hợp đồng đang được kiểm tra',
    `- **Tệp**: ${result.filename}`,
    `- **Dữ liệu đã đọc**: ${summary.party_count ?? moduleA.parties.length} bên, ${summary.clause_count ?? moduleA.clauses.length} điều khoản, ${summary.obligation_count ?? moduleA.obligations.length} nghĩa vụ.`,
    '',
    '## 2. Rủi ro nổi bật',
    ...(moduleA.risk_candidates.length
      ? moduleA.risk_candidates.slice(0, 8).map((risk) => `- \`${risk.source_clause_id || 'chưa rõ'}\` ${risk.title}: ${risk.detail}`)
      : ['- Chưa phát hiện rủi ro nổi bật ở bước đọc tự động.']),
    '',
    '## 3. Nhóm pháp luật cần đối chiếu',
    ...(moduleB?.legal_search_plan?.length
      ? moduleB.legal_search_plan.map((item) => `- ${item.topic}: ${item.reason || item.query || 'Cần tra cứu thêm.'}`)
      : ['- Chưa có kế hoạch tra luật.'])
  ].join('\n')

  return [
    result.module_c?.report_markdown || fallbackReport,
    ragWarnings,
    llmWarnings
  ].filter(Boolean).join('\n')
}

const safeErrorMessage = (error: unknown, fallback: string) => {
  if (!(error instanceof AxiosError)) return fallback
  const status = error.response?.status
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 402) return 'Bạn không đủ credit cho yêu cầu này.'
  if (status === 403 || status === 404) return 'Không tìm thấy cuộc trò chuyện hoặc bạn không có quyền truy cập.'
  if (status === 409) return 'Cuộc trò chuyện đang xử lý một yêu cầu khác.'
  if (status === 413) return 'Nội dung vượt quá giới hạn cho phép.'
  if (status === 422) return 'Nội dung gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.'
  if (status === 429) return 'Bạn gửi yêu cầu quá nhanh. Vui lòng chờ một chút rồi thử lại.'
  if (status === 503) return 'Dịch vụ AI tạm thời chưa sẵn sàng. Yêu cầu này không bị tính phí.'
  return fallback
}

const apiErrorCode = (error: unknown): string | null => {
  if (!(error instanceof AxiosError)) return null
  const body = error.response?.data as { code?: string; error?: { code?: string } } | undefined
  return body?.code ?? body?.error?.code ?? null
}

const shouldReuseGatewayAttempt = (error: unknown, code: string | null) => {
  if (code === 'TURN_IN_PROGRESS') return true
  if (!(error instanceof AxiosError)) return true
  const response = error.response
  if (!response) return true
  const terminalCodes = [
    'AI_PROVIDER_UNAVAILABLE',
    'AI_CONTRACT_INVALID',
    'CHAT_GATEWAY_DISABLED',
    'CHAT_GATEWAY_AUTH_UNAVAILABLE',
    'RATE_CARD_UNAVAILABLE',
    'PREFLIGHT_EXPIRED',
    'IDEMPOTENCY_CONFLICT'
  ]
  if (terminalCodes.includes(code || '')) return false
  if ([401, 403, 503].includes(response.status)) return false
  return true
}

export default function AIChat() {
  const [sessions, setSessions] = useState<ChatSessionView[]>([])
  const [newSession, setNewSession] = useState<ChatSessionView>(makeEmptySession)
  const [inputText, setInputText] = useState('')
  const [draftInputs, setDraftInputs] = useState<Record<string, string>>({})
  const [historyState, setHistoryState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null)
  const [processingSessionId, setProcessingSessionId] = useState<string | null>(null)
  const [isSuggestingLawyers, setIsSuggestingLawyers] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isPreflighting, setIsPreflighting] = useState(false)
  const [pendingGatewayTurn, setPendingGatewayTurn] = useState<PendingGatewayTurn | null>(null)
  const [chatMode, setChatMode] = useState<ChatMode>('legal')
  const [selectedContractFile, setSelectedContractFile] = useState<File | null>(null)
  const [isAnalyzingContract, setIsAnalyzingContract] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const userId = useAuthStore((state) => state.user?.userId)
  const activeSessionId = sessionId ?? NEW_SESSION_ID
  const chatBasePath = location.pathname.startsWith(`${ROUTE.ADMIN.ROOT}/`)
    ? `${ROUTE.ADMIN.ROOT}/${ROUTE.ADMIN.CHAT_AI}`
    : ROUTE.USER.CHAT_AI

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inFlightSessionIdsRef = useRef<Set<string>>(new Set())
  const detailGenerationRef = useRef(0)
  const submitLockRef = useRef(false)
  const previousUserIdRef = useRef<string | undefined>(userId)
  const { data: billing = null, refetch: refreshBilling } = useMyBilling()

  const activeSession = useMemo(
    () => activeSessionId === NEW_SESSION_ID
      ? newSession
      : sessions.find((item) => item.id === activeSessionId) ?? {
          ...makeEmptySession(),
          id: activeSessionId,
          title: 'Đang tải cuộc trò chuyện…',
          detailLoaded: false
        },
    [activeSessionId, newSession, sessions]
  )

  const isPersistedProcessing = activeSession.lastMessageStatus === 'processing'
  const isCurrentSessionLoading =
    processingSessionId === activeSessionId ||
    detailLoadingId === activeSessionId ||
    isPersistedProcessing ||
    isAnalyzingContract

  const loadSessionList = useCallback(async () => {
    setHistoryState('loading')
    try {
      const items = await chatTransport.listSessions()
      setSessions((previous) => items.map((item) => {
        const summary = toSessionSummary(item)
        const loaded = previous.find((session) => session.id === item.session_id)
        return loaded?.detailLoaded
          ? {
              ...summary,
              messages: loaded.messages,
              aiSessionToken: loaded.aiSessionToken,
              detailLoaded: true
            }
          : summary
      }))
      setHistoryState('ready')
    } catch {
      setHistoryState('error')
    }
  }, [])

  const refreshSession = useCallback(async (
    id: string,
    options: { apply?: boolean; signal?: AbortSignal } = {}
  ): Promise<ChatSessionView> => {
    const detail = await chatTransport.getSession(id, getStoredSessionToken(id), options.signal)
    if (detail.session_token) sessionStorage.setItem(sessionTokenKey(id), detail.session_token)
    const mapped = toSessionDetail(detail)
    if (options.apply !== false) {
      setSessions((previous) => {
        const index = previous.findIndex((item) => item.id === id)
        if (index === -1) return [...previous, mapped]
        return previous.map((item) => item.id === id ? mapped : item)
      })
    }
    return mapped
  }, [])

  useEffect(() => {
    if (previousUserIdRef.current !== userId) {
      detailGenerationRef.current += 1
      clearAiSessionTokens()
      setSessions([])
      setNewSession(makeEmptySession())
      previousUserIdRef.current = userId
    }
    if (userId) void loadSessionList()
  }, [loadSessionList, userId])

  useEffect(() => {
    if (!sessionId || inFlightSessionIdsRef.current.has(sessionId)) return
    const generation = ++detailGenerationRef.current
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined

    const load = async () => {
      setDetailLoadingId(sessionId)
      setPageError(null)
      try {
        const detail = await refreshSession(sessionId, { apply: false, signal: controller.signal })
        if (controller.signal.aborted || detailGenerationRef.current !== generation) return
        setSessions((previous) => {
          const index = previous.findIndex((item) => item.id === sessionId)
          if (index === -1) return [...previous, detail]
          return previous.map((item) => item.id === sessionId ? detail : item)
        })
        if (detail.lastMessageStatus === 'processing') {
          timer = setTimeout(load, PROCESSING_POLL_MS)
        }
      } catch (error) {
        if (controller.signal.aborted || detailGenerationRef.current !== generation) return
        const message = safeErrorMessage(error, 'Không tải được cuộc trò chuyện. Vui lòng thử lại.')
        setPageError(message)
        if (error instanceof AxiosError && [403, 404].includes(error.response?.status ?? 0)) {
          setSessions((previous) => previous.filter((item) => item.id !== sessionId))
          navigate(chatBasePath, { replace: true })
        }
      } finally {
        if (!controller.signal.aborted && detailGenerationRef.current === generation) {
          setDetailLoadingId((current) => current === sessionId ? null : current)
        }
      }
    }

    void load()
    return () => {
      controller.abort()
      if (timer) clearTimeout(timer)
    }
  }, [chatBasePath, navigate, refreshSession, sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSessionId, activeSession.messages.length, processingSessionId])

  useEffect(() => {
    if (!location.state?.newChat) return
    navigate(chatBasePath, { replace: true, state: {} })
    setNewSession(makeEmptySession())
    setInputText('')
  }, [chatBasePath, location.state, navigate])

  const handleSelectSession = (newId: string) => {
    if (newId === activeSessionId) {
      setIsHistoryOpen(false)
      return
    }
    detailGenerationRef.current += 1
    setDraftInputs((previous) => ({ ...previous, [activeSessionId]: inputText }))
    setInputText(draftInputs[newId] || '')
    setPageError(null)
    navigate(`${chatBasePath}/${newId}`)
    setIsHistoryOpen(false)
  }

  const handleNewChat = () => {
    detailGenerationRef.current += 1
    setDraftInputs((previous) => ({ ...previous, [activeSessionId]: inputText }))
    setNewSession(makeEmptySession())
    setInputText(draftInputs[NEW_SESSION_ID] || '')
    setPageError(null)
    navigate(chatBasePath)
    setIsHistoryOpen(false)
  }

  const handleDeleteSession = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await chatTransport.deleteSession(id, getStoredSessionToken(id))
      sessionStorage.removeItem(sessionTokenKey(id))
      setSessions((previous) => previous.filter((session) => session.id !== id))
      if (activeSessionId === id) handleNewChat()
    } catch (error) {
      setPageError(safeErrorMessage(error, 'Không xóa được cuộc trò chuyện.'))
    }
  }

  const handleSelectStarterCategory = (category: string) => {
    setInputText(category === 'Tôi không chắc lĩnh vực'
      ? 'Tôi cần tư vấn pháp lý về tình huống sau: '
      : `Tôi cần tư vấn về lĩnh vực ${category}: `)
    requestAnimationFrame(() => document.getElementById('chat-message-input')?.focus())
  }

  const updateActiveLocalMessages = (
    updater: (messages: ChatMessageView[]) => ChatMessageView[],
    options: { title?: string; status?: ChatSessionView['lastMessageStatus'] } = {}
  ) => {
    if (activeSessionId === NEW_SESSION_ID) {
      setNewSession((previous) => ({
        ...previous,
        title: options.title ?? previous.title,
        lastMessageStatus: options.status ?? previous.lastMessageStatus,
        messages: updater(previous.messages)
      }))
      return
    }
    setSessions((previous) => previous.map((item) => item.id === activeSessionId
      ? {
          ...item,
          title: options.title ?? item.title,
          lastMessageStatus: options.status ?? item.lastMessageStatus,
          detailLoaded: true,
          messages: updater(item.messages)
        }
      : item))
  }

  const handleContractFileChange = (file: File | null) => {
    if (!file) {
      setSelectedContractFile(null)
      return
    }
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setPageError('Chế độ phân tích hợp đồng hiện chỉ nhận file DOCX.')
      setSelectedContractFile(null)
      return
    }
    setPageError(null)
    setSelectedContractFile(file)
  }

  const handleContractSubmit = async (messageContent: string) => {
    if (!selectedContractFile) {
      setPageError('Vui lòng đính kèm file DOCX trước khi phân tích hợp đồng.')
      return
    }

    const now = formatTime(new Date())
    const pendingId = `local-contract-processing-${crypto.randomUUID()}`
    const userMessage: ChatMessageView = {
      id: `local-contract-user-${crypto.randomUUID()}`,
      sender: 'user',
      content: `${messageContent}\n\nTệp hợp đồng: ${selectedContractFile.name}`,
      timestamp: now
    }
    const pendingMessage: ChatMessageView = {
      id: pendingId,
      sender: 'ai',
      content: '',
      timestamp: now,
      mode: 'contract',
      status: 'processing',
      stage: 'received'
    }

    setInputText('')
    setPageError(null)
    setIsAnalyzingContract(true)

    let targetSessionId = activeSessionId === NEW_SESSION_ID ? null : activeSessionId
    let targetSessionToken = activeSession.aiSessionToken ?? null
    const targetTitle = activeSession.title === 'Cuộc trò chuyện mới'
      ? titleFromMessage(messageContent)
      : activeSession.title
    const updateTargetMessages = (
      updater: (messages: ChatMessageView[]) => ChatMessageView[],
      status: ChatSessionView['lastMessageStatus']
    ) => {
      if (targetSessionId) {
        setSessions((previous) => previous.map((item) => item.id === targetSessionId
          ? {
              ...item,
              title: targetTitle,
              lastMessageStatus: status,
              detailLoaded: true,
              messages: updater(item.messages)
            }
          : item))
        return
      }
      updateActiveLocalMessages(updater, { title: targetTitle, status })
    }

    try {
      if (!targetSessionId) {
        const created = await chatTransport.createSession()
        targetSessionId = created.session_id
        targetSessionToken = created.session_token ?? null
        if (targetSessionToken) {
          sessionStorage.setItem(sessionTokenKey(targetSessionId), targetSessionToken)
        }
        const createdSession: ChatSessionView = {
          id: targetSessionId,
          title: targetTitle,
          date: created.created_at,
          messages: [userMessage, pendingMessage],
          aiSessionId: targetSessionId,
          aiSessionToken: targetSessionToken,
          lastMessageStatus: 'processing',
          detailLoaded: true
        }
        setSessions((previous) => [createdSession, ...previous.filter((item) => item.id !== targetSessionId)])
        setNewSession(makeEmptySession())
        navigate(`${chatBasePath}/${targetSessionId}`, { replace: true })
      } else {
        updateTargetMessages((messages) => [...messages, userMessage, pendingMessage], 'processing')
      }

      const result = await analyzeContractDocx({
        file: selectedContractFile,
        question: messageContent,
        useLlm: true,
        enableRag: false,
        sessionId: targetSessionId,
        sessionToken: targetSessionToken
      })
      if (result.session_id && result.session_id !== targetSessionId) {
        targetSessionId = result.session_id
      }
      const answerMessage: ChatMessageView = {
        id: result.assistant_message_id || `local-contract-answer-${crypto.randomUUID()}`,
        sender: 'ai',
        content: formatContractAnalysisAnswer(result),
        timestamp: formatTime(new Date()),
        mode: 'contract',
        status: 'completed',
        usage: result.llm_review?.usage as ChatMessageView['usage']
      }
      if (result.session_token && result.session_id) {
        sessionStorage.setItem(sessionTokenKey(result.session_id), result.session_token)
      }
      updateTargetMessages(
        (messages) => messages.map((item) => item.id === pendingId ? answerMessage : item),
        'completed'
      )
      void loadSessionList()
    } catch (error) {
      const errorText = error instanceof Error
        ? error.message
        : 'Không phân tích được hợp đồng. Vui lòng thử lại.'
      updateTargetMessages(
        (messages) => messages.map((item) => item.id === pendingId
          ? { ...item, status: 'failed', content: errorText }
          : item),
        'failed'
      )
      setPageError(errorText)
    } finally {
      setIsAnalyzingContract(false)
    }
  }

  const callAiProxyWithoutPreflight = async (messageContent: string) => {
    let targetSessionId = sessionId
    let sessionToken = targetSessionId ? getStoredSessionToken(targetSessionId) : null
    const now = new Date()
    const optimisticUser: ChatMessageView = {
      id: `local-user-${crypto.randomUUID()}`,
      sender: 'user',
      content: messageContent,
      timestamp: formatTime(now)
    }
    const pendingId = `local-processing-${crypto.randomUUID()}`
    const optimisticAssistant: ChatMessageView = {
      id: pendingId,
      sender: 'ai',
      content: '',
      timestamp: formatTime(now),
      mode: 'analysis',
      status: 'processing',
      stage: 'received',
      availableActions: []
    }

    setPageError(null)
    if (!targetSessionId) {
      setNewSession({
        ...makeEmptySession(),
        title: titleFromMessage(messageContent),
        messages: [optimisticUser, optimisticAssistant],
        lastMessageStatus: 'processing'
      })
      setProcessingSessionId(NEW_SESSION_ID)
      let created
      try {
        created = await chatTransport.createSession()
      } catch (error) {
        setInputText(messageContent)
        setNewSession((previous) => ({
          ...previous,
          lastMessageStatus: 'failed',
          messages: previous.messages.map((message) => message.id === pendingId
            ? { ...message, status: 'failed', content: safeErrorMessage(error, 'Không tạo được cuộc trò chuyện. Vui lòng thử lại.') }
            : message)
        }))
        setProcessingSessionId(null)
        return
      }

      targetSessionId = created.session_id
      sessionToken = created.session_token
      if (sessionToken) sessionStorage.setItem(sessionTokenKey(targetSessionId), sessionToken)
      const createdSession: ChatSessionView = {
        id: targetSessionId,
        title: titleFromMessage(messageContent),
        date: created.created_at,
        messages: [optimisticUser, optimisticAssistant],
        aiSessionId: targetSessionId,
        aiSessionToken: sessionToken,
        lastMessageStatus: 'processing',
        detailLoaded: true
      }
      inFlightSessionIdsRef.current.add(targetSessionId)
      setSessions((previous) => [createdSession, ...previous.filter((item) => item.id !== targetSessionId)])
      setProcessingSessionId(targetSessionId)
      navigate(`${chatBasePath}/${targetSessionId}`, { replace: true })
    } else {
      setSessions((previous) => {
        const updated = previous.map((item) => item.id === targetSessionId
          ? {
              ...item,
              title: ['Yêu cầu phân tích mới', 'Cuộc trò chuyện mới'].includes(item.title)
                ? titleFromMessage(messageContent)
                : item.title,
              lastMessageStatus: 'processing' as const,
              detailLoaded: true,
              messages: [...item.messages, optimisticUser, optimisticAssistant]
            }
          : item)
        const active = updated.find((item) => item.id === targetSessionId)
        return active ? [active, ...updated.filter((item) => item.id !== targetSessionId)] : updated
      })
      setProcessingSessionId(targetSessionId)
    }

    if (!targetSessionId) return

    try {
      const response = await chatTransport.send({
        message: messageContent,
        session_id: targetSessionId,
        session_token: sessionToken
      })
      const assistantMessage: ChatMessageView = {
        id: response.assistant_message_id,
        sender: 'ai',
        content: response.message?.text || response.answer || 'Hệ thống chưa trả về nội dung.',
        timestamp: formatTime(new Date()),
        mode: response.mode,
        citations: response.citations,
        status: response.status,
        availableActions: response.available_actions,
        report: response.report,
        handoff: response.handoff,
        stage: response.stage,
        billing: response.billing,
        usage: response.usage
      }
      setSessions((previous) => previous.map((item) => item.id === targetSessionId
        ? {
            ...item,
            aiSessionId: response.session_id,
            aiSessionToken: response.session_token,
            lastMessageStatus: response.status,
            messages: item.messages.map((message) => message.id === pendingId ? assistantMessage : message)
          }
        : item))
      await refreshSession(targetSessionId)
      if (response.billing) void refreshBilling()
      void loadSessionList()
    } catch (error) {
      try {
        await refreshSession(targetSessionId)
      } catch {
        const errorText = safeErrorMessage(error, 'Hệ thống AI đang gặp sự cố. Vui lòng thử lại sau.')
        setSessions((previous) => previous.map((item) => item.id === targetSessionId
          ? {
              ...item,
              lastMessageStatus: 'failed',
              messages: item.messages.map((message) => message.id === pendingId
                ? { ...message, status: 'failed', content: errorText }
                : message)
            }
          : item))
      }
    } finally {
      inFlightSessionIdsRef.current.delete(targetSessionId)
      setProcessingSessionId((current) => current === targetSessionId ? null : current)
    }
  }

  const runGatewayTurn = async (attempt: PendingGatewayTurn) => {
    if (!chatTransport.sendTurn) return
    const initialSessionId = attempt.sessionId
    const timestamp = formatTime(new Date())
    const optimisticUser: ChatMessageView = {
      id: `local-user-${crypto.randomUUID()}`,
      sender: 'user',
      content: attempt.message,
      timestamp
    }
    const pendingId = `local-processing-${crypto.randomUUID()}`
    const optimisticAssistant: ChatMessageView = {
      id: pendingId,
      sender: 'ai',
      content: '',
      timestamp,
      mode: 'analysis',
      status: 'processing',
      stage: 'received',
      availableActions: []
    }

    setPendingGatewayTurn(null)
    setInputText('')
    setPageError(null)
    if (initialSessionId) {
      setSessions((previous) => {
        const updated = previous.map((item) => item.id === initialSessionId
          ? {
              ...item,
              title: ['Yêu cầu phân tích mới', 'Cuộc trò chuyện mới'].includes(item.title)
                ? titleFromMessage(attempt.message)
                : item.title,
              lastMessageStatus: 'processing' as const,
              messages: [...item.messages, optimisticUser, optimisticAssistant]
            }
          : item)
        const active = updated.find((item) => item.id === initialSessionId)
        return active ? [active, ...updated.filter((item) => item.id !== initialSessionId)] : updated
      })
      setProcessingSessionId(initialSessionId)
    } else {
      setNewSession({
        ...makeEmptySession(),
        title: titleFromMessage(attempt.message),
        messages: [optimisticUser, optimisticAssistant],
        lastMessageStatus: 'processing'
      })
      setProcessingSessionId(NEW_SESSION_ID)
    }

    try {
      const response = await chatTransport.sendTurn({
        preflightId: attempt.preflight.preflightId,
        message: attempt.message,
        sessionId: initialSessionId,
        sessionToken: null,
        confirmedMaxCredits: attempt.preflight.confirmationRequired
          ? attempt.preflight.estimatedCredits.max
          : null
      }, attempt.idempotencyKey)
      const targetSessionId = response.session_id
      const assistantMessage: ChatMessageView = {
        id: response.assistant_message_id,
        sender: 'ai',
        content: response.message?.text || response.answer || 'Hệ thống chưa trả về nội dung.',
        timestamp: formatTime(new Date()),
        mode: response.mode,
        citations: response.citations,
        status: response.status,
        availableActions: response.available_actions,
        report: response.report,
        handoff: response.handoff,
        stage: response.stage,
        billing: response.billing,
        usage: response.usage
      }

      if (initialSessionId) {
        setSessions((previous) => previous.map((item) => item.id === initialSessionId
          ? {
              ...item,
              id: targetSessionId,
              aiSessionId: targetSessionId,
              aiSessionToken: response.session_token,
              lastMessageStatus: response.status,
              messages: item.messages.map((message) => message.id === pendingId ? assistantMessage : message)
            }
          : item))
      } else {
        const createdSession: ChatSessionView = {
          id: targetSessionId,
          title: titleFromMessage(attempt.message),
          date: new Date().toISOString(),
          messages: [optimisticUser, assistantMessage],
          aiSessionId: targetSessionId,
          aiSessionToken: response.session_token,
          lastMessageStatus: response.status,
          detailLoaded: true
        }
        if (response.session_token) sessionStorage.setItem(sessionTokenKey(targetSessionId), response.session_token)
        setSessions((previous) => [createdSession, ...previous.filter((item) => item.id !== targetSessionId)])
        setNewSession(makeEmptySession())
        navigate(`${chatBasePath}/${targetSessionId}`, { replace: true })
      }

      await refreshSession(targetSessionId)
      if (response.billing) void refreshBilling()
      void loadSessionList()
    } catch (error) {
      const errorText = safeErrorMessage(error, 'Yêu cầu chưa hoàn tất. Bạn có thể thử lại an toàn với cùng mã yêu cầu.')
      const code = apiErrorCode(error)
      setPageError(errorText)
      setInputText(attempt.message)
      setPendingGatewayTurn(shouldReuseGatewayAttempt(error, code)
        ? { ...attempt, state: 'retry' }
        : null)
      if (initialSessionId) {
        setSessions((previous) => previous.map((item) => item.id === initialSessionId
          ? {
              ...item,
              lastMessageStatus: 'failed',
              messages: item.messages.map((message) => message.id === pendingId
                ? { ...message, status: 'failed', content: errorText }
                : message)
            }
          : item))
      } else {
        setNewSession((previous) => ({
          ...previous,
          lastMessageStatus: 'failed',
          messages: previous.messages.map((message) => message.id === pendingId
            ? { ...message, status: 'failed', content: errorText }
            : message)
        }))
      }
    } finally {
      setProcessingSessionId((current) => current === (initialSessionId ?? NEW_SESSION_ID) ? null : current)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const messageContent = inputText.trim()
    if (!messageContent || isCurrentSessionLoading || submitLockRef.current || inputText.length > CHAT_MAX_CHARS) return
    submitLockRef.current = true
    try {
      if (chatMode === 'contract') {
        await handleContractSubmit(messageContent)
        return
      }
      if (chatTransport.supportsPreflight && chatTransport.preflight) {
        setPendingGatewayTurn(null)
        setIsPreflighting(true)
        let targetSessionId = sessionId
        if (!targetSessionId) {
          const created = await chatTransport.createSession()
          targetSessionId = created.session_id
          if (created.session_token) {
            sessionStorage.setItem(sessionTokenKey(targetSessionId), created.session_token)
          }
          const createdSession: ChatSessionView = {
            id: targetSessionId,
            title: titleFromMessage(messageContent),
            date: created.created_at,
            messages: [],
            aiSessionId: targetSessionId,
            aiSessionToken: created.session_token,
            lastMessageStatus: null,
            detailLoaded: true
          }
          setSessions((previous) => [createdSession, ...previous.filter((item) => item.id !== targetSessionId)])
          setNewSession(makeEmptySession())
          navigate(`${chatBasePath}/${targetSessionId}`, { replace: true })
        }
        const idempotencyKey = crypto.randomUUID()
        const preflight = await chatTransport.preflight({
          sessionId: targetSessionId,
          message: messageContent,
          attachments: [],
          requestedMode: 'auto'
        }, idempotencyKey)
        if (!preflight.allowed) {
          setPageError(preflight.reason === 'INSUFFICIENT_CREDITS'
            ? 'Bạn không đủ credit cho yêu cầu này. Hãy chỉnh câu hỏi hoặc xem các gói sử dụng.'
            : 'Yêu cầu hiện chưa thể xử lý.')
          return
        }
        const attempt: PendingGatewayTurn = {
          message: messageContent,
          sessionId: targetSessionId,
          idempotencyKey,
          preflight,
          state: preflight.confirmationRequired ? 'confirmation' : 'retry'
        }
        if (preflight.confirmationRequired) {
          setPendingGatewayTurn(attempt)
          return
        }
        setDraftInputs((previous) => ({ ...previous, [activeSessionId]: '' }))
        await runGatewayTurn(attempt)
      } else {
        setInputText('')
        setDraftInputs((previous) => ({ ...previous, [activeSessionId]: '' }))
        await callAiProxyWithoutPreflight(messageContent)
      }
    } catch (error) {
      setPageError(safeErrorMessage(error, 'Không thể kiểm tra yêu cầu lúc này. Vui lòng thử lại.'))
    } finally {
      setIsPreflighting(false)
      submitLockRef.current = false
    }
  }

  const continueGatewayTurn = async () => {
    if (!pendingGatewayTurn || submitLockRef.current) return
    submitLockRef.current = true
    setDraftInputs((previous) => ({ ...previous, [activeSessionId]: '' }))
    try {
      await runGatewayTurn(pendingGatewayTurn)
    } finally {
      submitLockRef.current = false
    }
  }

  const handleInputChange = (value: string) => {
    if (pendingGatewayTurn && value !== pendingGatewayTurn.message) setPendingGatewayTurn(null)
    setInputText(value)
  }

  const handleDownloadAnalysis = async (message: ChatMessageView) => {
    try {
      let markdownToExport = message.content
      let titleToExport = activeSession?.title || 'Bản phân tích pháp lý'

      const reportId = chatReportId(message.report)
      if (reportId && activeSessionId !== NEW_SESSION_ID) {
        try {
          const report = isLegalPositioningReport(message.report)
            ? message.report
            : await chatTransport.getReport(
              reportId,
              activeSessionId,
              getStoredSessionToken(activeSessionId)
            )
          if (report?.rendered_markdown) {
            markdownToExport = report.rendered_markdown
          }
          if (report?.title) {
            titleToExport = report.title
          }
        } catch (err) {
          console.warn('Không thể lấy canonical report, sẽ dùng nội dung câu trả lời trực tiếp:', err)
        }
      }

      if (!markdownToExport) {
        throw new Error('Nội dung không khả dụng để xuất PDF.')
      }

      await exportAnalysisPdf(markdownToExport, { title: titleToExport })
    } catch (error) {
      console.error('Lỗi khi xuất PDF:', error)
      setPageError('Không thể xuất PDF lúc này. Vui lòng thử lại.')
    }
  }

  const handleSuggestLawyers = async (message: ChatMessageView) => {
    if (isSuggestingLawyers || activeSessionId === NEW_SESSION_ID) return

    let specialties = message.handoff?.specialty_codes ?? (
      isLegalPositioningReport(message.report)
        ? message.report.issue_analyses.map((item) => String(item['issue'] ?? '')).filter(Boolean)
        : []
    )

    if (!specialties.length) {
      const text = `${activeSession?.title || ''} ${message.content}`.toLowerCase()
      const detected: string[] = []
      if (/lao động|nghỉ việc|mất việc|trợ cấp|sa thải|lương|hợp đồng lao động|thôi việc/.test(text)) detected.push('Lao động')
      if (/doanh nghiệp|công ty|tái cơ cấu|cổ phần|hội đồng|thành viên|doanh nhân/.test(text)) detected.push('Doanh nghiệp')
      if (/đất đai|nhà đất|bất động sản|sổ đỏ|quyền sử dụng đất|nhà ở/.test(text)) detected.push('Đất đai')
      if (/ly hôn|hôn nhân|tài sản chung|cấp dưỡng|gia đình|kết hôn/.test(text)) detected.push('Hôn nhân')
      if (/hình sự|tội|vi phạm|khởi tố|bị cáo|công an|án phí/.test(text)) detected.push('Hình sự')

      specialties = detected.length > 0 ? detected : ['Lao động', 'Doanh nghiệp', 'Dân sự']
    }

    setIsSuggestingLawyers(true)
    try {
      const lawyers = await fetchRecommendedLawyers(specialties)
      const recommendation: ChatMessageView = {
        id: `local-lawyers-${crypto.randomUUID()}`,
        sender: 'ai',
        content: lawyers.length
          ? 'Dưới đây là các luật sư có chuyên môn phù hợp với tình huống của bạn. Bạn nên xem hồ sơ trước khi liên hệ.'
          : 'Hiện chưa tìm thấy luật sư phù hợp. Bạn có thể thử lại sau.',
        timestamp: formatTime(new Date()),
        lawyers
      }
      setSessions((previous) => previous.map((item) => item.id === activeSessionId
        ? { ...item, messages: [...item.messages, recommendation] }
        : item))
    } catch (error) {
      setPageError(safeErrorMessage(error, 'Không thể tải danh sách luật sư lúc này.'))
    } finally {
      setIsSuggestingLawyers(false)
    }
  }

  return (
    <div className='flex h-[calc(100vh-100px)] w-full flex-col overflow-hidden animate-in fade-in-50 duration-300'>
      <div className='relative flex min-h-0 flex-1 overflow-hidden rounded-xl shadow-sm'>
        <main className='relative z-10 flex h-full min-h-0 min-w-0 flex-1 flex-col bg-transparent'>
          <header className='flex items-center justify-between border-b border-border-secondary bg-background-primary px-4 py-3 shadow-sm lg:px-6'>
            <div className='min-w-0'>
              <h1 className='truncate text-sm font-bold text-main'>{activeSession.title}</h1>
              <p className='mt-0.5 text-[11px] text-text-description'>Nội dung chỉ được tải theo cuộc trò chuyện đang mở.</p>
            </div>
            <div className='flex items-center gap-2'>
              <div className='hidden rounded-lg border border-border-secondary bg-background-secondary p-1 sm:inline-flex'>
                <button
                  type='button'
                  onClick={() => setChatMode('legal')}
                  disabled={isCurrentSessionLoading || isPreflighting}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                    chatMode === 'legal' ? 'bg-primary text-white shadow-sm' : 'text-text-description hover:text-main'
                  )}
                >
                  Chat pháp luật
                </button>
                <button
                  type='button'
                  onClick={() => setChatMode('contract')}
                  disabled={isCurrentSessionLoading || isPreflighting}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                    chatMode === 'contract' ? 'bg-primary text-white shadow-sm' : 'text-text-description hover:text-main'
                  )}
                >
                  Hợp đồng
                </button>
              </div>
              <ReportDialog
                type='SYSTEM'
                triggerLabel='Báo cáo lỗi'
                triggerClassName='hidden h-8 text-xs sm:inline-flex'
              />
              <div className='sm:hidden'><PlanCreditSummary /></div>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setIsHistoryOpen(true)}
                aria-label='Mở lịch sử trò chuyện'
                className='lg:hidden'
              >
                <History className='h-4 w-4' aria-hidden='true' />
              </Button>
            </div>
          </header>

          {pageError && (
            <div role='alert' className='mx-4 mt-3 rounded-lg border border-error-primary/30 bg-error-primary/5 px-3 py-2 text-xs text-error-primary'>
              {pageError}
            </div>
          )}

          <div className='border-b border-border-secondary bg-background-primary px-4 py-2 sm:hidden'>
            <div className='inline-flex w-full rounded-lg border border-border-secondary bg-background-secondary p-1'>
              <button
                type='button'
                onClick={() => setChatMode('legal')}
                disabled={isCurrentSessionLoading || isPreflighting}
                className={cn(
                  'flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                  chatMode === 'legal' ? 'bg-primary text-white shadow-sm' : 'text-text-description'
                )}
              >
                Chat pháp luật
              </button>
              <button
                type='button'
                onClick={() => setChatMode('contract')}
                disabled={isCurrentSessionLoading || isPreflighting}
                className={cn(
                  'flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                  chatMode === 'contract' ? 'bg-primary text-white shadow-sm' : 'text-text-description'
                )}
              >
                Hợp đồng
              </button>
            </div>
          </div>

          <ChatMessages
            messages={activeSession.messages}
            isLoading={isCurrentSessionLoading && !activeSession.messages.some((message) => message.status === 'processing')}
            isDetailLoading={detailLoadingId === activeSessionId && !activeSession.detailLoaded}
            messagesEndRef={messagesEndRef}
            onSelectCategory={handleSelectStarterCategory}
            onDownloadAnalysis={handleDownloadAnalysis}
            onSuggestLawyers={handleSuggestLawyers}
            isSuggestingLawyers={isSuggestingLawyers}
            canExportPdf={hasBillingEntitlement(billing, 'can_export_pdf')}
            canSuggestLawyer={hasBillingEntitlement(billing, 'can_use_lawyer_handoff')}
          />

          {pendingGatewayTurn && (
            <div className='mx-3 mb-2 rounded-xl border border-primary/25 bg-primary/5 p-3 lg:mx-4' role='status'>
              <p className='text-sm font-semibold text-main'>
                {pendingGatewayTurn.state === 'retry'
                  ? 'Yêu cầu trước chưa nhận được kết quả xác nhận.'
                  : pendingGatewayTurn.preflight.displayName}
              </p>
              <p className='mt-1 text-xs text-text-description'>
                {pendingGatewayTurn.state === 'retry'
                  ? 'Thử lại sẽ dùng đúng mã yêu cầu cũ để tránh tạo lượt chat hoặc trừ credit hai lần.'
                  : `Dự kiến ${pendingGatewayTurn.preflight.estimatedCredits.min}–${pendingGatewayTurn.preflight.estimatedCredits.max} credit · hiện có ${pendingGatewayTurn.preflight.availableCredits}.`}
              </p>
              <div className='mt-2 flex gap-2'>
                <Button size='sm' onClick={() => void continueGatewayTurn()} className='text-xs text-white'>
                  {pendingGatewayTurn.state === 'retry' ? 'Thử lại an toàn' : 'Tiếp tục'}
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    setInputText(pendingGatewayTurn.message)
                    setPendingGatewayTurn(null)
                  }}
                  className='text-xs'
                >
                  Chỉnh câu hỏi
                </Button>
              </div>
            </div>
          )}

          <ChatInput
            inputText={inputText}
            setInputText={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={isCurrentSessionLoading || isPreflighting}
            mode={chatMode}
            selectedFile={selectedContractFile}
            onFileChange={handleContractFileChange}
          />
        </main>

        <HistorySidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          setActiveSessionId={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          loadState={historyState}
          onRetry={loadSessionList}
          className='hidden w-[260px] border-l border-border-secondary lg:flex xl:w-[300px]'
        />

        {isHistoryOpen && (
          <>
            <button
              aria-label='Đóng lịch sử'
              className='fixed inset-0 z-40 h-full w-full border-0 bg-black/40 lg:hidden'
              onClick={() => setIsHistoryOpen(false)}
            />
            <HistorySidebar
              sessions={sessions}
              activeSessionId={activeSessionId}
              setActiveSessionId={handleSelectSession}
              onNewChat={handleNewChat}
              onDeleteSession={handleDeleteSession}
              loadState={historyState}
              onRetry={loadSessionList}
              onCloseMobile={() => setIsHistoryOpen(false)}
              showCloseButton
              className='fixed inset-y-0 left-0 z-50 w-[280px] border-r border-border-secondary shadow-2xl animate-in slide-in-from-left duration-300 lg:hidden'
            />
          </>
        )}
      </div>
    </div>
  )
}
