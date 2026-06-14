import { useState } from 'react'

import { motion } from 'framer-motion'
import { Search } from 'lucide-react'

import { mockTemplates } from '@/_mocks/data-form-library'
import FormGrid from '@/components/ui/FormGrid'
import { Input } from '@/components/ui/input'
import LayoutSwitcher from '@/components/ui/LayoutSwitcher'
import { cn } from '@/core/lib/utils'
import { type ViewMode } from '@/models/types/form-library'

export default function Template() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTemplates = mockTemplates.filter(
    (template) =>
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  return (
    <div className='w-full space-y-8'>
      {/* Header */}
      <motion.div variants={headerVariants} initial='hidden' animate='visible' className='space-y-6'>
        <div>
          <h1 className='text-4xl font-bold text-slate-900 dark:text-white'>Thư viện biểu mẫu</h1>
          <p className='mt-2 text-slate-600 dark:text-slate-400'>
            Khám phá hàng trăm biểu mẫu pháp lý được tạo bởi các chuyên gia
          </p>
        </div>

        {/* Search & Controls */}
        <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
          {/* Search Bar */}
          <div className='relative flex-1'>
            <Search
              className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500'
              size={20}
            />
            <Input
              placeholder='Tìm kiếm biểu mẫu, luật pháp hoặc từ khóa...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'pl-10 w-full',
                'border-slate-200 dark:border-slate-700',
                'placeholder:text-slate-400 dark:placeholder:text-slate-500'
              )}
            />
          </div>

          {/* Layout Switcher */}
          <LayoutSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>

        {/* Results count */}
        <div className='text-sm text-slate-600 dark:text-slate-400'>
          Tìm thấy <span className='font-semibold text-slate-900 dark:text-white'>{filteredTemplates.length}</span> biểu
          mẫu
        </div>
      </motion.div>

      {/* Template Grid */}
      <FormGrid templates={filteredTemplates} viewMode={viewMode} />
    </div>
  )
}
