import React from 'react'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownPreviewProps {
  content: string
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-text-secondary leading-relaxed text-left space-y-3.5 overflow-y-auto pr-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => (
            <h1 className="text-[13px] font-black text-primary border-b border-border-secondary/50 pb-2 mt-5 mb-3.5 uppercase tracking-wide" {...props} />
          ),
          h2: ({ ...props }) => (
            <h2 className="text-xs font-bold text-text-primary mt-4.5 mb-2.5 border-l-2 border-primary pl-2.5 uppercase tracking-wide" {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 className="text-[11px] font-bold text-text-secondary mt-3.5 mb-2" {...props} />
          ),
          p: ({ ...props }) => (
            <p className="mb-2.5 text-text-secondary font-semibold leading-relaxed" {...props} />
          ),
          ul: ({ ...props }) => (
            <ul className="list-disc list-inside pl-3 mb-2.5 space-y-1.5 text-text-secondary font-semibold" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="list-decimal list-inside pl-3 mb-2.5 space-y-1.5 text-text-secondary font-semibold" {...props} />
          ),
          li: ({ ...props }) => (
            <li className="mb-1 leading-relaxed" {...props} />
          ),
          strong: ({ ...props }) => (
            <strong className="font-extrabold text-text-primary" {...props} />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-border-secondary/60 shadow-sm">
              <table className="w-full border-collapse text-[10px]" {...props} />
            </div>
          ),
          th: ({ ...props }) => (
            <th className="border-b border-border-secondary/60 bg-background-secondary/40 p-2.5 font-bold text-text-primary text-left" {...props} />
          ),
          td: ({ ...props }) => (
            <td className="border-b border-border-secondary/30 p-2.5 text-text-secondary font-semibold" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
