import { useState, useEffect } from 'react'

import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { ROUTE } from '@/core/constants/path'
import { useAuthStore } from '@/core/store/features/auth/authStore'

interface DraftState {
  id: string
  templateId: string
  templateTitle: string
  templateCategory: string
  lastModified: string | Date
  progress: number
  formData: Record<string, string>
}

export default function DraftEdit() {
  const location = useLocation()
  const navigate = useNavigate()
  const access_token = useAuthStore((s) => s.access_token)

  const draft = (location.state as DraftState) || null

  useEffect(() => {
    if (!draft) {
      // no draft in state — go back
      navigate(ROUTE.USER.DRAFT)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    return draft?.formData ? { ...draft.formData } : {}
  })

  useEffect(() => {
    if (draft?.formData) setFormValues({ ...draft.formData })
  }, [draft])

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!draft) return
    try {
      const res = await fetch(`https://fairinsights-api.gdsc.dev/api/v1/drafts/${draft.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(access_token ? { Authorization: `Bearer ${access_token}` } : {})
        },
        body: JSON.stringify({ content: formValues })
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Save failed: ${res.status} ${txt}`)
      }
      alert('Lưu bản nháp thành công!')
      navigate(ROUTE.USER.DRAFT)
    } catch (err) {
      console.error('Failed to save draft edit:', err)
      alert((err as Error)?.message ?? 'Lưu thất bại')
    }
  }

  if (!draft) return null

  return (
    <div className='w-full p-4'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-h5 font-bold'>Chỉnh sửa bản nháp — {draft.templateTitle}</h2>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={() => navigate(ROUTE.USER.DRAFT)}>
            Hủy
          </Button>
          <Button size='sm' onClick={handleSave}>
            Lưu
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4'>
        {Object.keys(formValues).map((key) => (
          <div key={key} className='space-y-1'>
            <label className='text-sm font-medium text-text-secondary'>{key}</label>
            <input
              className='w-full rounded-md border-border-secondary bg-background-primary px-3 py-2'
              value={formValues[key] ?? ''}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
