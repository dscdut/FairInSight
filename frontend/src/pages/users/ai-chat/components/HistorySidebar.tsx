import { HelpCircle, Plus, RefreshCcw, Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui'
import { cn } from '@/core/lib/utils'
import { type ChatSessionView } from '@/models/ai-chat/chat-view.type'

interface HistorySidebarProps {
  sessions: ChatSessionView[]
  activeSessionId: string
  setActiveSessionId: (id: string) => void
  onNewChat: () => void
  onDeleteSession: (id: string, e: React.MouseEvent) => void
  onCloseMobile?: () => void
  showCloseButton?: boolean
  className?: string
  loadState?: 'loading' | 'ready' | 'error'
  onRetry?: () => void
}

export default function HistorySidebar({
  sessions,
  activeSessionId,
  setActiveSessionId,
  onNewChat,
  onDeleteSession,
  onCloseMobile,
  showCloseButton = false,
  className,
  loadState = 'ready',
  onRetry
}: HistorySidebarProps) {
  return (
    <div className={cn('flex flex-col h-full bg-background-primary min-h-0 relative z-10 px-4 py-4', className)}>

      <Button
        variant='default'
        onClick={() => {
          onNewChat()
          if (onCloseMobile) onCloseMobile()
        }}
        className='w-full flex items-center gap-2.5 p-3 rounded-xl text-sm font-semibold h-auto justify-start border-0 mb-4 focus-visible:ring-1 focus-visible:ring-info focus-visible:outline-none'
      >
        <Plus className='w-4 h-4 shrink-0' aria-hidden='true' />
        <span className='truncate'>Bắt đầu cuộc trò chuyện mới</span>
      </Button>

      {/* History Header */}
      <div className='flex items-center justify-between shrink-0 bg-background-primary'>
        <h3 className='text-h5 text-main font-semibold flex items-center gap-2'>
          Lịch sử
        </h3>
        {showCloseButton && onCloseMobile && (
          <Button
            variant='ghost'
            size='icon'
            onClick={onCloseMobile}
            aria-label='Đóng lịch sử'
            className='text-text-description hover:text-main rounded-lg lg:hidden focus-visible:ring-1 focus-visible:ring-info focus-visible:outline-none'
          >
            <X className='w-5 h-5' aria-hidden='true' />
          </Button>
        )}
      </div>

      {/* Saved Sessions list */}
      <div className='flex-1 overflow-y-auto py-2 space-y-0'>
        {loadState === 'loading' ? (
          <div className='space-y-2 p-1' aria-label='Đang tải lịch sử'>
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className='h-10 animate-pulse rounded-xl bg-background-secondary' />
            ))}
          </div>
        ) : loadState === 'error' ? (
          <div className='flex h-full flex-col items-center justify-center gap-3 p-4 text-center text-text-description'>
            <p className='text-xs'>Không tải được lịch sử trò chuyện.</p>
            {onRetry && (
              <Button variant='outline' size='sm' onClick={onRetry} className='gap-1.5 text-xs'>
                <RefreshCcw className='h-3.5 w-3.5' aria-hidden='true' />
                Thử lại
              </Button>
            )}
          </div>
        ) : sessions.length === 0 ? (
          <div className='h-full flex flex-col items-center justify-center text-center p-4 text-text-description space-y-2'>
            <HelpCircle className='w-8 h-8 opacity-45' aria-hidden='true' />
            <p className='text-xs'>Chưa có lịch sử phân tích.</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId
            return (
              <div
                key={session.id}
                role='button'
                tabIndex={0}
                onClick={() => {
                  setActiveSessionId(session.id)
                  if (onCloseMobile) onCloseMobile()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setActiveSessionId(session.id)
                    if (onCloseMobile) onCloseMobile()
                  }
                }}
                className={cn(
                  'group relative p-2 rounded-xl cursor-pointer transition-all text-left flex items-start gap-2.5 w-full border-0 focus-visible:ring-1 focus-visible:ring-info focus-visible:outline-none',
                  isActive
                    ? 'bg-background-secondary shadow-sm'
                    : 'bg-background-primary hover:bg-background-secondary'
                )}
              >
                <div className='flex-1 min-w-0 pr-6'>
                  <h4 className={cn(
                    'text-sm font-semibold truncate transition-colors',
                    isActive
                       ? 'text-main'
                       : 'text-text-description group-hover:text-main'
                  )}>
                    {session.title}
                  </h4>
                </div>

                {/* Delete Session Button */}
                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  aria-label={`Xóa phiên ${session.title}`}
                  className='absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-primary text-text-description hover:bg-background-secondary p-1.5 rounded-lg transition-all shrink-0 focus-visible:ring-1 focus-visible:ring-info focus-visible:outline-none'
                  title='Xóa phiên này'
                >
                  <Trash2 className='w-3.5 h-3.5' aria-hidden='true' />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
