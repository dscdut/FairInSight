// Cây Điều/Khoản/Điểm của 1 văn bản. Nhận list PHẲNG (mỗi node có parent_id), tự
// dựng cây + render gập: mặc định chỉ hiện Điều (article), click Điều mới mở Khoản/
// Điểm con. Luật lớn (Bộ luật Hình sự ~4400 unit) nên KHÔNG đổ phẳng — gập là bắt buộc.
import { useMemo, useState } from 'react'

import { ChevronDown, ChevronRight } from 'lucide-react'

import { cn } from '@/core/lib/utils'
import { type UnitNode } from '@/core/services/law-inspect.service'

interface TreeNode extends UnitNode {
  children: TreeNode[]
}

// dựng cây từ list phẳng theo parent_id, giữ thứ tự order_index (BE đã sort).
function buildTree(units: UnitNode[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  units.forEach((u) => map.set(u.id, { ...u, children: [] }))
  const roots: TreeNode[] = []
  map.forEach((node) => {
    const parent = node.parent_id ? map.get(node.parent_id) : null
    if (parent) parent.children.push(node)
    else roots.push(node)
  })
  return roots
}

// nhãn ngắn cho 1 unit theo loại. Chương/Mục/Phần định danh bằng unit_no (I, II...),
// KHÔNG phải article_no → trước đây đọc nhầm cột nên ra "Chương ?".
function unitLabel(u: UnitNode): string {
  if (u.unit_type === 'chapter') return `Chương ${u.unit_no ?? ''}`.trim() || 'Chương'
  if (u.unit_type === 'section') return `Mục ${u.unit_no ?? ''}`.trim() || 'Mục'
  if (u.unit_type === 'part') return `Phần ${u.unit_no ?? ''}`.trim() || 'Phần'
  if (u.unit_type === 'article') return `Điều ${u.article_no ?? u.unit_no ?? '?'}`
  if (u.unit_type === 'clause') return `Khoản ${u.clause_no ?? u.unit_no ?? '?'}`
  if (u.unit_type === 'point') return `Điểm ${u.point_label ?? u.unit_no ?? '?'}`
  return u.unit_type
}

// màu chấm trạng thái hiệu lực (Điều bị thay/bãi → đỏ/cam để nhìn ra ngay).
const STATUS_DOT: Record<string, string> = {
  active: 'bg-green-500',
  amended: 'bg-amber-500',
  replaced: 'bg-red-500',
  repealed: 'bg-red-600',
  not_yet: 'bg-gray-400'
}

interface UnitTreeProps {
  units: UnitNode[]
  selectedId: string | null
  onSelect: (unit: UnitNode) => void
}

export function UnitTree({ units, selectedId, onSelect }: UnitTreeProps) {
  const tree = useMemo(() => buildTree(units), [units])
  // các node đang mở (chứa con). Mặc định rỗng = mọi Điều gập.
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const renderNode = (node: TreeNode, depth: number) => {
    const hasChildren = node.children.length > 0
    const isOpen = expanded.has(node.id)
    const isSelected = node.id === selectedId

    return (
      <div key={node.id}>
        <div
          role='button'
          tabIndex={0}
          className={cn(
            'flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer text-xs transition-colors',
            isSelected
              ? 'bg-primary/10 text-primary font-semibold'
              : 'hover:bg-background-secondary text-text-primary'
          )}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={() => onSelect(node)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect(node)
            }
          }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggle(node.id)
              }}
              className='shrink-0 text-text-tertiary hover:text-text-primary'
            >
              {isOpen ? <ChevronDown className='w-3.5 h-3.5' /> : <ChevronRight className='w-3.5 h-3.5' />}
            </button>
          ) : (
            <span className='w-3.5 shrink-0' />
          )}
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0',
              STATUS_DOT[node.unit_status] ?? 'bg-gray-300'
            )}
          />
          <span className='font-semibold shrink-0'>{unitLabel(node)}</span>
          <span className='text-text-tertiary truncate'>
            {node.title || node.content || ''}
          </span>
        </div>
        {hasChildren && isOpen && node.children.map((c) => renderNode(c, depth + 1))}
      </div>
    )
  }

  if (units.length === 0) {
    return <p className='text-xs text-text-tertiary p-4 text-center'>Văn bản không có đơn vị nào.</p>
  }

  return <div className='py-1'>{tree.map((n) => renderNode(n, 0))}</div>
}
