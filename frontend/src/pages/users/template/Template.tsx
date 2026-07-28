import { useState } from 'react'

import { motion } from 'framer-motion'
import { Search } from 'lucide-react'

import { mockTemplates } from '@/_mocks/data-form-library'
import FormGrid from '@/components/ui/FormGrid'
import { Input } from '@/components/ui/input'
import LayoutSwitcher from '@/components/ui/LayoutSwitcher'
import { cn } from '@/core/lib/utils'
import { type ViewMode, type Template as TTemplate } from '@/models/types/form-library'

import TemplatePreviewModal from './components/TemplatePreviewModal'
import TemplateEditor from './TemplateEditor'

export default function Template() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả')
  const [selectedTemplate, setSelectedTemplate] = useState<TTemplate | null>(null)
  // Biểu mẫu đang xem trước sơ bộ (popup) — khác selectedTemplate (mở editor).
  const [previewTemplate, setPreviewTemplate] = useState<TTemplate | null>(null)

  const categories = ['Tất cả', ...Array.from(new Set(mockTemplates.map((t) => t.category)))]

  const filteredTemplates = mockTemplates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === 'Tất cả' || template.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  if (selectedTemplate) {
    return (
      <div className='w-full p-2 lg:p-4'>
        <TemplateEditor template={selectedTemplate} onBack={() => setSelectedTemplate(null)} />
      </div>
    )
  }

  return (
    <div className='w-full space-y-8 p-2 lg:p-4'>
      {/* Header */}
      <motion.div variants={headerVariants} initial='hidden' animate='visible' className='space-y-4'>
        <div>
          <h1 className='text-h2 font-semibold text-text-main tracking-tight'>Thư viện biểu mẫu</h1>
          <p className='text-small text-text-description mt-2'>
            Khám phá hàng trăm biểu mẫu pháp lý được tạo bởi các chuyên gia
          </p>
        </div>

        {/* Search & Controls */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
          {/* Search Bar */}
          <div className='relative flex-1'>
            <Search
              className='absolute left-2 top-1/2 transform -translate-y-1/2 text-text-description'
              size={20}
              aria-hidden='true'
            />
            <Input
              id='search-input'
              name='search'
              autoComplete='off'
              aria-label='Tìm kiếm biểu mẫu pháp lý'
              placeholder='Tìm kiếm biểu mẫu, luật pháp hoặc từ khóa…'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'pl-3 py-3 w-full rounded-xl h-11',
                'border-border-secondary bg-background-secondary text-main',
                'placeholder:text-text-description'
              )}
            />
          </div>

          {/* Layout Switcher */}
          <LayoutSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>

        {/* Categories Filter Pills */}
        <div className='flex flex-wrap items-center gap-2 pt-2'>
          {categories.map((category) => {
            const isSelected = category === selectedCategory
            return (
              <button
                key={category}
                type='button'
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none',
                  isSelected
                    ? 'bg-primary border-primary text-white shadow-sm'
                    : 'bg-background-primary border-border-secondary text-text-description hover:bg-background-secondary hover:text-main'
                )}
              >
                {category}
              </button>
            )
          })}
        </div>

        {/* Results count */}
        <div className='text-small text-text-description'>
          Tìm thấy <span className='font-semibold text-main'>{filteredTemplates.length}</span> biểu mẫu
        </div>
      </motion.div>

      {/* Template Grid */}
      <FormGrid
        templates={filteredTemplates}
        viewMode={viewMode}
        onSelect={setSelectedTemplate}
        onPreview={setPreviewTemplate}
      />

      {/* Xem trước sơ bộ — popup; "Sử dụng" trong popup sẽ mở editor */}
      <TemplatePreviewModal
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUse={(tpl) => {
          setPreviewTemplate(null)
          setSelectedTemplate(tpl)
        }}
      />
    </div>
  )
}
