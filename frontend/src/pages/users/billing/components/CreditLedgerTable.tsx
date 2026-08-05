import { ArrowUpRight, History } from 'lucide-react'

import { Button } from '@/components/ui'
import { type BillingLedgerItem } from '@/models/ai-chat/contracts'

interface CreditLedgerTableProps {
  ledger: BillingLedgerItem[]
  nextCursor: string | null
  onLoadMore: () => void
}

const LEDGER_TYPE_MAP: Record<string, string> = {
  GRANT: 'Cấp credit định kỳ',
  TOPUP: 'Nạp credit',
  CHARGE: 'Trừ credit (AI)',
  REFUND: 'Hoàn credit',
  RESERVE: 'Tạm giữ credit',
  RELEASE: 'Giải tỏa credit',
  EXPIRE: 'Credit hết hạn'
}

export default function CreditLedgerTable({ ledger, nextCursor, onLoadMore }: CreditLedgerTableProps) {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between border-b border-border-secondary pb-3'>
        <div className='flex items-center gap-2'>
          <History className='h-4 w-4 text-primary' />
          <h3 className='text-sm font-bold text-main'>Lịch Sử Biến Động Credit</h3>
        </div>
        <span className='text-xs text-text-description'>{ledger.length} giao dịch gần đây</span>
      </div>

      {!ledger.length ? (
        <p className='py-8 text-center text-xs text-text-description'>Chưa ghi nhận biến động credit nào.</p>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-left text-xs'>
            <thead className='border-b border-border-secondary/60 text-text-description font-semibold'>
              <tr>
                <th className='pb-2 pt-1 font-bold'>Thời Gian</th>
                <th className='pb-2 pt-1 font-bold'>Loại Giao Dịch</th>
                <th className='pb-2 pt-1 font-bold text-right'>Thay Đổi</th>
                <th className='pb-2 pt-1 font-bold text-right'>Khả Dụng</th>
                <th className='pb-2 pt-1 font-bold text-right'>Tạm Giữ</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border-secondary/30'>
              {ledger.map((item) => (
                <tr key={item.id} className='hover:bg-background-secondary/30 transition-colors'>
                  <td className='py-3 text-text-description font-medium'>
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className='py-3 font-bold text-main'>{LEDGER_TYPE_MAP[item.type] || item.type}</td>
                  <td className='py-3 text-right font-black'>
                    <span className={item.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                      {item.amount > 0 ? `+${item.amount.toLocaleString('vi-VN')}` : item.amount.toLocaleString('vi-VN')}
                    </span>
                  </td>
                  <td className='py-3 text-right font-bold text-main'>{item.availableAfter.toLocaleString('vi-VN')}</td>
                  <td className='py-3 text-right font-semibold text-text-description'>{item.reservedAfter.toLocaleString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {nextCursor && (
        <div className='pt-2'>
          <Button variant='outline' size='sm' onClick={onLoadMore} className='w-full text-xs gap-1.5'>
            Xem thêm giao dịch <ArrowUpRight className='h-3.5 w-3.5' />
          </Button>
        </div>
      )}
    </div>
  )
}
