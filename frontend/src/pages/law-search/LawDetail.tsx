import { useParams, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  Printer,
  Share2,
  Bookmark,
  GitBranch,
  Building,
  User,
  CheckCircle2,
  XCircle,
  Home,
  ChevronRight,
  History,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MOCK_LAWS } from './law-mock'

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

  const law = useMemo(() => {
    return MOCK_LAWS.find(l => l.id === id) || MOCK_LAWS[0]
  }, [id])

  return (
    <div className="min-h-screen bg-[var(--background-tertiary)] pb-12">
      <nav className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] py-3 px-4 border-b border-[var(--border-primary)] bg-[var(--background-primary)]">
        <a href="/" className="flex items-center gap-1 hover:text-primary transition-colors">
          <Home className="w-3.5 h-3.5" />
          Trang chủ
        </a>
        <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        <span
          className="hover:text-primary cursor-pointer transition-colors"
          onClick={() => navigate('/law-library')}
        >
          Văn bản quy phạm pháp luật Trung ương
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        <span className="text-[var(--text-primary)] font-medium max-w-[200px] truncate">
          {law.documentNumber}
        </span>
      </nav>

      <div className="container max-w-[1280px] mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/law-library')}
          className="mb-4 text-xs gap-1 hover:bg-transparent hover:text-primary"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-xl p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-sm font-bold">
                  Trung ương
                </Badge>
                {law.status === 'ACTIVE' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-lg dark:bg-green-950/20 dark:text-green-400">
                    <CheckCircle2 className="w-3 h-3" /> Còn hiệu lực
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-lg dark:bg-orange-950/20 dark:text-orange-400">
                    <XCircle className="w-3 h-3" /> Hết hiệu lực
                  </span>
                )}
              </div>

              <h1 className="text-xl font-bold text-[var(--text-primary)] leading-snug mb-6">
                {law.title}
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-[var(--border-secondary)] rounded-lg bg-[var(--background-secondary)] text-sm mb-6">
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

            <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-3 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Nội dung chi tiết văn bản
              </h2>
              <div className="prose max-w-none text-sm text-[var(--text-secondary)] leading-relaxed space-y-4">
                <p className="font-semibold text-[var(--text-primary)]">
                  BỘ TIÊU CHUẨN KỸ THUẬT VÀ QUY PHỤ SỰ LÝ
                </p>
                <div className="whitespace-pre-line text-justify">
                  {law.content}
                </div>
                <p className="mt-8 text-xs text-[var(--text-tertiary)] italic border-t border-[var(--border-primary)] pt-4 text-right">
                  Người cập nhật hệ thống: {law.authorName || 'Quyền Admin'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-xl p-5 shadow-sm sticky top-6">
              <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-3 mb-4">
                Tác vụ văn bản
              </h3>
              <div className="space-y-2">
                {law.sourceUrl && (
                  <Button
                    onClick={() => window.open(law.sourceUrl, '_blank')}
                    className="w-full justify-start text-xs border-[var(--border-secondary)] hover:bg-[var(--background-secondary)]"
                    variant="outline"
                    iconStart={<Download className="w-4 h-4 text-red-500" />}
                  >
                    Tải văn bản PDF gốc
                  </Button>
                )}
                {law.officialUrl && (
                  <Button
                    onClick={() => window.open(law.officialUrl, '_blank')}
                    className="w-full justify-start text-xs border-[var(--border-secondary)] hover:bg-[var(--background-secondary)]"
                    variant="outline"
                    iconStart={<ExternalLink className="w-4 h-4 text-blue-500" />}
                  >
                    Xem trên cổng thông tin
                  </Button>
                )}
                <Button
                  className="w-full justify-start text-xs border-[var(--border-secondary)] hover:bg-[var(--background-secondary)]"
                  variant="outline"
                  iconStart={<GitBranch className="w-4 h-4 text-green-500" />}
                >
                  Xem lược đồ mối quan hệ
                </Button>
                <Button
                  className="w-full justify-start text-xs border-[var(--border-secondary)] hover:bg-[var(--background-secondary)]"
                  variant="outline"
                  iconStart={<Bookmark className="w-4 h-4 text-yellow-500" />}
                >
                  Lưu văn bản này
                </Button>
                <Button
                  className="w-full justify-start text-xs border-[var(--border-secondary)] hover:bg-[var(--background-secondary)]"
                  variant="outline"
                  iconStart={<Share2 className="w-4 h-4 text-purple-500" />}
                >
                  Chia sẻ liên kết
                </Button>
                <Button
                  className="w-full justify-start text-xs border-[var(--border-secondary)] hover:bg-[var(--background-secondary)]"
                  variant="outline"
                  iconStart={<Printer className="w-4 h-4 text-gray-500" />}
                  onClick={() => window.print()}
                >
                  In trang văn bản
                </Button>
              </div>

              <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-3 mt-6 mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> Lược sử và các phiên bản
              </h3>
              {law.versions && law.versions.length > 0 ? (
                <div className="relative border-l border-[var(--border-secondary)] ml-3 pl-4 space-y-4 text-xs">
                  <div className="relative">
                    <span 
                      style={{ left: '-22px' }} 
                      className="absolute top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-white ring-2 ring-primary/20" 
                    />
                    <p className="font-semibold text-[var(--text-primary)]">Phiên bản hiện tại</p>
                    <p className="text-[var(--text-tertiary)]">{formatDate(law.issuedDate)}</p>
                  </div>
                  {law.versions.map(v => (
                    <div key={v.id} className="relative opacity-85 hover:opacity-100 transition-opacity">
                      <span 
                        style={{ left: '-22px' }} 
                        className="absolute top-1.5 w-3 h-3 rounded-full bg-gray-300 border-2 border-white" 
                      />
                      <p className="font-medium text-[var(--text-secondary)]">{v.version} - {v.title}</p>
                      <p className="text-[var(--text-tertiary)]">{formatDate(v.issuedDate)}</p>
                      {v.changeNote && <p className="text-[var(--text-tertiary)] mt-0.5 italic">{v.changeNote}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)]">Không có thông tin phiên bản cũ hơn.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
