import React from 'react'

import { Eye, Edit2 } from 'lucide-react'

import { cn } from '@/core/lib/utils'
import { type Law } from '@/models/types/law.type'

import { DOC_TYPE_LABELS } from '../doc-type'

interface DocumentListRowProps {
  law: Law
  onView: (law: Law) => void
  onEdit?: (law: Law) => void
  onToggleStatus?: (law: Law) => void
  readOnly?: boolean
}

export const DocumentListRow: React.FC<DocumentListRowProps> = ({
  law,
  onView,
  onEdit,
  onToggleStatus,
  readOnly = false,
}) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    const d = String(date.getDate()).padStart(2, '0')
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const y = date.getFullYear()
    return `${d}/${m}/${y}`
  }

  const getLatestVersionName = (law: Law) => {
    if (!law.versions || law.versions.length === 0) return 'V1'
    const sorted = [...law.versions].sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
    return sorted[0].version.toUpperCase()
  }

  const latestVer = getLatestVersionName(law)

  // Tên hiển thị = title (tên thuần trong DB) + số hiệu. DB lưu title sạch (không kèm
  // số hiệu), nhưng cột "Tên văn bản" ghép lại cho đầy đủ như cách VBPL hiển thị.
  const displayName = law.documentNumber
    ? `${law.title} số ${law.documentNumber}`
    : law.title

  return (
    <tr className='hover:bg-background-secondary/20 transition-all duration-200'>
      {/* Tên văn bản */}
      <td className='px-6 py-5.5'>
        <div className='flex flex-col gap-0.5'>
          <button
            type='button'
            onClick={() => onView(law)}
            className='font-bold text-text-primary text-sm hover:text-primary transition-colors cursor-pointer text-left focus:outline-none'
          >
            {displayName}
          </button>
          <span className='text-xs text-text-description font-medium'>
            {law.authorName ? `Ban hành bởi ${law.authorName}` : 'Tài liệu nội bộ'}
          </span>
        </div>
      </td>

      {/* Loại văn bản — badge phân loại (Luật/Nghị quyết/Thông tư...) */}
      <td className='px-6 py-5.5 whitespace-nowrap'>
        {law.docType && DOC_TYPE_LABELS[law.docType] ? (
          <span className='inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-primary bg-primary/10 border border-primary/20'>
            {DOC_TYPE_LABELS[law.docType]}
          </span>
        ) : (
          <span className='text-text-tertiary'>—</span>
        )}
      </td>

      {/* Số hiệu — không xuống dòng, luôn nằm gọn 1 dòng */}
      <td className='px-6 py-5.5 font-semibold text-text-secondary whitespace-nowrap'>
        {law.documentNumber}
      </td>

      {/* Ngày hiệu lực */}
      <td className='px-6 py-5.5 font-semibold text-text-secondary whitespace-nowrap'>
        {formatDate(law.effectiveDate)}
      </td>

      {/* Version */}
      <td className='px-6 py-5.5 text-center'>
        <span className='inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-text-secondary bg-background-secondary border border-border-secondary uppercase'>
          {latestVer}
        </span>
      </td>

      {/* Trạng thái */}
      <td className='px-6 py-5.5 text-center'>
        <span
          className={cn(
            'inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border',
            law.status === 'ACTIVE'
              ? 'bg-info-primary/10 text-info-primary border-info-primary/20'
              : 'bg-error-primary/10 text-error-primary border-error-primary/20'
          )}
        >
          {law.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </td>

      {/* Hành động */}
      <td className='px-6 py-5.5'>
        <div className='flex items-center justify-center gap-3.5'>
          {/* View */}
          <button
            onClick={() => onView(law)}
            className='p-1.5 text-text-tertiary hover:text-primary hover:bg-background-secondary rounded-lg transition-all'
            title='Xem chi tiết & lịch sử phiên bản'
          >
            <Eye className='w-4.5 h-4.5' />
          </button>

          {/* Edit */}
          {!readOnly && onEdit && (
            <button
              onClick={() => onEdit(law)}
              className='p-1.5 text-text-tertiary hover:text-warning-secondary hover:bg-warning-primary/10 rounded-lg transition-all'
              title='Chỉnh sửa văn bản'
            >
              <Edit2 className='w-4.5 h-4.5' />
            </button>
          )}

          {/* Toggle status Switch */}
          {!readOnly && onToggleStatus && (
            <button
              onClick={() => onToggleStatus(law)}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner',
                law.status === 'ACTIVE' ? 'bg-primary' : 'bg-background-tertiary'
              )}
              title={law.status === 'ACTIVE' ? 'Chuyển sang Hết hiệu lực' : 'Chuyển sang Còn hiệu lực'}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out',
                  law.status === 'ACTIVE' ? 'translate-x-4' : 'translate-x-0'
                )}
              />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
