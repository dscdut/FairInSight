import { useState, useRef, useEffect } from 'react'

import dayjs from 'dayjs'
import { Settings } from 'lucide-react'

import {
  type Attachment,
  type ChatSession,
  DEFAULT_SESSION,
  INITIAL_SESSIONS,
  type Message
} from '@/_mocks/chat-data-mock'
import { MOCK_LAWYERS_BY_CATEGORY } from '@/_mocks/lawyer.mock'
import { requestAssistantReply } from '@/api/workspaceApi'
import { cn } from '@/core/lib/utils'
import { LAW_MAJORS } from '@/core/constants/law-major'
import { formatTime } from '@/core/helpers/date-time'

import ChatInput from './components/ChatInput'
import ChatMessages from './components/ChatMessages'
import HistorySidebar from './components/HistorySidebar'

const detectCategoryFromSession = (session: ChatSession, currentMessage: string): string => {
  const textToAnalyze = (session.title + ' ' + currentMessage + ' ' + session.messages.map(m => m.content).join(' ')).toLowerCase()
  if (textToAnalyze.includes('đất') || textToAnalyze.includes('ranh giới') || textToAnalyze.includes('sổ đỏ')) {
    return LAW_MAJORS.LAND
  }
  if (textToAnalyze.includes('hôn nhân') || textToAnalyze.includes('ly hôn') || textToAnalyze.includes('gia đình') || textToAnalyze.includes('con cái')) {
    return LAW_MAJORS.FAMILY_LONG
  }
  if (textToAnalyze.includes('hình sự') || textToAnalyze.includes('tội') || textToAnalyze.includes('bị cáo') || textToAnalyze.includes('bào chữa')) {
    return LAW_MAJORS.CRIMINAL
  }
  if (textToAnalyze.includes('dân sự') || textToAnalyze.includes('thừa kế') || textToAnalyze.includes('đại diện')) {
    return LAW_MAJORS.CIVIL
  }
  if (textToAnalyze.includes('lao động') || textToAnalyze.includes('sa thải') || textToAnalyze.includes('lương') || textToAnalyze.includes('bảo hiểm')) {
    return LAW_MAJORS.LABOR
  }
  if (textToAnalyze.includes('doanh nghiệp') || textToAnalyze.includes('công ty') || textToAnalyze.includes('thương mại') || textToAnalyze.includes('m&a')) {
    return LAW_MAJORS.BUSINESS
  }
  return LAW_MAJORS.UNKNOWN
}

