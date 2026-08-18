import { useCallback, useEffect, useState } from 'react'

import { CheckCircle2, RefreshCw } from 'lucide-react'

import { Badge, Button, Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@/components/ui'
import toastifyCommon from '@/core/lib/toastify-common'
import { reportApi } from '@/core/services/report.service'
import { type ReportCategory, type ReportItem, type ReportStatus } from '@/models/types/report.type'

const statusLabel: Record<ReportStatus, string> = {
  OPEN: 'Mới',
  IN_REVIEW: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết'
}

const typeLabel = {
  SYSTEM: 'Hệ thống',
  LAWYER: 'Luật sư',
  USER: 'Người dùng'
}

const categoryLabel: Record<ReportCategory, string> = {
  HARASSMENT: 'Quấy rối',
  UNPROFESSIONAL_BEHAVIOR: 'Hành vi không chuyên nghiệp',
  FRAUD: 'Lừa đảo hoặc bất thường thanh toán',
  TECHNICAL_ERROR: 'Lỗi kỹ thuật',
  PAYMENT_ERROR: 'Lỗi thanh toán',
  FEATURE_ERROR: 'Lỗi tính năng',
  OTHER: 'Khác'
}

export default function AdminReports() {
  const [items, setItems] = useState<ReportItem[]>([])
  const [selected, setSelected] = useState<ReportItem | null>(null)
  const [status, setStatus] = useState<ReportStatus | 'ALL'>('ALL')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const page = await reportApi.listReports({ page: 1, size: 100, status })
      const nextItems = Array.isArray(page?.items) ? page.items : []
      setItems(nextItems)
      if (selected) {
        const refreshed = nextItems.find((item) => item.id === selected.id)
        if (refreshed) setSelected(refreshed)
      }
    } catch {
      toastifyCommon.error('Không thể tải danh sách report.')
    } finally {
      setLoading(false)
    }
  }, [selected, status])

  useEffect(() => {
    void load()
  }, [load])

  const updateStatus = async (nextStatus: ReportStatus) => {
    if (!selected) return
    try {
      const updated = await reportApi.updateStatus(selected.id, nextStatus, reply.trim() || undefined)
      setSelected(updated)
      setReply('')
      await load()
    } catch {
      toastifyCommon.error('Không thể cập nhật trạng thái.')
    }
  }

  return (
    <div className='grid h-full min-h-[640px] grid-cols-1 gap-4 p-4 lg:grid-cols-[380px_1fr]'>
      <Card className='flex min-h-0 flex-col p-4'>
        <div className='mb-4 flex items-center justify-between gap-2'>
          <div>
            <h1 className='text-h4 font-semibold text-text-primary'>Report Queue</h1>
            <p className='text-xs text-text-description'>Admin đọc, phản hồi và đánh dấu report đã giải quyết.</p>
          </div>
          <Button variant='ghost' size='sm' onClick={() => void load()}><RefreshCw className='h-4 w-4' /></Button>
        </div>
        <Select value={status} onValueChange={(value) => setStatus(value as ReportStatus | 'ALL')}>
          <SelectTrigger className='mb-3'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>Tất cả</SelectItem>
            <SelectItem value='OPEN'>Mới</SelectItem>
            <SelectItem value='IN_REVIEW'>Đang xử lý</SelectItem>
            <SelectItem value='RESOLVED'>Đã giải quyết</SelectItem>
          </SelectContent>
        </Select>

        <div className='min-h-0 flex-1 space-y-2 overflow-auto'>
          {loading ? (
            <div className='py-10 text-center text-sm text-text-description'>Đang tải...</div>
          ) : items.length === 0 ? (
            <div className='py-10 text-center text-sm text-text-description'>Không có report.</div>
          ) : items.map((report) => (
            <button
              key={report.id}
              type='button'
              onClick={() => setSelected(report)}
              className='w-full rounded-md border border-border-secondary bg-background-primary p-3 text-left hover:border-border-focus'
            >
              <div className='mb-2 flex items-center gap-2'>
                <Badge>{typeLabel[report.type]}</Badge>
                <Badge variant='outline'>{statusLabel[report.status]}</Badge>
              </div>
              <p className='line-clamp-1 text-sm font-semibold text-text-primary'>{report.customReason || categoryLabel[report.category]}</p>
              <p className='line-clamp-2 text-xs text-text-description'>{report.description}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card className='min-h-0 p-4'>
        {!selected ? (
          <div className='flex h-full items-center justify-center text-text-description'>Chọn một report để xem chi tiết.</div>
        ) : (
          <div className='flex h-full min-h-0 flex-col gap-4'>
            <div className='space-y-2 border-b border-border-secondary pb-4'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge>{typeLabel[selected.type]}</Badge>
                <Badge variant='outline'>{statusLabel[selected.status]}</Badge>
                <span className='text-xs text-text-description'>{new Date(selected.createdAt).toLocaleString('vi-VN')}</span>
              </div>
              <h2 className='text-h4 font-semibold'>{selected.customReason || categoryLabel[selected.category]}</h2>
              <p className='text-sm text-text-description'>{selected.description}</p>
              <div className='grid gap-1 text-xs text-text-secondary'>
                <span>Người gửi: {selected.reporter?.fullName} ({selected.reporter?.email})</span>
                {selected.targetUser && <span>Đối tượng: {selected.targetUser.fullName} ({selected.targetUser.email})</span>}
              </div>
            </div>

            <div className='min-h-0 flex-1 space-y-3 overflow-auto'>
              {selected.messages.map((message) => (
                <div key={message.id} className='rounded-md border border-border-secondary p-3'>
                  <div className='mb-1 flex items-center justify-between text-xs text-text-description'>
                    <span>{message.senderRole === 'ADMIN' ? 'Admin' : 'Người gửi report'}</span>
                    <span>{new Date(message.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <p className='whitespace-pre-wrap text-sm'>{message.message}</p>
                </div>
              ))}
            </div>

            <div className='space-y-3 border-t border-border-secondary pt-4'>
              <Textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={3} placeholder='Phản hồi hoặc ghi chú xử lý...' />
              <div className='flex flex-wrap justify-end gap-2'>
                <Button variant='outline' onClick={() => void updateStatus('IN_REVIEW')} disabled={selected.status === 'RESOLVED'}>Đang xử lý</Button>
                <Button onClick={() => void updateStatus('RESOLVED')} disabled={selected.status === 'RESOLVED'} className='gap-2'>
                  <CheckCircle2 className='h-4 w-4' />
                  Đánh dấu đã giải quyết
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
