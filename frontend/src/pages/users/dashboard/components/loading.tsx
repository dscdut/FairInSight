import { Sparkles } from 'lucide-react'

export default function LoadingResponse() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4 max-w-md mx-auto animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-100 border-t-primary"></div>
        <Sparkles className="w-5 h-5 text-primary absolute animate-pulse" />
      </div>
      <div className="text-center space-y-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <p className="text-h5 text-description">FairInsights AI đang xử lý lập luận...</p>
        <p className="text-p text-slate-400 leading-relaxed">
          Hệ thống đang thực hiện bóc tách ngữ nghĩa, so chiếu các điều luật trong cơ sở dữ liệu quốc gia và tìm kiếm danh sách luật sư phù hợp nhất.
        </p>
      </div>
    </div>
  )
}
