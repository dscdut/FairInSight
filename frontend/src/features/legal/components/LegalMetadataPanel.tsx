import type { LegalDocument } from '../types'

interface LegalMetadataPanelProps {
  document: LegalDocument
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex items-start gap-4 py-3 border-b border-border-primary last:border-0'>
      <span className='text-small text-text-tertiary w-40 shrink-0'>{label}</span>
      <span className='text-small text-text-primary flex-1'>{value}</span>
    </div>
  )
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const TYPE_LABEL: Record<string, string> = {
  law: 'Luật',
  decree: 'Nghị định',
  circular: 'Thông tư',
  resolution: 'Nghị quyết',
  decision: 'Quyết định',
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Còn hiệu lực',
  EXPIRED: 'Hết hiệu lực',
  REPLACED: 'Đã thay thế',
}

export function LegalMetadataPanel({ document: doc }: LegalMetadataPanelProps) {
  return (
    <div className='bg-background-primary rounded-xl border border-border-primary divide-y divide-border-primary p-4'>
      <MetaRow label='Số hiệu' value={<span className='font-mono'>{doc.code}</span>} />
      <MetaRow label='Hình thức văn bản' value={TYPE_LABEL[doc.documentType] || doc.documentType} />
      <MetaRow label='Cơ quan ban hành' value={doc.issuingAgency} />
      <MetaRow label='Ngày ban hành' value={formatDate(doc.issueDate)} />
      <MetaRow label='Ngày có hiệu lực' value={formatDate(doc.effectiveDate)} />
      <MetaRow label='Ngày cập nhật' value={formatDate(doc.updatedDate)} />
      <MetaRow label='Trạng thái' value={<span className={doc.status === 'ACTIVE' ? 'text-success-primary font-medium' : 'text-warning-primary font-medium'}>{STATUS_LABEL[doc.status]}</span>} />
      <MetaRow
        label='Lĩnh vực'
        value={
          <div className='flex flex-wrap gap-1'>
            {doc.categories.map((cat) => (
              <span key={cat} className='px-2 py-0.5 rounded-full text-xs bg-info-50 text-info-600 border border-info-400/20'>
                {cat}
              </span>
            ))}
          </div>
        }
      />
    </div>
  )
}
