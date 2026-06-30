import { useState, useRef, useEffect } from 'react'

import { Search, Send, Paperclip, Phone, Video, Info, MoreVertical, ArrowLeft, MessageCircle, Image as ImageIcon, FileText, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/core/lib/utils'

interface Attachment {
  id: string
  name: string
  type: 'image' | 'file'
  url?: string
  size?: string
}

interface ChatMessage {
  id: string
  sender: 'me' | 'other'
  content: string
  timestamp: string
  attachments?: Attachment[]
}

interface Conversation {
  id: string
  name: string
  avatar: string
  role: string
  online: boolean
  unreadCount: number
  lastMessage: string
  lastTime: string
  messages: ChatMessage[]
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    name: 'Luật sư Nguyễn Hồng Sơn',
    avatar: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=200',
    role: 'Chuyên gia Hình sự & Đất đai',
    online: true,
    unreadCount: 2,
    lastMessage: 'Tôi đã xem qua tài liệu của bạn. Hãy sắp xếp buổi gặp vào 9h sáng mai nhé.',
    lastTime: '10:35',
    messages: [
      { id: '1', sender: 'other', content: 'Xin chào, tôi là Luật sư Nguyễn Hồng Sơn. Rất vui được hỗ trợ bạn.', timestamp: '10:15' },
      { id: '2', sender: 'me', content: 'Chào Luật sư, tôi đã gửi hồ sơ tranh chấp đất đai qua form tư vấn. Không biết anh đã nhận được chưa ạ?', timestamp: '10:20' },
      { id: '3', sender: 'other', content: 'Tôi đã xem qua tài liệu của bạn. Hãy sắp xếp buổi gặp vào 9h sáng mai nhé.', timestamp: '10:35' }
    ]
  },
  {
    id: 'conv-2',
    name: 'Luật sư Lê Thị Quỳnh',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    role: 'Chuyên gia Hôn nhân & Gia đình',
    online: false,
    unreadCount: 0,
    lastMessage: 'Vụ việc ly hôn đồng thuận của chị đã hoàn tất thủ tục nộp đơn.',
    lastTime: 'Hôm qua',
    messages: [
      { id: '1', sender: 'me', content: 'Chào chị Quỳnh, hồ sơ ly hôn của em tiến triển thế nào rồi ạ?', timestamp: 'Hôm qua 14:00' },
      { id: '2', sender: 'other', content: 'Vụ việc ly hôn đồng thuận của chị đã hoàn tất thủ tục nộp đơn.', timestamp: 'Hôm qua 15:30' }
    ]
  },
  {
    id: 'conv-3',
    name: 'Trợ lý hệ thống LegalAI',
    avatar: '',
    role: 'Hỗ trợ kỹ thuật & dịch vụ',
    online: true,
    unreadCount: 0,
    lastMessage: 'Tài khoản của bạn đã được nâng cấp lên gói Premium.',
    lastTime: '15/06',
    messages: [
      { id: '1', sender: 'other', content: 'Chào mừng bạn đến với LegalAI! Hãy nhắn cho chúng tôi nếu bạn có bất kỳ câu hỏi nào về cách sử dụng phần mềm.', timestamp: '15/06 09:00' },
      { id: '2', sender: 'me', content: 'Cảm ơn, dịch vụ phân tích hợp đồng của các bạn rất tốt.', timestamp: '15/06 09:15' },
      { id: '3', sender: 'other', content: 'Tài khoản của bạn đã được nâng cấp lên gói Premium.', timestamp: '15/06 10:00' }
    ]
  }
]

