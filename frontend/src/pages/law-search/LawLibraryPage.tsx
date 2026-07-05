import { useState, useMemo, useCallback } from 'react'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Search,
  BookOpen,
  Scale,
  Sparkles,
  Eye,
  Bookmark,
  Share2,
  ChevronRight,
  Calendar,
  Building2,
  Tag,
  TrendingUp,
  Filter,
  HelpCircle,
  Download,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/core/lib/utils'
import { lawApi } from '@/core/services/law.service'
import { useDebounce } from '@/hooks/use-debounce'
import type { Law } from '@/models/types/law.type'

// ─── Types ───────────────────────────────────────────────────────────────────

type SearchScope = 'title' | 'content' | 'documentNumber' | 'exactPhrase'
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'
type SortBy = 'newest' | 'popular'

interface SearchFilters {
  searchIn: SearchScope
  status: StatusFilter
  field: string
  sortBy: SortBy
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

const SEARCH_SCOPE_OPTIONS: { value: SearchScope; label: string }[] = [
  { value: 'title', label: 'Tiêu đề' },
  { value: 'content', label: 'Nội dung' },
  { value: 'documentNumber', label: 'Số hiệu' },
  { value: 'exactPhrase', label: 'Cụm từ chính xác' },
]

const LEGAL_FIELDS = [
  { value: 'ALL', label: 'Tất cả lĩnh vực' },
  { value: 'civil', label: 'Dân sự' },
  { value: 'business', label: 'Thương mại / Doanh nghiệp' },
  { value: 'tax', label: 'Thuế' },
  { value: 'labor', label: 'Lao động' },
  { value: 'land', label: 'Đất đai' },
  { value: 'investment', label: 'Đầu tư' },
  { value: 'admin', label: 'Hành chính' },
  { value: 'criminal', label: 'Hình sự' },
]

const QUICK_SUGGESTIONS = [
  'Hợp đồng lao động',
  'Thuế thu nhập cá nhân',
  'Luật Đất đai 2024',
  'Đăng ký kinh doanh',
  'Thủ tục hành chính',
  'Bảo hiểm xã hội',
  'Luật Nhà ở 2023',
]

const POPULAR_DOCS = [
  { id: '1', title: 'Luật Đất đai 2024', views: 128450, date: '2024-01-18' },
  { id: '2', title: 'Bộ luật Lao động 2019', views: 95230, date: '2019-11-20' },
  { id: '3', title: 'Luật Doanh nghiệp 2020', views: 84100, date: '2020-06-17' },
  { id: '4', title: 'Luật Nhà ở 2023', views: 72600, date: '2023-11-27' },
  { id: '5', title: 'Luật Thuế thu nhập cá nhân', views: 63200, date: '2007-11-21' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

// ─── SearchGuidePopover ───────────────────────────────────────────────────────

function SearchGuidePopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 text-sm text-white/80 hover:text-white underline underline-offset-2 transition-colors shrink-0">
          <HelpCircle className="w-3.5 h-3.5" />
          Hướng dẫn tìm kiếm
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[360px] max-h-[480px] overflow-y-auto p-0 border-[var(--border-secondary)] bg-[var(--background-primary)] shadow-xl"
        align="end"
        sideOffset={8}
      >
        <div className="p-4 border-b border-[var(--border-primary)] bg-[var(--background-secondary)]">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">
              Hướng dẫn tìm kiếm
            </h3>
          </div>
        </div>

        <div className="p-4 space-y-5 text-sm text-[var(--text-secondary)]">
          <section>
            <h4 className="font-semibold text-[var(--text-primary)] mb-2">Tìm kiếm cơ bản</h4>
            <ul className="space-y-2.5">
              <li>
                <p>Tìm theo tên văn bản:</p>
                <code className="text-xs bg-[var(--background-secondary)] text-primary px-2 py-0.5 rounded font-mono">
                  Bộ luật Dân sự 2015
                </code>
              </li>
              <li>
                <p>Tìm theo số hiệu:</p>
                <code className="text-xs bg-[var(--background-secondary)] text-primary px-2 py-0.5 rounded font-mono">
                  91/2015/QH13
                </code>
              </li>
              <li>
                <p>Tìm theo từ khoá:</p>
                <code className="text-xs bg-[var(--background-secondary)] text-primary px-2 py-0.5 rounded font-mono">
                  giao dịch dân sự, năng lực pháp luật
                </code>
              </li>
            </ul>
          </section>

          <div className="border-t border-[var(--border-primary)]" />

          <section>
            <h4 className="font-semibold text-[var(--text-primary)] mb-2">Tìm kiếm nâng cao</h4>
            <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)] mb-2 font-medium">
              Phạm vi tìm kiếm
            </p>
            <ul className="space-y-2">
              {[
                { label: 'Tất cả', desc: 'Tìm trong cả tiêu đề và nội dung văn bản.' },
                { label: 'Tiêu đề', desc: 'Chỉ tìm trong tiêu đề văn bản.' },
                { label: 'Nội dung', desc: 'Chỉ tìm trong nội dung toàn văn.' },
                { label: 'Số hiệu', desc: 'Tìm theo số hiệu chính thức của văn bản.' },
                { label: 'Cụm từ chính xác', desc: 'Khớp đúng chuỗi từ khoá theo thứ tự.' },
              ].map(opt => (
                <li key={opt.label}>
                  <span className="font-medium text-[var(--text-primary)]">{opt.label}: </span>
                  {opt.desc}
                </li>
              ))}
            </ul>
          </section>