export default function AIChat() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('legal_ai_chat_sessions')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse sessions from localStorage', e)
        }
      }
    }
    return INITIAL_SESSIONS
  })
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('legal_ai_active_session_id')
      if (savedId) return savedId
    }
    return 'session-1'
  })
  const [inputText, setInputText] = useState<string>('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // UI responsive control
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false)

  // AI query configurations
  const [topK, setTopK] = useState<number>(5)
  const [docSummary, setDocSummary] = useState<string>('')
  const [legalDomain, setLegalDomain] = useState<string>('All')
  const [isActiveOnly, setIsActiveOnly] = useState<boolean>(true)
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get active session
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || DEFAULT_SESSION

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSessionId, activeSession.messages.length, isLoading])

  // Save sessions to localStorage on changes
  useEffect(() => {
    localStorage.setItem('legal_ai_chat_sessions', JSON.stringify(sessions))
  }, [sessions])

  // Save activeSessionId to localStorage on changes
  useEffect(() => {
    localStorage.setItem('legal_ai_active_session_id', activeSessionId)
  }, [activeSessionId])

  // Format date helper
  const getCurrentFormattedDate = () => {
    const now = new Date()
    return `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  // Handle Mock File Attachments
  const handleAttach = (files: FileList | null, type: 'file' | 'image') => {
    if (files && files.length > 0) {
      const selectedFiles = Array.from(files)
      const newAttachments: Attachment[] = selectedFiles.map((file) => {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB'
        return {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type,
          size: sizeMB,
          url: type === 'image' ? URL.createObjectURL(file) : undefined
        }
      })
      setAttachments((prev) => [...prev, ...newAttachments])
    }
  }

  // Remove Attachment
  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id))
  }

  // Start a new clean session (client state only)
  const handleNewChat = () => {
    const newId = `session-${Date.now()}`
    const newSession: ChatSession = {
      id: newId,
      title: 'Yêu cầu phân tích mới',
      date: getCurrentFormattedDate(),
      messages: []
    }
    setSessions((prev) => [newSession, ...prev])
    setActiveSessionId(newId)
    setInputText('')
    setAttachments([])
    setIsHistoryOpen(false)
  }

  // Delete a session from history
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const remaining = sessions.filter((s) => s.id !== id)
    setSessions(remaining)
    if (activeSessionId === id) {
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id)
      } else {
        // Create an empty session
        const now = dayjs()
        const fallbackId = 'session-fallback'
        setSessions([
          {
            id: fallbackId,
            title: 'Yêu cầu phân tích mới',
            date: formatTime(now, 'HH:mm``') || '00:00',
            messages: []
          }
        ])
        setActiveSessionId(fallbackId)
      }
    }
  }

  // Sessions are saved automatically to localStorage, so manual save is obsolete

  const handleSelectStarterCategory = (category: string) => {
    if (category === 'Tôi không chắc lĩnh vực') {
      setInputText('Tôi cần tư vấn pháp lý về tình huống sau: ')
    } else {
      setInputText(`Tôi cần tư vấn về lĩnh vực ${category}: `)
    }
    // Focus the chat message input textarea
    const textareaEl = document.getElementById('chat-message-input')
    if (textareaEl) {
      textareaEl.focus()
    }
  }

  // Submit Prompt to AI
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() && attachments.length === 0) return
    if (isLoading) return

    const userMessageId = `msg-user-${Date.now()}`
    const userMessageContent = inputText
    const userAttachments = [...attachments]
    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

    const newUserMsg: Message = {
      id: userMessageId,
      sender: 'user',
      content: userMessageContent,
      timestamp,
      attachments: userAttachments
    }

    // Update session with User Message
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          // If it was default empty name, auto-name it based on input
          const newTitle = s.title === 'Yêu cầu phân tích mới' && userMessageContent.trim()
            ? (userMessageContent.trim().length > 30 ? userMessageContent.trim().slice(0, 30) + '...' : userMessageContent.trim())
            : s.title
          return {
            ...s,
            title: newTitle,
            messages: [...s.messages, newUserMsg]
          }
        }
        return s
      })
    )

    // Reset Input form state
    setInputText('')
    setAttachments([])
    setIsLoading(true)

    // Call real RAG Assistant Query API
    try {
      const history = activeSession.messages.map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content
      }))

      const reply = await requestAssistantReply(
        userMessageContent,
        'low',
        history,
        docSummary || null,
        activeSessionId,
        topK,
        legalDomain,
        isActiveOnly
      )

      // Retain lawyer recommendation overlay if user explicitly asks for it
      let recommendedLawyers = undefined
      const lowerInput = userMessageContent.toLowerCase().trim()
      const isRequestingLawyers = 
        lowerInput === 'có' || 
        lowerInput === 'co' || 
        lowerInput.includes('tôi muốn tìm kiếm luật sư') || 
        lowerInput.includes('tôi muốn tìm luật sư') || 
        lowerInput.includes('tìm luật sư') || 
        lowerInput.includes('gợi ý luật sư') || 
        lowerInput.includes('có, tôi muốn') ||
        lowerInput.includes('có tôi muốn') ||
        (lowerInput.includes('có') && (lowerInput.includes('muốn') || lowerInput.includes('luật sư') || lowerInput.includes('gợi ý')))

      if (isRequestingLawyers) {
        const category = detectCategoryFromSession(activeSession, userMessageContent)
        const rawLawyers = MOCK_LAWYERS_BY_CATEGORY[category] || MOCK_LAWYERS_BY_CATEGORY['Tôi không chắc lĩnh vực']
        recommendedLawyers = rawLawyers.map((l) => ({
          id: l.id,
          name: l.fullName,
          avatar: l.avatar || '',
          specialty: l.specializations.join(', ')
        }))
      }

      const aiMessage: Message = {
        id: reply.id || `msg-ai-${Date.now()}`,
        sender: 'ai',
        content: reply.content,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        lawyers: recommendedLawyers
      }

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: [...s.messages, aiMessage]
            }
          }
          return s
        })
      )
    } catch (error) {
      console.error('Error fetching AI response:', error)
      const errMessage: Message = {
        id: `msg-ai-err-${Date.now()}`,
        sender: 'ai',
        content: 'Có lỗi xảy ra khi kết nối tới trợ lý AI. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: [...s.messages, errMessage]
            }
          }
          return s
        })
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex flex-col h-[calc(100vh-100px)] w-full overflow-hidden animate-in fade-in-50 duration-300'>
      {/* Save Session Dialog is removed because saving is now automatic */}

      {/* Main Split Layout: 8-2 or 7-3 */}
      <div className='flex flex-1 h-full min-h-0 overflow-hidden rounded-xl shadow-sm relative'>
        
        {/* LEFT COLUMN: Main Chat Component (75% / 80%) */}
        <div className='flex flex-col flex-1 h-full min-w-0 min-h-0 bg-transparent relative z-10'>

          {/* Header & AI Configuration Bar */}
          <div className='flex items-center justify-between px-6 py-4 bg-background-primary border-b border-border-secondary shadow-sm'>
            <div className='flex items-center gap-2'>
              <span className='w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse' />
              <h2 className='text-sm font-bold text-main'>{activeSession.title}</h2>
            </div>
            
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm cursor-pointer',
                isConfigOpen 
                  ? 'bg-primary text-white border-primary' 
                  : 'bg-background-secondary text-main border-border-secondary hover:bg-background-secondary/80'
              )}
            >
              <Settings className='w-3.5 h-3.5' />
              <span>Cấu hình AI</span>
            </button>
          </div>

          {/* Collapsible Configuration Panel */}
          {isConfigOpen && (
            <div className='p-6 bg-background-primary border-b border-border-secondary grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top duration-300'>
              {/* Top K */}
              <div className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <label className='text-xs font-bold text-main'>Số tài liệu truy vấn (Top K)</label>
                  <span className='text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md'>{topK}</span>
                </div>
                <input
                  type='range'
                  min='1'
                  max='20'
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className='w-full accent-primary h-1 bg-background-secondary rounded-lg appearance-none cursor-pointer'
                />
                <p className='text-[10px] text-text-description'>Số đoạn văn bản pháp quy liên quan nhất được trích xuất.</p>
              </div>

              {/* Legal Domain */}
              <div className='space-y-2'>
                <label className='text-xs font-bold text-main block'>Lĩnh vực pháp lý</label>
                <select
                  value={legalDomain}
                  onChange={(e) => setLegalDomain(e.target.value)}
                  className='w-full px-3 py-2 text-xs rounded-xl bg-background-secondary border border-border-secondary font-semibold text-main outline-none focus:border-primary transition-all'
                >
                  <option value='All'>Tất cả lĩnh vực</option>
                  <option value='lao_dong'>Luật Lao Động</option>
                  <option value='dan_su'>Luật Dân Sự</option>
                  <option value='hinh_su'>Luật Hình Sự</option>
                  <option value='hanh_chinh'>Luật Hành Chính</option>
                </select>
                <p className='text-[10px] text-text-description'>Giới hạn phạm vi tìm kiếm luật của trợ lý AI.</p>
              </div>

              {/* Is Active Only */}
              <div className='space-y-2 flex flex-col justify-between h-[52px]'>
                <div className='flex items-center justify-between pt-1'>
                  <label className='text-xs font-bold text-main cursor-pointer' htmlFor='active-only-toggle'>
                    Chỉ văn bản còn hiệu lực
                  </label>
                  <input
                    id='active-only-toggle'
                    type='checkbox'
                    checked={isActiveOnly}
                    onChange={(e) => setIsActiveOnly(e.target.checked)}
                    className='w-4 h-4 rounded text-primary border-border-secondary focus:ring-primary accent-primary cursor-pointer'
                  />
                </div>
                <p className='text-[10px] text-text-description'>
                  Bỏ qua các văn bản, thông tư pháp lý đã hết hiệu lực thi hành.
                </p>
              </div>

              {/* Document Summary (doc_summary) */}
              <div className='space-y-2 md:col-span-3'>
                <label className='text-xs font-bold text-main block'>Tóm tắt bối cảnh văn bản (doc_summary)</label>
                <textarea
                  value={docSummary}
                  onChange={(e) => setDocSummary(e.target.value)}
                  placeholder='Nhập tóm tắt văn bản pháp lý hoặc bối cảnh hợp đồng (nếu có) để AI tham chiếu bổ sung...'
                  rows={2}
                  className='w-full p-3 text-xs rounded-xl bg-background-secondary border border-border-secondary font-medium text-main outline-none focus:border-primary transition-all resize-none placeholder-text-tertiary'
                />
                <p className='text-[10px] text-text-description'>Thông tin này sẽ được đính kèm vào truy vấn RAG để tăng độ chính xác của ngữ cảnh.</p>
              </div>
            </div>
          )}

          {/* Messages Scrollable Container */}
          <ChatMessages
            messages={activeSession.messages}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
            onSelectCategory={handleSelectStarterCategory}
          />

          {/* Form Input Area */}
          <ChatInput
            inputText={inputText}
            setInputText={setInputText}
            attachments={attachments}
            onRemoveAttachment={handleRemoveAttachment}
            onAttach={handleAttach}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>

        {/* RIGHT COLUMN: Conversation History (20% / 30%) */}
        {/* Desktop Sidebar Panel */}
        <HistorySidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          className='hidden lg:flex w-[260px] xl:w-[300px] border-l border-border-secondary'
        />

        {/* MOBILE SLIDE-OVER DRAWER FOR HISTORY */}
        {isHistoryOpen && (
          <>
            {/* Drawer Backdrop Overlay */}
            <button
              className='fixed inset-0 z-40 bg-black/40 lg:hidden w-full h-full border-0'
              onClick={() => setIsHistoryOpen(false)}
            />
            {/* Drawer Sidebar */}
            <HistorySidebar
              sessions={sessions}
              activeSessionId={activeSessionId}
              setActiveSessionId={setActiveSessionId}
              onNewChat={handleNewChat}
              onDeleteSession={handleDeleteSession}
              onCloseMobile={() => setIsHistoryOpen(false)}
              showCloseButton={true}
              className='fixed top-0 left-0 bottom-0 z-50 w-[280px] border-r border-border-secondary shadow-2xl animate-in slide-in-from-left duration-300 lg:hidden'
            />
          </>
        )}
      </div>
    </div>
  )
}
