import { useState, useMemo, useEffect, useRef } from 'react'

import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import LayoutSwitcher from '@/components/ui/LayoutSwitcher'
import { cn } from '@/core/lib/utils'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { type ViewMode } from '@/models/types/form-library'

import DraftCard from './components/DraftCard'
import DraftEmpty from './components/DraftEmpty'

interface Draft {
  id: string
  templateId: string
  templateTitle: string
  templateCategory: string
  lastModified: Date
  progress: number // 0-100%
  formData: Record<string, string>
}

export default function Draft() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const access_token = useAuthStore((s) => s.access_token)

  // Filter drafts based on search query
  const filteredDrafts = useMemo(() => {
    return drafts.filter((draft) => {
      const matchesSearch =
        draft.templateTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (draft.templateCategory || '').toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }, [searchQuery, drafts])

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  }

  // extract fetchDrafts so it can be reused after delete
  const navigate = useNavigate()
  const mountedRef = useRef(true)

  const fetchDrafts = async () => {
    try {
      const res = await fetch('https://fairinsights-api.gdsc.dev/api/v1/drafts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(access_token ? { Authorization: `Bearer ${access_token}` } : {})
        }
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Failed to fetch drafts: ${res.status} ${text}`)
      }
      const data = (await res.json()) as Array<Record<string, unknown>>
      const mapped: Draft[] = data.map((doc) => {
        const content = (doc['content'] as Record<string, unknown>) || {}
        const totalFields = Object.keys(content).length || 0
        const filled = Object.values(content).filter(
          (v) => v !== null && v !== undefined && String(v ?? '').trim() !== ''
        ).length
        const progress = totalFields > 0 ? Math.round((filled / totalFields) * 100) : 0
        return {
          id: String(doc['id'] ?? ''),
          templateId: String(doc['template_id'] ?? doc['templateId'] ?? ''),
          templateTitle: String(
            (doc['templates'] as Record<string, unknown>)?.['name'] ?? (content['title'] as string) ?? 'Không tên'
          ),
          templateCategory: String((content['category'] as string) ?? 'Khác'),
          lastModified: new Date(String(doc['updated_at'] ?? doc['created_at'] ?? Date.now())),
          progress,
          formData: Object.keys(content).reduce((acc: Record<string, string>, key) => {
            const val = content[key]
            acc[key] = val === null || val === undefined ? '' : String(val)
            return acc
          }, {})
        }
      })

      setDrafts(mapped)
    } catch (err) {
      console.error(err)
      if (mountedRef.current) setError((err as Error)?.message ?? 'Lỗi khi tải bản nháp')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrafts()
    return () => {
      mountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access_token])

  const handleEdit = (draft: Draft) => {
    navigate(`/drafts/${draft.id}/edit`, { state: draft })
  }

  const handleDelete = async (draft: Draft) => {
    const confirmDelete = window.confirm('Bạn có chắc muốn xóa bản nháp này không?')
    if (!confirmDelete) return
    try {
      const res = await fetch(`https://fairinsights-api.gdsc.dev/api/v1/drafts/${draft.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(access_token ? { Authorization: `Bearer ${access_token}` } : {})
        }
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Xóa thất bại: ${res.status} ${txt}`)
      }
      // Refresh list
      await fetchDrafts()
    } catch (err) {
      console.error('Failed to delete draft:', err)
      alert((err as Error)?.message ?? 'Không thể xóa bản nháp')
    }
  }

  console.log('filteredDrafts:', filteredDrafts)
  return (
    <div className='w-full space-y-8 p-2 lg:p-4'>
      {/* Header */}
      <motion.div variants={headerVariants} initial='hidden' animate='visible' className='space-y-4'>
        <div>
          <h1 className='text-h2 font-semibold text-text-main tracking-tight'>Bản nháp</h1>
          <p className='text-small text-text-description mt-2'>
            Danh sách biểu mẫu đang chỉnh sửa - tiếp tục chỉnh sửa hoặc hoàn thành bản nháp của bạn
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
              id='draft-search'
              name='search'
              autoComplete='off'
              aria-label='Tìm kiếm bản nháp'
              placeholder='Tìm kiếm theo tên biểu mẫu hoặc danh mục…'
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
      </motion.div>

      {/* Drafts Grid/List */}
      {loading ? (
        <div className='flex items-center justify-center py-16 text-text-description'>Đang tải bản nháp…</div>
      ) : error ? (
        <div className='flex items-center justify-center py-16 text-error-primary'>{error}</div>
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
