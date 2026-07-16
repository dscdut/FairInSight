import React, { useState } from 'react';

import { CheckCircle2, Send, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/core/lib/utils';
import { type ConsultationProcess } from '@/core/services/consultation.service';

interface LawyerStagePortalSubmittingProps {
  activeProcess: ConsultationProcess;
  updatingPortal: boolean;
  handleUpdatePortalStatus: (status: 'APPROVED' | 'REJECTED', feedback: string) => Promise<void>;
}

export default function LawyerStagePortalSubmitting({
  activeProcess,
  updatingPortal,
  handleUpdatePortalStatus
}: LawyerStagePortalSubmittingProps) {
  const [status, setStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [feedback, setFeedback] = useState('');

  const isPortal = activeProcess.submission_method === 'PORTAL';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFeedback = feedback.trim() || (status === 'APPROVED' ? 'Hồ sơ đã được thông qua và phê duyệt thành công.' : 'Hồ sơ chưa đạt yêu cầu, vui lòng liên hệ luật sư để được tư vấn chỉnh sửa.');
    handleUpdatePortalStatus(status, finalFeedback);
  };

  return (
    <div className='max-w-2xl mx-auto space-y-5 text-left w-full'>
      <Card className='p-6 border border-border-secondary bg-background-primary shadow-sm space-y-5'>
        <div className='flex items-center justify-between border-b border-slate-100 pb-3 shrink-0'>
          <div className='flex items-center gap-2.5'>
            <CheckCircle2 className='w-5 h-5 text-primary' />
            <h3 className='font-bold text-base text-text-main'>
              Thẩm định & Cập nhật kết quả nộp hồ sơ
            </h3>
          </div>
          <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider animate-pulse'>
            Chờ kết quả thẩm định
          </span>
        </div>

        <div className='bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-text-secondary space-y-2.5'>
          <p>
            Hình thức nộp hồ sơ của khách hàng:{' '}
            <strong className='text-text-main uppercase'>
              {isPortal ? 'Nộp trực tuyến (Cổng DVC)' : 'Nộp trực tiếp (Nộp tay)'}
            </strong>
          </p>
          <p className='leading-relaxed'>
            {isPortal
              ? 'Hồ sơ đã được gửi lên hệ thống một cửa của Cổng Dịch vụ công. Vui lòng theo dõi tiến trình và cập nhật kết quả chính thức từ cơ quan Nhà nước.'
              : 'Khách hàng tự đi nộp hoặc đã nhận bàn giao hồ sơ từ văn phòng để đi nộp. Vui lòng cập nhật kết quả thẩm duyệt hồ sơ khi có phản hồi.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4 pt-1'>
          <div className='space-y-2'>
            <label className='text-xs font-semibold text-text-main block'>
              1. Lựa chọn kết quả giải quyết hồ sơ:
            </label>
            <div className='grid grid-cols-2 gap-3'>
              <button
                type='button'
                onClick={() => setStatus('APPROVED')}
                className={cn(
                  'p-3.5 rounded-xl border text-left transition-all relative flex flex-col gap-1',
                  status === 'APPROVED'
                    ? 'border-emerald-600 bg-emerald-50/30 text-emerald-700 font-bold shadow-sm'
                    : 'border-border-secondary hover:bg-slate-50 text-text-secondary bg-white'
                )}
              >
                <div className='flex items-center justify-between w-full'>
                  <span className='text-xs font-bold flex items-center gap-1'>
                    <Check className='w-4 h-4 text-emerald-600 shrink-0' />
                    Hồ sơ Thành công
                  </span>
                  {status === 'APPROVED' && <span className='w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0' />}
                </div>
                <p className='text-[9px] text-text-description font-normal leading-relaxed mt-0.5'>
                  Hồ sơ được thông qua, cấp phép hoặc bàn giao thành công.
                </p>
              </button>

              <button
                type='button'
                onClick={() => setStatus('REJECTED')}
                className={cn(
                  'p-3.5 rounded-xl border text-left transition-all relative flex flex-col gap-1',
                  status === 'REJECTED'
                    ? 'border-red-600 bg-red-50/30 text-red-700 font-bold shadow-sm'
                    : 'border-border-secondary hover:bg-slate-50 text-text-secondary bg-white'
                )}
              >
                <div className='flex items-center justify-between w-full'>
                  <span className='text-xs font-bold flex items-center gap-1'>
                    <X className='w-4 h-4 text-red-600 shrink-0' />
                    Hồ sơ Thất bại / Bị từ chối
                  </span>
                  {status === 'REJECTED' && <span className='w-2.5 h-2.5 rounded-full bg-red-500 shrink-0' />}
                </div>
                <p className='text-[9px] text-text-description font-normal leading-relaxed mt-0.5'>
                  Cơ quan có thẩm quyền trả hồ sơ, từ chối cấp phép hoặc hủy yêu cầu.
                </p>
              </button>
            </div>
          </div>

          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-text-main'>
              2. Ý kiến phản hồi / Chỉ dẫn kết quả gửi cho Khách hàng:
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                status === 'APPROVED'
                  ? 'Ví dụ: Đã nhận được phê duyệt, giấy phép số GP-28192 đã được cấp hành chính thành công. Vui lòng qua văn phòng nhận...'
                  : 'Ví dụ: Cơ quan có thẩm quyền từ chối tiếp nhận vì thiếu chữ ký bên thứ ba. Vui lòng liên hệ lại để luật sư bổ sung chỉnh sửa...'
              }
              className='rounded-lg text-sm bg-background-primary border-border-secondary min-h-[90px]'
            />
          </div>

          <div className='pt-2 border-t border-slate-100'>
            <Button
              type='submit'
              disabled={updatingPortal}
              className='w-full bg-primary hover:bg-primary/95 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2 shadow transition-all duration-200 text-xs uppercase tracking-wider'
            >
              <Send className='w-4 h-4' />
              {updatingPortal ? 'Đang gửi kết quả...' : 'Gửi thông tin kết quả về cho khách hàng'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
