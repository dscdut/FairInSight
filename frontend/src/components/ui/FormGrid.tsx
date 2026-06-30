import { cn } from '@/core/lib/utils'
import { type Template, type ViewMode } from '@/models/types/form-library'

import FormCard from './FormCard'

interface FormGridProps {
  templates: Template[]
  viewMode: ViewMode
  onSelect?: (template: Template) => void
  onPreview?: (template: Template) => void
}

export default function FormGrid({ templates, viewMode, onSelect, onPreview }: FormGridProps) {
  const gridClasses = cn(
    'w-full gap-6',
    viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'flex flex-col gap-4'
  )

  if (templates.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16'>
        <p className='text-text-main'>Không tìm thấy biểu mẫu</p>
      </div>
    )
  }

  return (
    <div className={gridClasses}>
      {templates.map((template, index) => (
        <FormCard key={template.id} template={template} viewMode={viewMode} index={index} onSelect={onSelect} onPreview={onPreview} />
      ))}
    </div>
  )
}
