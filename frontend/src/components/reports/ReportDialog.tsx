import { useMemo, useState } from 'react'

import { AlertTriangle, Plus } from 'lucide-react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea
} from '@/components/ui'
import toastifyCommon from '@/core/lib/toastify-common'
import { reportApi } from '@/core/services/report.service'
import { type ReportCategory, type ReportPriority, type ReportType } from '@/models/types/report.type'

const lawyerCategories: Array<{ value: ReportCategory; label: string }> = [
  { value: 'HARASSMENT', label: 'Quấy rối' },
  { value: 'UNPROFESSIONAL_BEHAVIOR', label: 'Hành vi không chuyên nghiệp' },
  { value: 'FRAUD', label: 'Lừa đảo hoặc thanh toán bất thường' },
  { value: 'OTHER', label: 'Khác' }
]

const systemCategories: Array<{ value: ReportCategory; label: string }> = [
  { value: 'TECHNICAL_ERROR', label: 'Lỗi kỹ thuật' },
  { value: 'PAYMENT_ERROR', label: 'Lỗi thanh toán' },
  { value: 'FEATURE_ERROR', label: 'Không sử dụng được tính năng' },
  { value: 'OTHER', label: 'Khác' }
]

interface ReportDialogProps {
  type?: ReportType
  targetUserId?: string | null
  targetLabel?: string
  triggerLabel?: string
  triggerClassName?: string
  triggerIcon?: 'alert' | 'plus'
  onCreated?: () => void
}

export default function ReportDialog({
  type = 'SYSTEM',
  targetUserId = null,
  targetLabel,
  triggerLabel = 'Báo cáo',
  triggerClassName = '',
  triggerIcon = 'alert',
  onCreated
}: ReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<ReportCategory>(type === 'SYSTEM' ? 'TECHNICAL_ERROR' : 'HARASSMENT')
  const [priority, setPriority] = useState<ReportPriority>('NORMAL')
  const [customReason, setCustomReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const categories = useMemo(() => type === 'SYSTEM' ? systemCategories : lawyerCategories, [type])
  const title = type === 'SYSTEM'
    ? 'Báo cáo lỗi hệ thống'
    : `Báo cáo ${targetLabel || (type === 'LAWYER' ? 'luật sư' : 'người dùng')}`
  const TriggerIcon = triggerIcon === 'plus' ? Plus : AlertTriangle

  const submit = async () => {
    if (type !== 'SYSTEM' && !targetUserId) {
      toastifyCommon.error('Không xác định được đối tượng cần báo cáo.')
      return
    }
    if (category === 'OTHER' && !customReason.trim()) {
      toastifyCommon.error('Vui lòng nhập lý do khác.')
      return
    }
    if (!description.trim()) {
      toastifyCommon.error('Vui lòng mô tả vấn đề.')
      return
    }

    setSubmitting(true)
    try {
      await reportApi.createReport({
        type,
        targetUserId,
        category,
        customReason: category === 'OTHER' ? customReason.trim() : null,
        description: description.trim(),
        priority
      })
      toastifyCommon.success('Đã gửi báo cáo.')
      setOpen(false)
      setCustomReason('')
      setDescription('')
      setPriority('NORMAL')
      onCreated?.()
    } catch {
      toastifyCommon.error('Không thể gửi báo cáo lúc này.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className={`gap-2 ${triggerClassName}`}>
          <TriggerIcon className='h-4 w-4' />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className='bg-background-primary text-text-primary'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Báo cáo sẽ được gửi tới quản trị viên. Bạn có thể theo dõi phản hồi trong Trung tâm báo cáo.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Loại vấn đề</label>
            <Select value={category} onValueChange={(value) => setCategory(value as ReportCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {category === 'OTHER' && (
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Lý do khác</label>
              <Input value={customReason} onChange={(event) => setCustomReason(event.target.value)} />
            </div>
          )}

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Mức độ</label>
            <Select value={priority} onValueChange={(value) => setPriority(value as ReportPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='LOW'>Thấp</SelectItem>
                <SelectItem value='NORMAL'>Bình thường</SelectItem>
                <SelectItem value='HIGH'>Cao</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Mô tả</label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              placeholder='Mô tả ngắn gọn vấn đề bạn gặp phải...'
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)} disabled={submitting}>Hủy</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? 'Đang gửi...' : 'Gửi báo cáo'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