          <div className="border-t border-[var(--border-primary)]" />

          <section>
            <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)] mb-2 font-medium">
              Bộ lọc nâng cao
            </p>
            <p>Kết hợp các điều kiện lọc:</p>
            <ul className="mt-2 space-y-1 text-xs">
              {['Loại văn bản', 'Cơ quan ban hành', 'Tình trạng hiệu lực', 'Khoảng thời gian'].map(f => (
                <li key={f} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-primary inline-block shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── SearchSection ────────────────────────────────────────────────────────────

interface SearchSectionProps {
  query: string
  filters: SearchFilters
  onQueryChange: (v: string) => void
  onSearch: () => void
  onFilterChange: (patch: Partial<SearchFilters>) => void
  onSuggestion: (s: string) => void
}

function SearchSection({
  query,
  filters,
  onQueryChange,
  onSearch,
  onFilterChange,
  onSuggestion,
}: SearchSectionProps) {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f1f5c] via-[#1a3a8c] to-[#2a5fd6] pt-14 pb-10 px-4">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="container relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-blue-200" />
              <span className="text-blue-200 text-sm font-bold uppercase tracking-widest">
                Cơ sở dữ liệu pháp luật
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
              Tra cứu văn bản{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                pháp luật
              </span>
            </h1>

            <p className="text-white/70 text-base mb-7 max-w-xl mx-auto">
              Hệ thống thư viện pháp luật điện tử tinh gọn, chính xác và chuyên nghiệp
            </p>

            <div className="relative flex items-center max-w-3xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 shadow-2xl gap-2">
              <div className="flex-1 min-w-0">
                <Input
                  id="law-search-input"
                  value={query}
                  onChange={e => onQueryChange(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onSearch()}
                  placeholder="Nhập từ khoá… (ví dụ: ly hôn, đất đai, doanh nghiệp...)"
                  className="border-transparent bg-transparent text-white placeholder:text-white/50 rounded-xl focus-visible:ring-0 h-12"
                />
              </div>
              <Button
                onClick={onSearch}
                size="lg"
                className="bg-white text-[#0f1f5c] hover:bg-white/90 font-semibold rounded-xl px-7 shrink-0"
                iconStart={<Search className="w-4 h-4" />}
              >
                Tìm kiếm
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-4">
              <span className="text-white/60 text-sm">Tìm kiếm trong:</span>
              {SEARCH_SCOPE_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="searchIn"
                    value={opt.value}
                    checked={filters.searchIn === opt.value}
                    onChange={() => onFilterChange({ searchIn: opt.value })}
                    className="accent-white w-3.5 h-3.5"
                  />
                  <span className="text-white/80 text-sm">{opt.label}</span>
                </label>
              ))}
              <SearchGuidePopover />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="bg-[var(--background-primary)] border-b border-[var(--border-primary)] px-4 py-3">
        <div className="container max-w-6xl mx-auto flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--text-tertiary)] font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Tìm kiếm gần đây:
          </span>
          {QUICK_SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => onSuggestion(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--border-secondary)] text-[var(--text-secondary)] hover:border-primary hover:text-primary hover:bg-[var(--background-primary-light)] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' }) {
  return status === 'ACTIVE' ? (
    <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
      Đang có hiệu lực
    </Badge>
  ) : (
    <Badge variant="outline" className="text-[var(--text-tertiary)] border-[var(--border-secondary)]">
      Hết hiệu lực
    </Badge>
  )
}

// ─── QuickActions ─────────────────────────────────────────────────────────────

function QuickActions({ law }: { law: Law }) {
  return (
    <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-primary)]">
      <Button size="sm" variant="default" iconStart={<Eye className="w-3.5 h-3.5" />}>
        Xem chi tiết
      </Button>
      {law.sourceUrl && (
        <Button
          size="sm"
          variant="outline"
          iconStart={<Download className="w-3.5 h-3.5" />}
          onClick={() => window.open(law.sourceUrl, '_blank')}
        >
          Tải về
        </Button>
      )}
      <Button size="sm" variant="outline" iconStart={<Bookmark className="w-3.5 h-3.5" />}>
        Lưu
      </Button>
      <Button size="sm" variant="outline" iconStart={<Share2 className="w-3.5 h-3.5" />}>
        Chia sẻ
      </Button>
    </div>
  )
}

// ─── LawCard ─────────────────────────────────────────────────────────────────

function LawCard({ law, index }: { law: Law; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="group bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-2xl p-5 hover:shadow-md hover:border-[var(--border-secondary)] transition-all duration-200"
    >
      <div className="flex flex-wrap items-start gap-2 mb-3">
        <span className="font-mono text-xs font-bold text-primary bg-[var(--background-primary-light)] px-2.5 py-1 rounded-full">
          {law.documentNumber}
        </span>
        <StatusBadge status={law.status} />
        <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(law.issuedDate)}
        </span>
      </div>

      <h3 className="text-base font-semibold text-[var(--text-primary)] leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
        {law.title}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
        {law.content}
      </p>

      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-tertiary)] mb-4">
        <span className="flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          {law.authorName}
        </span>
        <span className="flex items-center gap-1">
          <Tag className="w-3 h-3" />
          Pháp luật
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Hiệu lực: {formatDate(law.effectiveDate)}
        </span>
      </div>

      <QuickActions law={law} />
    </motion.article>
  )
}

