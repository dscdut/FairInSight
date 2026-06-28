// Panel quan hệ 2 CHIỀU quanh unit đang chọn. Chia 2 nhóm:
//  - Outgoing: unit này ĐI tác động/dẫn chiếu cái khác (gồm cạnh TREO chưa nối).
//  - Incoming: unit này BỊ tác động / ĐƯỢC dẫn chiếu bởi cái khác.
// Nhãn (label) đã đảo chủ động/bị động sẵn từ BE. Cạnh treo (resolved=false) tô vàng
// + icon cảnh báo — đây là chỗ admin cần nối tay ở bước sau (vòng này read-only).
import { AlertTriangle, ArrowRight, ArrowLeft, CornerDownRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/core/lib/utils'
import { type RelationItem, type UnitNode } from '@/core/services/law-inspect.service'

// màu badge theo loại quan hệ (amendment = đổi hiệu lực, đậm hơn; reference = nhạt).
function relColor(item: RelationItem): string {
  if (item.kind === 'amendment') {
    if (item.rel_type === 'repeal' || item.rel_type === 'replace') return 'bg-red-100 text-red-700'
    return 'bg-amber-100 text-amber-700'
  }
  return 'bg-blue-100 text-blue-700'
}

function RelationRow({ item }: { item: RelationItem }) {
  const treo = !item.resolved
  // resolved=true nhưng đầu kia mất tên = unit đích đã bị XÓA (mồ côi do re-ingest).
  // Ghi rõ thay vì '?' mơ hồ — đây là dữ liệu cần dọn, không phải lỗi hiển thị.
  const orphan = item.resolved && !item.other_doc_title
  const target = treo
    ? item.target_text || 'chưa xác định'
    : orphan
      ? 'Đơn vị đích đã bị xóa (dữ liệu mồ côi)'
      : `${item.other_doc_title}${item.other_article_no ? ` · Điều ${item.other_article_no}` : ''}${
          item.other_clause_no ? ` Khoản ${item.other_clause_no}` : ''
        }`

  const flagged = treo || orphan // cả 2 đều cần soát → tô vàng

  return (
    <div
      className={cn(
        'flex flex-col gap-1 p-2.5 rounded-lg border text-xs',
        flagged ? 'border-amber-300 bg-amber-50' : 'border-border-secondary bg-background-primary'
      )}
    >
      <div className='flex items-center gap-2 flex-wrap'>
        <Badge className={cn('shrink-0', relColor(item))}>{item.label}</Badge>
        {item.via_parent && (
          <span className='inline-flex items-center gap-0.5 text-[10px] text-text-tertiary'>
            <CornerDownRight className='w-3 h-3' />
            qua Điều cha
          </span>
        )}
        {treo && (
          <span className='inline-flex items-center gap-0.5 text-[10px] text-amber-700 font-semibold'>
            <AlertTriangle className='w-3 h-3' />
            chưa nối
          </span>
        )}
        {orphan && (
          <span className='inline-flex items-center gap-0.5 text-[10px] text-amber-700 font-semibold'>
            <AlertTriangle className='w-3 h-3' />
            mồ côi
          </span>
        )}
      </div>
      <div className='flex items-start gap-1.5 text-text-primary'>
        <span className={cn('font-semibold shrink-0', flagged ? 'text-amber-700' : 'text-text-secondary')}>
          {target}
        </span>
      </div>
      {item.evidence_text && (
        <p className='text-[11px] text-text-tertiary italic line-clamp-2 leading-snug'>
          “{item.evidence_text}”
        </p>
      )}
    </div>
  )
}

interface RelationPanelProps {
  unit: UnitNode | null
  outgoing: RelationItem[]
  incoming: RelationItem[]
  loading: boolean
}

export function RelationPanel({ unit, outgoing, incoming, loading }: RelationPanelProps) {
  if (!unit) {
    return (
      <div className='flex-1 flex items-center justify-center text-text-tertiary text-xs p-8 text-center'>
        Chọn một Điều / Khoản / Điểm bên trái để xem chi tiết và các quan hệ của nó.
      </div>
    )
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Chi tiết unit đang chọn */}
      <div className='p-4 border-b border-border-secondary'>
        <p className='text-xs text-text-tertiary font-semibold mb-1'>{unit.path_text || ''}</p>
        <h3 className='text-sm font-bold text-text-primary'>
          {unit.title || `Điều ${unit.article_no ?? ''}`}
        </h3>
        {unit.content && (
          <p className='text-xs text-text-secondary mt-2 whitespace-pre-wrap leading-relaxed max-h-40 overflow-auto'>
            {unit.content}
          </p>
        )}
      </div>

      {loading ? (
        <div className='flex-1 flex items-center justify-center text-text-tertiary text-xs gap-2'>
          <div className='w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin' />
          Đang tải quan hệ…
        </div>
      ) : (
        <div className='flex-1 overflow-auto p-4 space-y-5'>
          {/* OUTGOING */}
          <section>
            <div className='flex items-center gap-1.5 mb-2'>
              <ArrowRight className='w-4 h-4 text-primary' />
              <h4 className='text-xs font-bold text-text-primary uppercase'>
                Điều này tác động / dẫn chiếu ra ({outgoing.length})
              </h4>
            </div>
            {outgoing.length === 0 ? (
              <p className='text-[11px] text-text-tertiary pl-5'>Không có.</p>
            ) : (
              <div className='space-y-2'>
                {outgoing.map((r) => (
                  <RelationRow key={r.relation_id} item={r} />
                ))}
              </div>
            )}
          </section>

          {/* INCOMING */}
          <section>
            <div className='flex items-center gap-1.5 mb-2'>
              <ArrowLeft className='w-4 h-4 text-blue-600' />
              <h4 className='text-xs font-bold text-text-primary uppercase'>
                Điều này bị tác động / được dẫn chiếu ({incoming.length})
              </h4>
            </div>
            {incoming.length === 0 ? (
              <p className='text-[11px] text-text-tertiary pl-5'>Không có.</p>
            ) : (
              <div className='space-y-2'>
                {incoming.map((r) => (
                  <RelationRow key={r.relation_id} item={r} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
