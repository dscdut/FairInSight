import { Database, RefreshCcw } from "lucide-react";

const lawUpdates = [
  { id: 1, code: 'Luật Đất Đai 2024', status: 'Mới cập nhật', type: 'Đã nhúng Vector DB', date: 'Hôm nay' },
  { id: 2, code: 'Nghị định 123/NĐ-CP', status: 'Hết hiệu lực', type: 'Đã gắn thẻ thay thế', date: 'Hôm qua' },
  { id: 3, code: 'Thông tư 05/TT-BTP', status: 'Đang xử lý pipeline', type: 'Đang bóc tách OCR', date: '2 ngày trước' },
];

export default function Knowledge() {
  return (
<div className="space-y-6">
          {/* Trạng thái Core Vector Database */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Database className="w-5 h-5" /></div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Vector Database Status</h4>
                    <p className="text-xs text-slate-400">Hệ thống lưu trữ cấu trúc Embedding</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-xs">Kích hoạt</span>
              </div>
              <div className="pt-2 text-xs grid grid-cols-2 gap-4">
                <div><span className="text-slate-400 block">Tổng Chunks mã hóa:</span><strong className="text-slate-800 text-base">142,500 chunks</strong></div>
                <div><span className="text-slate-400 block">Mô hình Embedding:</span><strong className="text-slate-800 text-base">text-embedding-004</strong></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><RefreshCcw className="w-5 h-5" /></div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Knowledge Ingestion Pipeline</h4>
                    <p className="text-xs text-slate-400">Tiến trình bóc tách văn bản pháp lý tự động</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-xs">Đang chạy</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1"><div className="bg-amber-500 h-full w-[70%] animate-pulse" /></div>
              <p className="text-[11px] text-slate-400">Đang đồng bộ hóa dữ liệu từ cổng thông tin pháp luật Quốc Hội...</p>
            </div>
          </div>

          {/* Danh sách cập nhật hiệu lực luật */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-base text-slate-900">Quản lý vòng đời Văn bản & Hiệu lực pháp lý</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-medium">
                    <th className="p-3">Số hiệu / Tên văn bản</th>
                    <th className="p-3">Trạng thái hiệu lực</th>
                    <th className="p-3">Hành động hệ thống AI</th>
                    <th className="p-3 text-right">Ngày xử lý</th>
                  </tr>
                </thead>
                <tbody>
                  {lawUpdates.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">{item.code}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          item.status === 'Mới cập nhật' ? 'bg-green-50 text-green-700' : 
                          item.status === 'Hết hiệu lực' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                        }`}>{item.status}</span>
                      </td>
                      <td className="p-3 text-slate-500 font-medium">{item.type}</td>
                      <td className="p-3 text-right text-slate-400">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
  )
}
