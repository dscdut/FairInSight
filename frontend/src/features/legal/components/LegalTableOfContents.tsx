import { ChevronDown, ChevronRight, List } from 'lucide-react'
import { useState, useCallback } from 'react'

import { cn } from '@/core/lib/utils'
import type { TocItem } from '../types'

interface LegalTableOfContentsProps {
  items: TocItem[]
  activeId?: string
  onItemClick: (id: string) => void
  className?: string
}

interface TocNodeProps {
  item: TocItem
  activeId?: string
  onItemClick: (id: string) => void
  depth?: number
}

function TocNode({ item, activeId, onItemClick, depth = 0 }: TocNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = item.children && item.children.length > 0
  const isActive = activeId === item.id

  const indentClass = depth === 0 ? '' : depth === 1 ? 'ml-3' : depth === 2 ? 'ml-6' : 'ml-9'
  const dotSize = depth === 0 ? 'text-sm font-semibold' : depth === 1 ? 'text-xs font-medium' : 'text-xs'

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors group',
          indentClass,
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-text-secondary hover:bg-background-secondary hover:text-text-primary'
        )}
        onClick={() => {
          onItemClick(item.id)
          if (hasChildren) setExpanded(!expanded)
        }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            className='flex items-center justify-center h-3.5 w-3.5 shrink-0'
          >
            {expanded ? (
              <ChevronDown className='h-3 w-3' />
            ) : (
              <ChevronRight className='h-3 w-3' />
            )}
          </button>
        ) : (
          <span className={cn('shrink-0 rounded-full bg-current', depth >= 2 ? 'h-1.5 w-1.5 ml-1' : 'h-1.5 w-1.5 ml-1')} />
        )}
        <span className={cn('leading-tight', dotSize)}>
          {item.label}
        </span>
      </div>
      {hasChildren && expanded && (
        <div>
          {item.children!.map((child) => (
            <TocNode
              key={child.id}
              item={child}
              activeId={activeId}
              onItemClick={onItemClick}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function LegalTableOfContents({
  items,
  activeId,
  onItemClick,
  className,
}: LegalTableOfContentsProps) {
  return (
    <div className={cn('bg-background-primary rounded-xl border border-border-primary flex flex-col', className)}>
      <div className='flex items-center gap-2 px-4 py-3 border-b border-border-primary bg-info-600 rounded-t-xl'>
        <List className='h-4 w-4 text-white shrink-0' />
        <span className='text-sm font-semibold text-white'>Mục lục</span>
      </div>
      <div className='overflow-y-auto flex-1 p-2 max-h-[calc(100vh-240px)]'>
        {items.map((item) => (
          <TocNode
            key={item.id}
            item={item}
            activeId={activeId}
            onItemClick={onItemClick}
          />
        ))}
      </div>
    </div>
  )
}
