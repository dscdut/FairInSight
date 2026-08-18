import * as React from 'react'
import { useEffect, useRef } from 'react'

import { FileDown, FileText, Paperclip, Scale, Send, X } from 'lucide-react'

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
  mode?: 'legal' | 'contract'
  selectedFile?: File | null
  onFileChange?: (file: File | null) => void
  onRequestLawyer?: () => void
  onExportPdf?: () => void
  showSuggestions?: boolean
}

export default function ChatInput({
  inputText,
  setInputText,
  onSubmit,
  isLoading,
  mode = 'legal',
  selectedFile = null,
  onFileChange,
  onRequestLawyer,
  onExportPdf,
  showSuggestions = false
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  const contractMode = mode === 'contract'
  const canSubmit = Boolean(inputText.trim()) && !overLimit && (!contractMode || Boolean(selectedFile))

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

      {contractMode && (
        <div className='mb-2 flex min-w-0 flex-wrap items-center gap-2'>
            <input
              ref={fileInputRef}
              type='file'
              accept='.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              className='hidden'
              onChange={(event) => onFileChange?.(event.target.files?.[0] ?? null)}
            />
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className='gap-1.5 text-xs'
            >
              <Paperclip className='h-3.5 w-3.5' aria-hidden='true' />
              Đính kèm DOCX
            </Button>
            {selectedFile && (
              <span className='inline-flex min-w-0 max-w-[220px] items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-xs font-medium text-main'>
                <FileText className='h-3.5 w-3.5 shrink-0 text-primary' aria-hidden='true' />
                <span className='truncate'>{selectedFile.name}</span>
                <button
                  type='button'
                  onClick={() => onFileChange?.(null)}
                  disabled={isLoading}
                  className='rounded p-0.5 text-text-description hover:bg-background-secondary hover:text-main'
                  aria-label='Bỏ tệp hợp đồng'
                >
                  <X className='h-3 w-3' aria-hidden='true' />
                </button>
              </span>
            )}
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
            placeholder={contractMode
              ? 'Đính kèm DOCX và hỏi điều bạn muốn kiểm tra trong hợp đồng...'
              : 'Mô tả vụ việc pháp lý hoặc đặt câu hỏi pháp luật tại đây...'}
            className='min-h-[44px] w-full bg-transparent border-0 ring-0 focus-visible:ring-0 shadow-none py-3 px-3 leading-relaxed text-sm resize-none overflow-y-auto'
            rows={1}
          />
        </div>

        {/* Dynamic Send Button */}
        <Button
          type='submit'
          loading={isLoading}
          disabled={isLoading || !canSubmit}
          aria-busy={isLoading}
          aria-label='Gửi tin nhắn'
          className={cn(
            'h-11 w-11 rounded-xl font-medium shrink-0 shadow-sm transition-all flex items-center gap-2 duration-300 focus-visible:ring-1 focus-visible:ring-info focus-visible:outline-none',
            canSubmit
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

      {contractMode && !selectedFile && (
        <p className='mt-1.5 text-center text-xs text-text-description'>
          Chế độ hợp đồng cần một file DOCX và câu hỏi đi kèm.
        </p>
      )}

      <p className='text-xs text-text-description text-center mx-auto mt-2 leading-normal max-w-4xl'>
        Thông tin do AI cung cấp chỉ mang tính chất tham khảo. Vui lòng tư vấn luật sư cho các quyết định pháp lý quan trọng.
      </p>
    </div>
  )
}
