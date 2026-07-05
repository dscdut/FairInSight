import { useParams, useNavigate } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Download,
  FileText,
  Printer,
  CheckCircle2,
  XCircle,
  Home,
  ChevronRight,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Maximize2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { lawApi } from '@/core/services/law.service'
import { MOCK_LAWS } from './law-mock'
import TableOfContents from './TableOfContents'
import DocumentRenderer from './DocumentRenderer'

const ZOOM_LEVELS = [80, 90, 100, 110, 125, 150]

function formatDate(str: string) {
  if (!str) return '—'
  try {
    return new Date(str).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return str
  }
}

export default function LawDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [zoomIndex, setZoomIndex] = useState(2) // Defaults to 100% (index 2)
  const [showUpdates, setShowUpdates] = useState(false)
  const [activeTOCId, setActiveTOCId] = useState('')
  const [isTOCDrawerOpen, setIsTOCDrawerOpen] = useState(false)

  const zoomFactor = ZOOM_LEVELS[zoomIndex]

  const { data: apiLaw, isLoading, isError, refetch } = useQuery({
    queryKey: ['law', id],
    queryFn: () => lawApi.getLawById(id as string),
    enabled: !!id,
    retry: 1
  })

  const law = useMemo(() => {
    if (apiLaw) return apiLaw
    return MOCK_LAWS.find(l => l.id === id) || MOCK_LAWS[0]
  }, [apiLaw, id])

  const handleZoomIn = () => {
    if (zoomIndex < ZOOM_LEVELS.length - 1) {
      setZoomIndex(prev => prev + 1)
    }
  }

  const handleZoomOut = () => {
    if (zoomIndex > 0) {
      setZoomIndex(prev => prev - 1)
    }
  }

  const handleTOCItemClick = (targetId: string) => {
    setActiveTOCId(targetId)
    const element = document.getElementById(targetId)
    if (element) {
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - headerOffset
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
    setIsTOCDrawerOpen(false)
  }

  useEffect(() => {
    if (!law || !law.chapters) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length > 0) {
          setActiveTOCId(visible[0].target.id)
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0.1
      }
    )

    const targets = document.querySelectorAll('.data-toc-target')
    targets.forEach(t => observer.observe(t))

    return () => {
      targets.forEach(t => observer.unobserve(t))
    }
  }, [law])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background-tertiary)] pb-12">
        <div className="h-12 bg-[var(--background-primary)] border-b border-[var(--border-primary)] animate-pulse" />
        <div className="container max-w-[1280px] mx-auto px-4 py-8 space-y-6">
          <div className="h-8 bg-[var(--background-primary)] w-1/3 rounded animate-pulse" />
          <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-xl p-6 space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-neutral-800 w-1/4 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 dark:bg-neutral-800 w-3/4 rounded animate-pulse" />
            <div className="h-12 bg-gray-200 dark:bg-neutral-800 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 bg-[var(--background-primary)] h-[600px] border border-[var(--border-primary)] rounded-xl p-8 animate-pulse" />
            <div className="hidden lg:block bg-[var(--background-primary)] h-[400px] border border-[var(--border-primary)] rounded-xl p-4 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (isError && !law) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background-tertiary)] p-6">
        <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] p-8 rounded-xl shadow-sm text-center max-w-sm space-y-4">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">Lỗi tải dữ liệu văn bản</h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Hệ thống không thể tải dữ liệu chi tiết văn bản này vào lúc này. Vui lòng thử lại.
          </p>
          <Button onClick={() => refetch()} className="w-full text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Thử lại ngay
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background-tertiary)] pb-12">
      <div className="bg-[var(--background-primary)] border-b border-[var(--border-primary)] sticky top-0 z-40">
        <div className="container max-w-[1280px] mx-auto px-4 flex flex-col md:flex-row md:items-center justify-between py-2.5 gap-3">
          <nav className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <a href="/" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Home className="w-3 h-3" /> Trang chủ
            </a>
            <ChevronRight className="w-3 h-3 text-[var(--text-tertiary)]" />
            <span
              className="hover:text-primary cursor-pointer transition-colors"
              onClick={() => navigate('/law-library')}
            >
              Văn bản luật
            </span>
            <ChevronRight className="w-3 h-3 text-[var(--text-tertiary)]" />
            <span className="text-[var(--text-primary)] font-medium max-w-[180px] truncate" title={law.documentNumber}>
              {law.documentNumber}
            </span>
          </nav>

          <div className="flex items-center justify-end gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 bg-[var(--background-secondary)] p-1 rounded-lg border border-[var(--border-primary)]">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-[var(--background-primary)]"
                onClick={handleZoomOut}
                disabled={zoomIndex === 0}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs font-bold text-[var(--text-primary)] min-w-[36px] text-center">
                {zoomFactor}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-[var(--background-primary)]"
                onClick={handleZoomIn}
                disabled={zoomIndex === ZOOM_LEVELS.length - 1}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="h-4 w-px bg-[var(--border-secondary)] hidden md:block" />

            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showUpdates}
                onChange={(e) => setShowUpdates(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary"></div>
              <span className="ml-2 text-xs font-semibold text-[var(--text-secondary)] whitespace-nowrap">
                Hiển thị chi tiết cập nhật
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="container max-w-[1280px] mx-auto px-4 mt-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/law-library')}
          className="mb-4 text-xs gap-1 hover:bg-transparent hover:text-primary p-0 h-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách
        </Button>

        <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-xl p-6 shadow-sm mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded dark:bg-green-950/20 dark:text-green-400">
              <CheckCircle2 className="w-3 h-3" /> Còn hiệu lực
            </span>
          </div>

          <h1 className="text-lg md:text-xl font-bold text-[var(--text-primary)] leading-normal mb-6">
            {law.title}
          </h1>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-[var(--border-secondary)] rounded-lg bg-[var(--background-secondary)] text-xs">
            <div>
              <span className="text-[var(--text-tertiary)] block mb-0.5">Số hiệu văn bản</span>
              <span className="font-semibold text-primary">{law.documentNumber}</span>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)] block mb-0.5">Cơ quan ban hành</span>
              <span className="font-medium text-[var(--text-primary)]">{law.authorName}</span>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)] block mb-0.5">Ngày ban hành</span>
              <span className="font-medium text-[var(--text-primary)]">{formatDate(law.issuedDate)}</span>
            </div>
            <div>
              <span className="text-[var(--text-tertiary)] block mb-0.5">Ngày có hiệu lực</span>
              <span className="font-medium text-[var(--text-primary)]">{formatDate(law.effectiveDate)}</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="bg-[var(--background-primary)] border border-[var(--border-primary)] w-full justify-start p-1 h-auto flex overflow-x-auto whitespace-nowrap rounded-xl shadow-sm">
            <TabsTrigger value="content" className="text-xs font-semibold px-4 py-2">
              Nội dung
            </TabsTrigger>
            <TabsTrigger value="properties" className="text-xs font-semibold px-4 py-2">
              Thuộc tính
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs font-semibold px-4 py-2">
              Lược đồ
            </TabsTrigger>
            <TabsTrigger value="original" className="text-xs font-semibold px-4 py-2">
              Văn bản gốc
            </TabsTrigger>
            <TabsTrigger value="download" className="text-xs font-semibold px-4 py-2">
              Tải về
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              <div className="lg:col-span-3 space-y-6 overflow-x-auto pb-4">
                <DocumentRenderer
                  law={law}
                  scale={zoomFactor}
                  showUpdates={showUpdates}
                />
              </div>

              {law.chapters && law.chapters.length > 0 && (
                <div className="hidden lg:block lg:col-span-1 sticky top-16">
                  <TableOfContents
                    chapters={law.chapters}
                    activeId={activeTOCId}
                    onItemClick={handleTOCItemClick}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="properties" className="outline-none">
            <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-xl p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] leading-normal mb-6">
                  {law.title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 text-xs">
                  <div className="space-y-4">
                    <div className="flex justify-between py-2 border-b border-[var(--border-secondary)]">
                      <span className="text-[var(--text-tertiary)]">Số hiệu:</span>
                      <span className="font-semibold text-primary">{law.documentNumber}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[var(--border-secondary)]">
                      <span className="text-[var(--text-tertiary)]">Ngành:</span>
                      <span className="font-medium text-[var(--text-primary)]">{law.nganh || 'Ngoại giao'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[var(--border-secondary)]">
                      <span className="text-[var(--text-tertiary)]">Lĩnh vực:</span>
                      <span className="font-medium text-[var(--text-primary)]">{law.linhVuc || 'Hàm, cấp ngoại giao'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[var(--border-secondary)] flex items-center">
                      <span className="text-[var(--text-tertiary)]">Tình trạng hiệu lực:</span>
                      <span className="text-green-700 font-medium">Còn hiệu lực</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[var(--border-secondary)]">
                      <span className="text-[var(--text-tertiary)]">Cơ quan ban hành:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{law.authorName || 'Chính phủ'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[var(--border-secondary)]">
                      <span className="text-[var(--text-tertiary)]">Chức danh:</span>
                      <span className="font-medium text-[var(--text-primary)]">{law.chucDanh || 'Phó Thủ tướng'}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between py-2 border-b border-[var(--border-secondary)]">
                      <span className="text-[var(--text-tertiary)] font-normal">Loại văn bản:</span>
                      <span className="font-medium text-[var(--text-primary)]">{law.loaiVanBan || 'Nghị định'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[var(--border-secondary)]">
                      <span className="text-[var(--text-tertiary)]">Ngày ban hành:</span>
                      <span className="font-medium text-[var(--text-primary)]">{formatDate(law.issuedDate)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[var(--border-secondary)]">
                      <span className="text-[var(--text-tertiary)]">Ngày có hiệu lực:</span>
                      <span className="font-medium text-[var(--text-primary)]">{formatDate(law.effectiveDate)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[var(--border-secondary)] flex items-center">
                      <span className="text-[var(--text-tertiary)]">Ngày hết hiệu lực:</span>
                      <span className="font-medium text-[var(--text-primary)]">{law.ngayHetHieuLuc || '--'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[var(--border-secondary)]">
                      <span className="text-[var(--text-tertiary)]">Người ký:</span>
                      <span className="font-medium text-[var(--text-primary)]">{law.nguoiKy || 'Phạm Gia Túc'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-lg p-3 text-xs">
                  <span className="font-bold text-[var(--text-primary)] block mb-2 text-[11px] uppercase tracking-wider">
                    Văn bản được hướng dẫn áp dụng (0)
                  </span>
                  <span className="text-[var(--text-tertiary)] italic">—</span>
                </div>
                <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-lg p-3 text-xs">
                  <span className="font-bold text-[var(--text-primary)] block mb-1 text-[11px] uppercase tracking-wider">
                    Văn bản được quy định chi tiết, hướng dẫn thi hành (1)
                  </span>
                  <div className="text-xs text-[var(--text-secondary)] hover:text-primary cursor-pointer flex items-start gap-1 p-2 bg-[var(--background-secondary)] rounded border border-[var(--border-secondary)]">
                    <span className="flex-1">
                      Nghị quyết số 250/2025/QH15 Về một số cơ chế, chính sách đặc thù nhằm nâng cao hiệu quả hội nhập quốc tế
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 mt-0.5 text-primary flex-shrink-0" />
                  </div>
                </div>
                <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-lg p-3 text-xs">
                  <span className="font-bold text-[var(--text-primary)] block mb-2 text-[11px] uppercase tracking-wider">
                    Văn bản được hợp nhất (0)
                  </span>
                  <span className="text-[var(--text-tertiary)] italic">—</span>
                </div>
                <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-lg p-3 text-xs">
                  <span className="font-bold text-[var(--text-primary)] block mb-2 text-[11px] uppercase tracking-wider">
                    Văn bản được sửa đổi bổ sung (0)
                  </span>
                  <span className="text-[var(--text-tertiary)] italic">—</span>
                </div>
                <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-lg p-3 text-xs">
                  <span className="font-bold text-[var(--text-primary)] block mb-2 text-[11px] uppercase tracking-wider">
                    Văn bản được đính chính (0)
                  </span>
                  <span className="text-[var(--text-tertiary)] italic">—</span>
                </div>
                <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-lg p-3 text-xs">
                  <span className="font-bold text-[var(--text-primary)] block mb-2 text-[11px] uppercase tracking-wider">
                    Văn bản được thay thế (0)
                  </span>
                  <span className="text-[var(--text-tertiary)] italic">—</span>
                </div>
              </div>

              <div className="lg:col-span-2 bg-[var(--background-primary)] border-2 border-primary rounded-xl p-5 md:p-6 shadow-sm space-y-4">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#e0f2fe] text-primary px-2.5 py-0.5 rounded-full">
                  VĂN BẢN ĐANG XEM
                </span>
                <h2 className="text-xs md:text-sm font-bold text-[var(--text-primary)] leading-relaxed">
                  {law.title}
                </h2>
                <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-[var(--border-secondary)]">
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Số hiệu</span>
                    <span className="font-semibold text-primary">{law.documentNumber}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Loại văn bản</span>
                    <span className="font-medium text-[var(--text-primary)]">{law.loaiVanBan || 'Nghị định'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Ngành</span>
                    <span className="font-medium text-[var(--text-primary)]">{law.nganh || 'Ngoại giao'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Ngày ban hành</span>
                    <span className="font-medium text-[var(--text-primary)]">{formatDate(law.issuedDate)}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Lĩnh vực</span>
                    <span className="font-medium text-[var(--text-primary)]">{law.linhVuc || 'Hàm, cấp ngoại giao'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Cơ quan ban hành</span>
                    <span className="font-medium text-[var(--text-primary)]">{law.authorName}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Chức danh</span>
                    <span className="font-medium text-[var(--text-primary)]">{law.chucDanh || 'Phó Thủ tướng'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)] block">Người ký</span>
                    <span className="font-medium text-[var(--text-primary)]">{law.nguoiKy || 'Phạm Gia Túc'}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-4">
                <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-lg p-3 text-xs">
                  <span className="font-bold text-[var(--text-primary)] block mb-2 text-[11px] uppercase tracking-wider">
                    Văn bản hướng dẫn áp dụng (0)
                  </span>
                  <span className="text-[var(--text-tertiary)] italic">—</span>
                </div>
                <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-lg p-3 text-xs">
                  <span className="font-bold text-[var(--text-primary)] block mb-2 text-[11px] uppercase tracking-wider">
                    Văn bản quy định chi tiết, hướng dẫn thi hành (0)
                  </span>
                  <span className="text-[var(--text-tertiary)] italic">—</span>
                </div>
                <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-lg p-3 text-xs">
                  <span className="font-bold text-[var(--text-primary)] block mb-2 text-[11px] uppercase tracking-wider">
                    Văn bản hợp nhất (0)
                  </span>
                  <span className="text-[var(--text-tertiary)] italic">—</span>
                </div>
                <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-lg p-3 text-xs">
                  <span className="font-bold text-[var(--text-primary)] block mb-2 text-[11px] uppercase tracking-wider">
                    Văn bản sửa đổi bổ sung (0)
                  </span>
                  <span className="text-[var(--text-tertiary)] italic">—</span>
                </div>
                <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-lg p-3 text-xs">
                  <span className="font-bold text-[var(--text-primary)] block mb-2 text-[11px] uppercase tracking-wider">
                    Văn bản đính chính (0)
                  </span>
                  <span className="text-[var(--text-tertiary)] italic">—</span>
                </div>
                <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-lg p-3 text-xs">
                  <span className="font-bold text-[var(--text-primary)] block mb-2 text-[11px] uppercase tracking-wider">
                    Văn bản thay thế (0)
                  </span>
                  <span className="text-[var(--text-tertiary)] italic">—</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="original" className="outline-none">
            <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-xl overflow-hidden shadow-sm max-w-[900px] mx-auto">
              <div className="bg-[#f3f4f6] dark:bg-neutral-800 border-b border-[var(--border-secondary)] p-2 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 rotate-180 text-gray-500 cursor-pointer" />
                  <span className="flex items-center gap-1">
                    <input type="text" defaultValue="1" className="w-7 h-6 text-center border border-[var(--border-primary)] rounded" />
                    <span className="text-gray-500">/ 16</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-500 cursor-pointer" />
                </div>

                <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 border border-[var(--border-primary)] rounded px-1.5 py-0.5">
                  <ZoomOut className="w-3 h-3 text-gray-500 cursor-pointer" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">190%</span>
                  <ZoomIn className="w-3 h-3 text-gray-500 cursor-pointer" />
                </div>

                <div className="flex items-center gap-2">
                  <Printer className="w-3.5 h-3.5 text-gray-600 cursor-pointer hover:text-primary" />
                  <Download className="w-3.5 h-3.5 text-gray-600 cursor-pointer hover:text-primary" />
                </div>
              </div>

              <div className="bg-neutral-500 dark:bg-neutral-950 p-6 flex justify-center overflow-x-auto min-h-[500px]">
                <div className="bg-white text-black font-serif py-12 px-8 md:px-14 shadow-2xl max-w-[800px] w-full text-justify leading-relaxed relative">
                  <div className="absolute top-4 left-6 text-[10px] text-red-700 font-bold border-2 border-red-700 px-1 py-0.5 uppercase tracking-tighter">
                    Cơ quan phát hành: VĂN PHÒNG CHÍNH PHỦ
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pb-4 border-b border-black">
                    <div className="text-center space-y-1">
                      <p className="font-bold tracking-wide uppercase">CHÍNH PHỦ</p>
                      <div className="w-16 h-px bg-black mx-auto" />
                      <p className="font-bold text-[10px] mt-1">
                        Số: {law.documentNumber}
                      </p>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="font-bold uppercase tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                      <p className="underline underline-offset-4 decoration-1 font-bold">Độc lập - Tự do - Hạnh phúc</p>
                      <p className="italic text-[10px] mt-1">
                        Hà Nội, ngày 30 tháng 6 năm 2026
                      </p>
                    </div>
                  </div>

                  <div className="text-center my-8 space-y-2">
                    <p className="font-bold uppercase text-[13px]">NGHỊ ĐỊNH</p>
                    <p className="font-bold text-[11px] max-w-lg mx-auto leading-normal">
                      {law.title}
                    </p>
                  </div>

                  <div className="space-y-4 italic text-[11px] mb-6">
                    <p>Căn cứ Luật Tổ chức Chính phủ số 63/2025/QH15;</p>
                    <p>Căn cứ Luật Tổ chức chính quyền địa phương số 77/2025/QH15;</p>
                    <p>Theo đề nghị của Bộ trưởng Bộ Tư pháp;</p>
                    <p>Chính phủ ban hành Nghị định quy định chi tiết một số điều về cơ chế, chính sách phát huy nguồn lực nhằm nâng cao hiệu quả hội nhập quốc tế...</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="download" className="outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-xl p-4 flex items-center justify-between hover:border-primary transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-red-50 text-red-600 p-2.5 rounded-lg dark:bg-red-950/20 dark:text-red-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[280px]" title={law.pdfFile?.name}>
                      {law.pdfFile?.name || '258_2026_ND-CP_30062026-signed_1.pdf'}
                    </h4>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                      {law.pdfFile?.size || '6.63MB'} • {law.pdfFile?.date || '03/07/2026 10:22'}
                    </p>
                  </div>
                </div>
                <a href={law.sourceUrl} download className="p-2 hover:bg-[var(--background-secondary)] rounded-lg text-primary">
                  <Download className="w-4 h-4 cursor-pointer" />
                </a>
              </div>

              <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-xl p-4 flex items-center justify-between hover:border-primary transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg dark:bg-blue-950/20 dark:text-blue-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[280px]" title={law.docxFile?.name}>
                      {law.docxFile?.name || 'ND 258.2026 Final.docx'}
                    </h4>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                      {law.docxFile?.size || '0.05MB'} • {law.docxFile?.date || '03/07/2026 10:22'}
                    </p>
                  </div>
                </div>
                <a href={law.sourceUrl} download className="p-2 hover:bg-[var(--background-secondary)] rounded-lg text-primary">
                  <Download className="w-4 h-4 cursor-pointer" />
                </a>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {law.chapters && law.chapters.length > 0 && (
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsTOCDrawerOpen(true)}
            className="rounded-full w-12 h-12 shadow-lg bg-primary hover:bg-primary/95 flex items-center justify-center p-0"
          >
            <Maximize2 className="w-5 h-5 text-white" />
          </Button>
        </div>
      )}

      {isTOCDrawerOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end transition-opacity duration-300">
          <div className="fixed inset-0" onClick={() => setIsTOCDrawerOpen(false)} />
          <div className="relative w-80 max-w-[90%] bg-[var(--background-primary)] h-full shadow-2xl p-4 flex flex-col justify-between">
            <div className="flex-1 overflow-y-auto">
              <TableOfContents
                chapters={law.chapters || []}
                activeId={activeTOCId}
                onItemClick={handleTOCItemClick}
              />
            </div>
            <Button
              className="mt-4 w-full text-xs"
              variant="outline"
              onClick={() => setIsTOCDrawerOpen(false)}
            >
              Đóng mục lục
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
