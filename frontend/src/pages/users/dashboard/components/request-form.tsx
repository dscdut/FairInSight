import { ArrowLeft, Sparkles } from 'lucide-react'
import { useForm } from 'react-hook-form';

import { Button, Card, CardContent, Input, Textarea } from '@/components/ui'
import { type AnalysisRequest } from '@/core/store/features/analyze-request/type';
import { useRequestStore } from '@/core/store/features/analyze-request/useRequestStore';


export default function RequestForm() {

  const submit = useRequestStore((state) => state.submitRequest)
  const setDefault = useRequestStore((state) => state.setDefault)
    
  const { register, handleSubmit } = useForm<AnalysisRequest>();
  
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in-50 duration-200">
      <div className="space-y-2 text-center md:text-left">
        <Button
          variant="ghost"
          size="ghost"
          onClick={setDefault}
          className="flex md:hidden mt-4 text-btn-medium text-slate-600"
        >
          <ArrowLeft className="w-4 h-4" /> Trở về trang chủ
        </Button>
        <div className='flex justify-between'>
          <h1 className="text-h4 flex items-center tracking-tight text-main gap-2">
            Khởi tạo vụ việc pháp lý mới
          </h1>
          {/* <Button 
            variant="outline"
            onClick={setDefault}
            className="hidden md:flex text-btn-medium text-slate-600 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" /> Trở về trang chủ
          </Button> */}
        </div>
        <p className="text-p text-text-description">Mô tả chi tiết vấn đề của bạn để Trợ lý AI bóc tách cấu trúc dữ liệu luật liên quan.</p>
      </div>

      <Card className="border-slate-200/80 shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(submit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-small font-semibold tracking-wider text-desription">Tên ngắn gọn của vụ việc</label>
              <Input 
                {...register('title', { required: true })} 
                placeholder="Ví dụ: Tranh chấp đất đai chia tài sản thừa kế..." 
                className="focus-visible:ring-info h-11"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-small font-semibold tracking-wider text-description">Nội dung chi tiết tình huống pháp lý</label>
              <Textarea 
                {...register('content', { required: true })} 
                placeholder="Hãy viết toàn bộ diễn biến sự việc, các mốc thời gian, các bên tham gia tranh chấp và câu hỏi cụ thể bạn cần giải đáp tại đây..." 
                rows={10}
                className="focus-visible:ring-blue-500 resize-none leading-relaxed text-sm"
              />
            </div>

            <Button
              variant="default"
              size={'lg'}
              type="submit"
              className='w-full'
            >
              <Sparkles className="w-4 h-4 text-white" />
              Bắt đầu phân tích bằng AI
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
