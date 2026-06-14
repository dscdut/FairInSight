import { Star } from "lucide-react";

const handoffQueue = [
  { id: 1, client: 'Trần Văn A', topic: 'Tranh chấp Đất đai (Phức tạp)', status: 'Đang đợi điều phối', duration: '12 phút' },
  { id: 2, client: 'Nguyễn Thị B', topic: 'Ly hôn có yếu tố nước ngoài', status: 'Đang kết nối', duration: '5 phút' },
  { id: 3, client: 'Công ty TechX', topic: 'Vi phạm hợp đồng NDA thương mại', status: 'Đang đợi điều phối', duration: '45 phút' },
];

export default function HandOff() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Hàng đợi cần xử lý điều phối sang Luật sư */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base text-slate-900">Hàng đợi chuyển tiếp Luật sư (Handoff Queue)</h3>
              <p className="text-xs text-slate-500">Các vụ việc phức tạp AI phân loại cần Support kết nối chuyên gia.</p>
            </div>
            <span className="px-2 py-1 bg-amber-50 text-amber-700 font-semibold text-xs rounded-lg">3 Ca đang đợi</span>
          </div>

          <div className="space-y-3">
            {handoffQueue.map((item) => (
              <div key={item.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{item.client}</p>
                  <p className="text-slate-500 mt-0.5">{item.topic}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">⏳ {item.duration}</span>
                  <button className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg shadow-sm">Gán ngay</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trạng thái phòng chat đối tác Luật sư đang mở */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-base text-slate-900">Phòng chat đang mở</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Đang hoạt động (Active Room)</span>
              </div>
              <span className="font-bold text-slate-900">14 phòng</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-300" />
                <span className="text-slate-600">Phòng đã đóng (Hôm nay)</span>
              </div>
              <span className="font-bold text-slate-900">42 phòng</span>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-800 mb-2">Đánh giá Luật sư cộng tác gần đây</p>
              <div className="flex items-center justify-between text-xs p-2 bg-amber-50/50 rounded-lg">
                <span className="font-medium text-slate-700">LS. Nguyễn Văn Thắng</span>
                <span className="flex items-center gap-1 text-amber-600 font-bold"><Star className="w-3 h-3 fill-amber-500 text-amber-500" /> 4.9</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
