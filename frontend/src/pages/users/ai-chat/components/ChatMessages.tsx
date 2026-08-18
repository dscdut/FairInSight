import * as React from 'react'

import { Bot, Brain, Check, ChevronDown, Download, FileText, ShieldCheck, Sparkles, Users } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useNavigate } from 'react-router-dom'
import remarkGfm from 'remark-gfm'

import logo from '@/assets/images/logo.png'
import { Avatar, AvatarFallback, AvatarImage, Button } from '@/components/ui'
import { CHAT_STARTER_CATEGORIES } from '@/core/constants/law-major'
import { ROUTE } from '@/core/constants/path'
import { getInitials } from '@/core/helpers/get-initials'
import { cn } from '@/core/lib/utils'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { type ChatMessageView } from '@/models/ai-chat/chat-view.type'
import {
  type ChatCitation,
  type ChatWorkflowStage
} from '@/models/ai-chat/contracts'

interface ChatMessagesProps {
  messages: ChatMessageView[]
  isLoading: boolean
  isDetailLoading?: boolean
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  onSelectCategory?: (category: string) => void
  onDownloadAnalysis?: (message: ChatMessageView) => void
  onSuggestLawyers?: (message: ChatMessageView) => void
  isSuggestingLawyers?: boolean
  canExportPdf?: boolean | null
  canSuggestLawyer?: boolean | null
}

const STAGE_LABELS: Partial<Record<ChatWorkflowStage, string>> = {
  received: 'Đã nhận yêu cầu…',
  understanding: 'Đang hiểu tình huống và ghi nhận dữ kiện…',
  planning: 'Đang lập kế hoạch tra cứu…',
  retrieving: 'Đang tìm căn cứ pháp lý liên quan…',
  checking_applicability: 'Đang kiểm tra điều kiện áp dụng…',
  researching: 'Đang lần theo dẫn chiếu và hiệu lực văn bản…',
  applying_law: 'Đang đối chiếu căn cứ với vụ việc…',
  verifying: 'Đang kiểm chứng nhận định và trích dẫn…',
  writing_report: 'Đang hoàn thiện bản định vị pháp lý…'
}

const REASONING_CYCLES = [
  'Đã nhận yêu cầu & đang khởi tạo quy trình tư vấn…',
  'Đang hiểu tình huống, trích xuất dữ kiện & từ khóa pháp lý…',
  'Đang lập kế hoạch tra cứu trong hệ thống pháp luật Việt Nam…',
  'Đang tìm căn cứ pháp lý, điều luật & văn bản quy phạm liên quan…',
  'Đang kiểm tra điều kiện áp dụng & đối chiếu với tình huống…',
  'Đang lần theo dẫn chiếu, văn bản hướng dẫn & hiệu lực thi hành…',
  'Đang áp dụng điều luật & xây dựng lập luận pháp lý chuyên sâu…',
  'Đang kiểm chứng nhận định, kiểm tra trích dẫn & hoàn thiện bản báo cáo…'
]

const CONTRACT_REASONING_CYCLES = [
  'Đã nhận file DOCX và câu hỏi đi kèm…',
  'Đang đọc nội dung hợp đồng, bảng và các đoạn văn bản chính…',
  'Đang tách dữ liệu sạch: các bên, vai trò, điều khoản, nghĩa vụ và mốc thời gian…',
  'Đang kiểm tra dẫn chiếu nội bộ, phụ lục, điều khoản móc nối và quan hệ giữa các bên…',
  'Đang nhận diện rủi ro: thiếu điều khoản, mơ hồ, bất lợi hoặc cần đối chiếu luật…',
  'Đang chọn nhóm vấn đề pháp lý cần kiểm tra theo pháp luật Việt Nam…',
  'Đang tổng hợp nhận xét, khuyến nghị sửa và cảnh báo phần cần luật sư xem thêm…'
]

