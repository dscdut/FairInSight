import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { type ConsultationStage } from '@/core/services/consultation.service';

interface ClientStagePendingProps {
  isClient: boolean;
  partnerName: string;
  handleTransition: (stage: ConsultationStage) => Promise<void>;
}

export default function ClientStagePending({
  isClient,
  partnerName,
  handleTransition
}: ClientStagePendingProps) {
  return (
    <div className='flex-1 flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto w-full'>
      <div className='w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 ring-8 ring-amber-500/10 shrink-0'>
        <AlertCircle className='w-6 h-6' />
      </div>
      {isClient ? (
        <div className='space-y-1.5'>
          <h3 className='font-bold text-sm text-text-primary'>Đang chờ phản hồi</h3>
          <p className='text-[11px] text-text-description leading-relaxed'>
            Yêu cầu tư vấn của bạn đã được chuyển tới luật sư {partnerName}. Vui lòng chờ luật sư xác nhận và mở phòng trao đổi.
          </p>
        </div>
      ) : (
        <div className='space-y-4 w-full'>
          <div className='space-y-1.5'>
            <h3 className='font-bold text-sm text-text-primary'>Yêu cầu tư vấn mới</h3>
            <p className='text-[11px] text-text-description leading-relaxed'>
              Bạn có một yêu cầu tư vấn mới từ khách hàng {partnerName}. Vui lòng xác nhận để bắt đầu quy trình làm việc.
            </p>
          </div>
          <div className='flex gap-2.5 justify-center pt-2'>
            <Button
              onClick={() => handleTransition('CHATTING')}
              className='bg-primary hover:bg-primary-600 text-white font-bold px-5 text-xs py-2 rounded shadow'
            >
              Chấp nhận tư vấn
            </Button>
            <Button
              onClick={() => handleTransition('REJECTED')}
              variant='ghost'
              className='text-danger-secondary hover:bg-danger-primary/10 font-bold px-4 text-xs py-2 border border-border-primary rounded'
            >
              Từ chối
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
