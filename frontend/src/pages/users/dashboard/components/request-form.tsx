import { ChevronDown, Paperclip } from 'lucide-react'
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { Button, Card, CardContent } from '@/components/ui'
import { type AnalysisRequest } from '@/core/store/features/analyze-request/type';
import { useRequestStore } from '@/core/store/features/analyze-request/useRequestStore';


export default function RequestForm() {

  const submit = useRequestStore((state) => state.submitRequest)  
  const { register, handleSubmit } = useForm<AnalysisRequest>();
  
  return (
    <div className="w-full space-y-4 animate-in fade-in-50 duration-200">
      <p className="text-p text-text-description">Mô tả chi tiết vấn đề của bạn để Trợ lý AI bóc tách cấu trúc dữ liệu luật liên quan.</p>

      <Card className="border-0 shadow-sm bg-background-primary rounded-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(submit)} className="space-y-5">
            {/* Tên vụ việc */}
            <div className="space-y-2">
              <label className="text-text-description font-semibold text-small block">Tên vụ việc</label>
              <input 
                type="text"
                {...register('title', { required: true })} 
                placeholder="Ví dụ: Tranh chấp đất đai chia tài sản thừa kế..." 
                className="flex min-h-11 w-full rounded-xl border-0 bg-background-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-ring transition-all"
              />
            </div>
            
            {/* Lĩnh vực pháp lý & Vai trò */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-text-description font-semibold text-small block">Lĩnh vực pháp lý</label>
                <div className="relative">
                  <select
                    {...register('category', { required: true })}
                    className="flex min-h-11 w-full rounded-xl border-0 bg-background-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-ring appearance-none transition-all pr-8"
                  >
                    <option value="">Chọn lĩnh vực</option>
                    <option value="Dân sự">Dân sự</option>
                    <option value="Hình sự">Hình sự</option>
                    <option value="Đất đai">Đất đai</option>
                    <option value="Hợp đồng">Hợp đồng</option>
                    <option value="Lao động">Lao động</option>
                    <option value="Doanh nghiệp">Doanh nghiệp</option>
                    <option value="Hôn nhân & Gia đình">Hôn nhân & Gia đình</option>
                    <option value="Hành chính">Hành chính</option>
                    <option value="Tài chính & Thuế">Tài chính & Thuế</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-secondary">
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-text-description font-semibold text-small block">Vai trò</label>
                <div className="relative">
                  <select
                    {...register('role', { required: true })}
                    className="flex min-h-11 w-full rounded-xl border-0 bg-background-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-ring appearance-none transition-all pr-8"
                  >
                    <option value="">Chọn vai trò</option>
                    <option value="Nguyên đơn">Nguyên đơn</option>
                    <option value="Bị đơn">Bị đơn</option>
                    <option value="Liên quan">Liên quan</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-secondary">
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </div>
                </div>
              </div>
            </div>

            {/* Mô tả vụ việc */}
            <div className="space-y-2">
              <label className="text-text-description font-semibold text-small block">Mô tả vụ việc</label>
              <textarea 
                {...register('content', { required: true })} 
                placeholder="Hãy viết toàn bộ diễn biến sự việc, các mốc thời gian, các bên tham gia tranh chấp tại đây..." 
                rows={8}
                className="flex w-full rounded-xl border-0 bg-background-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed transition-all"
              />
            </div>

            {/* Yêu cầu của bạn */}
            <div className="space-y-2">
              <label className="text-text-description font-semibold text-small block">Yêu cầu của bạn</label>
              <input 
                type="text"
                {...register('requirement', { required: true })} 
                placeholder="Ví dụ: Phân tích rủi ro pháp lý, xác định quyền lợi và nghĩa vụ của các bên..." 
                className="flex min-h-11 w-full rounded-xl border-0 bg-background-secondary px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-ring transition-all"
              />
            </div>

            {/* Tài liệu đính kèm */}
            <div className="space-y-2">
              <label className="text-text-description font-semibold text-small block">Tài liệu đính kèm</label>
              <div className="relative flex flex-col items-center justify-center min-h-[96px] px-4 py-4 bg-background-secondary rounded-xl transition-all cursor-pointer hover:bg-background-secondary/80 group">
                <input
                  type="file"
                  multiple
                  {...register('attachments')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Paperclip className="w-5 h-5 text-text-secondary group-hover:scale-110 transition-transform mb-2" />
                <span className="text-sm text-text-secondary font-medium">Kéo thả hoặc nhấp để tải lên tài liệu</span>
                <span className="text-xs text-text-tertiary mt-1">Hỗ trợ các định dạng PDF, DOCX, TXT</span>
              </div>
              <p className="text-xs text-text-description mt-2">
                Bạn có thể soạn tài liệu{' '}
                <Link to="/template" className="text-primary hover:underline font-semibold transition-all">
                  tại đây
                </Link>
              </p>
            </div>

            <Button
              variant="default"
              size={'lg'}
              type="submit"
              className='w-full h-11 bg-primary text-white hover:opacity-90 rounded-xl font-semibold transition-all flex items-center justify-center gap-2'
            >
              Phân tích ngay
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
