import { useCallback, useEffect, useState } from 'react'

import { ArrowLeft, Mail, Send } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { Badge, Button, Card, Textarea } from '@/components/ui'
import toastifyCommon from '@/core/lib/toastify-common'
import { reportApi } from '@/core/services/report.service'
import { type ReportCategory, type ReportItem, type ReportMessage, type ReportStatus } from '@/models/types/report.type'

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

function getSenderName(report: ReportItem, item: ReportMessage) {
  if (item.senderRole === 'ADMIN') return item.sender?.fullName || 'Admin'
  if (item.senderRole === 'SYSTEM') return 'Hệ thống'
  return item.sender?.fullName || report.reporter?.fullName || 'Bạn'
}

function MailThreadItem({ report, item, index }: { report: ReportItem; item: ReportMessage; index: number }) {
  const isAdmin = item.senderRole === 'ADMIN'
  const senderName = getSenderName(report, item)

  return (
    <article className='rounded-lg border border-border-secondary bg-background-primary'>
      <div className='flex flex-col gap-3 border-b border-border-secondary px-4 py-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex min-w-0 items-start gap-3'>
          <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background-secondary text-sm font-semibold text-text-primary'>
            {senderName.charAt(0).toUpperCase()}
          </div>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='font-semibold text-text-primary'>{senderName}</span>
              <Badge variant={isAdmin ? 'default' : 'outline'}>{isAdmin ? 'Admin' : index === 0 ? 'Người gửi report' : 'Phản hồi'}</Badge>
            </div>
            <p className='mt-1 text-xs text-text-description'>
              Tới: {isAdmin ? report.reporter?.email || 'người gửi report' : 'Admin FairInSight'}
            </p>
          </div>
        </div>
        <span className='text-xs text-text-description'>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
      </div>
      <div className='px-4 py-4'>
        <p className='whitespace-pre-wrap text-sm leading-6 text-text-primary'>{item.message}</p>
      </div>
    </article>
  )
}

export default function ReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState<ReportItem | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      setReport(await reportApi.getReport(id))
    } catch {
      toastifyCommon.error('Không thể tải báo cáo.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const send = async () => {
    if (!id || !message.trim()) return
    setSending(true)
    try {
      setReport(await reportApi.sendMessage(id, message.trim()))
      setMessage('')
    } catch {
      toastifyCommon.error('Không thể gửi phản hồi.')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className='p-4 text-text-description'>Đang tải báo cáo...</div>
  if (!report) return <div className='p-4 text-text-description'>Không tìm thấy báo cáo.</div>

  const subject = report.customReason || categoryLabel[report.category]

  return (
    <div className='w-full space-y-4 p-4'>
      <Button variant='ghost' onClick={() => navigate(-1)} className='gap-2'>
        <ArrowLeft className='h-4 w-4' />
        Quay lại
      </Button>

      <section className='rounded-lg border border-border-secondary bg-background-primary'>
        <div className='border-b border-border-secondary px-5 py-4'>
          <div className='mb-3 flex flex-wrap items-center gap-2'>
            <Badge>{typeLabel[report.type]}</Badge>
            <Badge variant='outline'>{statusLabel[report.status]}</Badge>
            <span className='text-xs text-text-description'>Tạo lúc {new Date(report.createdAt).toLocaleString('vi-VN')}</span>
          </div>
          <div className='flex items-start gap-3'>
            <div className='mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
              <Mail className='h-5 w-5' />
            </div>
            <div className='min-w-0'>
              <h1 className='text-h4 font-semibold text-text-primary'>{subject}</h1>
              <p className='mt-2 text-sm leading-6 text-text-description'>{report.description}</p>
              <div className='mt-3 grid gap-1 text-xs text-text-secondary'>
                <span>Người gửi: {report.reporter?.fullName || 'Bạn'}{report.reporter?.email ? ` (${report.reporter.email})` : ''}</span>
                {report.targetUser && <span>Đối tượng: {report.targetUser.fullName} ({report.targetUser.email})</span>}
              </div>
            </div>
          </div>
        </div>

        <div className='space-y-3 bg-background-secondary/40 p-4'>
          {report.messages.map((item, index) => (
            <MailThreadItem key={item.id} report={report} item={item} index={index} />
          ))}
        </div>
      </section>

      {report.status !== 'RESOLVED' ? (
        <Card className='space-y-3 p-4'>
          <div>
            <h2 className='text-sm font-semibold text-text-primary'>Trả lời report</h2>
            <p className='text-xs text-text-description'>Nội dung này sẽ được lưu vào luồng trao đổi của report.</p>
          </div>
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            placeholder='Nhập phản hồi hoặc bổ sung thông tin...'
          />
          <div className='flex justify-end'>
            <Button onClick={send} disabled={sending || !message.trim()} className='gap-2'>
              <Send className='h-4 w-4' />
              {sending ? 'Đang gửi...' : 'Gửi phản hồi'}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className='p-4 text-sm text-text-description'>Report này đã được đánh dấu đã giải quyết.</Card>
      )}
    </div>
  )
}
