import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { useQuery } from '@tanstack/react-query'
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Scale,
  Eye,
  Download,
  Bookmark,
  Share2,
  SlidersHorizontal,
  HelpCircle,
  Home,
  ChevronRight,
  AlertCircle,
  GitBranch,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
import { MOCK_LAWS } from './law-mock'

type SearchScope = 'title' | 'content' | 'documentNumber'
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'

interface SidebarState {
  docGroups: string[]
  agencies: string[]
  docTypes: string[]
  fields: string[]
  issueFrom: string
  issueTo: string
}

const DOC_GROUPS = [
  'Văn bản quy phạm pháp luật',
  'Văn bản hợp nhất',
  'Hệ thống hóa văn bản pháp luật',
  'Văn bản hành chính liên quan',
]

const AGENCIES = [
  'Quốc hội',
  'Ủy ban Thường vụ Quốc hội',
  'Chính phủ',
  'Chủ tịch nước',
  'Thủ tướng Chính phủ',
  'Bộ Tư pháp',
  'Bộ Tài chính',
]

const DOC_TYPES = [
  'Thông tư liên tịch',
  'Quyết định',
  'Lệnh',
  'Nghị quyết',
  'Luật',
  'Nghị định',
  'Thông tư',
  'Hiến pháp',
]

const FIELDS = [
  'Dân sự',
  'Hình sự',
  'Đất đai',
  'Hợp đồng',
  'Lao động',
  'Doanh nghiệp',
  'Hôn nhân & Gia đình',
  'Hành chính',
  'Tài chính & Thuế',
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'relevant', label: 'Liên quan nhất' },
  { value: 'effective_recent', label: 'Hiệu lực gần nhất' },
  { value: 'issued_recent', label: 'Ban hành gần nhất' },
]

const PAGE_SIZE = 10

function formatDate(str: string) {
  if (!str) return '—'
  try {
    return new Date(str).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return str
  }
}

function highlight(text: string, keyword: string) {
  if (!keyword.trim() || !text) return <>{text}</>
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

function PageBreadcrumb() {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] py-3 px-4 border-b border-[var(--border-primary)] bg-[var(--background-primary)]">
      <a href="/" className="flex items-center gap-1 hover:text-primary transition-colors">
        <Home className="w-3.5 h-3.5" />
        Trang chủ
      </a>
      <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
      <span className="text-[var(--text-primary)] font-medium">Văn bản quy phạm pháp luật Trung ương</span>
    </nav>
  )
}

interface FilterGroupProps {
  title: string
  options: string[]
  selected: string[]
  onChange: (vals: string[]) => void
  defaultOpen?: boolean
}

