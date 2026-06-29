import { useState, useRef, useEffect } from 'react'

import { Search, Send, Paperclip, Phone, Video, Info, MoreVertical, ArrowLeft, MessageCircle, Image as ImageIcon, FileText, X } from 'lucide-react'

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
    name: 'Khách hàng Trần Văn An',
    avatar: '',
    role: 'Vụ việc: Tranh chấp quyền sử dụng đất đai',
    online: true,
    unreadCount: 1,
    lastMessage: 'Tôi đã đính kèm các giấy tờ chứng nhận quyền sử dụng đất gửi Luật sư.',
    lastTime: '10:35',
    messages: [
      { id: '1', sender: 'other', content: 'Xin chào Luật sư. Tôi đang gặp rắc rối về vụ tranh chấp mảnh đất phía sau nhà.', timestamp: '10:15' },
      { id: '2', sender: 'me', content: 'Chào anh An. Anh gửi giúp tôi bản chụp sổ đỏ cùng các giấy tờ liên quan để tôi nghiên cứu trước nhé.', timestamp: '10:25' },
      { id: '3', sender: 'other', content: 'Tôi đã đính kèm các giấy tờ chứng nhận quyền sử dụng đất gửi Luật sư.', timestamp: '10:35' }
    ]
  },
  {
    id: 'conv-2',
    name: 'Khách hàng Nguyễn Thị Bình',
    avatar: '',
    role: 'Vụ việc: Tư vấn rà soát hợp đồng thương mại',
    online: false,
    unreadCount: 0,
    lastMessage: 'Vâng, tôi sẽ chuẩn bị các hồ sơ công ty và gửi lại cho luật sư vào chiều nay.',
    lastTime: 'Hôm qua',
    messages: [
      { id: '1', sender: 'other', content: 'Chào luật sư, tôi muốn nhờ luật sư xem giúp các điều khoản phạt vi phạm trong hợp đồng cung ứng này.', timestamp: 'Hôm qua 14:00' },
      { id: '2', sender: 'me', content: 'Chào chị Bình. Chị gửi bản thảo hợp đồng qua đây, đặc biệt chú ý phần điều khoản phạt và trường hợp bất khả kháng nhé.', timestamp: 'Hôm qua 15:30' },
      { id: '3', sender: 'other', content: 'Vâng, tôi sẽ chuẩn bị các hồ sơ công ty và gửi lại cho luật sư vào chiều nay.', timestamp: 'Hôm qua 16:00' }
    ]
  }
]

