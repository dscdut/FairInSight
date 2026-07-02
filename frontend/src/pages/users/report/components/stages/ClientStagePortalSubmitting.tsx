import { Clock } from 'lucide-react';

import { type ConsultationProcess } from '@/core/services/consultation.service';

interface ClientStagePortalSubmittingProps {
  process: ConsultationProcess;
}

export default function ClientStagePortalSubmitting({
  process
}: ClientStagePortalSubmittingProps) {
  const isPortal = process.submission_method === 'PORTAL';

  return (
    <div className='flex-1 flex flex-col items-center justify-center text-center space-y-5 max-w-sm mx-auto py-6 w-full text-left'>
      <div className='w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center text-sky-500 ring-8 ring-sky-500/10 shrink-0 mx-auto'>
        <Clock className='w-6 h-6 animate-spin' />
      </div>
      
      <div className='space-y-3 text-center'>
        <h3 className='font-bold text-sm text-text-primary'>
          {isPortal ? 'Đang thẩm định hồ sơ trực tuyến' : 'Đang xử lý nộp hồ sơ trực tiếp'}
        </h3>
        
        <p className='text-[11px] text-text-description leading-relaxed'>
          {isPortal
            ? 'Ý kiến tư vấn và hồ sơ của bạn đã được gửi lên hệ thống một cửa của Cổng Dịch vụ công Quốc gia.'
            : 'Vui lòng thực hiện nộp hồ sơ tay trực tiếp theo hướng dẫn của luật sư hoặc đợi luật sư bàn giao kết quả trực tiếp.'}
        </p>

        <p className='text-[11px] text-text-description leading-relaxed'>
          Cơ quan ban ngành đang xử lý thẩm định hồ sơ. Luật sư sẽ sớm cập nhật kết quả chính thức (Thành công hay Thất bại) kèm chỉ dẫn chi tiết cho bạn tại đây.
        </p>

        <div className='inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1 mt-2 text-amber-700 font-bold text-[10px] mx-auto'>
          <span className='w-2 h-2 rounded-full bg-amber-500 animate-ping'></span>
          Trạng thái: Chờ kết quả thẩm duyệt hồ sơ
        </div>
      </div>
    </div>
  );
}
