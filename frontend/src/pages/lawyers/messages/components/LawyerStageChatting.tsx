import React from 'react';

import { Send, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/core/lib/utils';
import { type ConsultationProcess } from '@/core/services/consultation.service';

interface LawyerStageChattingProps {
  activeProcess: ConsultationProcess;
  user: any;
  inputText: string;
  setInputText: (v: string) => void;
  handleSend: (e: React.FormEvent) => void;
  handleEndChat: () => Promise<void>;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export default function LawyerStageChatting({
  activeProcess,
  user,
  inputText,
  setInputText,
  handleSend,
  handleEndChat,
  scrollContainerRef
}: LawyerStageChattingProps) {
  return (
    <div className='flex h-[480px] max-w-5xl mx-auto rounded-xl border border-border-secondary bg-background-primary overflow-hidden shadow-sm text-left w-full'>
      {/* Left: Chat history & input */}
      <div className='flex flex-1 flex-col min-w-0 h-full'>
        {activeProcess.current_stage === 'CHATTING' && (
          <div className='p-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-3 shrink-0'>
            <div className='flex items-center gap-2'>
              <Clock className='w-4.5 h-4.5 text-amber-500 animate-pulse shrink-0' />
              <p className='text-xs text-amber-800 font-medium'>
                Đang trao đổi trực tiếp với khách hàng. Khi đã đủ thông tin, hãy kết thúc thảo luận để chuyển sang soạn báo cáo.
              </p>
            </div>
            <Button
              onClick={handleEndChat}
              className='bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs py-1.5 px-4 rounded-lg shrink-0'
            >
              Kết thúc & Soạn báo cáo
            </Button>
          </div>
        )}

        {/* Message History */}
        <div
          ref={scrollContainerRef}
          className='flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/40'
        >
          {activeProcess.conversations?.messages && activeProcess.conversations.messages.length > 0 ? (
            activeProcess.conversations.messages.map((m) => {
              const isMe = m.sender_id === user?.userId;
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
                      {m.content}
                    </div>
                    <span className='text-[10px] text-text-description mt-1 px-1'>
                      {new Date(m.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className='text-xs text-text-description text-center mt-8'>Chưa có cuộc thảo luận nào.</p>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSend} className='p-3 bg-background-primary border-t border-border-secondary flex items-center gap-2 shrink-0'>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder='Trả lời khách hàng...'
            className='flex-1 rounded-lg text-sm bg-background-primary border-border-secondary min-h-[40px] max-h-[80px] py-2 resize-none focus-visible:ring-primary'
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <Button type='submit' size='icon' className='h-10 w-10 shrink-0 bg-primary hover:bg-primary/95 text-white rounded-lg'>
            <Send className='w-4.5 h-4.5' />
          </Button>
        </form>
      </div>
    </div>
  );
}