export default function LawyerMessages() {
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
    document.title = 'Hộp thư tư vấn của Luật sư | FairInsight'
  }, [])

  // Scroll to top of the message list by default on initial page mount/load
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [activeConversation.messages])

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

    // Trigger mock client response
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const clientReply: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        sender: 'other',
        content: `Dạ vâng, cảm ơn Luật sư đã hướng dẫn chi tiết. Tôi sẽ thực hiện theo hướng dẫn ạ.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeId) {
            return {
              ...c,
              lastMessage: clientReply.content,
              lastTime: clientReply.timestamp,
              messages: [...c.messages, clientReply]
            }
          }
          return c
        })
      )
    }, 2000)
  }

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <main className='flex h-[calc(100vh-140px)] w-full overflow-hidden rounded-2xl border border-border-secondary bg-background-primary shadow-sm animate-in fade-in duration-300'>
      {/* List column */}
      <section
        aria-label='Danh sách khách hàng'
        className={cn(
          'w-full md:w-[320px] lg:w-[360px] border-r border-border-secondary flex flex-col bg-background-primary shrink-0 transition-all duration-300 md:flex',
          showMobileList ? 'flex' : 'hidden'
        )}
      >
        <header className='p-4 border-b border-border-secondary space-y-3.5'>
          <h1 className='text-lg font-bold text-text-primary flex items-center gap-2'>
            <MessageCircle className='w-5 h-5 text-primary' />
            Hộp thư tư vấn
          </h1>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-description' />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder='Tìm kiếm khách hàng...'
              className='pl-9 bg-background-secondary border-border-secondary h-9.5 text-sm rounded-lg focus-visible:ring-primary'
            />
          </div>
        </header>

        <div className='flex-1 overflow-y-auto p-2 space-y-1' role='tablist'>
          {filteredConversations.map((c) => {
            const isSelected = c.id === activeId
            return (
              <button
                key={c.id}
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
                  <div className='w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center border border-primary/15 text-sm'>
                    {getInitials(c.name)}
                  </div>
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
              onClick={() => setShowMobileList(true)}
              className='md:hidden p-1.5 rounded-lg text-text-secondary hover:bg-background-secondary shrink-0'
              aria-label='Quay lại danh sách tin nhắn'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>

            <div className='relative shrink-0'>
              <div className='w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center border border-primary/15 text-sm'>
                {getInitials(activeConversation.name)}
              </div>
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
            <Button variant='ghost' size='icon' className='h-9 w-9 text-text-secondary hover:text-text-primary rounded-lg'>
              <Phone className='w-4.5 h-4.5' />
            </Button>
            <Button variant='ghost' size='icon' className='h-9 w-9 text-text-secondary hover:text-text-primary rounded-lg'>
              <Video className='w-4.5 h-4.5' />
            </Button>
            <Button variant='ghost' size='icon' className='h-9 w-9 text-text-secondary hover:text-text-primary rounded-lg'>
              <Info className='w-4.5 h-4.5' />
            </Button>
            <Button variant='ghost' size='icon' className='h-9 w-9 text-text-secondary hover:text-text-primary rounded-lg'>
              <MoreVertical className='w-4.5 h-4.5' />
            </Button>
          </div>
        </header>

        {/* Message area */}
        <div ref={scrollContainerRef} className='flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-background-secondary/50'>
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
                            <div className={cn(
                              'w-8 h-8 rounded flex items-center justify-center shrink-0',
                              isMe ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary'
                            )}>
                              <FileText className='w-4.5 h-4.5' />
                            </div>
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
            <div className='flex w-full justify-start'>
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

        {/* Input area */}
        <div className='p-3 lg:p-4 bg-background-primary shrink-0 border-t border-border-secondary'>
          <input
            type='file'
            ref={fileInputRef}
            onChange={(e) => handleAttach(e.target.files, 'file')}
            className='hidden'
            multiple
          />
          <input
            type='file'
            ref={imageInputRef}
            onChange={(e) => handleAttach(e.target.files, 'image')}
            accept='image/*'
            className='hidden'
            multiple
          />

          {attachments.length > 0 && (
            <div className='flex flex-wrap gap-2 mb-3 px-1.5'>
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className='flex items-center gap-2 bg-background-secondary border border-border-secondary pl-2 pr-1 py-1 rounded-lg text-xs'
                >
                  <FileText className='w-3.5 h-3.5 text-primary' />
                  <span className='font-semibold truncate max-w-[120px]'>{att.name}</span>
                  <button
                    onClick={() => handleRemoveAttachment(att.id)}
                    className='p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800'
                  >
                    <X className='w-3 h-3 text-text-description' />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className='flex items-end gap-2'>
            <div className='flex gap-1.5 shrink-0 mb-1'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => imageInputRef.current?.click()}
                className='w-9 h-9 hover:bg-secondary rounded-lg text-text-secondary hover:text-text-primary'
              >
                <ImageIcon className='w-4.5 h-4.5' />
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => fileInputRef.current?.click()}
                className='w-9 h-9 hover:bg-secondary rounded-lg text-text-secondary hover:text-text-primary'
              >
                <Paperclip className='w-4.5 h-4.5' />
              </Button>
            </div>

            <div className='flex-1 relative'>
              <Textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Nhập nội dung tư vấn gửi khách hàng...'
                className='w-full resize-none min-h-[38px] max-h-[160px] py-2 px-3 pr-10 rounded-xl border border-border-secondary bg-background-secondary focus-visible:ring-primary focus-visible:ring-offset-0 text-sm scrollbar-none'
                rows={1}
              />
            </div>

            <Button
              type='submit'
              size='icon'
              className='w-9.5 h-9.5 rounded-xl bg-primary hover:bg-primary-600 text-white shrink-0 mb-0.5 shadow-sm active:scale-95 transition-all'
            >
              <Send className='w-4.5 h-4.5' />
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
