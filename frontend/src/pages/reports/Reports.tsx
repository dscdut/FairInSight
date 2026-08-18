import { useCallback, useEffect, useState } from 'react'

import { AlertCircle, MessageSquare, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import ReportDialog from '@/components/reports/ReportDialog'
import { Badge, Button, Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
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

export default function Reports() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ReportItem[]>([])
  const [status, setStatus] = useState<ReportStatus | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await reportApi.listReports({ page: 1, size: 50, status })
      setItems(Array.isArray(page?.items) ? page.items : [])
    } catch {
      setError('Dữ liệu đang được đồng bộ. Hệ thống sẽ tự tải lại sau vài giây.')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!error) return
    const timer = window.setTimeout(() => {
      void load()
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [error, load])

  return (
    <div className='w-full space-y-5 p-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-h3 font-semibold text-text-primary'>Trung tâm báo cáo</h1>
          <p className='text-sm text-text-description'>Theo dõi báo cáo lỗi hệ thống, báo cáo luật sư và các phản hồi xử lý.</p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Select value={status} onValueChange={(value) => setStatus(value as ReportStatus | 'ALL')}>
            <SelectTrigger className='w-[170px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>Tất cả</SelectItem>
              <SelectItem value='OPEN'>Mới</SelectItem>
              <SelectItem value='IN_REVIEW'>Đang xử lý</SelectItem>
              <SelectItem value='RESOLVED'>Đã giải quyết</SelectItem>
            </SelectContent>
          </Select>
          <ReportDialog
            type='SYSTEM'
            triggerLabel='Tạo báo cáo lỗi hệ thống'
            triggerIcon='plus'
            triggerClassName='border-amber-300 bg-amber-400 text-amber-950 hover:bg-amber-500 hover:text-amber-950'
            onCreated={() => void load()}
          />
        </div>
      </div>

      {error && (
        <Card className='flex flex-col gap-3 border-amber-200 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2 text-sm'>
            <AlertCircle className='h-4 w-4 shrink-0' />
            <span>
              {error}
              <span className='block text-xs text-amber-700'>Bạn vẫn có thể bấm tải lại ngay nếu cần.</span>
            </span>
          </div>
          <Button variant='outline' onClick={() => void load()} className='gap-2 bg-white'>
            <RefreshCw className='h-4 w-4' />
            Tải lại
          </Button>
        </Card>
      )}

      {loading && items.length === 0 ? (
        <div className='py-16 text-center text-text-description'>Đang tải báo cáo...</div>
      ) : items.length === 0 ? (
        <Card className='p-8 text-center text-text-description'>Chưa có báo cáo nào.</Card>
      ) : (
        <div className='grid gap-3'>
          {items.map((report) => (
            <button
              key={report.id}
              type='button'
              onClick={() => navigate(`/reports/${report.id}`)}
              className='w-full cursor-pointer rounded-lg border border-border-secondary bg-background-secondary p-4 text-left transition hover:border-border-focus'
            >
              <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                <div className='min-w-0 space-y-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge>{typeLabel[report.type]}</Badge>
                    <Badge variant='outline'>{statusLabel[report.status]}</Badge>
                    <span className='text-xs text-text-description'>{new Date(report.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <h2 className='line-clamp-1 text-base font-semibold text-text-primary'>{report.customReason || categoryLabel[report.category]}</h2>
                  <p className='line-clamp-2 text-sm text-text-description'>{report.description}</p>
                </div>
                <div className='flex items-center gap-1 text-sm text-text-description'>
                  <MessageSquare className='h-4 w-4' />
                  {report.messages?.length || 0}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
