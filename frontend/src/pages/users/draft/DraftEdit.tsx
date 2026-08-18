import { useEffect, useMemo, useState } from 'react'

import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { ROUTE } from '@/core/constants/path'
import { documentApi } from '@/core/services/document.service'

import { type DraftItem } from './Draft'

const stringifyContent = (content: Record<string, unknown> | null | undefined): Record<string, string> => {
  if (!content || typeof content !== 'object') return {}

  return Object.entries(content).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = value === null || value === undefined ? '' : String(value)
    return acc
  }, {})
}

export default function DraftEdit() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const initialDraft = location.state as DraftItem | null

  const [title, setTitle] = useState(initialDraft?.templateTitle || 'Bản nháp')
  const [formValues, setFormValues] = useState<Record<string, string>>(initialDraft?.formData || {})
  const [loading, setLoading] = useState(!initialDraft)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || initialDraft) return

    let cancelled = false
    setLoading(true)
    setError(null)

    documentApi.getDraftById(id)
      .then((draft) => {
        if (cancelled) return
        const content = stringifyContent(draft.content)
        setFormValues(content)
        setTitle(draft.templates?.name || content.title || content.name || 'Bản nháp')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load draft:', err)
        setError((err as Error)?.message || 'Không thể tải bản nháp')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, initialDraft])

  const fieldEntries = useMemo(() => Object.entries(formValues), [formValues])

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!id) return

    setSaving(true)
    try {
      await documentApi.updateDraft(id, { content: formValues })
      navigate(ROUTE.USER.DRAFT)
    } catch (err) {
      console.error('Failed to save draft:', err)
      alert((err as Error)?.message || 'Lưu bản nháp thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className='w-full p-4 text-text-description'>Đang tải bản nháp...</div>
  }

  if (error) {
    return (
      <div className='w-full p-4'>
        <p className='text-error-primary mb-4'>{error}</p>
        <Button variant='outline' size='sm' onClick={() => navigate(ROUTE.USER.DRAFT)}>
          Quay lại
        </Button>
      </div>
    )
  }

  return (
    <div className='w-full p-4'>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <h2 className='text-h5 font-bold'>Chỉnh sửa bản nháp - {title}</h2>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={() => navigate(ROUTE.USER.DRAFT)}>
            Hủy
          </Button>
          <Button size='sm' onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </div>

      {fieldEntries.length === 0 ? (
        <div className='rounded-lg border border-border-secondary bg-background-secondary p-6 text-text-description'>
          Bản nháp này chưa có dữ liệu biểu mẫu để chỉnh sửa.
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4'>
          {fieldEntries.map(([key, value]) => (
            <div key={key} className='space-y-1'>
              <label className='text-sm font-medium text-text-secondary'>{key}</label>
              <input
                type='text'
                name={key}
                aria-label={key}
                className='w-full rounded-md border border-border-secondary bg-background-primary px-3 py-2'
                value={value}
                onChange={(event) => handleChange(key, event.target.value)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
