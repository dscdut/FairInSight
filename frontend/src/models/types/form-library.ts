export interface Template {
  id: string
  title: string
  description: string
  category: string
  usageCount: number
  isNew: boolean
  isVip: boolean
  thumbnail?: string
  fileUrl?: string
  fields?: {
    section: string
    inputs: {
      key: string
      label: string
      type: string
      placeholder?: string
      required?: boolean
      disabled?: boolean
      defaultValue?: string
    }[]
  }[]
}

export type ViewMode = 'grid' | 'list'
