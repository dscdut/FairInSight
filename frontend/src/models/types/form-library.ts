export interface Template {
  id: string
  title: string
  description: string
  category: string
  usageCount: number
  isNew: boolean
  isVip: boolean
  thumbnail?: string
}

export type ViewMode = 'grid' | 'list'
