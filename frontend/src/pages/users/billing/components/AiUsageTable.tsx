import { Activity, Layers } from 'lucide-react'

import { type BillingAiUsageItem } from '@/models/ai-chat/contracts'

interface AiUsageTableProps {
  usage: BillingAiUsageItem[]
}

const TASK_CLASS_MAP: Record<string, string> = {
  LOOKUP: 'Tra cứu pháp lý',
  GUIDED_ANALYSIS: 'Phân tích định hướng',
  DEEP_ANALYSIS: 'Phân tích chuyên sâu',
  DOCUMENT_ANALYSIS: 'Phân tích tài liệu',
  GREETING: 'Chào hỏi'
}

export default function AiUsageTable({ usage }: AiUsageTableProps) {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between border-b border-border-secondary pb-3'>
        <div className='flex items-center gap-2'>
          <Activity className='h-4 w-4 text-primary' />
          <h3 className='text-sm font-bold text-main'>Mức Sử Dụng AI Gần Đây</h3>
        </div>
        <span className='text-xs text-text-description'>{usage.length} lượt xử lý</span>
      </div>

      {!usage.length ? (
        <p className='py-8 text-center text-xs text-text-description'>Chưa ghi nhận lượt truy vấn AI nào.</p>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-xs'>
            <thead className='border-b border-border-secondary/60 text-text-description font-semibold'>
              <tr>
                <th className='pb-2 pt-1 font-bold'>Thời Gian</th>
                <th className='pb-2 pt-1 font-bold'>Tác Vụ</th>
                <th className='pb-2 pt-1 font-bold text-right'>Token Đầu Vào</th>
                <th className='pb-2 pt-1 font-bold text-right'>Token Đầu Ra</th>
                <th className='pb-2 pt-1 font-bold text-right'>Thời Gian Xử Lý</th>
                <th className='pb-2 pt-1 font-bold text-right'>Tính Phí</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border-secondary/30'>
              {usage.map((item) => (
                <tr key={item.id} className='hover:bg-background-secondary/30 transition-colors'>
                  <td className='py-3 text-text-description font-medium'>
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className='py-3 font-bold text-main flex items-center gap-1.5'>
                    <Layers className='h-3.5 w-3.5 text-primary' />
                    {TASK_CLASS_MAP[item.taskClass] || item.taskClass}
                  </td>
                  <td className='py-3 text-right font-semibold text-main'>{item.inputTokens.toLocaleString('vi-VN')}</td>
                  <td className='py-3 text-right font-semibold text-main'>{item.outputTokens.toLocaleString('vi-VN')}</td>
                  <td className='py-3 text-right text-text-description'>{(item.latencyMs / 1000).toFixed(1)}s</td>
                  <td className='py-3 text-right font-bold'>
                    <span className={item.billable ? 'text-primary' : 'text-text-description'}>
                      {item.billable ? 'Có' : 'Không'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
