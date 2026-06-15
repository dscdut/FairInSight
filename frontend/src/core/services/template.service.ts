import { type AxiosInstance } from 'axios'

import axiosClient from '@/core/services/axios-client'
import { type Template } from '@/models/types/form-library'

export interface BackendTemplate {
  id: string
  name: string
  description: string | null
  file_url: string
<<<<<<< HEAD
  fields: Array<{
    section: string
    inputs: Array<{
      key: string
      label: string
      type: string
      placeholder?: string
      required?: boolean
      disabled?: boolean
      defaultValue?: string
    }>
  }> | null
=======
  fields: any
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
  created_at: string
  updated_at: string
}

<<<<<<< HEAD
function mapTemplateFromBackend(t: BackendTemplate): Template {
=======
function mapTemplateFromBackend(t: any): Template {
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
  return {
    id: t.id,
    title: t.name,
    description: t.description || '',
    category: t.name.toLowerCase().includes('doanh nghiệp') ? 'Doanh nghiệp' : 'Hợp đồng',
    usageCount: 1500,
    isNew: t.name.toLowerCase().includes('nhượng quyền') ? true : false,
    isVip: t.name.toLowerCase().includes('văn phòng') ? true : false,
    fields: t.fields || [],
    fileUrl: t.file_url
  }
}

export const createTemplateApi = (client: AxiosInstance) => ({
  async listTemplates() {
<<<<<<< HEAD
    const res = (await client.get('/templates')) as BackendTemplate[]
    return (res || []).map(mapTemplateFromBackend) as Template[]
  },
  async getTemplateById(id: string) {
    const res = (await client.get(`/templates/${id}`)) as BackendTemplate
=======
    const res = (await client.get('/templates')) as any
    return (res || []).map(mapTemplateFromBackend) as Template[]
  },
  async getTemplateById(id: string) {
    const res = (await client.get(`/templates/${id}`)) as any
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
    return mapTemplateFromBackend(res)
  }
})

export const templateApi = createTemplateApi(axiosClient)
