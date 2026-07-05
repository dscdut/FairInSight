import { CheckCircle2, Star } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@/core/lib/utils';
import { type ConsultationProcess } from '@/core/services/consultation.service';

interface LawyerStageCompletedProps {
  activeProcess: ConsultationProcess;
}

export default function LawyerStageCompleted({
  activeProcess
}: LawyerStageCompletedProps) {
  return (
    <div className='max-w-2xl mx-auto space-y-5 text-left w-full'>
      {activeProcess.current_stage === 'REVIEWED' ? (
        <Card className='p-6 border border-border-secondary bg-background-primary shadow-sm space-y-4'>
          <div className='flex items-center gap-3 border-b border-border-secondary pb-4'>
            <CheckCircle2 className='w-5 h-5 text-emerald-500' />
            <h3 className='font-bold text-sm text-text-main'>Khách hàng đã nghiệm thu & đánh giá hồ sơ</h3>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center gap-1'>
              <span className='text-xs font-semibold text-text-main mr-2'>Điểm đánh giá:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'w-4 h-4',
                    star <= (activeProcess.rating || 0)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-200'
                  )}
                />
              ))}
            </div>

            <div className='space-y-1.5'>
              <p className='text-xs font-semibold text-text-main'>Nhận xét từ khách hàng:</p>
              <div className='p-3.5 bg-slate-50 rounded-lg text-xs text-text-secondary italic'>
                "{activeProcess.review_comment || 'Không có nhận xét thêm.'}"
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className='p-6 border border-border-secondary bg-background-primary shadow-sm text-center space-y-3'>
          <div className='w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-100'>
            <CheckCircle2 className='w-6 h-6 animate-bounce' />
          </div>
          <h3 className='font-bold text-base text-text-main'>Tư vấn đã hoàn tất thành công!</h3>
          <p className='text-sm text-text-description max-w-sm mx-auto'>
            Hồ sơ và kết quả tư vấn đã được bàn giao cho khách hàng. Đang chờ khách hàng gửi đánh giá chất lượng phục vụ của luật sư.
          </p>
        </Card>
      )}
    </div>
  );
}
