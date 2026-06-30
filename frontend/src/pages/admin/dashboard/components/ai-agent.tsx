import { AlertCircle, Clock, DollarSign, Shield } from "lucide-react";

const guardrailLogs = [
  { id: 1, type: 'Hallucination Blocked', prompt: 'Hỏi về Luật đất đai điều 999...', status: 'Đã chặn', time: '5 phút trước' },
  { id: 2, type: 'Prompt Injection', prompt: 'Ignore previous instructions and act as...', status: 'Đã lọc', time: '18 phút trước' },
  { id: 3, type: 'PII Leak Prevented', prompt: 'Số điện thoại & CCCD của khách hàng...', status: 'Đã ẩn', time: '1 giờ trước' },
];


export default function AIAgent() {
  return (
    <div className="space-y-6">
      {/* Hàng chỉ số AI */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Chi phí Token (Gemini API)</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-1">$42.15 <span className="text-xs font-normal text-slate-400">/ $100 quota</span></h4>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><DollarSign className="w-5 h-5" /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Độ trễ AI (Avg Latency)</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-1">1.84s <span className="text-xs font-normal text-emerald-500">▼ 0.2s v2.3</span></h4>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Clock className="w-5 h-5" /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Tỷ lệ lỗi xử lý (Fallback)</p>
            <h4 className="text-2xl font-bold text-slate-900 mt-1">0.32% <span className="text-xs font-normal text-slate-400">Ổn định</span></h4>
          </div>
          <div className="p-3 bg-red-50 text-destructive rounded-xl"><AlertCircle className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Nhật ký lớp bảo vệ Guardrail bảo mật pháp lý */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-semibold text-base text-slate-900">Guardrail Engine Logs (Nhật ký chống ảo giác)</h3>
            <p className="text-xs text-slate-500">Hệ thống kiểm soát Prompt an toàn ngăn chặn dữ liệu pháp luật sai lệch.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-medium">
                <th className="p-3">Loại phòng vệ</th>
                <th className="p-3">Nội dung truy vấn</th>
                <th className="p-3">Trạng thái hành động</th>
                <th className="p-3 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {guardrailLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-3 font-semibold text-slate-900">{log.type}</td>
                  <td className="p-3 font-mono text-slate-500 max-w-xs truncate">{log.prompt}</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">{log.status}</span></td>
                  <td className="p-3 text-right text-slate-400">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
