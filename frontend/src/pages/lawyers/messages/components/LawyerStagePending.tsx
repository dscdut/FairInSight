import { Clock, FileText, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { type ConsultationProcess } from '@/core/services/consultation.service';

interface LawyerStagePendingProps {
  activeProcess: ConsultationProcess;
  handleAcceptConsultation: () => Promise<void>;
  handleReject: () => Promise<void>;
}

export default function LawyerStagePending({
  activeProcess,
  handleAcceptConsultation,
  handleReject
}: LawyerStagePendingProps) {
  return (
    <div className='max-w-2xl mx-auto space-y-4 text-left'>
      <Card className='p-6 border border-border-secondary bg-background-primary shadow-sm text-center space-y-4'>
        <div className='w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto'>
          <Clock className='w-6 h-6' />
        </div>
        <h3 className='font-bold text-base text-text-main'>Xử lý yêu cầu tư vấn mới</h3>
        
        {activeProcess.current_stage === 'PENDING' ? (
          <div className='space-y-4'>
            <p className='text-sm text-text-description max-w-md mx-auto leading-relaxed'>
              Bạn nhận được yêu cầu tư vấn pháp lý từ khách hàng {activeProcess.users?.full_name}. Vui lòng lựa chọn chấp nhận để bắt đầu trao đổi hoặc từ chối yêu cầu.
            </p>
            <div className='flex items-center justify-center gap-3.5'>
              <Button
                onClick={handleAcceptConsultation}
                className='bg-primary hover:bg-primary/95 text-white font-semibold py-2 px-6 rounded-lg'
              >
                Chấp nhận hồ sơ & Bắt đầu tư vấn
              </Button>
              <Button
                variant='destructive'
                onClick={handleReject}
                className='bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg'
              >
                Từ chối yêu cầu
              </Button>
            </div>
          </div>
        ) : (
          <p className='text-sm text-emerald-600 font-medium'>
            Bạn đã duyệt chấp nhận hồ sơ yêu cầu tư vấn này. Tiến trình đã được chuyển sang giai đoạn chat thảo luận trực tiếp.
          </p>
        )}
      </Card>

      {/* Display Analysis Info & Reports */}
      <Card className='p-5 border border-border-secondary bg-background-primary shadow-sm space-y-4'>
        <h4 className='font-bold text-sm text-text-main flex items-center gap-2 border-b border-border-secondary pb-3.5'>
          <FileText className='w-4.5 h-4.5 text-primary' />
          Thông tin tóm tắt & Hồ sơ đính kèm từ AI
        </h4>
        <div className='space-y-3.5 text-sm'>
          <div>
            <span className='text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1'>Bối cảnh vụ việc (AI Tóm tắt)</span>
            <div className='p-3 bg-slate-50 border border-slate-100 rounded-lg text-text-secondary leading-relaxed'>
              {activeProcess.analysis?.context_summary || 'Chưa có thông tin tóm tắt bối cảnh.'}
            </div>
          </div>
          <div>
            <span className='text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1'>Chẩn đoán pháp lý sơ bộ</span>
            <div className='p-4 bg-primary/5 border border-primary/10 rounded-xl text-text-primary leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none text-left'>
              {activeProcess.analysis?.result ? (
                <ReactMarkdown>{activeProcess.analysis.result}</ReactMarkdown>
              ) : (
                'Đang phân tích chẩn đoán sơ bộ...'
              )}
            </div>
          </div>
          <div>
            <span className='text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5'>Tài liệu & Báo cáo đi kèm</span>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
              <div className='flex items-center justify-between p-2.5 border border-border-primary bg-background-primary hover:bg-slate-50/50 rounded-lg transition-colors cursor-pointer group'>
                <div className='flex items-center gap-2 min-w-0'>
                  <FileText className='w-4.5 h-4.5 text-red-500 shrink-0' />
                  <span className='text-xs font-medium text-text-primary truncate'>Bao_cao_phan_tich_AI.pdf</span>
                </div>
                <Download className='w-3.5 h-3.5 text-text-secondary group-hover:text-primary shrink-0' />
              </div>
              <div className='flex items-center justify-between p-2.5 border border-border-primary bg-background-primary hover:bg-slate-50/50 rounded-lg transition-colors cursor-pointer group'>
                <div className='flex items-center gap-2 min-w-0'>
                  <FileText className='w-4.5 h-4.5 text-blue-500 shrink-0' />
                  <span className='text-xs font-medium text-text-primary truncate'>Tai_lieu_minh_chung.pdf</span>
                </div>
                <Download className='w-3.5 h-3.5 text-text-secondary group-hover:text-primary shrink-0' />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