function ProcessingIndicator({ stage, mode }: { stage?: ChatWorkflowStage | null; mode?: string | null }) {
  const [cycleIndex, setCycleIndex] = React.useState(0)
  const isContract = mode === 'contract'
  const cycles = isContract ? CONTRACT_REASONING_CYCLES : REASONING_CYCLES

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % cycles.length)
    }, 2800)
    return () => clearInterval(timer)
  }, [cycles.length])

  const safeIndex = cycleIndex % cycles.length
  const currentText = isContract
    ? cycles[safeIndex]
    : (stage && STAGE_LABELS[stage]) || cycles[safeIndex]

  return (
    <div
      role='status'
      aria-live='polite'
      className='flex flex-col gap-2.5 py-1.5 text-xs text-text-description'
    >
      <div className='flex items-center gap-2.5'>
        <div className='flex shrink-0 items-center gap-1.5' aria-hidden='true'>
          <span className='h-2.5 w-2.5 animate-bounce rounded-full bg-primary' />
          <span className='h-2.5 w-2.5 animate-bounce rounded-full bg-primary [animation-delay:180ms]' />
          <span className='h-2.5 w-2.5 animate-bounce rounded-full bg-primary [animation-delay:360ms]' />
        </div>
        <span className='font-black uppercase tracking-wider text-primary text-[11px] animate-pulse flex items-center gap-1.5'>
          <Brain className='h-3.5 w-3.5 animate-spin duration-1000' />
          {isContract ? 'Đang phân tích hợp đồng…' : 'Đang suy luận & phân tích pháp lý…'}
        </span>
      </div>

      <div className='ml-5 rounded-xl border border-primary/25 bg-primary/8 p-3 transition-all duration-300 shadow-2xs'>
        <p className='font-semibold italic text-main/95 text-xs flex items-center gap-2'>
          <span className='inline-block h-2 w-2 rounded-full bg-primary animate-ping shrink-0' />
          <span className='animate-in fade-in slide-in-from-left-2 duration-300'>{currentText}</span>
        </p>
      </div>
    </div>
  )
}

