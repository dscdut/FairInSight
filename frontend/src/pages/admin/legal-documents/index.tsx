import { useState, useEffect, useCallback, useRef } from 'react'

import { Award, Loader2, CheckCircle2, XCircle, X } from 'lucide-react'

import { FadeUp } from '@/components/animated/animated-component'
import { Button } from '@/components/ui/button'
import { ROLE_ADMIN } from '@/core/configs/consts'
import isEqual from '@/core/configs/is-equal'
import { cn } from '@/core/lib/utils'
import { lawAiApi } from '@/core/services/law-ai.service'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { type Law } from '@/models/types/law.type'

import { DocumentDetailDrawer } from './components/document-detail-drawer'
import { DocumentFilters } from './components/document-filters'
import { DocumentFormDrawer, type FormSubmitData } from './components/document-form-drawer'
import { DocumentListTable } from './components/document-list-table'

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

export default function LegalDocumentsPage() {
  const [laws, setLaws] = useState<Law[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // Spinner full-page CHỈ ở lần tải đầu; refetch khi đổi bộ lọc thì giữ bảng cũ.
  const isFirstLoad = useRef(true)

  // Filters state. searchInput = ô gõ (cập nhật tức thì); searchQuery = giá trị đã
  // debounce, mới là thứ trigger gọi API → tránh mỗi ký tự 1 request.
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [issuedDateFilter, setIssuedDateFilter] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Drawer xem chi tiết (đọc từ AI backend)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [activeLawForDetail, setActiveLawForDetail] = useState<Law | null>(null)

  // Drawer thêm văn bản (CHỈ admin) — nạp KB qua backend_reasoning (lawAiApi.confirmLaw)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Nạp KB chạy NỀN: confirm mất ~9 phút (full ingest LLM). Thay vì giữ drawer đơ,
  // đóng drawer ngay rồi hiện pill nổi "đang nạp" để admin làm việc khác. Xong →
  // pill thành công/lỗi + reload list. title chỉ để hiện trong pill cho dễ nhận.
  const [ingest, setIngest] = useState<{
    status: 'running' | 'success' | 'error'
    title: string
  } | null>(null)

  // Guard FE: chỉ admin mới thấy nút thêm + gọi API import.
  // Lưu ý: BE cũng PHẢI chặn bằng JWT (role ADMIN) vì FE chỉ là phòng vệ lớp đầu.
  const user = useAuthStore((state) => state.user)
  const isAdmin = isEqual(user?.roleName, ROLE_ADMIN)

  // Debounce ô tìm kiếm: dừng gõ 400ms mới cập nhật searchQuery (về trang 1).
  // BỎ QUA lần chạy đầu (mount): nếu không, timer mount sẽ setCurrentPage(1) sau 400ms
  // và "kéo" người dùng về trang 1 khi họ vừa bấm sang trang khác → tưởng phân trang lỗi.
  const didMountSearch = useRef(false)
  useEffect(() => {
    if (!didMountSearch.current) {
      didMountSearch.current = true
      return
    }
    const t = setTimeout(() => {
      setSearchQuery(searchInput)
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // Enter = tìm ngay (không chờ debounce). Ô trống + Enter = về danh sách mặc định.
  const handleSearchEnter = () => {
    setSearchQuery(searchInput)
    setCurrentPage(1)
  }

  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Phân trang SERVER-SIDE (chuẩn cho data lớn): mỗi trang chỉ kéo `itemsPerPage` mục.
  // Cache theo (bộ lọc → trang) để quay lại trang cũ là tức thì + prefetch trang kế khi
  // rảnh để bấm "Sau" không phải chờ. Khóa cache = chuỗi bộ lọc hiện tại.
  const cacheRef = useRef<Map<string, Map<number, Law[]>>>(new Map())
  const filterKey = JSON.stringify({ searchQuery, statusFilter, issuedDateFilter })

  // Gọi server 1 trang. background=true: chỉ nạp vào cache (prefetch), không đụng UI.
  const fetchPage = useCallback(
    async (page: number, background = false): Promise<Law[] | null> => {
      const byPage = cacheRef.current.get(filterKey)
      const cached = byPage?.get(page)
      if (cached) {
        if (!background) setLaws(cached)
        return cached
      }
      if (!background && isFirstLoad.current) setIsLoading(true)
      try {
        const res = await lawAiApi.listLaws({
          page,
          size: itemsPerPage,
          search: searchQuery || undefined,
          status: statusFilter && statusFilter !== 'ALL' ? statusFilter : undefined,
          issuedDate: issuedDateFilter || undefined
        })
        const map = cacheRef.current.get(filterKey) ?? new Map<number, Law[]>()
        map.set(page, res.items)
        cacheRef.current.set(filterKey, map)
        if (!background) {
          setLaws(res.items)
          setTotalCount(res.pagination.total)
          setTotalPages(res.pagination.totalPages)
        }
        return res.items
      } catch (error) {
        if (!background) console.error('Lỗi khi tải danh sách văn bản:', error)
        return null
      } finally {
        if (!background) {
          setIsLoading(false)
          isFirstLoad.current = false
        }
      }
    },
    [filterKey, searchQuery, statusFilter, issuedDateFilter]
  )

  // Tải trang đang xem (từ cache hoặc server) mỗi khi đổi trang / đổi bộ lọc.
  useEffect(() => {
    fetchPage(currentPage)
  }, [fetchPage, currentPage])

  // Prefetch âm thầm trang kế sau khi trang hiện tại sẵn sàng → "Sau" bấm là có ngay.
  useEffect(() => {
    if (currentPage < totalPages) fetchPage(currentPage + 1, true)
  }, [fetchPage, currentPage, totalPages])

  const pagedLaws = laws

  // Tải lại sau khi thêm văn bản: xóa toàn bộ cache (data đã đổi) rồi về trang 1.
  const reload = useCallback(() => {
    cacheRef.current.clear()
    isFirstLoad.current = true
    if (currentPage === 1) fetchPage(1)
    else setCurrentPage(1)
  }, [currentPage, fetchPage])

  // Mở drawer NGAY với data đã có trong list (đã kèm pdf_url) — iframe PDF tự load dần,
  // không chờ getLawById trả về (chi tiết hiện trả cùng DTO list nên chờ là vô ích).
  const handleViewClick = (law: Law) => {
    setActiveLawForDetail(law)
    setIsDetailOpen(true)
  }

  // Mở form thêm văn bản — chặn nếu không phải admin (phòng vệ FE).
  const handleAddNewClick = () => {
    if (!isAdmin) return
    setIsFormOpen(true)
  }

  // Tạo văn bản mới (chỉ admin). Bước CONFIRM gọi backend_reasoning (AI) để nạp KB.
  // Lưu ý: preview (trích xuất + check trùng) đã chạy trong drawer; ở đây chỉ chốt.
  //
  // Nạp KB chạy NỀN: confirm tốn ~9 phút nên KHÔNG await trong drawer. Đóng drawer
  // ngay, bật pill "đang nạp", rồi mới gọi confirm. Admin tự do thoát ra, làm việc
  // khác; xong thì pill báo + reload list. (return ngay nên drawer không kẹt
  // 'confirming'.)
  const handleFormSubmit = async (formData: FormSubmitData) => {
    if (!isAdmin) {
      alert('Bạn không có quyền thực hiện thao tác này.')
      return
    }
    if (!formData.previewClientId || !formData.previewFields) {
      // Phòng vệ: add-new phải đi qua luồng preview trước khi confirm.
      alert('Vui lòng tải lên tài liệu PDF và chờ trích xuất xong trước khi tạo.')
      return
    }

    const payload = {
      client_id: formData.previewClientId,
      fields: formData.previewFields,
      force: !!formData.forceConfirmed
    }
    // Đóng drawer + bật pill TRƯỚC khi gọi API → admin thoát ra ngoài ngay.
    setIsFormOpen(false)
    setIngest({ status: 'running', title: formData.title || 'Văn bản mới' })

    // Fire-and-forget: không await, không throw (drawer đã đóng). Kết quả phản ánh
    // qua pill. Lỗi BE/timeout → pill 'error' để admin biết nạp lại.
    void lawAiApi
      .confirmLaw(payload)
      .then(() => {
        setIngest({ status: 'success', title: formData.title || 'Văn bản mới' })
        reload()
      })
      .catch((error) => {
        console.error('Lỗi khi nạp văn bản vào KB:', error)
        setIngest({ status: 'error', title: formData.title || 'Văn bản mới' })
      })
  }

  // Tự ẩn pill sau khi nạp xong (thành công 6s / lỗi giữ tới khi admin tự đóng).
  useEffect(() => {
    if (ingest?.status === 'success') {
      const t = setTimeout(() => setIngest(null), 6000)
      return () => clearTimeout(t)
    }
  }, [ingest])

  return (
    <main className='p-4 space-y-6 flex-1 flex flex-col'>
      {/* Title section */}
      <section>
        <FadeUp>
          <span className='inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-white backdrop-blur-sm shadow-sm mb-3.5'>
            <Award className='w-3.5 h-3.5' />
            Hệ thống Quản lý Pháp lý
          </span>
          <h1 className='text-h1 font-bold text-text-primary mb-2'>
            Quản lý văn bản pháp luật
          </h1>
          <p className='text-xs text-text-description font-semibold leading-relaxed'>
            Tra cứu và xem nội dung các văn bản pháp quy trong hệ thống.
          </p>
        </FadeUp>
      </section>

      {/* Filter box and Table */}
      <section className='border border-border-secondary bg-background-primary rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 relative min-h-[350px]'>
        <DocumentFilters
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
          onSearchEnter={handleSearchEnter}
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
          onAddNewClick={isAdmin ? handleAddNewClick : undefined}
        />

        {isLoading ? (
          <div className='flex-1 flex flex-col items-center justify-center text-text-tertiary gap-2 min-h-[250px]'>
            <Loader2 className='w-8 h-8 text-primary animate-spin' />
            <span className='text-xs font-semibold'>Đang tải dữ liệu văn bản...</span>
          </div>
        ) : (
          <>
            <DocumentListTable
              laws={pagedLaws}
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

      {/* Drawer — chỉ xem */}
      <DocumentDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        law={activeLawForDetail}
        readOnly={true}
      />

      {/* Form thêm văn bản — chỉ render cho admin */}
      {isAdmin && (
        <DocumentFormDrawer
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          law={null}
        />
      )}

      {/* Pill nạp KB chạy nền — nổi góc dưới-phải, admin thoát drawer vẫn thấy.
          running: spinner; success: tick (tự ẩn); error: chữ X (admin tự đóng). */}
      {ingest && (
        <div className='fixed bottom-6 right-6 z-[60] max-w-sm'>
          <div
            className={cn(
              'flex items-start gap-3 rounded-2xl border p-4 shadow-2xl bg-background-primary',
              ingest.status === 'running' && 'border-primary/30',
              ingest.status === 'success' && 'border-success-primary/30',
              ingest.status === 'error' && 'border-error-primary/30'
            )}
          >
            <div className='shrink-0 mt-0.5'>
              {ingest.status === 'running' && <Loader2 className='w-5 h-5 text-primary animate-spin' />}
              {ingest.status === 'success' && <CheckCircle2 className='w-5 h-5 text-success-primary' />}
              {ingest.status === 'error' && <XCircle className='w-5 h-5 text-error-primary' />}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-xs font-bold text-text-primary'>
                {ingest.status === 'running' && 'Đang nạp văn bản vào hệ thống...'}
                {ingest.status === 'success' && 'Đã thêm văn bản thành công'}
                {ingest.status === 'error' && 'Nạp văn bản thất bại'}
              </p>
              <p className='text-[11px] text-text-description font-semibold truncate mt-0.5'>
                {ingest.title}
              </p>
              {ingest.status === 'running' && (
                <p className='text-[10px] text-text-tertiary font-medium mt-1.5 leading-relaxed'>
                  Quá trình này có thể mất vài phút (OCR, phân tích, nhúng dữ liệu).
                  Bạn có thể tiếp tục thao tác khác.
                </p>
              )}
              {ingest.status === 'error' && (
                <p className='text-[10px] text-text-tertiary font-medium mt-1.5 leading-relaxed'>
                  Vui lòng thử tạo lại văn bản.
                </p>
              )}
            </div>
            {ingest.status !== 'running' && (
              <button
                type='button'
                onClick={() => setIngest(null)}
                className='shrink-0 text-text-tertiary hover:text-text-primary transition-colors'
              >
                <X className='w-4 h-4' />
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
