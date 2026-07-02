import React from 'react';

import { MessageSquare, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type ConsultationProcess, type ConsultationStage } from '@/core/services/consultation.service';

interface ClientStageChattingProps {
  process: ConsultationProcess;
  currentUserId: string;
  msgContent: string;
  setMsgContent: (v: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  messageEndRef: React.RefObject<HTMLDivElement | null>;
  isLawyer: boolean;
  handleTransition: (stage: ConsultationStage) => Promise<void>;
  handleSkip: (stage: ConsultationStage) => Promise<void>;
}

export default function ClientStageChatting({
  process,
  currentUserId,
  msgContent,
  setMsgContent,
  handleSendMessage,
  messageEndRef,
  isLawyer,
  handleTransition,
  handleSkip
}: ClientStageChattingProps) {
  return (
    <div className='flex-1 flex flex-col min-h-0 w-full'>
      {/* Messages box */}
      <div className='flex-1 overflow-y-auto space-y-2.5 pr-1 mb-3 max-h-[30vh] bg-slate-50 border border-border-primary rounded-xl p-3'>
        {(!process.conversations?.messages || process.conversations.messages.length === 0) ? (
          <div className='flex flex-col items-center justify-center h-full text-text-description space-y-1 py-8'>
            <MessageSquare className='w-7 h-7 text-slate-300' />
            <span className='text-[10px]'>Bắt đầu cuộc trao đổi trực tiếp...</span>
          </div>
        ) : (
          process.conversations.messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-2.5 rounded-xl max-w-[80%] text-left shadow-sm ${
                  isMe
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-white text-text-primary border border-border-secondary rounded-tl-none'
                }`}>
                  <p className='leading-relaxed text-[11px] whitespace-pre-wrap'>{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSendMessage} className='flex items-center gap-2 mb-3 shrink-0'>
        <Input
          value={msgContent}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMsgContent(e.target.value)}
          placeholder='Nhập nội dung trao đổi...'
          className='flex-1 h-9 text-xs text-text-primary'
        />
        <Button type='submit' size='sm' className='h-9 bg-primary hover:bg-primary-600 text-white rounded px-3'>
          <Send className='w-4 h-4' />
        </Button>
      </form>

      {/* Control buttons */}
      <div className='flex gap-2 justify-end border-t border-border-primary pt-3 shrink-0'>
        {isLawyer ? (
          <>
            <Button
              onClick={() => handleTransition('PDF_GENERATION')}
              className='bg-success-primary text-success-secondary font-bold text-xs h-8 px-4 rounded border border-success-primary/20 hover:bg-success-primary/80 transition-colors'
            >
              Hoàn tất & Soạn biên bản PDF
            </Button>
            <Button
              onClick={() => handleSkip('COMPLETED')}
              variant='ghost'
              className='text-text-secondary border border-border-primary hover:bg-slate-50 font-semibold text-xs h-8 px-3 rounded'
            >
              Bỏ qua & Hoàn thành thẳng
            </Button>
          </>
        ) : (
          <Button
            onClick={() => handleSkip('PDF_GENERATION')}
            className='bg-primary text-white font-bold text-xs h-8 px-4 rounded hover:bg-primary-600'
          >
            Yêu cầu Luật sư kết luận
          </Button>
        )}
      </div>
    </div>
  );
}
