import * as React from 'react'

import { Bot, Download, FileText, Sparkles, Users } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useNavigate } from 'react-router-dom'
import remarkGfm from 'remark-gfm'

import { type Citation, type Message } from '@/_mocks/chat-data-mock'
import logo from '@/assets/images/logo.png'
import { Avatar, AvatarFallback, AvatarImage, Button } from '@/components/ui'
import { CHAT_STARTER_CATEGORIES } from '@/core/constants/law-major'
import { ROUTE } from '@/core/constants/path'
import { getInitials } from '@/core/helpers/get-initials'
import { cn } from '@/core/lib/utils'
import { useAuthStore } from '@/core/store/features/auth/authStore'

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  onSelectCategory?: (category: string) => void
  onConfirmDeep?: (originalQuestion: string) => void
  onDownloadAnalysis?: (content: string) => void
  onSuggestLawyers?: (domain?: string | null) => void
}

// Render markdown câu trả lời AI (đậm, heading, bảng, danh sách...)
function AiMarkdown({ content }: { content: string }) {
  return (
    <div className='prose prose-sm prose-slate max-w-none text-small text-main leading-relaxed'>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...p }) => <h1 className='text-base font-black text-primary mb-2 mt-3' {...p} />,
          h2: ({ ...p }) => <h2 className='text-sm font-bold text-main mb-1.5 mt-3' {...p} />,
          h3: ({ ...p }) => <h3 className='text-sm font-bold text-main mb-1 mt-2' {...p} />,
          p: ({ ...p }) => <p className='mb-2 leading-relaxed' {...p} />,
          ul: ({ ...p }) => <ul className='list-disc pl-5 mb-2 space-y-1' {...p} />,
          ol: ({ ...p }) => <ol className='list-decimal pl-5 mb-2 space-y-1' {...p} />,
          strong: ({ ...p }) => <strong className='font-bold text-main' {...p} />,
          table: ({ ...p }) => (
            <div className='overflow-x-auto my-3 rounded-lg border border-border-secondary/60'>
              <table className='w-full border-collapse text-xs' {...p} />
            </div>
          ),
          th: ({ ...p }) => <th className='border-b border-border-secondary/60 bg-background-secondary/40 p-2 font-bold text-left' {...p} />,
          td: ({ ...p }) => <td className='border-b border-border-secondary/30 p-2' {...p} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// Hiển thị căn cứ pháp lý (citations) dạng chip nhỏ dưới câu trả lời
function Citations({ items }: { items: Citation[] }) {
  if (!items || items.length === 0) return null
  return (
    <div className='flex flex-wrap gap-1.5 mt-2'>
      {items.map((c, i) => {
        const label = [c.official_code, c.article_no && `Điều ${c.article_no}`, c.clause_no && `Khoản ${c.clause_no}`]
          .filter(Boolean)
          .join(' · ')
        if (!label) return null
        return (
          <span
            key={i}
            title={c.quoted_text || ''}
            className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/8 text-primary text-[10px] font-semibold border border-primary/15'
          >
            <FileText className='w-3 h-3' aria-hidden='true' />
            {label}
          </span>
        )
      })}
    </div>
  )
}

const STARTER_CATEGORIES = [...CHAT_STARTER_CATEGORIES]

