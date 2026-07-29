import { cn } from '@/core/lib/utils'

type TabId = 'content' | 'metadata' | 'diagram' | 'original' | 'download'

interface Tab {
  id: TabId
  label: string
}

const TABS: Tab[] = [
  { id: 'content', label: 'Nội dung' },
  { id: 'metadata', label: 'Thuộc tính' },
  { id: 'diagram', label: 'Lược đồ' },
  { id: 'original', label: 'Văn bản gốc' },
  { id: 'download', label: 'Tải về' },
]

interface LegalDocumentTabsProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  className?: string
}

export type { TabId }

export function LegalDocumentTabs({ activeTab, onTabChange, className }: LegalDocumentTabsProps) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-border-primary', className)}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-text-tertiary hover:text-text-secondary'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
