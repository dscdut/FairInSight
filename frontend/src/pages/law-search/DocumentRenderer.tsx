import { cn } from '@/core/lib/utils'
import { Law } from '@/models/types/law.type'

interface DocumentRendererProps {
  law: Law
  scale: number
  showUpdates: boolean
}

export default function DocumentRenderer({
  law,
  scale,
  showUpdates
}: DocumentRendererProps) {
  const isHtml = (str: string) => {
    return /<[a-z][\s\S]*>/i.test(str)
  }

  return (
    <div
      style={{ fontSize: `${scale}%` }}
      className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-xl py-12 px-6 md:px-16 shadow-sm mx-auto max-w-[800px] text-justify leading-relaxed transition-all duration-200"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-[var(--text-primary)] mb-8 pb-6 border-b border-[var(--border-secondary)]">
        <div className="text-center space-y-1">
          <p className="tracking-wide uppercase">{law.authorName || 'CHÍNH PHỦ'}</p>
          <div className="w-16 h-px bg-[var(--text-primary)] mx-auto" />
          <p className="text-[10px] text-[var(--text-secondary)] font-normal mt-1">
            Số: {law.documentNumber}
          </p>
        </div>
        <div className="text-center space-y-1">
          <p className="uppercase tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p className="underline underline-offset-4 decoration-1 font-bold">Độc lập - Tự do - Hạnh phúc</p>
          <p className="text-[10px] text-[var(--text-secondary)] font-normal italic mt-1">
            Hà Nội, ngày {new Date(law.issuedDate).getDate()} tháng {new Date(law.issuedDate).getMonth() + 1} năm {new Date(law.issuedDate).getFullYear()}
          </p>
        </div>
      </div>

      <div className="text-center mb-8 space-y-2">
        <p className="font-extrabold uppercase text-base text-[var(--text-primary)]">
          {law.documentNumber.includes('NĐ-CP') ? 'NGHỊ ĐỊNH' : 'QUYẾT ĐỊNH'}
        </p>
        <p className="font-bold text-sm text-[var(--text-secondary)] max-w-xl mx-auto leading-normal">
          {law.title}
        </p>
      </div>

      <div className="space-y-6 text-sm text-[var(--text-secondary)] leading-loose">
        {law.chapters && law.chapters.length > 0 ? (
          <div className="space-y-8">
            {law.chapters.map(c => (
              <div key={c.id} id={c.id} className="space-y-4 data-toc-target">
                <div className="text-center font-bold text-[var(--text-primary)] uppercase py-2 border-y border-[var(--border-secondary)] bg-[var(--background-secondary)]">
                  {c.title}
                </div>
                {c.articles && c.articles.map(art => (
                  <div key={art.id} id={art.id} className="space-y-3 pl-2 data-toc-target">
                    <p className="font-bold text-[var(--text-primary)] mt-4">
                      {art.title}
                    </p>
                    {art.clauses && art.clauses.map(cl => {
                      const highlightUpdate = showUpdates && cl.isUpdated
                      return (
                        <div
                          key={cl.id}
                          id={cl.id}
                          className={cn(
                            "space-y-2 pl-4 border-l transition-colors duration-200 data-toc-target",
                            highlightUpdate 
                              ? "bg-yellow-50/70 border-yellow-500 pl-4 py-1.5 rounded dark:bg-yellow-950/20" 
                              : "border-[var(--border-secondary)]"
                          )}
                        >
                          <p>
                            <span className="font-medium text-[var(--text-primary)] mr-1">{cl.title}:</span>
                            {cl.content}
                          </p>
                          {cl.points && cl.points.map(pt => {
                            const highlightPt = showUpdates && pt.isUpdated
                            return (
                              <p
                                key={pt.id}
                                id={pt.id}
                                className={cn(
                                  "pl-6 py-0.5 rounded transition-colors duration-200 data-toc-target",
                                  highlightPt ? "bg-yellow-50/70 border-l border-yellow-500 pl-6 dark:bg-yellow-950/20" : ""
                                )}
                              >
                                <span className="font-medium text-[var(--text-primary)] mr-1">{pt.title}:</span>
                                {pt.content}
                              </p>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 whitespace-pre-line text-justify">
            {isHtml(law.content) ? (
              <div dangerouslySetInnerHTML={{ __html: law.content }} />
            ) : (
              law.content.split('\n').map((para, index) => (
                <p key={index}>{para}</p>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