export default function Messages() {
  const location = useLocation()
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS)
  const [activeId, setActiveId] = useState<string>('conv-1')
  const [searchText, setSearchText] = useState<string>('')
  const [inputText, setInputText] = useState<string>('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [showMobileList, setShowMobileList] = useState<boolean>(true)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const activeConversation = conversations.find((c) => c.id === activeId) || conversations[0]

  // SEO Optimization
  useEffect(() => {
    document.title = 'Hộp thư tư vấn | LegalAI - Hệ thống hỗ trợ phân tích pháp luật'
    
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute(
      'content',
      'Trao đổi trực tiếp với các Luật sư chuyên gia hàng đầu trên nền tảng LegalAI. Hỗ trợ tư vấn pháp lý hình sự, dân sự, đất đai, hôn nhân gia đình trực tuyến bảo mật.'
    )
  }, [])

  // Scroll to top of the message list by default on initial page mount/load
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [])

  // Khi điều hướng từ /chat-ai (nút "Liên hệ luật sư"): mở đúng khung luật sư (nếu khớp tên)
  // và soạn sẵn prompt vào ô nhập. Chạy 1 lần theo state điều hướng.
  useEffect(() => {
    const navState = location.state as { lawyerName?: string; prefillMessage?: string } | null
    if (!navState?.prefillMessage) return

    if (navState.lawyerName) {
      const matched = INITIAL_CONVERSATIONS.find((c) =>
        c.name.toLowerCase().includes(navState.lawyerName!.toLowerCase())
      )
      if (matched) {
        setActiveId(matched.id)
        setShowMobileList(false)
      }
    }
    setInputText(navState.prefillMessage)
  }, [location.state])

  // Clear unread count when clicking conversation
  useEffect(() => {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c))
    )
  }, [activeId])

  // Auto-grow textarea height based on content length
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const maxHeight = 160
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    }
  }, [inputText])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(-2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

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

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() && attachments.length === 0) return

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      content: inputText,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      attachments: [...attachments]
    }

    // Update conversation with user message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeId) {
          const displayMsg = inputText.trim() 
            ? inputText 
            : `[Đã gửi ${attachments.length} tài liệu]`
          return {
            ...c,
            lastMessage: displayMsg,
            lastTime: newMessage.timestamp,
            messages: [...c.messages, newMessage]
          }
        }
        return c
      })
    )

    setInputText('')
    setAttachments([])

    // Trigger mock response
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const lawyerReply: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        sender: 'other',
        content: `Cảm ơn bạn đã nhắn tin. Tôi đã ghi nhận các thông tin bạn gửi. Tôi sẽ phản hồi lại chi tiết trong chốc lát.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeId) {
            return {
              ...c,
              lastMessage: lawyerReply.content,
              lastTime: lawyerReply.timestamp,
              messages: [...c.messages, lawyerReply]
            }
          }
          return c
        })
      )
    }, 1500)
  }

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <main className='flex h-[calc(100vh-100px)] w-full overflow-hidden rounded-xl border border-border-secondary bg-background-primary shadow-sm animate-in fade-in duration-300'>
      {/* List column */}
      <section
        aria-label='Danh sách hội thoại'
        className={cn(
          'w-full md:w-[320px] lg:w-[360px] border-r border-border-secondary flex flex-col bg-background-primary shrink-0 transition-all duration-300 md:flex',
          showMobileList ? 'flex' : 'hidden'
        )}
      >
        <header className='p-4 border-b border-border-secondary space-y-3.5'>
          <h1 className='text-lg font-bold text-text-primary flex items-center gap-2' id='page-title-messages'>
            <MessageCircle className='w-5 h-5 text-primary' />
            Hộp thư tư vấn
          </h1>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-description' />
            <Input
              id='search-lawyers-input'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder='Tìm kiếm luật sư...'
              className='pl-9 bg-background-secondary border-border-secondary h-9.5 text-sm rounded-lg focus-visible:ring-primary'
            />
          </div>
        </header>

        <div className='flex-1 overflow-y-auto p-2 space-y-1' role='tablist' aria-label='Chọn cuộc hội thoại'>
          {filteredConversations.map((c) => {
            const isSelected = c.id === activeId
            return (
              <button
                key={c.id}
                id={`conversation-tab-${c.id}`}
                role='tab'
                aria-selected={isSelected}
                onClick={() => {
                  setActiveId(c.id)
                  setShowMobileList(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 group relative',
                  isSelected
                    ? 'bg-primary/5 border border-primary/20 text-text-primary shadow-sm'
                    : 'hover:bg-background-secondary border border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                <div className='relative shrink-0'>
                  {c.avatar ? (
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className='w-11 h-11 rounded-full object-cover border border-border-primary'
                    />
                  ) : (
                    <div className='w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center border border-primary/15 text-sm'>
                      {getInitials(c.name)}
                    </div>
                  )}
                  {c.online && (
                    <span className='absolute bottom-0 right-0 w-3 h-3 bg-success-primary border-2 border-background-primary rounded-full' />
                  )}
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between'>
                    <h2 className='text-sm font-bold truncate group-hover:text-primary transition-colors'>
                      {c.name}
                    </h2>
                    <span className='text-[10px] text-text-description whitespace-nowrap'>{c.lastTime}</span>
                  </div>
                  <p className='text-xs text-text-tertiary font-medium mt-0.5'>{c.role}</p>
                  <p className='text-xs text-text-description truncate mt-1 leading-normal font-medium'>
                    {c.lastMessage}
                  </p>
                </div>

                {c.unreadCount > 0 && (
                  <span className='absolute right-3 bottom-3 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 h-5 flex items-center justify-center shrink-0'>
                    {c.unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Chat messages column */}
      <section
        aria-label='Khung trò chuyện'
        className={cn(
          'flex-1 flex flex-col h-full min-w-0 bg-background-secondary transition-all duration-300 md:flex',
          !showMobileList ? 'flex' : 'hidden'
        )}
      >
        {/* Chat Header */}
        <header className='flex items-center justify-between px-4 py-3 bg-background-primary border-b border-border-secondary shadow-sm shrink-0'>
          <div className='flex items-center gap-3 min-w-0'>
            <button
              id='mobile-back-to-list-button'
              onClick={() => setShowMobileList(true)}
              className='md:hidden p-1.5 rounded-lg text-text-secondary hover:bg-background-secondary shrink-0'
              aria-label='Quay lại danh sách tin nhắn'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>

            <div className='relative shrink-0'>
              {activeConversation.avatar ? (
                <img
                  src={activeConversation.avatar}
                  alt={activeConversation.name}
                  className='w-10 h-10 rounded-full object-cover border border-border-primary'
                />
              ) : (
                <div className='w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center border border-primary/15 text-sm'>
                  {getInitials(activeConversation.name)}
                </div>
              )}
              {activeConversation.online && (
                <span className='absolute bottom-0 right-0 w-2.5 h-2.5 bg-success-primary border-2 border-background-primary rounded-full' />
              )}
            </div>

            <div className='min-w-0'>
              <h2 className='text-sm font-bold text-text-primary truncate'>{activeConversation.name}</h2>
              <p className='text-[11px] text-text-description font-medium truncate flex items-center gap-1.5 mt-0.5'>
                {activeConversation.online ? (
                  <>
                    <span className='w-1.5 h-1.5 rounded-full bg-success-primary animate-pulse' />
                    <span>Đang hoạt động</span>
                  </>
                ) : (
                  <span>Ngoại tuyến</span>
                )}
                <span className='text-text-tertiary'>•</span>
                <span>{activeConversation.role}</span>
              </p>
            </div>
          </div>

          <div className='flex items-center gap-1 shrink-0'>
            <Button id='header-action-phone' variant='ghost' size='icon' className='h-9 w-9 text-text-secondary hover:text-text-primary rounded-lg' aria-label='Gọi điện thoại thoại'>
              <Phone className='w-4.5 h-4.5' />
            </Button>
            <Button id='header-action-video' variant='ghost' size='icon' className='h-9 w-9 text-text-secondary hover:text-text-primary rounded-lg' aria-label='Gọi video call'>
              <Video className='w-4.5 h-4.5' />
            </Button>
            <Button id='header-action-info' variant='ghost' size='icon' className='h-9 w-9 text-text-secondary hover:text-text-primary rounded-lg' aria-label='Xem thông tin chi tiết luật sư'>
              <Info className='w-4.5 h-4.5' />
            </Button>
            <Button id='header-action-more' variant='ghost' size='icon' className='h-9 w-9 text-text-secondary hover:text-text-primary rounded-lg' aria-label='Lựa chọn khác'>
              <MoreVertical className='w-4.5 h-4.5' />
            </Button>
          </div>
        </header>

        {/* Message area */}
        <div ref={scrollContainerRef} className='flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-background-secondary/50' aria-label='Lịch sử trò chuyện'>
          {activeConversation.messages.map((m) => {
            const isMe = m.sender === 'me'
            return (
              <div key={m.id} className={cn('flex w-full', isMe ? 'justify-end' : 'justify-start')}>
                <div className={cn('flex flex-col max-w-[75%]', isMe ? 'items-end' : 'items-start')}>
                  <div
                    className={cn(
                      'p-3 text-sm leading-relaxed rounded-2xl shadow-sm',
                      isMe
                        ? 'bg-gradient-to-r from-primary to-primary-400 text-white rounded-tr-none'
                        : 'bg-background-primary border border-border-primary text-text-primary rounded-tl-none'
                    )}
                  >
                    <div>{m.content}</div>

                    {/* Previews for attachments sent inside chat bubbles */}
                    {m.attachments && m.attachments.length > 0 && (
                      <div className='mt-2 space-y-1.5'>
                        {m.attachments.map((att) => (
                          <div
                            key={att.id}
                            className={cn(
                              'flex items-center gap-2 p-1.5 rounded-lg text-xs max-w-[240px] border shadow-sm',
                              isMe 
                                ? 'bg-white/10 border-white/20 text-white font-normal' 
                                : 'bg-background-secondary border-border-secondary text-text-primary font-medium'
                            )}
                          >
                            {att.type === 'image' ? (
                              <img
                                src={att.url}
                                alt={att.name}
                                className='w-8 h-8 object-cover rounded shrink-0 border border-black/5'
                              />
                            ) : (
                              <div className={cn(
                                'w-8 h-8 rounded flex items-center justify-center shrink-0',
                                isMe ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary'
                              )}>
                                <FileText className='w-4.5 h-4.5' />
                              </div>
                            )}
                            <div className='min-w-0 flex-1 text-left'>
                              <p className='font-bold truncate text-[10.5px] leading-tight'>{att.name}</p>
                              <p className={cn(
                                'text-[9px] mt-0.5 font-medium',
                                isMe ? 'text-white/80' : 'text-text-description'
                              )}>{att.size}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className='text-[10px] text-text-description font-medium mt-1 px-1'>{m.timestamp}</span>
                </div>
              </div>
            )
          })}

          {isTyping && (
            <div className='flex w-full justify-start' aria-label='Luật sư đang nhập tin nhắn'>
              <div className='flex flex-col items-start'>
                <div className='p-3 bg-background-primary border border-border-primary rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm'>
                  <span className='w-2 h-2 rounded-full bg-text-description animate-bounce [animation-delay:-0.3s]' />
                  <span className='w-2 h-2 rounded-full bg-text-description animate-bounce [animation-delay:-0.15s]' />
                  <span className='w-2 h-2 rounded-full bg-text-description animate-bounce' />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area identical to ChatInput.tsx */}
        <div className='p-3 lg:p-4 bg-background-primary shrink-0 border-t border-border-secondary'>
          {/* Hidden File Inputs */}
          <input
            type='file'
            ref={fileInputRef}
            id='hidden-document-input'
            onChange={(e) => {
              handleAttach(e.target.files, 'file')
              e.target.value = ''
            }}
            accept='.pdf,.doc,.docx,.xls,.xlsx,.txt'
            className='hidden'
            multiple
          />
          <input
            type='file'
            ref={imageInputRef}
            id='hidden-image-input'
            onChange={(e) => {
              handleAttach(e.target.files, 'image')
              e.target.value = ''
            }}
            accept='image/*'
            className='hidden'
            multiple
          />

          {/* Attachment Previews Area */}
          {attachments.length > 0 && (
            <div className='flex flex-wrap gap-2 mb-2 rounded-lg max-h-[140px] overflow-y-auto animate-in slide-in-from-bottom-2 duration-200' aria-label='Danh sách tệp chuẩn bị đính kèm'>
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className='relative flex items-center gap-2 p-1.5 pr-8 bg-background-primary border border-border-secondary rounded-lg text-xs max-w-[180px] shadow-sm shrink-0'
                >
                  {att.type === 'image' ? (
                    <img
                      src={att.url}
                      alt={att.name}
                      className='w-5 h-5 object-cover rounded'
                    />
                  ) : (
                    <div className='w-5 h-5 rounded flex items-center justify-center text-info shrink-0'>
                      <FileText className='w-4 h-4' aria-hidden='true' />
                    </div>
                  )}
                  <div className='min-w-0 flex-1 text-left'>
                    <p className='font-medium truncate leading-tight text-[11px] text-main'>{att.name}</p>
                    <p className='text-[9px] text-text-description leading-none'>{att.size}</p>
                  </div>
                  <button
                    type='button'
                    id={`remove-attachment-${att.id}`}
                    onClick={() => handleRemoveAttachment(att.id)}
                    aria-label={`Xóa ${att.type === 'image' ? 'hình ảnh' : 'tài liệu'} ${att.name}`}
                    className='absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-background-secondary focus-visible:ring-1 focus-visible:ring-info focus-visible:outline-none flex items-center justify-center text-text-description hover:text-slate-600 transition-colors'
                  >
                    <X className='w-3.5 h-3.5' aria-hidden='true' />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Form Box */}
          <form onSubmit={handleSend} className='relative flex items-end gap-2'>
            <div className='flex-1 relative border border-border-secondary rounded-xl bg-background-secondary shadow-inner focus-within:ring-1 focus-within:ring-primary transition-all'>
              {/* Textarea */}
              <Textarea
                ref={textareaRef}
                id='chat-message-input'
                name='message'
                autoComplete='off'
                aria-label='Nội dung tin nhắn'
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Nhập tin nhắn tư vấn pháp lý tại đây…'
                className='min-h-[44px] w-full bg-transparent border-0 ring-0 focus-visible:ring-0 shadow-none py-3 pl-3 pr-24 leading-relaxed text-sm resize-none overflow-y-auto'
                rows={1}
              />

              {/* Right Attachment Action Buttons */}
              <div className='absolute right-2 bottom-1.5 flex items-center gap-1'>
                <Button
                  type='button'
                  id='attach-image-button'
                  variant='ghost'
                  size='icon'
                  onClick={() => imageInputRef.current?.click()}
                  title='Đính kèm hình ảnh'
                  aria-label='Đính kèm hình ảnh'
                  className='w-8 h-8 rounded-lg text-text-description hover:text-primary hover:bg-background-secondary transition-all focus-visible:ring-1 focus-visible:ring-info focus-visible:outline-none'
                >
                  <ImageIcon className='w-4 h-4' aria-hidden='true' />
                </Button>
                <Button
                  type='button'
                  id='attach-document-button'
                  variant='ghost'
                  size='icon'
                  onClick={() => fileInputRef.current?.click()}
                  title='Đính kèm tài liệu (.pdf, .doc, …)'
                  aria-label='Đính kèm tài liệu'
                  className='w-8 h-8 rounded-lg text-text-description hover:text-primary hover:bg-background-secondary transition-all focus-visible:ring-1 focus-visible:ring-info focus-visible:outline-none'
                >
                  <Paperclip className='w-4 h-4' aria-hidden='true' />
                </Button>
              </div>
            </div>

            {/* Dynamic Send Button */}
            <Button
              type='submit'
              id='send-message-button'
              disabled={!inputText.trim() && attachments.length === 0}
              aria-label='Gửi tin nhắn'
              className={cn(
                'h-11 w-11 rounded-xl font-medium shrink-0 shadow-sm transition-all flex items-center gap-2 duration-300 focus-visible:ring-1 focus-visible:ring-info focus-visible:outline-none',
                (inputText.trim() || attachments.length > 0)
                  ? 'bg-primary text-white hover:bg-primary/50 shadow-md hover:scale-[1.02]'
                  : 'bg-background-secondary text-text-description'
              )}
            >
              <Send className='w-4 h-4' aria-hidden='true' />
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
