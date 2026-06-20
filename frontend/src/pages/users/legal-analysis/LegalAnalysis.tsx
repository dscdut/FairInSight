import { useState, useEffect, useCallback } from 'react'

import { Award, Loader2 } from 'lucide-react'

import { FadeUp } from '@/components/animated/animated-component'
import { Button } from '@/components/ui/button'
import { cn } from '@/core/lib/utils'
import { lawAiApi } from '@/core/services/law-ai.service'
import { type Law } from '@/models/types/law.type'
import { DocumentDetailDrawer } from '@/pages/admin/legal-documents/components/document-detail-drawer'
import { DocumentFilters } from '@/pages/admin/legal-documents/components/document-filters'
import { DocumentListTable } from '@/pages/admin/legal-documents/components/document-list-table'

// Dãy số trang rút gọn: luôn hiện trang 1, trang cuối, và ±1 quanh trang hiện tại;
// chèn '...' cho khoảng bị lược. Vd 79 trang, đang ở 6: [1, '...', 5, 6, 7, '...', 79].
function getPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('...')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < total - 1) pages.push('...')
  pages.push(total)
  return pages
}

export default function LegalAnalysis() {
  const [laws, setLaws] = useState<Law[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [issuedDateFilter, setIssuedDateFilter] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Drawer state
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [activeLawForDetail, setActiveLawForDetail] = useState<Law | null>(null)

  // Fetch Laws from API
  const fetchLaws = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await lawAiApi.listLaws({
        page: currentPage,
        size: itemsPerPage,
        search: searchQuery || undefined,
        status: statusFilter && statusFilter !== 'ALL' ? statusFilter : undefined,
        issuedDate: issuedDateFilter || undefined
      })
      setLaws(res.items)
      setTotalPages(res.pagination.totalPages)
      setTotalCount(res.pagination.total)
    } catch (error) {
      console.error('Lỗi khi tải danh sách văn bản:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchQuery, statusFilter, issuedDateFilter])

  useEffect(() => {
    fetchLaws()
  }, [fetchLaws])

  const handleViewClick = async (law: Law) => {
    try {
      const res = (await lawAiApi.getLawById(law.id)) as any
      setActiveLawForDetail(res)
      setIsDetailOpen(true)
    } catch (error) {
      console.error('Lỗi khi tải chi tiết văn bản:', error)
    }
  }

  return (
    <main className='p-4 space-y-6 flex-1 flex flex-col'>
      {/* Title section */}
      <section>
        <FadeUp>
          <span className='inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-white backdrop-blur-sm shadow-sm mb-3.5'>
            <Award className='w-3.5 h-3.5' />
            Thư viện Pháp lý
          </span>
          <h1 className='text-h2 text-text-primary mb-2'>
            Văn bản pháp luật
          </h1>
          <p className='text-p text-text-description font-semibold leading-relaxed'>
            Tra cứu và xem nội dung các văn bản pháp quy trong hệ thống.
          </p>
        </FadeUp>
      </section>

      {/* Filter box and Table */}
      <section className='border border-border-secondary bg-background-primary rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 relative min-h-[350px]'>
        <DocumentFilters
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val)
            setCurrentPage(1)
          }}
          statusFilter={statusFilter}
          onStatusChange={(val) => {
            setStatusFilter(val)
            setCurrentPage(1)
          }}
          issuedDateFilter={issuedDateFilter}
          onIssuedDateChange={(val) => {
            setIssuedDateFilter(val)
            setCurrentPage(1)
          }}
        />

        {isLoading ? (
          <div className='flex-1 flex flex-col items-center justify-center text-text-tertiary gap-2 min-h-[250px]'>
            <Loader2 className='w-8 h-8 text-primary animate-spin' />
            <span className='text-xs font-semibold'>Đang tải dữ liệu văn bản...</span>
          </div>
        ) : (
          <>
            <DocumentListTable
              laws={laws}
              onView={handleViewClick}
              readOnly={true}
            />

            {/* Table Pagination */}
            {totalCount > itemsPerPage && (
              <div className='flex items-center justify-between p-5 bg-background-primary border-t border-border-secondary rounded-b-2xl mt-auto'>
                <p className='text-xs text-text-description font-semibold'>
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{' '}
                  {Math.min(currentPage * itemsPerPage, totalCount)} của {totalCount} văn bản
                </p>
                <div className='flex gap-2.5'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className='h-8 px-3 text-xs border-border-primary text-text-primary font-bold hover:bg-background-secondary transition-all rounded-xl'
                  >
                    Trước
                  </Button>
                  {getPageRange(currentPage, totalPages).map((p, idx) =>
                    p === '...' ? (
                      <span
                        key={`gap-${idx}`}
                        className='h-8 w-8 flex items-center justify-center text-xs text-text-tertiary font-bold select-none'
                      >
                        …
                      </span>
                    ) : (
                      <Button
                        key={p}
                        size='sm'
                        onClick={() => setCurrentPage(p as number)}
                        variant={currentPage === p ? 'default' : 'outline'}
                        className={cn(
                          'h-8 w-8 text-xs font-bold rounded-xl transition-all',
                          currentPage === p ? 'text-white' : 'text-text-primary border-border-primary'
                        )}
                      >
                        {p}
                      </Button>
                    )
                  )}
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className='h-8 px-3 text-xs border-border-primary text-text-primary font-bold hover:bg-background-secondary transition-all rounded-xl'
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Drawer */}
      <DocumentDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        law={activeLawForDetail}
        readOnly={true}
      />
    </main>
  )
}