function FilterGroup({ title, options, selected, onChange, defaultOpen = false }: FilterGroupProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  const filtered = useMemo(
    () => options.filter(o => o.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  )
  const visible = showAll ? filtered : filtered.slice(0, 4)

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(s => s !== val) : [...selected, val])
  }

  return (
    <div className="border-b border-[var(--border-primary)] last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 px-1 text-sm font-semibold text-[var(--text-primary)] hover:text-primary transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
      </button>

      {open && (
        <div className="pb-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm"
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-[var(--border-secondary)] rounded-lg bg-[var(--background-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-2">
            {visible.map(opt => (
              <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  checked={selected.includes(opt)}
                  onCheckedChange={() => toggle(opt)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors leading-snug">
                  {opt}
                </span>
              </label>
            ))}
          </div>

          {filtered.length > 4 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="text-xs text-primary hover:underline"
            >
              {showAll ? 'Thu gọn' : `Xem thêm ${filtered.length - 4} mục`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

interface SidebarFiltersProps {
  sidebar: SidebarState
  onChange: (patch: Partial<SidebarState>) => void
  onReset: () => void
}

function SidebarFilters({ sidebar, onChange, onReset }: SidebarFiltersProps) {
  return (
    <aside className="w-64 shrink-0 sticky top-4 self-start bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
        <span className="text-sm font-bold text-[var(--text-primary)]">Bộ lọc</span>
        <button onClick={onReset} className="text-xs text-primary hover:underline">
          Bỏ chọn
        </button>
      </div>
      <div className="px-3 py-1 max-h-[calc(100vh-180px)] overflow-y-auto">
        <FilterGroup
          title="Nhóm văn bản"
          options={DOC_GROUPS}
          selected={sidebar.docGroups}
          onChange={v => onChange({ docGroups: v })}
          defaultOpen
        />
        <FilterGroup
          title="Cơ quan ban hành"
          options={AGENCIES}
          selected={sidebar.agencies}
          onChange={v => onChange({ agencies: v })}
          defaultOpen
        />
        <FilterGroup
          title="Hình thức văn bản"
          options={DOC_TYPES}
          selected={sidebar.docTypes}
          onChange={v => onChange({ docTypes: v })}
        />
        <FilterGroup
          title="Lĩnh vực"
          options={FIELDS}
          selected={sidebar.fields}
          onChange={v => onChange({ fields: v })}
        />

        <div className="border-b border-[var(--border-primary)] last:border-0">
          <button
            className="w-full flex items-center justify-between py-3 px-1 text-sm font-semibold text-[var(--text-primary)]"
            onClick={() => {}}
          >
            Thời gian ban hành
            <ChevronDown className="w-4 h-4 shrink-0" />
          </button>
          <div className="pb-3 space-y-2">
            <div>
              <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Từ ngày</label>
              <input
                type="date"
                value={sidebar.issueFrom}
                onChange={e => onChange({ issueFrom: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-[var(--border-secondary)] rounded-lg bg-[var(--background-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Đến ngày</label>
              <input
                type="date"
                value={sidebar.issueTo}
                onChange={e => onChange({ issueTo: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-[var(--border-secondary)] rounded-lg bg-[var(--background-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function SearchGuidePopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 text-sm text-primary hover:underline underline-offset-2 transition-colors whitespace-nowrap">
          <HelpCircle className="w-3.5 h-3.5" />
          Hướng dẫn tra cứu
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[340px] max-h-[440px] overflow-y-auto p-0 shadow-xl border-[var(--border-secondary)] bg-[var(--background-primary)]"
        align="end"
        sideOffset={8}
      >
        <div className="p-3 border-b border-[var(--border-primary)] bg-[var(--background-secondary)] flex items-center gap-2">
          <Scale className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">
            Hướng dẫn tìm kiếm
          </span>
        </div>

        <div className="p-4 space-y-4 text-sm text-[var(--text-secondary)]">
          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-2">Tìm kiếm cơ bản</p>
            <ul className="space-y-2.5">
              {[
                { label: 'Theo tên văn bản', ex: 'Bộ luật Dân sự 2015' },
                { label: 'Theo số hiệu', ex: '91/2015/QH13' },
                { label: 'Theo từ khoá', ex: 'dân sự, đất đai, hôn nhân, hợp đồng' },
              ].map(item => (
                <li key={item.label}>
                  <p>{item.label}:</p>
                  <code className="text-xs bg-[var(--background-secondary)] text-primary px-2 py-0.5 rounded font-mono">
                    {item.ex}
                  </code>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-[var(--border-primary)]" />

          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-2">Tìm kiếm nâng cao</p>
            <p className="text-xs uppercase text-[var(--text-tertiary)] font-medium mb-2">Phạm vi tìm kiếm</p>
            <ul className="space-y-1.5">
              {[
                { label: 'Tiêu đề', desc: 'Chỉ tìm trong tiêu đề văn bản.' },
                { label: 'Nội dung', desc: 'Tìm kiếm trong toàn văn.' },
                { label: 'Số hiệu', desc: 'Tìm theo số hiệu chính thức.' },
                { label: 'Chính xác cụm từ trên', desc: 'Khớp chính xác theo thứ tự từ.' },
              ].map(o => (
                <li key={o.label}>
                  <span className="font-medium text-[var(--text-primary)]">{o.label}: </span>
                  {o.desc}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-[var(--border-primary)]" />

          <div>
            <p className="text-xs uppercase text-[var(--text-tertiary)] font-medium mb-2">Bộ lọc nâng cao</p>
            <p>Kết hợp các điều kiện:</p>
            <ul className="mt-1.5 space-y-1 text-xs">
              {['Nhóm văn bản', 'Cơ quan ban hành', 'Tình trạng hiệu lực', 'Khoảng thời gian', 'Lĩnh vực'].map(f => (
                <li key={f} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-primary inline-block" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface AdvancedSearchDialogProps {
  open: boolean
  onClose: () => void
  status: StatusFilter
  onStatusChange: (v: StatusFilter) => void
  onApply: () => void
  onReset: () => void
}

function AdvancedSearchDialog({ open, onClose, status, onStatusChange, onApply, onReset }: AdvancedSearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg bg-[var(--background-primary)] border-[var(--border-primary)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)]">Tìm kiếm nâng cao</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <Label className="text-[var(--text-secondary)] text-xs mb-2 block uppercase tracking-wide font-semibold">
              Tình trạng hiệu lực
            </Label>
            <RadioGroup
              value={status}
              onValueChange={v => onStatusChange(v as StatusFilter)}
              className="flex gap-6"
            >
              {[
                { value: 'ALL', label: 'Tất cả' },
                { value: 'ACTIVE', label: 'Còn hiệu lực' },
                { value: 'INACTIVE', label: 'Hết hiệu lực' },
              ].map(opt => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem id={`adv-status-${opt.value}`} value={opt.value} />
                  <Label htmlFor={`adv-status-${opt.value}`} className="text-sm cursor-pointer text-[var(--text-primary)]">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-[var(--text-secondary)] text-xs mb-2 block uppercase tracking-wide font-semibold">
              Loại văn bản
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {DOC_TYPES.slice(0, 6).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                  <span className="text-sm text-[var(--text-secondary)]">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-[var(--text-secondary)] text-xs mb-2 block uppercase tracking-wide font-semibold">
              Sắp xếp
            </Label>
            <Select defaultValue="newest">
              <SelectTrigger className="h-9 text-sm border-[var(--border-secondary)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onReset} size="sm">
            Đặt lại
          </Button>
          <Button
            onClick={() => { onApply(); onClose() }}
            size="sm"
            className="bg-primary text-white"
          >
            Áp dụng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface SearchBarProps {
  keyword: string
  isLoading: boolean
  scope: SearchScope
  exactPhrase: boolean
  onKeywordChange: (v: string) => void
  onSearch: () => void
  onScopeChange: (v: SearchScope) => void
  onExactPhraseChange: (v: boolean) => void
  onAdvancedOpen: () => void
}

function SearchBar({
  keyword,
  isLoading,
  scope,
  exactPhrase,
  onKeywordChange,
  onSearch,
  onScopeChange,
  onExactPhraseChange,
  onAdvancedOpen,
}: SearchBarProps) {
  return (
    <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-xl p-4 mb-4">
        <div className="flex flex-col gap-2 mb-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              id="law-search-input"
              value={keyword}
              onChange={e => onKeywordChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSearch()}
              placeholder="Nhập từ khoá tìm kiếm"
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-[var(--border-secondary)] rounded-lg bg-[var(--background-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-primary transition-colors"
            />
            {keyword && (
              <button
                onClick={() => onKeywordChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={onSearch}
              className="flex-1 sm:flex-none bg-primary text-white hover:bg-primary/90 px-5"
              iconStart={
                isLoading
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  : <Search className="w-4 h-4" />
              }
            >
              Tìm kiếm
            </Button>
            <Button
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={onAdvancedOpen}
              iconStart={<SlidersHorizontal className="w-4 h-4" />}
            >
              Tìm kiếm nâng cao
            </Button>
          </div>
        </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-xs text-[var(--text-tertiary)] whitespace-nowrap">Tìm kiếm trong:</span>
        <RadioGroup
          value={scope}
          onValueChange={v => onScopeChange(v as SearchScope)}
          className="flex gap-4 flex-wrap"
        >
          {[
            { value: 'title', label: 'Tiêu đề' },
            { value: 'content', label: 'Nội dung' },
            { value: 'documentNumber', label: 'Số hiệu' },
          ].map(opt => (
            <div key={opt.value} className="flex items-center gap-1.5">
              <RadioGroupItem id={`scope-${opt.value}`} value={opt.value} />
              <Label htmlFor={`scope-${opt.value}`} className="text-sm cursor-pointer text-[var(--text-secondary)]">
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox
            checked={exactPhrase}
            onCheckedChange={v => onExactPhraseChange(!!v)}
            id="exact-phrase"
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <Label htmlFor="exact-phrase" className="text-sm cursor-pointer text-[var(--text-secondary)]">
            Chính xác cụm từ trên
          </Label>
        </label>

        <div className="ml-auto">
          <SearchGuidePopover />
        </div>
      </div>
    </div>
  )
}

interface ResultToolbarProps {
  total: number
  keyword: string
  sortBy: string
  onSortChange: (v: string) => void
}

function ResultToolbar({ total, keyword, sortBy, onSortChange }: ResultToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
      <p className="text-sm text-[var(--text-secondary)]">
        {keyword ? (
          <>
            Tìm thấy{' '}
            <span className="font-semibold text-[var(--text-primary)]">{total.toLocaleString('vi-VN')}</span>
            {' '}kết quả cho{' '}
            <span className="font-semibold text-[var(--text-primary)]">"{keyword}"</span>
          </>
        ) : (
          <>
            Hiển thị{' '}
            <span className="font-semibold text-[var(--text-primary)]">{total.toLocaleString('vi-VN')}</span>
            {' '}văn bản
          </>
        )}
      </p>

      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--text-tertiary)] whitespace-nowrap">Sắp xếp theo:</span>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="h-8 text-xs w-40 sm:w-48 border-[var(--border-secondary)] rounded-lg" id="result-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

interface LawCardProps {
  law: {
    id: string
    title: string
    content: string
    documentNumber: string
    issuedDate: string
    effectiveDate: string
    status: 'ACTIVE' | 'INACTIVE'
    authorName: string
    sourceUrl?: string
  }
  keyword: string
}

function StatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' }) {
  return status === 'ACTIVE' ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">
      Còn hiệu lực
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full dark:bg-orange-900/30 dark:text-orange-400">
      Chưa có hiệu lực
    </span>
  )
}

function LawCard({ law, keyword }: LawCardProps) {
  const navigate = useNavigate()
  const isNew = useMemo(() => {
    const created = new Date(law.issuedDate)
    const diff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
    return diff < 30
  }, [law.issuedDate])

  return (
    <article className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-xl p-4 hover:shadow-sm hover:border-[var(--border-secondary)] transition-all duration-150">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {isNew && (
          <Badge className="bg-primary text-white text-[10px] px-1.5 py-0 h-5 rounded-sm font-bold">
            Mới
          </Badge>
        )}
        <StatusBadge status={law.status} />
        <span className="text-xs text-[var(--text-tertiary)]">
          Số hiệu: <span className="font-medium text-primary">{law.documentNumber}</span>
        </span>
      </div>

      <h3
        onClick={() => navigate(`/law-library/${law.id}`)}
        className="text-sm font-semibold text-[var(--text-primary)] leading-snug mb-2 line-clamp-2 hover:text-primary cursor-pointer transition-colors"
      >
        {keyword ? highlight(law.title, keyword) : law.title}
      </h3>

      {law.content && keyword && (
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3 leading-relaxed">
          {highlight(law.content.slice(0, 280), keyword)}
          {law.content.length > 280 && '…'}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {['Pháp luật'].map(tag => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border-secondary)] text-[var(--text-tertiary)]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid grid-cols-1 gap-y-1.5 text-xs text-[var(--text-tertiary)] xs:grid-cols-2 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-0.5">
          <span>
            Tình trạng: <StatusBadge status={law.status} />
          </span>
          <span>
            Ngày ban hành:{' '}
            <span className="text-[var(--text-secondary)]">{formatDate(law.issuedDate)}</span>
          </span>
          <span className="xs:col-span-2 sm:col-span-2">
            Ngày hiệu lực:{' '}
            <span className="text-[var(--text-secondary)]">{formatDate(law.effectiveDate)}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:flex-nowrap">
          {law.sourceUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              iconStart={<Download className="w-3 h-3" />}
              onClick={() => window.open(law.sourceUrl, '_blank')}
            >
              PDF
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" iconStart={<GitBranch className="w-3 h-3" />}>
            Lược đồ
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" iconStart={<Download className="w-3 h-3" />}>
            Tải về
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Lưu">
            <Bookmark className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title="Xem"
            onClick={() => navigate(`/law-library/${law.id}`)}
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Chia sẻ">
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </article>
  )
}

interface LawListProps {
  laws: Array<{
    id: string
    title: string
    content: string
    documentNumber: string
    issuedDate: string
    effectiveDate: string
    status: 'ACTIVE' | 'INACTIVE'
    authorName: string
    sourceUrl?: string
  }>
  isLoading: boolean
  isError: boolean
  keyword: string
}

function SkeletonCard() {
  return (
    <div className="bg-[var(--background-primary)] border border-[var(--border-primary)] rounded-xl p-4 space-y-3 animate-pulse">
      <div className="flex gap-2">
        <div className="h-5 w-10 rounded-full bg-[var(--background-secondary)]" />
        <div className="h-5 w-20 rounded-full bg-[var(--background-secondary)]" />
        <div className="h-5 w-32 rounded-full bg-[var(--background-secondary)]" />
      </div>
      <div className="h-4 w-4/5 rounded bg-[var(--background-secondary)]" />
      <div className="h-4 w-3/5 rounded bg-[var(--background-secondary)]" />
      <div className="flex gap-4 mt-2">
        <div className="h-3 w-24 rounded bg-[var(--background-secondary)]" />
        <div className="h-3 w-24 rounded bg-[var(--background-secondary)]" />
      </div>
    </div>
  )
}

function LawList({ laws, isLoading, isError, keyword }: LawListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="font-medium text-[var(--text-primary)]">Không thể tải dữ liệu</p>
        <p className="text-sm text-[var(--text-secondary)]">Vui lòng thử lại sau.</p>
      </div>
    )
  }

  if (laws.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <BookOpen className="w-10 h-10 opacity-30 text-[var(--text-tertiary)]" />
        <p className="font-medium text-[var(--text-primary)]">Không tìm thấy văn bản phù hợp</p>
        {keyword && (
          <p className="text-sm text-[var(--text-secondary)]">
            Không có kết quả cho "{keyword}". Thử từ khoá khác hoặc điều chỉnh bộ lọc.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {laws.map(law => (
        <LawCard key={law.id} law={law} keyword={keyword} />
      ))}
    </div>
  )
}

function PaginationSection({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null

  const pages = useMemo(() => {
    const all = Array.from({ length: totalPages }, (_, i) => i + 1)
    if (totalPages <= 7) return all
    if (page <= 4) return [...all.slice(0, 5), -1, totalPages]
    if (page >= totalPages - 3) return [1, -1, ...all.slice(totalPages - 5)]
    return [1, -1, page - 1, page, page + 1, -2, totalPages]
  }, [page, totalPages])

  return (
    <div className="mt-6 flex items-center justify-center">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={e => { e.preventDefault(); onPageChange(Math.max(1, page - 1)) }}
              className={page <= 1 ? 'pointer-events-none opacity-40' : ''}
            />
          </PaginationItem>

          {pages.map((p, i) =>
            p < 0 ? (
              <PaginationItem key={`el${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === page}
                  onClick={e => { e.preventDefault(); onPageChange(p) }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={e => { e.preventDefault(); onPageChange(Math.min(totalPages, page + 1)) }}
              className={page >= totalPages ? 'pointer-events-none opacity-40' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

export default function LawLibraryPage() {
  const [keyword, setKeyword] = useState('')
  const [committedKeyword, setCommittedKeyword] = useState('')
  const [scope, setScope] = useState<SearchScope>('title')
  const [exactPhrase, setExactPhrase] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [sidebar, setSidebar] = useState<SidebarState>({
    docGroups: [],
    agencies: [],
    docTypes: [],
    fields: [],
    issueFrom: '',
    issueTo: '',
  })

  const debouncedKeyword = useDebounce(committedKeyword, 300)

  const apiParams = useMemo(() => ({
    page: currentPage,
    size: PAGE_SIZE,
    search: debouncedKeyword || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    issuedDate: sidebar.issueFrom || undefined,
  }), [debouncedKeyword, statusFilter, currentPage, sidebar.issueFrom])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['laws', apiParams, sidebar, statusFilter],
    queryFn: () => {
      let result = [...MOCK_LAWS]
      if (debouncedKeyword) {
        const kw = debouncedKeyword.toLowerCase()
        result = result.filter(l =>
          l.title.toLowerCase().includes(kw) ||
          l.content.toLowerCase().includes(kw) ||
          l.documentNumber.toLowerCase().includes(kw)
        )
      }
      if (statusFilter !== 'ALL') {
        result = result.filter(l => l.status === statusFilter)
      }
      if (sidebar.issueFrom) {
        result = result.filter(l => l.issuedDate >= sidebar.issueFrom)
      }
      if (sidebar.issueTo) {
        result = result.filter(l => l.issuedDate <= sidebar.issueTo)
      }
      if (sidebar.agencies.length > 0) {
        result = result.filter(l => sidebar.agencies.includes(l.authorName))
      }
      if (sidebar.docTypes.length > 0) {
        result = result.filter(l => sidebar.docTypes.some(t => l.title.includes(t) || l.documentNumber.includes(t)))
      }

      const total = result.length
      const page = currentPage
      const size = PAGE_SIZE
      const totalPages = Math.ceil(total / size)
      const sliced = result.slice((page - 1) * size, page * size)

      return {
        items: sliced,
        pagination: { page, size, total, totalPages }
      }
    },
    placeholderData: prev => prev,
  })

  const laws = data?.items ?? []
  const pagination = data?.pagination

  const handleSearch = useCallback(() => {
    setCommittedKeyword(keyword)
    setCurrentPage(1)
  }, [keyword])

  const handleSidebarChange = useCallback((patch: Partial<SidebarState>) => {
    setSidebar(prev => ({ ...prev, ...patch }))
    setCurrentPage(1)
  }, [])

  const handleSidebarReset = useCallback(() => {
    setSidebar({ docGroups: [], agencies: [], docTypes: [], fields: [], issueFrom: '', issueTo: '' })
    setCurrentPage(1)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--background-tertiary)]">
      <PageBreadcrumb />

      <div className="container max-w-[1280px] mx-auto px-4 py-5 flex gap-5 items-start">
        <div className="hidden lg:block">
          <SidebarFilters
            sidebar={sidebar}
            onChange={handleSidebarChange}
            onReset={handleSidebarReset}
          />
        </div>

        <div className="flex-1 min-w-0">
          <SearchBar
            keyword={keyword}
            isLoading={isLoading}
            scope={scope}
            exactPhrase={exactPhrase}
            onKeywordChange={setKeyword}
            onSearch={handleSearch}
            onScopeChange={v => { setScope(v); setCurrentPage(1) }}
            onExactPhraseChange={v => { setExactPhrase(v); setCurrentPage(1) }}
            onAdvancedOpen={() => setAdvancedOpen(true)}
          />

          <ResultToolbar
            total={pagination?.total ?? 0}
            keyword={debouncedKeyword}
            sortBy={sortBy}
            onSortChange={v => { setSortBy(v); setCurrentPage(1) }}
          />

          <LawList
            laws={laws}
            isLoading={isLoading}
            isError={isError}
            keyword={debouncedKeyword}
          />

          <PaginationSection
            page={currentPage}
            totalPages={pagination?.totalPages ?? 1}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <AdvancedSearchDialog
        open={advancedOpen}
        onClose={() => setAdvancedOpen(false)}
        status={statusFilter}
        onStatusChange={v => { setStatusFilter(v); setCurrentPage(1) }}
        onApply={() => setCurrentPage(1)}
        onReset={() => {
          setStatusFilter('ALL')
          setCurrentPage(1)
        }}
      />
    </div>
  )
}
