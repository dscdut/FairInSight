import { useState } from 'react'
import { ChevronDown, ChevronRight, Menu } from 'lucide-react'
import { cn } from '@/core/lib/utils'
import { Chapter } from '@/models/types/law.type'

interface TableOfContentsProps {
  chapters: Chapter[]
  activeId: string
  onItemClick: (id: string) => void
}

export default function TableOfContents({
  chapters,
  activeId,
  onItemClick
}: TableOfContentsProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'c-1': true,
    'art-1': true,
    'art-2': true,
    'art-3': true,
    'c-2': true
  })

  const toggleNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const isSelected = (id: string) => activeId === id

  return (
    <div className="flex flex-col h-full bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-lg overflow-hidden shadow-sm">
      <div className="h-11 bg-primary text-white flex items-center px-4 font-bold text-sm gap-2">
        <Menu className="w-4 h-4 text-white" />
        Mục lục
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[calc(100vh-220px)] scrollbar-thin">
        {chapters.map(c => {
          const isChapExpanded = expandedNodes[c.id] !== false
          return (
            <div key={c.id} className="space-y-1">
              <div
                onClick={() => onItemClick(c.id)}
                className={cn(
                  "flex items-center justify-between text-xs font-semibold py-1.5 px-2 rounded cursor-pointer transition-colors hover:bg-[var(--background-secondary)]",
                  isSelected(c.id) ? "bg-[#e0f2fe] text-primary" : "text-[var(--text-primary)]"
                )}
              >
                <span>{c.title}</span>
                {c.articles && c.articles.length > 0 && (
                  <button
                    onClick={(e) => toggleNode(c.id, e)}
                    className="p-0.5 hover:bg-[var(--border-primary)] rounded"
                  >
                    {isChapExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {isChapExpanded && c.articles && (
                <div className="pl-3 border-l border-[var(--border-secondary)] ml-2 space-y-1">
                  {c.articles.map(art => {
                    const isArtExpanded = expandedNodes[art.id] !== false
                    return (
                      <div key={art.id} className="space-y-1">
                        <div
                          onClick={() => onItemClick(art.id)}
                          className={cn(
                            "flex items-center justify-between text-[11px] py-1 px-2 rounded cursor-pointer transition-colors hover:bg-[var(--background-secondary)]",
                            isSelected(art.id) ? "bg-[#e0f2fe] text-primary font-semibold" : "text-[var(--text-secondary)]"
                          )}
                        >
                          <span className="truncate max-w-[200px]" title={art.title}>
                            {art.title.split('.')[0]} {/* e.g. Điều 1 */}
                          </span>
                          {art.clauses && art.clauses.length > 0 && (
                            <button
                              onClick={(e) => toggleNode(art.id, e)}
                              className="p-0.5 hover:bg-[var(--border-primary)] rounded"
                            >
                              {isArtExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                          )}
                        </div>

                        {isArtExpanded && art.clauses && (
                          <div className="pl-3 border-l border-[var(--border-secondary)] ml-2 space-y-1">
                            {art.clauses.map(cl => {
                              const isClExpanded = expandedNodes[cl.id] !== false
                              const hasPoints = cl.points && cl.points.length > 0
                              return (
                                <div key={cl.id} className="space-y-1">
                                  <div
                                    onClick={() => onItemClick(cl.id)}
                                    className={cn(
                                      "flex items-center justify-between text-[11px] py-0.5 px-2 rounded cursor-pointer transition-colors hover:bg-[var(--background-secondary)]",
                                      isSelected(cl.id) ? "bg-[#e0f2fe] text-primary font-medium" : "text-[var(--text-tertiary)]"
                                    )}
                                  >
                                    <span>• {cl.title}</span>
                                    {hasPoints && (
                                      <button
                                        onClick={(e) => toggleNode(cl.id, e)}
                                        className="p-0.5 hover:bg-[var(--border-primary)] rounded"
                                      >
                                        {isClExpanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
                                      </button>
                                    )}
                                  </div>

                                  {isClExpanded && hasPoints && cl.points && (
                                    <div className="pl-3 ml-2 space-y-0.5">
                                      {cl.points.map(pt => (
                                        <div
                                          key={pt.id}
                                          onClick={() => onItemClick(pt.id)}
                                          className={cn(
                                            "text-[10px] py-0.5 px-2 rounded cursor-pointer transition-colors hover:bg-[var(--background-secondary)]",
                                            isSelected(pt.id) ? "bg-[#e0f2fe] text-primary font-medium" : "text-[var(--text-tertiary)]"
                                          )}
                                        >
                                          • {pt.title}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
