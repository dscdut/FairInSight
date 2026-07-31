import React from 'react'

import { type Law } from '@/models/types/law.type'

import { DocumentListRow } from './document-list-row'

interface DocumentListTableProps {
  laws: Law[]
  onView: (law: Law) => void
  onDelete?: (law: Law) => void
  onEdit?: (law: Law) => void
  onToggleStatus?: (law: Law) => void
  readOnly?: boolean
  isAdmin?: boolean
}

export const DocumentListTable: React.FC<DocumentListTableProps> = ({
  laws,
  onView,
  onDelete,
  onEdit,
  onToggleStatus,
  readOnly = false,
  isAdmin = false,
}) => {
  return (
    <div className='w-full overflow-x-auto bg-background-primary rounded-b-2xl shadow-sm border border-t-0 border-border-secondary'>
      <table className='w-full min-w-[800px] border-collapse text-left text-sm text-text-secondary'>
        <thead className='bg-background-secondary/40 text-xs font-semibold uppercase text-text-secondary border-b border-border-secondary'>
          <tr>
            <th scope='col' className='px-6 py-4 font-bold text-left'>Tên văn bản</th>
            <th scope='col' className='px-6 py-4 font-bold text-center whitespace-nowrap'>Loại văn bản</th>
            <th scope='col' className='px-6 py-4 font-bold text-center whitespace-nowrap'>Số hiệu</th>
            <th scope='col' className='px-6 py-4 font-bold text-center whitespace-nowrap'>Ngày hiệu lực</th>
            <th scope='col' className='px-6 py-4 font-bold text-center whitespace-nowrap'>Version</th>
            <th scope='col' className='px-6 py-4 font-bold text-center whitespace-nowrap'>Trạng thái</th>
            <th scope='col' className='px-6 py-4 font-bold text-center whitespace-nowrap'>Hành động</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-border-secondary border-t border-border-secondary'>
          {laws.length === 0 ? (
            <tr>
              <td colSpan={7} className='px-6 py-10 text-center text-text-tertiary font-medium'>
                Không tìm thấy văn bản pháp luật nào phù hợp.
              </td>
            </tr>
          ) : (
            laws.map((law) => (
              <DocumentListRow
                key={law.id}
                law={law}
                onView={onView}
                onDelete={onDelete}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
                readOnly={readOnly}
                isAdmin={isAdmin}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
