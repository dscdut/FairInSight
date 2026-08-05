import React from 'react'

import { Eye, MoreVertical, Trash2, Edit2 } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/core/lib/utils'
import { type Law } from '@/models/types/law.type'

import { DOC_TYPE_LABELS } from '../doc-type'

interface DocumentListRowProps {
  law: Law
  onView: (law: Law) => void
  onDelete?: (law: Law) => void
  onEdit?: (law: Law) => void
  onToggleStatus?: (law: Law) => void
  readOnly?: boolean
  isAdmin?: boolean
}

export const DocumentListRow: React.FC<DocumentListRowProps> = ({
  law,
  onView,
  onDelete,
  onEdit,
  onToggleStatus: _onToggleStatus,
  readOnly = false,
  isAdmin = false,
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

  const displayName = law.documentNumber
    ? `${law.title} số ${law.documentNumber}`
    : law.title

  return (
    <tr className='hover:bg-background-secondary/20 transition-all duration-200'>
      {/* Tên văn bản */}
      <td className='px-6 py-4 font-medium'>
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

      {/* Loại văn bản */}
      <td className='px-6 py-4 text-center whitespace-nowrap'>
        {law.docType && DOC_TYPE_LABELS[law.docType] ? (
          <span className='inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-primary bg-primary/10 border border-primary/20'>
            {DOC_TYPE_LABELS[law.docType]}
          </span>
        ) : (
          <span className='text-text-tertiary'>—</span>
        )}
      </td>

      {/* Số hiệu */}
      <td className='px-6 py-4 text-center font-semibold text-text-secondary whitespace-nowrap'>
        {law.documentNumber || '—'}
      </td>

      {/* Ngày hiệu lực */}
      <td className='px-6 py-4 text-center font-semibold text-text-secondary whitespace-nowrap'>
        {formatDate(law.effectiveDate) || '—'}
      </td>

      {/* Version */}
      <td className='px-6 py-4 text-center'>
        <span className='inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-text-secondary bg-background-secondary border border-border-secondary uppercase'>
          {latestVer}
        </span>
      </td>

      {/* Trạng thái */}
      <td className='px-6 py-4 text-center'>
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

      {/* Hành động (3 Chấm Dropdown Menu) */}
      <td className='px-6 py-4 text-center'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              className='p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-background-secondary transition-all cursor-pointer outline-none focus:ring-2 focus:ring-primary/20'
              title='Tùy chọn thao tác'
            >
              <MoreVertical className='w-4 h-4' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-44 bg-background-primary border border-border-secondary shadow-lg rounded-xl p-1 z-50'>
            <DropdownMenuItem
              onClick={() => onView(law)}
              className='flex items-center gap-2 px-3 py-2 text-xs font-medium text-text-primary hover:bg-background-secondary rounded-lg cursor-pointer transition-colors'
            >
              <Eye className='w-4 h-4 text-text-secondary' />
              <span>Xem chi tiết</span>
            </DropdownMenuItem>

            {!readOnly && onEdit && (
              <DropdownMenuItem
                onClick={() => onEdit(law)}
                className='flex items-center gap-2 px-3 py-2 text-xs font-medium text-text-primary hover:bg-background-secondary rounded-lg cursor-pointer transition-colors'
              >
                <Edit2 className='w-4 h-4 text-text-secondary' />
                <span>Chỉnh sửa</span>
              </DropdownMenuItem>
            )}

            {/* CHỈ HIỆN NÚT XÓA NẾU LÀ ADMIN */}
            {isAdmin && onDelete && (
              <>
                <DropdownMenuSeparator className='my-1 border-border-secondary' />
                <DropdownMenuItem
                  onClick={() => onDelete(law)}
                  className='flex items-center gap-2 px-3 py-2 text-xs font-semibold text-error-primary hover:bg-error-primary/10 focus:bg-error-primary/10 focus:text-error-primary rounded-lg cursor-pointer transition-colors'
                >
                  <Trash2 className='w-4 h-4' />
                  <span>Xóa văn bản</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}
