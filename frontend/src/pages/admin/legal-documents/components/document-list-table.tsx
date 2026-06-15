import React from 'react'

import { type Law } from '@/models/types/law.type'

import { DocumentListRow } from './document-list-row'

interface DocumentListTableProps {
  laws: Law[]
  onView: (law: Law) => void
  onEdit?: (law: Law) => void
  onToggleStatus?: (law: Law) => void
  readOnly?: boolean
}

export const DocumentListTable: React.FC<DocumentListTableProps> = ({
  laws,
  onView,
  onEdit,
  onToggleStatus,
  readOnly = false,
}) => {
  return (
    <div className='w-full overflow-x-auto bg-background-primary rounded-b-2xl shadow-sm border border-t-0 border-border-secondary'>
      <table className='w-full min-w-[800px] border-collapse text-left text-sm text-text-secondary'>
        <thead className='bg-background-secondary/40 text-xs font-semibold uppercase text-text-secondary border-b border-border-secondary'>
          <tr>
            <th scope='col' className='px-6 py-4 font-bold'>Tên văn bản</th>
            <th scope='col' className='px-6 py-4 font-bold'>Số hiệu</th>
            <th scope='col' className='px-6 py-4 font-bold'>Ngày hiệu lực</th>
            <th scope='col' className='px-6 py-4 font-bold text-center'>Version</th>
            <th scope='col' className='px-6 py-4 font-bold text-center'>Trạng thái</th>
            <th scope='col' className='px-6 py-4 font-bold text-center'>Hành động</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-border-secondary border-t border-border-secondary'>
          {laws.length === 0 ? (
            <tr>
              <td colSpan={6} className='px-6 py-10 text-center text-text-tertiary'>
                Không tìm thấy văn bản pháp luật nào phù hợp.
              </td>
            </tr>
          ) : (
            laws.map((law) => (
              <DocumentListRow
                key={law.id}
                law={law}
                onView={onView}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
                readOnly={readOnly}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