// ─── LawList ─────────────────────────────────────────────────────────────────

interface LawListProps {
  laws: Law[]
  isLoading: boolean
  isError: boolean
  query: string
}

function LawList({ laws, isLoading, isError, query }: LawListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--text-tertiary)]">
        <AlertCircle className="w-10 h-10 text-[var(--error-primary)] opacity-60" />
        <p className="font-medium text-[var(--text-primary)]">Không thể tải dữ liệu</p>
        <p className="text-sm">Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.</p>
      </div>
    )
  }

  if (laws.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--text-tertiary)]">
        <BookOpen className="w-12 h-12 opacity-30" />
        <p className="font-medium text-[var(--text-primary)]">Không tìm thấy văn bản phù hợp</p>
        {query && <p className="text-sm">Không có kết quả cho từ khoá "{query}"</p>}
        <p className="text-sm">Hãy thử từ khoá khác hoặc điều chỉnh bộ lọc.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {laws.map((law, i) => (
        <LawCard key={law.id} law={law} index={i} />
      ))}
    </div>
  )
}

// ─── SearchFiltersBar ─────────────────────────────────────────────────────────

interface SearchFiltersProps {
  filters: SearchFilters
  total: number
  onFilterChange: (patch: Partial<SearchFilters>) => void
}

function SearchFiltersBar({ filters, total, onFilterChange }: SearchFiltersProps) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4 bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-2xl px-4 py-3">
        <Filter className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
        <div className="flex items-center gap-1">
          {(
            [
              { value: 'ALL', label: 'Tất cả' },
              { value: 'ACTIVE', label: 'Đang có hiệu lực' },
              { value: 'INACTIVE', label: 'Hết hiệu lực' },
            ] as const
          ).map(opt => (
            <button
              key={opt.value}
              onClick={() => onFilterChange({ status: opt.value })}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap',
                filters.status === opt.value
                  ? 'bg-primary text-white border-primary'
                  : 'border-[var(--border-secondary)] text-[var(--text-secondary)] hover:border-primary hover:text-primary'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Select value={filters.field} onValueChange={v => onFilterChange({ field: v })}>
            <SelectTrigger className="h-8 text-xs w-44 rounded-full border-[var(--border-secondary)]" id="field-select">
              <SelectValue placeholder="Lĩnh vực" />
            </SelectTrigger>
            <SelectContent>
              {LEGAL_FIELDS.map(f => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.sortBy} onValueChange={v => onFilterChange({ sortBy: v as SortBy })}>
            <SelectTrigger className="h-8 text-xs w-36 rounded-full border-[var(--border-secondary)]" id="sort-select">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="popular">Phổ biến nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-[var(--text-tertiary)] mb-4">
        Tìm thấy <span className="font-semibold text-[var(--text-primary)]">{total}</span> văn bản
      </p>
    </>
  )
}

// ─── FeaturedSection ──────────────────────────────────────────────────────────

interface DocItemProps {
  badge: string
  title: string
  issuedDate: string
  effectiveDate: string
  status: 'ACTIVE' | 'INACTIVE'
}

function DocItem({ badge, title, issuedDate, effectiveDate, status }: DocItemProps) {
  return (
    <div className="border-b border-[var(--border-primary)] last:border-0 py-3 first:pt-0">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] dark:bg-blue-900/30 dark:text-blue-400">
              Mới
            </Badge>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm text-[var(--text-primary)] font-medium line-clamp-2 leading-snug mb-1">
            <span className="font-mono text-primary font-bold mr-1">{badge}</span>
            {title}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Ban hành: {formatDate(issuedDate)}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Hiệu lực: {formatDate(effectiveDate)}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1 shrink-0 mt-1">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" iconStart={<FileText className="w-3 h-3" />}>
            PDF
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" iconStart={<Download className="w-3 h-3" />}>
            Tải về
          </Button>
        </div>
      </div>
    </div>
  )
}

function FeaturedSection() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'expiring'>('upcoming')

  const upcomingDocs: DocItemProps[] = [
    {
      badge: '11/2026/TT-BVHTTDL',
      title: 'Quy định định mức kinh tế - kỹ thuật hỗ trợ hoạt động sáng tác của văn nghệ sĩ tại các trại sáng tác phục vụ nhiệm vụ chính trị',
      issuedDate: '2026-05-20',
      effectiveDate: '2026-07-06',
      status: 'INACTIVE',
    },
    {
      badge: '182/2026/NĐ-CP',
      title: 'Nghị định quy định chế độ phụ cấp ưu đãi theo nghề đối với nhà giáo, cán bộ quản lý cơ sở giáo dục và nhân sự hỗ trợ giáo dục công tác trong các cơ sở giáo dục công lập',
      issuedDate: '2026-05-22',
      effectiveDate: '2026-07-07',
      status: 'INACTIVE',
    },
    {
      badge: '71/2026/TT-BCA',
      title: 'Hướng dẫn thực hiện tạm hoãn xuất cảnh, chưa cho nhập cảnh',
      issuedDate: '2026-05-25',
      effectiveDate: '2026-07-10',
      status: 'INACTIVE',
    },
  ]

  const expiringDocs: DocItemProps[] = [
    {
      badge: '200/2014/TT-BTC',
      title: 'Hướng dẫn Chế độ kế toán doanh nghiệp',
      issuedDate: '2014-12-22',
      effectiveDate: '2015-01-01',
      status: 'INACTIVE',
    },
    {
      badge: '08/2023/TT-NHNN',
      title: 'Quy định về hoạt động cho vay của tổ chức tín dụng',
      issuedDate: '2023-06-30',
      effectiveDate: '2023-07-01',
      status: 'ACTIVE',
    },
  ]

  const docs = activeTab === 'upcoming' ? upcomingDocs : expiringDocs

  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-2xl overflow-hidden">
          <div className="flex border-b border-[var(--border-primary)]">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={cn(
                'flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2',
                activeTab === 'upcoming'
                  ? 'bg-primary text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <Clock className="w-4 h-4" />
              Sắp có hiệu lực trong 30 ngày
            </button>
            <button
              onClick={() => setActiveTab('expiring')}
              className={cn(
                'flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2',
                activeTab === 'expiring'
                  ? 'bg-primary text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              <AlertCircle className="w-4 h-4" />
              Sắp hết hiệu lực trong 30 ngày
            </button>
          </div>
          <div className="p-5">
            {docs.map(d => (
              <DocItem key={d.badge} {...d} />
            ))}
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              iconEnd={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Xem tất cả
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex-1 rounded-2xl p-5 bg-primary flex flex-col gap-2 justify-between">
            <Scale className="w-6 h-6 text-white/80" />
            <div>
              <p className="text-sm font-bold text-white">Thư viện Án lệ</p>
              <p className="text-xs text-white/70 mt-1 leading-snug">
                Truy cập hơn 1,000 bản án tiêu biểu đã được Hội đồng Thẩm phán thông qua.
              </p>
            </div>
            <button className="text-xs text-white underline underline-offset-2 self-start hover:text-white/80 transition-colors">
              Khám phá ngay
            </button>
          </div>
          <div className="flex-1 rounded-2xl p-5 bg-[var(--background-secondary)] border border-[var(--border-primary)] flex flex-col gap-2 justify-between">
            <FileText className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Mẫu văn bản</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-snug">
                Tải xuống các mẫu đơn, hợp đồng chuẩn pháp lý.
              </p>
            </div>
            <button className="text-xs text-primary underline underline-offset-2 self-start hover:text-primary/80 transition-colors">
              Xem tất cả mẫu
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h3 className="font-semibold text-sm text-[var(--text-primary)]">{title}</h3>
    </div>
  )
}

// ─── PopularDocsSidebar ───────────────────────────────────────────────────────

function PopularDocsSidebar() {
  return (
    <aside className="space-y-3">
      <SectionHeader icon={<TrendingUp className="w-4 h-4 text-primary" />} title="Văn bản được xem nhiều" />
      {POPULAR_DOCS.map((doc, i) => (
        <button
          key={doc.id}
          className="w-full text-left group p-3 rounded-xl border border-[var(--border-primary)] hover:border-primary/30 hover:bg-[var(--background-tertiary)] transition-all duration-150"
        >
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--background-secondary)] text-[var(--text-tertiary)] text-[10px] font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1">
                {doc.title}
              </p>
              <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {doc.views.toLocaleString('vi-VN')}
                </span>
                <span>{formatDate(doc.date)}</span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </aside>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LawLibraryPage() {
  const [query, setQuery] = useState('')
  const [committedQuery, setCommittedQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({
    searchIn: 'title',
    status: 'ALL',
    field: 'ALL',
    sortBy: 'newest',
  })
  const [currentPage, setCurrentPage] = useState(1)

  // Debounce to avoid redundant API calls while user types
  const debouncedQuery = useDebounce(committedQuery, 400)

  const apiParams = useMemo(() => ({
    page: currentPage,
    size: PAGE_SIZE,
    search: debouncedQuery || undefined,
    status: filters.status !== 'ALL' ? filters.status : undefined,
  }), [debouncedQuery, filters.status, currentPage])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['laws', apiParams],
    queryFn: () => lawApi.listLaws(apiParams),
    placeholderData: prev => prev,
  })

  const laws = data?.items ?? []
  const pagination = data?.pagination

  const handleSearch = useCallback(() => {
    setCommittedQuery(query)
    setCurrentPage(1)
  }, [query])

  const handleSuggestion = useCallback((s: string) => {
    setQuery(s)
    setCommittedQuery(s)
    setCurrentPage(1)
  }, [])

  const handleFilterChange = useCallback((patch: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...patch }))
    setCurrentPage(1)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--background-tertiary)]">
      <SearchSection
        query={query}
        filters={filters}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onSuggestion={handleSuggestion}
      />

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <FeaturedSection />

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <SearchFiltersBar
              filters={filters}
              total={pagination?.total ?? laws.length}
              onFilterChange={handleFilterChange}
            />

            <LawList
              laws={laws}
              isLoading={isLoading}
              isError={isError}
              query={debouncedQuery}
            />

            {!isLoading && !isError && (pagination?.totalPages ?? 0) > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={e => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)) }}
                        className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {Array.from({ length: pagination?.totalPages ?? 1 }, (_, i) => i + 1)
                      .slice(0, 7)
                      .map(pg => (
                        <PaginationItem key={pg}>
                          <PaginationLink
                            href="#"
                            isActive={pg === currentPage}
                            onClick={e => { e.preventDefault(); setCurrentPage(pg) }}
                          >
                            {pg}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                    {(pagination?.totalPages ?? 0) > 7 && (
                      <PaginationItem><PaginationEllipsis /></PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={e => { e.preventDefault(); setCurrentPage(p => Math.min(pagination?.totalPages ?? 1, p + 1)) }}
                        className={currentPage >= (pagination?.totalPages ?? 1) ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>

          <aside className="w-full lg:w-72 shrink-0">
            <div className="sticky top-4 bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-2xl p-5">
              <PopularDocsSidebar />
              <div className="mt-6 pt-5 border-t border-[var(--border-primary)]">
                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-[var(--background-primary-light)] border border-primary/20 p-4">
                  <Sparkles className="w-5 h-5 text-primary mb-2" />
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Trợ lý AI Pháp lý</p>
                  <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
                    Tóm tắt nội dung văn bản pháp luật bằng trí tuệ nhân tạo.
                  </p>
                  <Button variant="default" size="sm" className="w-full">
                    Dùng thử ngay
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
