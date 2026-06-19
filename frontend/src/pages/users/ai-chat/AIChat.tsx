import { useState, useRef, useEffect, useMemo } from 'react'

import dayjs from 'dayjs'
import { Settings, Star, MapPin, Briefcase, Scale } from 'lucide-react'

import {
  type Attachment,
  type ChatSession,
  DEFAULT_SESSION,
  INITIAL_SESSIONS,
  type Message
} from '@/_mocks/chat-data-mock'
import { MOCK_LAWYERS_BY_CATEGORY } from '@/_mocks/lawyer.mock'
import { requestAssistantReply } from '@/api/workspaceApi'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Avatar, AvatarImage, AvatarFallback, Button } from '@/components/ui'
import { LAW_MAJORS } from '@/core/constants/law-major'
import { formatTime } from '@/core/helpers/date-time'
import { getInitials } from '@/core/helpers/get-initials'
import { cn } from '@/core/lib/utils'
import { type Lawyer } from '@/models/lawyer/list-lawyer.type'
import { LawyerContactDialog } from '@/pages/users/lawyer/components/LawyerContactDialog'

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

const parseBasicMarkdown = (text: string): string => {
  let res = text
  // Escape HTML to prevent injection and breakages
  res = res
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // Headers (e.g. ### Header -> <h3>Header</h3>)
  res = res.replace(/^### (.*$)/gim, '<h3 style="font-size: 14px; font-weight: bold; margin-top: 14px; margin-bottom: 6px; color: #111827;">$1</h3>')
  res = res.replace(/^## (.*$)/gim, '<h2 style="font-size: 16px; font-weight: bold; margin-top: 16px; margin-bottom: 8px; color: #111827;">$1</h2>')
  res = res.replace(/^# (.*$)/gim, '<h1 style="font-size: 18px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; color: #111827;">$1</h1>')
  
  // Bold (e.g. **text** -> <strong>text</strong>)
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  res = res.replace(/__(.*?)__/g, '<strong>$1</strong>')
  
  // Italic (e.g. *text* -> <em>text</em>)
  res = res.replace(/\*(.*?)\*/g, '<em>$1</em>')
  res = res.replace(/_(.*?)_/g, '<em>$1</em>')
  
  // Lists (- item -> <li>item</li>)
  const lines = res.split('\n')
  let inList = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.substring(2)
      if (!inList) {
        lines[i] = '<ul style="margin: 8px 0; padding-left: 20px;">\n<li style="margin-bottom: 4px;">' + content + '</li>'
        inList = true
      } else {
        lines[i] = '<li style="margin-bottom: 4px;">' + content + '</li>'
      }
    } else {
      if (inList) {
        lines[i] = '</ul>\n' + lines[i]
        inList = false
      }
    }
  }
  if (inList) {
    lines.push('</ul>')
  }
  res = lines.join('\n')

  // Line breaks
  res = res.replace(/\n/g, '<br />')
  
  return res
}

const convertMarkdownToHtml = (content: string): string => {
  const tomTatRegex = /\[TÓM TẮT\]:?([\s\S]*?)(?=\[(?:CĂN CỨ|LƯU Ý)\]|$)/i
  const canCuRegex = /\[CĂN CỨ\]:?([\s\S]*?)(?=\[(?:TÓM TẮT|LƯU Ý)\]|$)/i
  const luuYRegex = /\[LƯU Ý\]:?([\s\S]*?)(?=\[(?:TÓM TẮT|CĂN CỨ)\]|$)/i

  const hasTomTat = tomTatRegex.test(content)
  const hasCanCu = canCuRegex.test(content)
  const hasLuuY = luuYRegex.test(content)

  if (!hasTomTat && !hasCanCu && !hasLuuY) {
    return parseBasicMarkdown(content)
  }

  const firstSectionIdx = Math.min(
    ...[
      content.search(/\[TÓM TẮT\]/i),
      content.search(/\[CĂN CỨ\]/i),
      content.search(/\[LƯU Ý\]/i)
    ].filter((idx) => idx >= 0)
  )

  const prefix = firstSectionIdx > 0 ? content.slice(0, firstSectionIdx).trim() : ''
  const tomTatMatch = content.match(tomTatRegex)
  const canCuMatch = content.match(canCuRegex)
  const luuYMatch = content.match(luuYRegex)

  const tomTatText = tomTatMatch ? tomTatMatch[1].trim() : ''
  const canCuText = canCuMatch ? canCuMatch[1].trim() : ''
  const luuYText = luuYMatch ? luuYMatch[1].trim() : ''

  let htmlResult = ''
  if (prefix) {
    htmlResult += `<div style="margin-bottom: 12px;">${parseBasicMarkdown(prefix)}</div>`
  }
  if (tomTatText) {
    htmlResult += `
      <div style="margin-bottom: 16px; padding: 16px; border: 1px solid rgba(13, 148, 136, 0.3); background-color: rgba(240, 253, 250, 0.4); border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; gap: 8px; color: #0d9488; font-weight: bold; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">
          <span>📋 TÓM TẮT</span>
        </div>
        <div style="font-size: 13px; line-height: 1.6; color: #111827;">${parseBasicMarkdown(tomTatText)}</div>
      </div>
    `
  }
  if (canCuText) {
    htmlResult += `
      <div style="margin-bottom: 16px; padding: 16px; border: 1px solid rgba(79, 70, 229, 0.3); background-color: rgba(245, 243, 255, 0.4); border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; gap: 8px; color: #4f46e5; font-weight: bold; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">
          <span>⚖️ CĂN CỨ PHÁP LÝ</span>
        </div>
        <div style="font-size: 13px; line-height: 1.6; color: #111827;">${parseBasicMarkdown(canCuText)}</div>
      </div>
    `
  }
  if (luuYText) {
    htmlResult += `
      <div style="margin-bottom: 16px; padding: 16px; border: 1px solid rgba(217, 119, 6, 0.3); background-color: rgba(254, 243, 199, 0.4); border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; gap: 8px; color: #d97706; font-weight: bold; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">
          <span>⚠️ LƯU Ý</span>
        </div>
        <div style="font-size: 13px; line-height: 1.6; color: #111827;">${parseBasicMarkdown(luuYText)}</div>
      </div>
    `
  }

  return htmlResult
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

  // Lawyer list and contact dialog states
  const [isLawyerListOpen, setIsLawyerListOpen] = useState<boolean>(false)
  const [selectedContactLawyer, setSelectedContactLawyer] = useState<Lawyer | null>(null)

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

  const submitPrompt = async (userMessageContent: string, userAttachments: Attachment[] = []) => {
    if (isLoading) return

    const userMessageId = `msg-user-${Date.now()}`
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

  // Submit Prompt to AI
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() && attachments.length === 0) return
    if (isLoading) return

    const promptText = inputText
    const promptAttachments = [...attachments]

    // Reset Input form state
    setInputText('')
    setAttachments([])

    await submitPrompt(promptText, promptAttachments)
  }

  // Handle lawyer suggestion click
  const handleRequestLawyer = () => {
    setIsLawyerListOpen(true)
  }

  // Handle packaging session messages and exporting to PDF
  const handleExportPdf = () => {
    if (!activeSession || activeSession.messages.length === 0) {
      alert('Không có nội dung tin nhắn để xuất PDF.')
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Không thể mở cửa sổ in. Vui lòng tắt trình chặn pop-up của trình duyệt.')
      return
    }

    const dateStr = activeSession.date || new Date().toLocaleString('vi-VN')
    const title = activeSession.title || 'Phân tích Pháp lý'

    // Generate conversation HTML
    const conversationHtml = activeSession.messages.map((msg) => {
      const isUser = msg.sender === 'user'
      const senderName = isUser ? 'Khách hàng' : 'Trợ lý Pháp lý AI'
      const colorStyle = isUser 
        ? 'background-color: #f3f4f6; border-left: 4px solid #9ea2ae;' 
        : 'background-color: #ffffff; border-left: 4px solid #b81d24;'
      const bodyContent = convertMarkdownToHtml(msg.content)
      return `
        <div style="margin-bottom: 24px; padding: 16px; border-radius: 8px; ${colorStyle} page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; color: #4d5461; font-weight: bold;">
            <span>${senderName}</span>
            <span>${msg.timestamp}</span>
          </div>
          <div style="font-size: 13px; color: #111827; line-height: 1.6;">
            ${bodyContent}
          </div>
        </div>
      `
    }).join('')

    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - LegalAI</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #111827;
              background-color: #ffffff;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #b81d24;
              padding-bottom: 12px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .header-left h1 {
              font-size: 20px;
              color: #b81d24;
              margin: 0 0 4px 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-weight: bold;
            }
            .header-left p {
              font-size: 11px;
              color: #4d5461;
              margin: 0;
            }
            .header-right {
              text-align: right;
              font-size: 11px;
              color: #4d5461;
            }
            .doc-title {
              font-size: 22px;
              font-weight: bold;
              color: #111827;
              margin: 0 0 12px 0;
              text-align: center;
            }
            .doc-meta {
              font-size: 12px;
              color: #4d5461;
              margin-bottom: 32px;
              text-align: center;
            }
            .footer {
              margin-top: 40px;
              padding-top: 16px;
              border-top: 1px solid #e5e7ea;
              font-size: 10px;
              color: #6d717f;
              text-align: center;
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              <h1>LegalAI</h1>
              <p>Hệ thống Trợ lý Pháp lý thông minh</p>
            </div>
            <div class="header-right">
              <div>Ngày tạo: ${dateStr}</div>
              <div>Mã phiên: ${activeSession.id}</div>
            </div>
          </div>
          
          <h2 class="doc-title">${title}</h2>
          <div class="doc-meta">
            Bản ghi nội dung làm việc và phân tích pháp lý tự động bởi Trợ lý AI
          </div>

          <div class="content">
            ${conversationHtml}
          </div>

          <div class="footer">
            <p style="margin: 0 0 4px 0; font-weight: bold;">Tuyên bố miễn trừ trách nhiệm</p>
            <p style="margin: 0;">Thông tin do LegalAI cung cấp chỉ mang tính chất tham khảo học thuật và tra cứu. Vui lòng tham khảo ý kiến của luật sư hoặc chuyên gia pháp lý có thẩm quyền trước khi đưa ra các quyết định pháp lý quan trọng.</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Gather unique attachments from current session messages and input attachments
  const uniqueSessionAttachments = useMemo(() => {
    const allSessionAttachments = [
      ...(activeSession.messages.flatMap(m => m.attachments || [])),
      ...attachments
    ]
    const list: Attachment[] = []

    // Add the packaged chat history PDF representation automatically if there are messages
    if (activeSession.messages.length > 0) {
      const safeTitle = activeSession.title.trim().replace(/[^a-zA-Z0-9\s_]/g, '').replace(/\s+/g, '_')
      list.push({
        id: 'chat-pdf-report',
        name: `Báo_cáo_phân_tích_${safeTitle || 'chi_tiet'}.pdf`,
        size: 'Tự động tạo',
        type: 'file'
      })
    }

    const seenFiles = new Set<string>()
    for (const att of allSessionAttachments) {
      const key = `${att.name}-${att.size}`
      if (!seenFiles.has(key)) {
        seenFiles.add(key)
        list.push(att)
      }
    }
    return list
  }, [activeSession.messages, activeSession.title, attachments])

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
            onRequestLawyer={handleRequestLawyer}
            onExportPdf={handleExportPdf}
            showSuggestions={activeSession.messages.length > 0}
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

      {/* Dialog Danh sách Luật sư phù hợp */}
      <Dialog open={isLawyerListOpen} onOpenChange={setIsLawyerListOpen}>
        <DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto p-6 bg-background-primary border border-border-secondary rounded-2xl shadow-xl'>
          <DialogHeader className='border-b border-border-secondary pb-4 mb-4'>
            <DialogTitle className='text-xl font-extrabold text-main flex items-center gap-2'>
              <Scale className='w-6 h-6 text-primary' />
              <span>Gợi ý Luật sư Phù hợp</span>
            </DialogTitle>
            <DialogDescription className='text-xs text-text-description mt-1'>
              Tìm thấy {(() => {
                const activeCat = detectCategoryFromSession(activeSession, '')
                const rawLawyers = MOCK_LAWYERS_BY_CATEGORY[activeCat] || MOCK_LAWYERS_BY_CATEGORY[LAW_MAJORS.UNKNOWN]
                return rawLawyers.length
              })()} luật sư chuyên khoa liên quan đến lĩnh vực: <strong className='text-primary'>{detectCategoryFromSession(activeSession, '')}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {(MOCK_LAWYERS_BY_CATEGORY[detectCategoryFromSession(activeSession, '')] || MOCK_LAWYERS_BY_CATEGORY[LAW_MAJORS.UNKNOWN]).map((lawyer) => (
              <div
                key={lawyer.id}
                className='flex flex-col sm:flex-row gap-4 p-4 border border-border-secondary rounded-xl bg-background-tertiary hover:border-primary/30 transition-all duration-200 shadow-sm'
              >
                {/* Avatar & Name */}
                <div className='flex flex-row sm:flex-col items-center gap-3 sm:w-[150px] shrink-0 text-center'>
                  <Avatar className='w-16 h-16 rounded-full border border-border-secondary shadow-sm'>
                    <AvatarImage src={lawyer.avatar || ''} alt={lawyer.fullName} />
                    <AvatarFallback className='bg-primary text-white font-bold text-lg'>
                      {getInitials(lawyer.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='text-left sm:text-center min-w-0'>
                    <h4 className='text-sm font-bold text-main truncate w-full'>{lawyer.fullName}</h4>
                    <span className='inline-block text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1'>
                      Luật sư
                    </span>
                  </div>
                </div>

                {/* Main Lawyer Profile Details */}
                <div className='flex-1 min-w-0 flex flex-col justify-between'>
                  <div className='space-y-2'>
                    {/* Specialty & Location */}
                    <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-description font-medium'>
                      <div className='flex items-center gap-1.5'>
                        <Briefcase className='w-3.5 h-3.5 text-text-tertiary' />
                        <span>Chuyên môn: <strong className='text-main'>{lawyer.specializations.join(', ')}</strong></span>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <MapPin className='w-3.5 h-3.5 text-text-tertiary' />
                        <span>Khu vực: <strong className='text-main'>{lawyer.city}</strong></span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className='flex items-center gap-4 text-xs font-semibold'>
                      <div className='flex items-center gap-1 text-yellow-500'>
                        <Star className='w-4 h-4 fill-yellow-500' />
                        <span>{lawyer.averageRating} / 5.0</span>
                      </div>
                      <div className='text-text-description'>
                        Thành công: <strong className='text-main'>{lawyer.successfulCases} vụ</strong>
                      </div>
                    </div>

                    {/* Brief Bio */}
                    <p className='text-xs text-text-description leading-relaxed italic border-l-2 border-border-secondary pl-3 mt-2 line-clamp-2'>
                      {lawyer.bio}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className='flex justify-end gap-2 mt-4 sm:mt-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => alert(`Đang xem hồ sơ của Luật sư ${lawyer.fullName}`)}
                      className='text-xs font-bold'
                    >
                      Xem hồ sơ
                    </Button>
                    <Button
                      variant='default'
                      size='sm'
                      onClick={() => {
                        setIsLawyerListOpen(false)
                        setSelectedContactLawyer(lawyer)
                      }}
                      className='text-xs font-bold text-white bg-primary hover:bg-primary/90'
                    >
                      Liên hệ ngay
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Liên hệ */}
      <LawyerContactDialog
        lawyer={selectedContactLawyer}
        isOpen={selectedContactLawyer !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedContactLawyer(null)
        }}
        initialAttachments={uniqueSessionAttachments}
        onPreviewChatPdf={handleExportPdf}
      />
    </div>
  )
}
