import { useCallback, useEffect, useMemo, useState } from 'react'

import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import LayoutSwitcher from '@/components/ui/LayoutSwitcher'
import { cn } from '@/core/lib/utils'
import { documentApi, type UserDocument } from '@/core/services/document.service'
import { type ViewMode } from '@/models/types/form-library'

import DraftCard from './components/DraftCard'
import DraftEmpty from './components/DraftEmpty'

export interface DraftItem {
  id: string
  templateId: string
  templateTitle: string
  templateCategory: string
  lastModified: Date
  progress: number
  formData: Record<string, string>
}

const stringifyContent = (content: Record<string, unknown> | null | undefined): Record<string, string> => {
  if (!content || typeof content !== 'object') return {}

  return Object.entries(content).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = value === null || value === undefined ? '' : String(value)
    return acc
  }, {})
}

const getDraftTitle = (document: UserDocument, formData: Record<string, string>) =>
  document.templates?.name || formData.title || formData.name || 'Bản nháp không tên'

const getDraftCategory = (document: UserDocument, formData: Record<string, string>) =>
  document.templates?.description || formData.category || 'Khác'

const calculateProgress = (formData: Record<string, string>) => {
  const values = Object.values(formData)
  if (values.length === 0) return 0

  const filled = values.filter((value) => value.trim().length > 0).length
  return Math.round((filled / values.length) * 100)
}

const mapDraft = (document: UserDocument): DraftItem => {
  const formData = stringifyContent(document.content)

  return {
    id: document.id,
    templateId: document.template_id,
    templateTitle: getDraftTitle(document, formData),
    templateCategory: getDraftCategory(document, formData),
    lastModified: new Date(document.updated_at || document.created_at),
    progress: calculateProgress(formData),
    formData
  }
}

export default function Draft() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [drafts, setDrafts] = useState<DraftItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchDrafts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await documentApi.listDrafts()
      setDrafts(data.map(mapDraft))
    } catch (err) {
      console.error('Failed to load drafts:', err)
      setError((err as Error)?.message || 'Không thể tải bản nháp')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchDrafts()
  }, [fetchDrafts])

  const filteredDrafts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    if (!keyword) return drafts

    return drafts.filter((draft) =>
      draft.templateTitle.toLowerCase().includes(keyword) ||
      draft.templateCategory.toLowerCase().includes(keyword)
    )
  }, [searchQuery, drafts])

  const handleEdit = (draft: DraftItem) => {
    navigate(`/drafts/${draft.id}/edit`, { state: draft })
  }

  const handleDelete = async (draft: DraftItem) => {
    const confirmDelete = window.confirm('Bạn có chắc muốn xóa bản nháp này không?')
    if (!confirmDelete) return

    try {
      await documentApi.deleteDraft(draft.id)
      setDrafts((current) => current.filter((item) => item.id !== draft.id))
    } catch (err) {
      console.error('Failed to delete draft:', err)
      alert((err as Error)?.message || 'Không thể xóa bản nháp')
    }
  }

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  }

  return (
    <div className='w-full space-y-8 p-2 lg:p-4'>
      <motion.div variants={headerVariants} initial='hidden' animate='visible' className='space-y-4'>
        <div>
          <h1 className='text-h2 font-semibold text-text-main tracking-tight'>Bản nháp</h1>
          <p className='text-small text-text-description mt-2'>
            Danh sách biểu mẫu đang chỉnh sửa để bạn tiếp tục hoàn thiện.
          </p>
        </div>

        <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
          <div className='relative flex-1'>
            <Search
              className='absolute left-3 top-1/2 -translate-y-1/2 text-text-description'
              size={20}
              aria-hidden='true'
            />
            <Input
              id='draft-search'
              name='search'
              autoComplete='off'
              aria-label='Tìm kiếm bản nháp'
              placeholder='Tìm kiếm theo tên biểu mẫu hoặc danh mục...'
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={cn(
                'h-11 w-full rounded-xl py-3 pl-10',
                'border-border-secondary bg-background-secondary text-main',
                'placeholder:text-text-description'
              )}
            />
          </div>

          <LayoutSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      </motion.div>

      {loading ? (
        <div className='flex items-center justify-center py-16 text-text-description'>Đang tải bản nháp...</div>
      ) : error ? (
        <div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
          <p className='text-error-primary'>{error}</p>
          <button type='button' className='text-primary underline' onClick={() => void fetchDrafts()}>
            Tải lại
          </button>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <DraftEmpty searchQuery={searchQuery} />
      ) : (
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className={cn(
            'w-full gap-6',
            viewMode === 'grid'
              ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'flex flex-col gap-4'
          )}
        >
          {filteredDrafts.map((draft) => (
            <motion.div key={draft.id} variants={itemVariants}>
              <DraftCard draft={draft} viewMode={viewMode} onEdit={handleEdit} onDelete={handleDelete} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