function ReasoningHeader({ mode }: { mode?: string | null }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const isContract = mode === 'contract'

  return (
    <div className='mb-3.5 border-b border-border-secondary/60 pb-3'>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-2 text-xs font-semibold text-text-description hover:text-primary transition-colors cursor-pointer group'
      >
        <div className='flex items-center gap-1.5 rounded-xl bg-background-secondary/80 px-3 py-1.2 border border-border-secondary/80 group-hover:border-primary/40 shadow-2xs transition-all'>
          <Brain className='h-3.5 w-3.5 text-primary' />
          <span className='font-extrabold text-main text-[11px]'>
            {isContract
              ? 'Đã phân tích hợp đồng và đối chiếu vấn đề cần kiểm tra'
              : mode === 'deep' ? 'Đã hoàn tất phân tích chuyên sâu (9 bước)' : 'Đã suy luận & đối chiếu căn cứ pháp lý'}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200 text-text-description', isOpen && 'rotate-180')} />
        </div>
      </button>

      {isOpen && (
        <div className='mt-2.5 rounded-xl border border-border-secondary/60 bg-background-secondary/50 p-3 text-xs space-y-2 animate-in fade-in slide-in-from-top-1 duration-200'>
          <p className='font-extrabold text-[10px] uppercase tracking-wider text-text-description mb-2 flex items-center gap-1.5'>
            <Sparkles className='h-3 w-3 text-primary' />
            {isContract ? 'Quy trình phân tích hợp đồng đã thực hiện:' : 'Quy trình suy luận & tra cứu đã thực hiện:'}
          </p>
          {isContract ? (
            <div className='space-y-1.5 text-main/90 text-[11px]'>
              <div className='flex items-center gap-2'>
                <Check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                <span>Đọc DOCX, tách bảng, điều khoản và thông tin nền của hợp đồng</span>
              </div>
              <div className='flex items-center gap-2'>
                <Check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                <span>Trích xuất các bên, quan hệ, nghĩa vụ, tiền, thời hạn và dẫn chiếu nội bộ</span>
              </div>
              <div className='flex items-center gap-2'>
                <Check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                <span>Chọn nhóm điều khoản cần kiểm tra pháp lý và lập kế hoạch đối chiếu luật</span>
              </div>
              <div className='flex items-center gap-2'>
                <Check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                <span>Tổng hợp rủi ro, điểm cần sửa và khuyến nghị theo ngữ cảnh doanh nghiệp</span>
              </div>
            </div>
          ) : (
            <div className='space-y-1.5 text-main/90 text-[11px]'>
              <div className='flex items-center gap-2'>
                <Check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                <span>Phân tích tình huống, trích xuất dữ kiện & nhóm vấn đề pháp lý</span>
              </div>
              <div className='flex items-center gap-2'>
                <Check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                <span>Tra cứu căn cứ trong cơ sở dữ liệu Văn bản Quy phạm Pháp luật</span>
              </div>
              <div className='flex items-center gap-2'>
                <Check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                <span>Kiểm tra điều kiện áp dụng, hiệu lực văn bản & trích dẫn điều luật</span>
              </div>
              <div className='flex items-center gap-2'>
                <Check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                <span>Tổng hợp đánh giá pháp lý & xây dựng định hướng giải quyết</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AiMarkdown({ content }: { content: string }) {
  return (
    <div className='prose prose-sm prose-slate max-w-none text-small leading-relaxed text-main'>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          h1: ({ ...props }) => <h1 className='mb-2 mt-3 text-base font-black text-primary' {...props} />,
          h2: ({ ...props }) => <h2 className='mb-1.5 mt-3 text-sm font-bold text-main' {...props} />,
          h3: ({ ...props }) => <h3 className='mb-1 mt-2 text-sm font-bold text-main' {...props} />,
          p: ({ ...props }) => <p className='mb-2 leading-relaxed' {...props} />,
          ul: ({ ...props }) => <ul className='mb-2 list-disc space-y-1 pl-5' {...props} />,
          ol: ({ ...props }) => <ol className='mb-2 list-decimal space-y-1 pl-5' {...props} />,
          strong: ({ ...props }) => <strong className='font-bold text-main' {...props} />,
          a: ({ href, children, ...props }) => {
            const safeHref = href?.startsWith('https://') ? href : undefined
            return safeHref
              ? <a href={safeHref} target='_blank' rel='noopener noreferrer' {...props}>{children}</a>
              : <span>{children}</span>
          },
          table: ({ ...props }) => (
            <div className='my-3 overflow-x-auto rounded-lg border border-border-secondary/60'>
              <table className='w-full border-collapse text-xs' {...props} />
            </div>
          ),
          th: ({ ...props }) => <th className='border-b border-border-secondary/60 bg-background-secondary/40 p-2 text-left font-bold' {...props} />,
          td: ({ ...props }) => <td className='border-b border-border-secondary/30 p-2' {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function Citations({ items }: { items: ChatCitation[] }) {
  if (!items.length) return null
  return (
    <section className='mt-3 border-t border-border-secondary/50 pt-2' aria-label='Căn cứ pháp lý'>
      <p className='mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-description'>Căn cứ đã sử dụng</p>
      <div className='flex flex-wrap gap-1.5'>
        {items.map((citation, index) => {
          const label = [
            citation.official_code,
            citation.article_no && `Điều ${citation.article_no}`,
            citation.clause_no && `Khoản ${citation.clause_no}`
          ].filter(Boolean).join(' · ')
          if (!label) return null
          return (
            <span
              key={`${label}-${index}`}
              title={citation.quoted_text || undefined}
              className='inline-flex items-center gap-1 rounded-md border border-primary/15 bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary'
            >
              <FileText className='h-3 w-3' aria-hidden='true' />
              {label}
            </span>
          )
        })}
      </div>
    </section>
  )
}

function BillingSummary({ message }: { message: ChatMessageView }) {
  const billing = message.billing
  if (!billing) return null
  if (billing.status === 'NONE') {
    return <p className='mt-2 text-[11px] text-text-description'>Cần thêm thông tin để tiếp tục · chưa trừ credit</p>
  }
  if (billing.status === 'RELEASED' || billing.status === 'REFUNDED') {
    return <p className='mt-2 text-[11px] text-text-description'>Yêu cầu chưa hoàn tất · credit đã được hoàn lại</p>
  }
  if (billing.status === 'SHADOW') {
    return <p className='mt-2 text-[11px] text-text-description'>Đang ở chế độ thử nghiệm · chưa trừ credit</p>
  }
  return (
    <p className='mt-2 text-[11px] text-text-description'>
      Đã dùng {billing.chargedCredits.toLocaleString('vi-VN')} credit · còn {billing.remainingCredits.toLocaleString('vi-VN')}
    </p>
  )
}

export default function ChatMessages({
  messages,
  isLoading,
  isDetailLoading = false,
  messagesEndRef,
  onSelectCategory,
  onDownloadAnalysis,
  onSuggestLawyers,
  isSuggestingLawyers = false,
  canExportPdf = null,
  canSuggestLawyer = null
}: ChatMessagesProps) {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const [lawyerConsentMessageId, setLawyerConsentMessageId] = React.useState<string | null>(null)

  const handleContactLawyer = (lawyerName: string) => {
    const prefillMessage =
      `Xin chào ${lawyerName}, tôi được FairInsight gợi ý liên hệ để được hỗ trợ pháp lý. ` +
      'Tôi sẽ chủ động chọn những tài liệu và thông tin muốn chia sẻ.'
    navigate(ROUTE.USER.MESSAGES, { state: { lawyerName, prefillMessage } })
  }

  if (isDetailLoading) {
    return (
      <div className='flex flex-1 flex-col gap-4 overflow-hidden p-4 lg:p-6' aria-label='Đang tải nội dung cuộc trò chuyện'>
        <div className='h-20 w-2/3 animate-pulse rounded-2xl bg-background-secondary' />
        <div className='ml-auto h-14 w-1/2 animate-pulse rounded-2xl bg-background-secondary' />
        <div className='h-32 w-4/5 animate-pulse rounded-2xl bg-background-secondary' />
      </div>
    )
  }

  return (
    <div className='min-h-0 flex-1 space-y-4 overflow-y-auto p-4 lg:p-6'>
      {messages.length === 0 ? (
        <div className='mx-auto flex h-full max-w-lg flex-col items-center justify-center space-y-4 p-4 text-center animate-in fade-in-50 duration-500'>
          <img src={logo} className='h-20 w-20 object-contain' alt='FairInsight' />
          <h2 className='text-h3 font-semibold text-main'>Chào mừng đến với Trợ lý Pháp lý AI</h2>
          <p className='text-small leading-relaxed text-text-description'>
            Hãy mô tả tình huống, các bên liên quan, thời điểm xảy ra, tài liệu bạn đang có và điều bạn muốn được giải quyết.
          </p>
          <div className='mx-auto flex max-w-md flex-wrap justify-center gap-2 pt-2'>
            {CHAT_STARTER_CATEGORIES.map((category) => (
              <button
                key={category}
                type='button'
                onClick={() => onSelectCategory?.(category)}
                className='cursor-pointer rounded-xl bg-background-secondary px-3.5 py-2 text-xs font-semibold text-main shadow-sm transition-colors hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      ) : messages.map((message) => {
        const isUser = message.sender === 'user'
        const isProcessing = !isUser && message.status === 'processing'
        const exportReady = !isUser && Boolean(message.content) && message.status !== 'failed'
        const lawyerReady = !isUser && Boolean(message.content) && message.status !== 'failed'
        const showActions = !isUser && !isProcessing && Boolean(exportReady || lawyerReady)

        return (
          <article
            key={message.id}
            className={cn(
              'flex gap-3 animate-in fade-in slide-in-from-bottom-3 duration-250',
              isUser ? 'ml-auto max-w-[90%] flex-row-reverse lg:max-w-[75%]' : 'mr-auto max-w-[95%] lg:max-w-[90%]'
            )}
          >
            <Avatar className={cn('h-8 w-8 shrink-0 rounded-lg shadow-sm', isUser ? 'bg-info text-white' : 'bg-background-primaryLight text-primary')}>
              {isUser ? (
                <AvatarFallback className='border-1.5 border-border-secondary text-xs font-semibold'>
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src={user?.avatarUrl || '/images/avatar.png'} alt={user?.fullName || 'Người dùng'} />
                    <AvatarFallback className='bg-primary font-bold text-white'>{getInitials(user?.fullName || '')}</AvatarFallback>
                  </Avatar>
                </AvatarFallback>
              ) : (
                <AvatarFallback className='border-1.5 border-border-secondary text-xs font-semibold'>
                  <Bot className='h-4 w-4 text-primary' aria-hidden='true' />
                </AvatarFallback>
              )}
            </Avatar>

            <div className='min-w-0 w-full space-y-1.5'>
              <div className={cn(
                'rounded-2xl p-4 text-small leading-relaxed text-main',
                isUser ? 'bg-background-secondary' : 'bg-background-primary',
                message.status === 'failed' && 'border border-error-primary/30'
              )}>
                {isUser
                  ? <div className='whitespace-pre-line font-sans text-small'>{message.content}</div>
                  : isProcessing
                    ? <ProcessingIndicator stage={message.stage} mode={message.mode} />
                    : (
                      <>
                        <ReasoningHeader mode={message.mode} />
                        <AiMarkdown content={message.content} />
                      </>
                    )}

                {!isUser && !isProcessing && <Citations items={message.citations || []} />}
                {!isUser && !isProcessing && <BillingSummary message={message} />}

                {showActions && (
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {onDownloadAnalysis && exportReady && canExportPdf !== false && (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => onDownloadAnalysis(message)}
                        className='gap-1.5 text-xs font-semibold'
                      >
                        <Download className='h-3.5 w-3.5' aria-hidden='true' />
                        Tải bản phân tích (PDF)
                      </Button>
                    )}
                    {onSuggestLawyers && lawyerReady && canSuggestLawyer !== false && (
                      <Button
                        variant='default'
                        size='sm'
                        onClick={() => setLawyerConsentMessageId(message.id)}
                        disabled={isSuggestingLawyers}
                        className='gap-1.5 text-xs font-semibold text-white'
                      >
                        <Users className='h-3.5 w-3.5' aria-hidden='true' />
                        {isSuggestingLawyers ? 'Đang tìm luật sư…' : 'Gợi ý luật sư'}
                      </Button>
                    )}
                    {((exportReady && canExportPdf === false) || (lawyerReady && canSuggestLawyer === false)) && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => navigate(ROUTE.USER.BILLING)}
                        className='text-xs text-text-description'
                      >
                        Xem gói để mở thêm tính năng
                      </Button>
                    )}
                  </div>
                )}

                {lawyerConsentMessageId === message.id && (
                  <div className='mt-3 rounded-xl border border-border-secondary bg-background-secondary/50 p-3'>
                    <div className='flex gap-2 text-xs text-main'>
                      <ShieldCheck className='h-4 w-4 shrink-0 text-primary' aria-hidden='true' />
                      <p>Hệ thống chỉ dùng lĩnh vực pháp lý của báo cáo để tìm luật sư; không tự gửi toàn bộ nội dung trò chuyện.</p>
                    </div>
                    {message.handoff?.specialty_codes?.length ? (
                      <p className='mt-2 text-xs text-text-description'>Nhóm vấn đề: {message.handoff.specialty_codes.join('; ')}</p>
                    ) : null}
                    <div className='mt-2 flex gap-2'>
                      <Button
                        size='sm'
                        onClick={() => {
                          setLawyerConsentMessageId(null)
                          onSuggestLawyers?.(message)
                        }}
                        className='text-xs text-white'
                      >
                        Đồng ý tìm luật sư
                      </Button>
                      <Button variant='ghost' size='sm' onClick={() => setLawyerConsentMessageId(null)} className='text-xs'>Hủy</Button>
                    </div>
                  </div>
                )}
              </div>

              {message.lawyers && message.lawyers.length > 0 && (
                <div className='flex w-full gap-4 overflow-x-auto py-2 scroll-smooth md:max-w-[600px] lg:max-w-[700px]'>
                  {message.lawyers.map((lawyer) => (
                    <div key={lawyer.id} className='flex w-[210px] shrink-0 flex-col items-center rounded-2xl border border-border-secondary bg-background-primary p-4 text-center shadow-sm'>
                      <Avatar className='mb-3 h-16 w-16 shrink-0 rounded-full border border-border-secondary shadow-sm'>
                        <AvatarImage src={lawyer.avatar} alt={lawyer.name} />
                        <AvatarFallback className='bg-primary text-lg font-bold text-white'>{getInitials(lawyer.name)}</AvatarFallback>
                      </Avatar>
                      <h3 className='mb-1 w-full truncate text-sm font-bold text-main'>{lawyer.name}</h3>
                      <p className='mb-4 min-h-[32px] w-full line-clamp-2 text-xs leading-normal text-text-description'>{lawyer.specialty}</p>
                      <div className='mt-auto flex w-full flex-col gap-1.5'>
                        <Button variant='outline' size='sm' onClick={() => navigate(ROUTE.USER.LAWYER_DETAIL.replace(':id', lawyer.id))} className='w-full text-xs font-semibold'>Xem hồ sơ</Button>
                        <Button size='sm' onClick={() => handleContactLawyer(lawyer.name)} className='w-full text-xs font-semibold text-white'>Liên hệ</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className={cn('px-4 text-[10px] text-text-description', isUser && 'text-right')}>{message.timestamp}</p>
            </div>
          </article>
        )
      })}

      {isLoading && (
        <div className='mr-auto flex max-w-[75%] gap-3' aria-live='polite'>
          <Avatar className='h-8 w-8 shrink-0 rounded-lg bg-background-primaryLight'>
            <AvatarFallback className='text-xs font-semibold text-primary'><Bot className='h-4 w-4' aria-hidden='true' /></AvatarFallback>
          </Avatar>
          <div className='rounded-2xl bg-background-primary p-4 text-small text-main'><ProcessingIndicator /></div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
