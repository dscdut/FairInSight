import * as React from 'react'
import { useEffect, useRef } from 'react'

import { FileDown, Scale, Send } from 'lucide-react'

import { Button, Textarea } from '@/components/ui'
import { cn } from '@/core/lib/utils'

// Đây chỉ là guard UX. Server vẫn là nơi quyết định token/page budget và trả 413
// nếu yêu cầu vượt giới hạn của workflow/model đang được cấu hình.
export const CHAT_MAX_CHARS = 12000
const CHAT_WARN_CHARS = Math.floor(CHAT_MAX_CHARS * 0.8)

interface ChatInputProps {
  inputText: string
  setInputText: (text: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  onRequestLawyer?: () => void
  onExportPdf?: () => void
  showSuggestions?: boolean
}

export default function ChatInput({
  inputText,
  setInputText,
  onSubmit,
  isLoading,
  onRequestLawyer,
  onExportPdf,
  showSuggestions = false
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow textarea height based on content length
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const maxHeight = 160
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    }
  }, [inputText])

  const charCount = inputText.length
  const overLimit = charCount > CHAT_MAX_CHARS
  const nearLimit = charCount >= CHAT_WARN_CHARS

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (overLimit) return // vượt trần → chặn gửi bằng Enter
      onSubmit(e)
    }
  }

  return (
    <div className='p-3 lg:p-4 bg-background-primary shrink-0'>
      {/* Quick Action Suggestions */}
      {showSuggestions && (
        <div className='flex items-center gap-2 mb-3 animate-in slide-in-from-bottom-2 duration-300'>
          <span className='text-[10px] font-bold tracking-wider text-text-description uppercase shrink-0'>
            Gợi ý nhanh:
          </span>
          <div className='flex flex-wrap gap-2'>
            <button
              type='button'
              onClick={onRequestLawyer}
              disabled={isLoading}
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-background-secondary text-main border border-border-secondary hover:border-primary hover:text-primary transition-all duration-200 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
            >
              <Scale className='w-3.5 h-3.5' />
              <span>Yêu cầu luật sư</span>
            </button>
            <button
              type='button'
              onClick={onExportPdf}
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-background-secondary text-main border border-border-secondary hover:border-emerald-500 hover:text-emerald-600 transition-all duration-200 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
            >
              <FileDown className='w-3.5 h-3.5' />
              <span>Xuất PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Input Form Box */}
      <form onSubmit={onSubmit} className='relative flex items-end gap-2'>
        <div
          className={cn(
            'flex-1 relative border rounded-xl bg-background-secondary shadow-inner transition-all',
            overLimit
              ? 'border-error-primary focus-within:ring-1 focus-within:ring-error-primary'
              : 'border-border-secondary focus-within:ring-1 focus-within:ring-primary'
          )}
        >
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
            disabled={isLoading}
            placeholder='Mô tả vụ việc pháp lý hoặc đặt câu hỏi pháp luật tại đây…'
            className='min-h-[44px] w-full bg-transparent border-0 ring-0 focus-visible:ring-0 shadow-none py-3 px-3 leading-relaxed text-sm resize-none overflow-y-auto'
            rows={1}
          />
        </div>

        {/* Dynamic Send Button */}
        <Button
          type='submit'
          loading={isLoading}
          disabled={isLoading || !inputText.trim() || overLimit}
          aria-busy={isLoading}
          aria-label='Gửi tin nhắn'
          className={cn(
            'h-11 w-11 rounded-xl font-medium shrink-0 shadow-sm transition-all flex items-center gap-2 duration-300 focus-visible:ring-1 focus-visible:ring-info focus-visible:outline-none',
            inputText.trim() && !overLimit
              ? 'bg-primary text-white hover:bg-primary/50 shadow-md hover:scale-[1.02]'
              : 'bg-background-secondary text-text-description'
          )}
        >
          {!isLoading && <Send className='w-4 h-4' aria-hidden='true' />}
        </Button>
      </form>

      {/* Bộ đếm ký tự + cảnh báo vượt trần. Chỉ hiện khi gần/đã chạm trần để đỡ rối. */}
      {nearLimit && (
        <p
          className={cn(
            'text-xs text-right mt-1.5 leading-normal font-medium',
            overLimit ? 'text-error-primary' : 'text-text-description'
          )}
          aria-live='polite'
        >
          {overLimit
            ? `Câu hỏi quá dài (${charCount.toLocaleString('vi-VN')}/${CHAT_MAX_CHARS.toLocaleString('vi-VN')} ký tự). Vui lòng rút ngắn để gửi.`
            : `${charCount.toLocaleString('vi-VN')}/${CHAT_MAX_CHARS.toLocaleString('vi-VN')} ký tự`}
        </p>
      )}

      <p className='text-xs text-text-description text-center mx-auto mt-2 leading-normal max-w-4xl'>
        Thông tin do AI cung cấp chỉ mang tính chất tham khảo. Vui lòng tư vấn luật sư cho các quyết định pháp lý quan trọng.
      </p>
    </div>
  )
}
