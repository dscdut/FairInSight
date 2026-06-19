import * as React from 'react'
import { useRef, useEffect } from 'react'

import { Send, Paperclip, Image as ImageIcon, FileText, X, Scale, FileDown } from 'lucide-react'

import { Button, Textarea } from '@/components/ui'
import { cn } from '@/core/lib/utils'

interface Attachment {
  id: string
  name: string
  type: 'image' | 'file'
  url?: string
  size?: string
}

interface ChatInputProps {
  inputText: string
  setInputText: (text: string) => void
  attachments: Attachment[]
  onRemoveAttachment: (id: string) => void
  onAttach: (files: FileList | null, type: 'file' | 'image') => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  onRequestLawyer?: () => void
  onExportPdf?: () => void
  showSuggestions?: boolean
}

export default function ChatInput({
  inputText,
  setInputText,
  attachments,
  onRemoveAttachment,
  onAttach,
  onSubmit,
  isLoading,
  onRequestLawyer,
  onExportPdf,
  showSuggestions = false
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
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

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const triggerImageInput = () => {
    imageInputRef.current?.click()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e)
    }
  }

  return (
    <div className='p-3 lg:p-4 bg-background-primary shrink-0'>
      {/* Hidden File Inputs */}
      <input
        type='file'
        ref={fileInputRef}
        onChange={(e) => {
          onAttach(e.target.files, 'file')
          e.target.value = ''
        }}
        accept='.pdf,.doc,.docx,.xls,.xlsx,.txt'
        className='hidden'
        multiple
      />
      <input
        type='file'
        ref={imageInputRef}
        onChange={(e) => {
          onAttach(e.target.files, 'image')
          e.target.value = ''
        }}
        accept='image/*'
        className='hidden'
        multiple
      />

      {/* Attachment Previews Area */}
      {attachments.length > 0 && (
        <div className='flex flex-wrap gap-2 mb-2 rounded-lg max-h-[140px] overflow-y-auto animate-in slide-in-from-bottom-2 duration-200'>
          {attachments.map((att) => (
            <div
              key={att.id}
              className='relative flex items-center gap-2 p-1.5 pr-8 bg-background-primary border border-border-secondary rounded-lg text-xs max-w-[180px] shadow-sm shrink-0'
            >
              {att.type === 'image' ? (
                <img
                  src={att.url}
                  alt={att.name}
                  className='w-5 h-5 object-cover rounded '
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
                onClick={() => onRemoveAttachment(att.id)}
                aria-label={`Xóa ${att.type === 'image' ? 'hình ảnh' : 'tài liệu'} ${att.name}`}
                className='absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-background-secondary focus-visible:ring-1 focus-visible:ring-info focus-visible:outline-none flex items-center justify-center text-text-description hover:text-slate-600 transition-colors'
              >
                <X className='w-3.5 h-3.5' aria-hidden='true' />
              </button>
            </div>
          ))}
        </div>
      )}

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
            placeholder='Mô tả vụ việc pháp lý hoặc đặt câu hỏi pháp luật tại đây…'
            className='min-h-[44px] w-full bg-transparent border-0 ring-0 focus-visible:ring-0 shadow-none py-3 pl-3 pr-24 leading-relaxed text-sm resize-none overflow-y-auto'
            rows={1}
          />

          {/* Left Attachment Action Buttons */}
          <div className='absolute right-2 bottom-1.5 flex items-center gap-1'>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              onClick={triggerImageInput}
              title='Đính kèm hình ảnh'
              aria-label='Đính kèm hình ảnh'
              className='w-8 h-8 rounded-lg text-text-description hover:text-primary hover:bg-background-secondary transition-all focus-visible:ring-1 focus-visible:ring-info focus-visible:outline-none'
            >
              <ImageIcon className='w-4 h-4' aria-hidden='true' />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              onClick={triggerFileInput}
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
          loading={isLoading}
          disabled={!inputText.trim() && attachments.length === 0}
          aria-label='Gửi tin nhắn'
          className={cn(
            'h-11 w-11 rounded-xl font-medium shrink-0 shadow-sm transition-all flex items-center gap-2 duration-300 focus-visible:ring-1 focus-visible:ring-info focus-visible:outline-none',
            (inputText.trim() || attachments.length > 0)
              ? 'bg-primary text-white hover:bg-primary/50 shadow-md hover:scale-[1.02]'
              : 'bg-background-secondary text-text-description'
          )}
        >
          {!isLoading && <Send className='w-4 h-4' aria-hidden='true' />}
        </Button>
      </form>
      <p className='text-xs text-text-description text-center mx-auto mt-2 leading-normal max-w-4xl'>
        Thông tin do AI cung cấp chỉ mang tính chất tham khảo. Vui lòng tư vấn luật sư cho các quyết định pháp lý quan trọng.
      </p>
    </div>
  )
}