export default function ChatMessages({
  messages,
  isLoading,
  messagesEndRef,
  onSelectCategory,
  onConfirmDeep,
  onDownloadAnalysis,
  onSuggestLawyers
}: ChatMessagesProps) {

  const { user } = useAuthStore()
  const navigate = useNavigate()

  // "Xem hồ sơ" → mở trang hồ sơ chi tiết của luật sư đó.
  const handleViewLawyerProfile = (lawyerId: string) => {
    navigate(ROUTE.USER.LAWYER_DETAIL.replace(':id', lawyerId))
  }

  // "Liên hệ" → mở khung chat luật sư, soạn sẵn prompt (kèm gợi ý đính kèm hồ sơ PDF).
  const handleContactLawyer = (lawyerName: string) => {
    const prefillMessage =
      `Xin chào ${lawyerName}, tôi đang gặp một số vấn đề pháp lý và được hệ thống FairInsight ` +
      `kết nối tới Luật sư. Tôi xin gửi kèm bản tổng hợp hồ sơ vụ việc (PDF) do trợ lý AI phân tích. ` +
      `Rất mong Luật sư xem giúp và tư vấn hướng xử lý phù hợp. Tôi xin chân thành cảm ơn.`
    navigate(ROUTE.USER.MESSAGES, { state: { lawyerName, prefillMessage } })
  }

  // Câu hỏi gốc của user (tin user ngay trước 1 bubble AI) — dùng để gửi lại khi
  // bấm "Phân tích sâu".
  const lastUserBefore = (index: number): string => {
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].sender === 'user') return messages[i].content
    }
    return ''
  }

  return (
    <div className='flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 min-h-0'>
      {messages.length === 0 ? (
        // Starter
        <div className='h-full flex flex-col items-center justify-center text-center p-4 max-w-lg mx-auto space-y-4 animate-in fade-in-50 duration-500'>
          <img src={logo} className='w-20 h-20 object-contain' alt="LegalAI Logo" />
          <h3 className='text-h3 text-main font-semibold'>Chào mừng đến với Trợ lý Pháp lý AI</h3>
          <p className='text-small text-text-description leading-relaxed'>
            Hãy nhập nội dung tình huống pháp lý của bạn ở khung chat bên dưới. Bạn có thể đính kèm các hình ảnh hiện trường, biên bản, hợp đồng liên quan để AI phân tích chi tiết.
          </p>

          <div className='flex flex-wrap justify-center gap-2 pt-2 max-w-md mx-auto'>
            {STARTER_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => onSelectCategory?.(category)}
                className='px-3.5 py-2 rounded-xl text-xs font-semibold bg-background-secondary text-main hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 shadow-sm cursor-pointer'
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((message, index) => {
          const isUser = message.sender === 'user'
          return (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 animate-in fade-in slide-in-from-bottom-3 duration-250',
                isUser ? 'ml-auto flex-row-reverse max-w-[90%] lg:max-w-[75%]' : 'max-w-[95%] lg:max-w-[90%] mr-auto'
              )}
            >
              {/* Message Avatar */}
              <Avatar className={cn(
                'w-8 h-8 rounded-lg shrink-0 shadow-sm',
                isUser 
                  ? ' bg-info text-white'
                  : ' bg-background-primaryLight text-primary'
              )}>
                {isUser ? (
                  <AvatarFallback className='text-xs font-semibold border-border-secondary border-1.5'>
                    <Avatar
                      className={cn(
                        'w-8 h-8',
                      )}
                    >
                      {/* Sử dụng optional chaining an toàn để tránh crash khi chưa có dữ liệu */}
                      <AvatarImage src='/images/avatar.png' alt={user?.fullName} />
                      <AvatarFallback className='bg-primary text-white font-bold'>
                        {getInitials(user?.fullName || '')}
                      </AvatarFallback>
                    </Avatar>
                  </AvatarFallback>
                ) : (
                  <AvatarFallback className='text-xs font-semibold border-border-secondary border-1.5'>
                    <Bot className='w-4 h-4 text-primary' aria-hidden='true' />
                  </AvatarFallback>
                )}
              </Avatar>

              {/* Message Content Bubble */}
              <div className='space-y-1.5 min-w-0 w-full'>
                <div
                  className={cn(
                    'p-4 rounded-2xl text-small leading-relaxed text-main',
                    isUser
                      ? 'bg-background-secondary'
                      : 'bg-background-primary'
                  )}
                >
                  {/* Display text contents — AI: markdown; user: plain */}
                  {isUser ? (
                    <div className='whitespace-pre-line text-small font-sans'>
                      {message.content}
                    </div>
                  ) : (
                    <AiMarkdown content={message.content} />
                  )}

                  {/* Căn cứ pháp lý (citations) */}
                  {!isUser && <Citations items={message.citations || []} />}

                  {/* Nút "Phân tích sâu" khi AI mời chuyển sang reasoning */}
                  {!isUser && message.deepPending && onConfirmDeep && (
                    <Button
                      variant='default'
                      size='sm'
                      onClick={() => onConfirmDeep(lastUserBefore(index))}
                      className='mt-3 text-xs font-semibold text-white gap-1.5'
                    >
                      <Sparkles className='w-3.5 h-3.5' aria-hidden='true' />
                      Phân tích sâu vụ việc này
                    </Button>
                  )}

                  {/* Sau khi reasoning ra kết luận → 2 nút: tải bản phân tích / gợi ý luật sư.
                      Dựa vào mode (lưu trong localStorage) để tin cũ load lại vẫn hiện nút. */}
                  {!isUser && (message.showPostActions || message.mode === 'deep_reasoning') && (
                    <div className='mt-3 flex flex-wrap gap-2'>
                      {onDownloadAnalysis && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => onDownloadAnalysis(message.content)}
                          className='text-xs font-semibold gap-1.5'
                        >
                          <Download className='w-3.5 h-3.5' aria-hidden='true' />
                          Tải bản phân tích (PDF)
                        </Button>
                      )}
                      {onSuggestLawyers && (
                        <Button
                          variant='default'
                          size='sm'
                          onClick={() => onSuggestLawyers(message.domain)}
                          className='text-xs font-semibold text-white gap-1.5'
                        >
                          <Users className='w-3.5 h-3.5' aria-hidden='true' />
                          Gợi ý luật sư
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Attachments rendering inside chat bubble */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className='space-y-2 mt-2'>
                      <div className='flex flex-wrap gap-2 mt-2'>
                        {message.attachments.map((att) => (
                          <div key={att.id}>
                            {att.type === 'image' ? (
                              <div className='relative group overflow-hidden rounded-lg max-w-[150px] bg-background-secondary'>
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className='h-20 w-full object-cover group-hover:scale-105 transition-transform'
                                />
                                <div className='absolute bottom-0 inset-x-0 p-1 bg-black/60 text-xs text-white truncate text-center'>
                                  {att.name}
                                </div>
                              </div>
                            ) : (
                              <div className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs shadow-sm max-w-[200px] min-w-0',
                                isUser 
                                  ? 'bg-background-primary text-main'
                                  : 'bg-background-secondary text-main'
                              )}>
                                <FileText className='w-5 h-5 text-info shrink-0' aria-hidden='true' />
                                <div className='min-w-0 flex-1 text-left'>
                                  <p className='font-medium truncate'>{att.name}</p>
                                  <p className='text-[9px] text-text-description'>{att.size}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Render Lawyer recommendation cards if present */}
                {message.lawyers && message.lawyers.length > 0 && (
                  <div className='flex overflow-x-auto gap-4 py-2 w-full xs:max-w-[140px] sm:max-w-[200px] md:max-w-[600px] lg:max-w-[700px] no-scrollbar scroll-smooth'>
                    {message.lawyers.map((lawyer) => (
                      <div
                        key={lawyer.id}
                        className='flex flex-col items-center p-4 bg-background-primary border border-border-secondary rounded-2xl w-[190px] text-center shadow-sm shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-200'
                      >
                        {/* Avatar */}
                        <Avatar className='w-16 h-16 rounded-full shadow-sm mb-3 border border-border-secondary shrink-0'>
                          <AvatarImage src={lawyer.avatar} alt={lawyer.name} />
                          <AvatarFallback className='bg-primary text-white font-bold text-lg'>
                            {getInitials(lawyer.name)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Label: Luật sư */}
                        <span className='text-sm font-semibold tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full mb-2'>
                          Luật sư
                        </span>

                        {/* Họ và tên */}
                        <h4 className='text-sm font-bold text-main truncate w-full mb-1'>
                          {lawyer.name}
                        </h4>

                        {/* Chuyên mục */}
                        <p className='text-xs text-text-description line-clamp-2 min-h-[32px] w-full px-1 mb-4 leading-normal'>
                          {lawyer.specialty}
                        </p>

                        {/* 2 Buttons */}
                        <div className='flex flex-col gap-1.5 w-full mt-auto'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleViewLawyerProfile(lawyer.id)}
                            className='w-full text-xs font-semibold py-1.5 rounded-lg h-auto'
                          >
                            Xem hồ sơ
                          </Button>
                          <Button
                            variant='default'
                            size='sm'
                            onClick={() => handleContactLawyer(lawyer.name)}
                            className='w-full text-xs font-semibold py-1.5 rounded-lg h-auto text-white'
                          >
                            Liên hệ
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className={cn(
                  'text-[10px] text-text-description px-4',
                  isUser && 'text-right'
                )}>
                  {message.timestamp}
                </p>
              </div>
            </div>
          )
        })
      )}

      {/* Waiting AI Loading state bubble */}
      {isLoading && (
        <div className='flex gap-3 max-w-[75%] mr-auto animate-in fade-in duration-200'>
          <Avatar className='w-8 h-8 rounded-lg shrink-0 bg-background-primaryLight'>
            <AvatarFallback className='text-xs font-semibold text-primary'>
              <Bot className='w-4 h-4 animate-bounce' aria-hidden='true' />
            </AvatarFallback>
          </Avatar>
          <div className='bg-background-primary p-4 rounded-2xl text-small text-main'>
            <div className='flex items-center gap-2'>
              <span className='w-2 h-2 rounded-full bg-primary animate-bounce' style={{ animationDelay: '0ms' }} />
              <span className='w-2 h-2 rounded-full bg-primary animate-bounce' style={{ animationDelay: '150ms' }} />
              <span className='w-2 h-2 rounded-full bg-primary animate-bounce' style={{ animationDelay: '300ms' }} />
              <span className='text-small font-medium text-text-description ml-1.5'>
                Trợ lý AI đang nghiên cứu các điều khoản luật…
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  )
}
