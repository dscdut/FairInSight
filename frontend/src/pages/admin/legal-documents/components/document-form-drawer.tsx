import React, { useState, useEffect } from 'react'


import { motion, AnimatePresence } from 'framer-motion'
import { X, Info, ChevronDown, ChevronUp, RotateCcw, UploadCloud, FileText, Trash2, Loader2, Pencil, CheckCircle2, AlertTriangle, Link2 } from 'lucide-react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import config from '@/core/configs/env'
import { cn } from '@/core/lib/utils'
import {
  lawAiApi,
  type CompareCheck,
  type CompareReport,
  type DuplicateCandidate,
  type PreviewLawFields,
} from '@/core/services/law-ai.service'
import { lawApi } from '@/core/services/law.service'
import { type Law, type LawVersion } from '@/models/types/law.type'

import { DOC_TYPE_OPTIONS, normalizeDocType } from '../doc-type'

import { DuplicateWarning } from './duplicate-warning'
import { MarkdownPreview } from './markdown-preview'
import { PipelineLoader } from './pipeline-loader'

export interface FormSubmitData {
  title: string
  documentNumber: string
  issuedDate: string
  effectiveDate: string
  sourceUrl: string
  officialUrl: string
  content: string
  changeNote: string
  // Chỉ có ở luồng "thêm mới" qua AI (preview -> confirm). Edit mode để undefined.
  previewClientId?: string
  previewFields?: PreviewLawFields
  forceConfirmed?: boolean
}

interface DocumentFormDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: FormSubmitData) => void | Promise<void>
  law: Law | null // Null means "Add New", not null means "Edit"
  onRestoreVersion?: (version: LawVersion) => void
}

export const DocumentFormDrawer: React.FC<DocumentFormDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  law,
  onRestoreVersion,
}) => {
  const isEdit = !!law

  const [title, setTitle] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [issuedDate, setIssuedDate] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [officialUrl, setOfficialUrl] = useState('')
  const [content, setContent] = useState('')
  const [changeNote, setChangeNote] = useState('')

  // Accordion for version history
  const [showVersions, setShowVersions] = useState(false)

  // Docx/PDF upload states
  const [editSourceType, setEditSourceType] = useState<'text' | 'docx'>('text')
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingFileName, setUploadingFileName] = useState('')
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('preview')

  // PDF progress states
  const [isPdfUpload, setIsPdfUpload] = useState(false)
  const [pdfProgress, setPdfProgress] = useState<{
    step: string
    status: 'pending' | 'running' | 'completed' | 'error'
    error?: string
  }[]>([])

  // ---- State machine luồng thêm mới (preview -> confirm) ----
  // idle: 1 box upload chiếm nguyên drawer.
  // preview: đã trích xuất xong -> 2 cột (trái lock + card PDF + tóm tắt; phải đã xong).
  // confirming: đang gọi /confirm nạp KB.
  const [phase, setPhase] = useState<'idle' | 'preview' | 'confirming'>('idle')
  const [summary, setSummary] = useState('') // tóm tắt sơ bộ (read-only)
  const [cloudinaryUrl, setCloudinaryUrl] = useState('') // link PDF trên Cloudinary
  const [showPdf, setShowPdf] = useState(false) // mở PDF inline ngay dưới (không tải về)
  const [previewClientId, setPreviewClientId] = useState('') // client_id từ /preview
  const [previewFields, setPreviewFields] = useState<PreviewLawFields | null>(null)
  const [duplicate, setDuplicate] = useState<{
    verdict: 'unique' | 'different' | 'suspect'
    candidates: DuplicateCandidate[]
  } | null>(null)
  const [forceConfirmed, setForceConfirmed] = useState(false) // admin bấm "Vẫn tạo"

  // ---- Luồng cào VBPL (tùy chọn) ----
  // Admin dán link vbpl.vn → BE cào toàn văn (cấu trúc Điều/Khoản mạnh hơn OCR),
  // đối chiếu với PDF (compare). Link trống → nạp PDF như cũ.
  const [vbplUrl, setVbplUrl] = useState('')
  const [compare, setCompare] = useState<CompareReport | null>(null)

  // Initialize form values
  useEffect(() => {
    if (isOpen) {
      if (law) {
        setTitle(law.title || '')
        setDocumentNumber(law.documentNumber || '')
        setIssuedDate(law.issuedDate ? law.issuedDate.split('T')[0] : '')
        setEffectiveDate(law.effectiveDate ? law.effectiveDate.split('T')[0] : '')
        setSourceUrl(law.sourceUrl || '')
        setOfficialUrl(law.officialUrl || '')
        setContent(law.content || '')
        setChangeNote('') // Clear change note
      } else {
        setTitle('')
        setDocumentNumber('')
        setIssuedDate('')
        setEffectiveDate('')
        setSourceUrl('')
        setOfficialUrl('')
        setContent('')
        setChangeNote('')
      }
      setShowVersions(false)
      setEditSourceType('text')
      setUploadedFile(null)
      setIsUploading(false)
      setIsPdfUpload(false)
      setPdfProgress([])
      // Reset state machine luồng thêm mới
      setPhase('idle')
      setSummary('')
      setCloudinaryUrl('')
      setShowPdf(false)
      setPreviewClientId('')
      setPreviewFields(null)
      setDuplicate(null)
      setForceConfirmed(false)
      setVbplUrl('')
      setCompare(null)
    }
  }, [isOpen, law])

  // Lock background scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Link VBPL hợp lệ: .../vbpl.vn/van-ban/chi-tiet/<slug>--<ItemID>. Rỗng = OK (PDF cũ).
  // Khớp BE services/vbpl.parse_vbpl_url để FE cảnh báo sớm, không chờ round-trip.
  const isVbplUrlValid = (url: string): boolean => {
    const s = url.trim()
    if (!s) return true // không dán = hợp lệ (nạp PDF như cũ)
    const m = s.toLowerCase().match(/vbpl\.vn\/van-ban\/chi-tiet\/.*--([0-9]+|[0-9a-f-]{36})(?:[/?#]|$)/)
    return !!m
  }
  const vbplUrlError = vbplUrl.trim() !== '' && !isVbplUrlValid(vbplUrl)

  // Chuẩn hóa ngày từ LLM về dạng yyyy-MM-dd cho input[type=date].
  const normalizeDate = (raw?: string) => {
    if (!raw) return ''
    const s = raw.trim()
    // dd/MM/yyyy hoặc dd-MM-yyyy
    const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (m) {
      const [, d, mo, y] = m
      return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    // đã là yyyy-MM-dd (có thể kèm time)
    return s.split('T')[0]
  }

  // === EDIT MODE: giữ nguyên luồng docx/pdf cũ (upload + parse) ===
  const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFileName(file.name)
    setIsPdfUpload(false)
    setIsUploading(true)
    try {
      const uploadRes = await lawApi.uploadFile(file)
      const secureUrl = uploadRes.url
      const parseRes = await lawApi.parseDocx(secureUrl)
      setUploadedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      })
      setContent(parseRes.text)
      setSourceUrl(secureUrl)
    } catch (error: unknown) {
      console.error('Lỗi tải file:', error)
      const errorMsg = (error as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string }).response?.data?.error?.message || (error as { response?: { data?: { message?: string } } }).response?.data?.message || (error as { message?: string }).message || 'Có lỗi xảy ra khi upload hoặc trích xuất văn bản.'
      alert(errorMsg)
    } finally {
      setIsUploading(false)
    }
  }

  // Chọn file PDF tay → validate rồi chạy preview (lõi chung với nút "Tải từ VBPL").
  const handlePreviewUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Chỉ chấp nhận tệp PDF (.pdf).')
      return
    }
    if (vbplUrl.trim() && !isVbplUrlValid(vbplUrl)) {
      alert('Link VBPL không đúng định dạng. Vui lòng dán link dạng https://vbpl.vn/van-ban/chi-tiet/... hoặc để trống.')
      return
    }
    await runPreview(file)
  }

  // Nút "Tải PDF từ VBPL": link hợp lệ → BE proxy tải PDF gốc → chạy preview như file tay.
  const [isFetchingVbplPdf, setIsFetchingVbplPdf] = useState(false)
  const handleFetchVbplPdf = async () => {
    if (!isVbplUrlValid(vbplUrl) || !vbplUrl.trim()) {
      alert('Vui lòng dán link VBPL hợp lệ trước khi tải PDF.')
      return
    }
    setIsFetchingVbplPdf(true)
    try {
      const file = await lawAiApi.fetchVbplPdf(vbplUrl.trim())
      await runPreview(file)
    } catch (error: unknown) {
      const errorMsg = (error as { response?: { data?: { detail?: string } }; message?: string }).response?.data?.detail || (error as { message?: string }).message || 'Không tải được PDF từ VBPL. Văn bản có thể chưa có PDF gốc — vui lòng tải PDF lên thủ công.'
      alert(errorMsg)
    } finally {
      setIsFetchingVbplPdf(false)
    }
  }

  // === ADD-NEW: PDF -> /preview (KHÔNG ghi KB). Trích metadata + tóm tắt + check trùng. ===
  const runPreview = async (file: File) => {
    setUploadingFileName(file.name)
    setIsPdfUpload(true)
    setIsUploading(true)
    setPhase('preview') // chuyển sang 2 cột ngay; bên phải hiển thị PipelineLoader
    setForceConfirmed(false)
    setDuplicate(null)

    // Tiến trình hiển thị (PipelineLoader). WS /ws/progress BE có thể chưa có nên
    // dùng giả lập: bật 'running' từng bước, để loader tự "ticking". Không block luồng.
    setPdfProgress([
      { step: 'upload', status: 'running' },
      { step: 'scan', status: 'pending' },
      { step: 'summarize', status: 'pending' },
      { step: 'chunk', status: 'pending' },
      { step: 'embed', status: 'pending' },
      { step: 'store', status: 'pending' },
    ])

    const clientId = 'client-' + Math.random().toString(36).substring(2, 9)

    // Cố mở WS để nhận progress thật nếu BE đã hỗ trợ; lỗi thì bỏ qua (giả lập).
    let socket: WebSocket | null = null
    try {
      const wsBase = config.aiBaseUrl.replace(/^http/, 'ws')
      socket = new WebSocket(`${wsBase}/ws/progress/${clientId}`)
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setPdfProgress((prev) =>
            prev.map((item) =>
              item.step === data.step ? { ...item, status: data.status, error: data.error } : item
            )
          )
        } catch {
          /* ignore parse errors */
        }
      }
      socket.onerror = () => { /* WS chưa sẵn — dùng giả lập */ }
    } catch {
      socket = null
    }

    // Giả lập tiến trình các bước trước khi /preview trả về (không block API).
    const fakeOrder = ['upload', 'scan', 'summarize']
    let fakeIdx = 0
    const ticker = setInterval(() => {
      if (fakeIdx >= fakeOrder.length - 1) return
      setPdfProgress((prev) => {
        const cur = fakeOrder[fakeIdx]
        const next = fakeOrder[fakeIdx + 1]
        return prev.map((item) => {
          if (item.step === cur) return { ...item, status: 'completed' }
          if (item.step === next) return { ...item, status: 'running' }
          return item
        })
      })
      fakeIdx++
    }, 1400)

    try {
      const res = await lawAiApi.previewLaw(file, clientId, vbplUrl)
      setCompare(res.compare || null)

      // Trích xuất xong -> đánh dấu các bước phân tích hoàn tất.
      setPdfProgress((prev) =>
        prev.map((item) =>
          ['upload', 'scan', 'summarize'].includes(item.step)
            ? { ...item, status: 'completed' }
            : item
        )
      )

      const f = res.fields
      setTitle(f.title || '')
      setDocumentNumber(f.official_code || '')
      setIssuedDate(normalizeDate(f.issue_date))
      setEffectiveDate(normalizeDate(f.effective_date))
      setPreviewFields({
        ...f,
        doc_type: normalizeDocType(f.doc_type),
        issue_date: normalizeDate(f.issue_date),
        effective_date: normalizeDate(f.effective_date),
      })
      setPreviewClientId(res.client_id || clientId)
      setCloudinaryUrl(res.cloudinary_url || '')
      setSourceUrl(res.cloudinary_url || '')
      setSummary(res.summary || '')
      setContent(res.summary || '')
      setDuplicate({
        verdict: res.duplicate?.verdict || 'unique',
        candidates: res.duplicate?.candidates || [],
      })
      setUploadedFile({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      })
    } catch (error: unknown) {
      console.error('Lỗi preview PDF:', error)
      setPdfProgress((prev) =>
        prev.map((item) => (item.status === 'running' ? { ...item, status: 'error' } : item))
      )
      const errorMsg = (error as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string }).response?.data?.error?.message || (error as { response?: { data?: { message?: string } } }).response?.data?.message || (error as { message?: string }).message || 'Có lỗi xảy ra khi xử lý file PDF.'
      alert(errorMsg)
      // Quay về idle để admin thử lại.
      setPhase('idle')
      setUploadedFile(null)
    } finally {
      clearInterval(ticker)
      socket?.close()
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setContent('')
    setSourceUrl('')
    if (!isEdit) {
      // Reset toàn bộ state preview -> quay về box upload.
      setPhase('idle')
      setTitle('')
      setDocumentNumber('')
      setIssuedDate('')
      setEffectiveDate('')
      setSummary('')
      setCloudinaryUrl('')
      setShowPdf(false)
      setPreviewClientId('')
      setPreviewFields(null)
      setDuplicate(null)
      setForceConfirmed(false)
      setPdfProgress([])
      setCompare(null)
      // KHÔNG xoá vbplUrl: admin gỡ PDF để thử lại thường vẫn dùng cùng link.
    }
  }

  // Sẵn sàng confirm khi: đã preview xong + (không nghi trùng HOẶC admin đã bấm "Vẫn tạo").
  const isSuspect = !isEdit && duplicate?.verdict === 'suspect'
  const confirmReady =
    isEdit
      ? true
      : phase === 'preview' && !!previewFields && (!isSuspect || forceConfirmed)

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) {
      if (!title || !documentNumber || !issuedDate || !effectiveDate || !content) {
        alert('Vui lòng điền đầy đủ các thông tin bắt buộc.')
        return
      }
      onSubmit({
        title,
        documentNumber,
        issuedDate,
        effectiveDate,
        sourceUrl,
        officialUrl,
        content,
        changeNote: changeNote || 'Cập nhật tài liệu',
      })
      return
    }

    // ADD-NEW: chỉ confirm khi đã preview xong & qua cảnh báo trùng.
    if (!confirmReady || !previewFields) return
    setPhase('confirming')
    try {
      await onSubmit({
        title,
        documentNumber,
        issuedDate,
        effectiveDate,
        sourceUrl: cloudinaryUrl,
        officialUrl: '',
        content: summary,
        changeNote: 'Khởi tạo văn bản',
        previewClientId,
        previewFields,
        forceConfirmed,
      })
    } catch {
      // Lỗi confirm (vd BE chưa sẵn) -> quay lại preview để admin thử lại.
      setPhase('preview')
    }
  }

  const getSortedVersions = () => {
    if (!law || !law.versions) return []
    return [...law.versions].sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('vi-VN')
  }

  // Render qua PORTAL ở document.body: layout admin (LayoutMain) có backdrop-blur tạo
  // containing block khiến position:fixed bị bó theo khung mờ đó → overlay không phủ hết
  // sidebar/topbar, viền layout lòi ra. Portal đưa modal ra ngoài → fixed bám viewport.
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className='fixed inset-0 z-[200] bg-black'
          />

          {/* Large Centered Form Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-52%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-54%' }}
            exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-52%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='fixed left-1/2 top-1/2 z-[201] w-[95vw] max-w-5xl h-[85vh] bg-background-primary shadow-2xl rounded-2xl flex flex-col border border-border-secondary overflow-hidden'
          >
            {/* Header */}
            <div className='flex items-center justify-between p-5 border-b border-border-secondary bg-background-primary shrink-0'>
              <div>
                <h2 className='text-lg font-bold text-text-primary'>
                  {isEdit ? 'Chỉnh sửa văn bản' : 'Thêm văn bản pháp luật'}
                </h2>
                {isEdit && (
                  <p className='text-xs text-text-description mt-1 font-semibold flex items-center gap-1.5'>
                    <span className='bg-primary text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold'>
                      Phiên bản: {law.versions?.[0]?.version.toUpperCase() || 'V1'}
                    </span>
                    <span className='truncate max-w-[250px]'>{law.title}</span>
                  </p>
                )}
              </div>
              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={onClose}
                className='h-8 w-8 rounded-xl border-border-primary text-text-secondary hover:text-text-primary hover:bg-background-secondary'
              >
                <X className='w-4.5 h-4.5' />
              </Button>
            </div>

            {/* Split Columns Form Container */}
            <form onSubmit={handleFormSubmit} className='flex-1 flex flex-col overflow-hidden bg-background-primary text-text-primary'>
              {/* ===== ADD-NEW (luồng AI preview -> confirm) ===== */}
              {!isEdit && phase === 'idle' ? (
                /* IDLE: 1 box upload chiếm nguyên drawer, chỉ nhận PDF */
                <div className='flex-1 flex items-center justify-center p-8 overflow-y-auto'>
                  <div className='w-full max-w-xl'>
                    {/* Ô link VBPL (tùy chọn) — dán trước, rồi mới chọn PDF. Có link hợp lệ
                        → cào toàn văn từ VBPL (cấu trúc mạnh hơn), PDF để đối chiếu + lưu. */}
                    <div className='mb-5'>
                      <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                        Link VBPL <span className='text-text-tertiary font-semibold normal-case'>(tùy chọn — ưu tiên cào toàn văn)</span>
                      </label>
                      <Input
                        value={vbplUrl}
                        onChange={(e) => setVbplUrl(e.target.value)}
                        placeholder='https://vbpl.vn/van-ban/chi-tiet/...'
                        className={cn(
                          'h-10 text-sm bg-background-secondary/30 border-border-secondary focus:bg-background-primary rounded-xl text-text-primary',
                          vbplUrlError && 'border-error-primary focus:border-error-primary'
                        )}
                      />
                      <p className={cn(
                        'text-[11px] font-semibold mt-1.5',
                        vbplUrlError ? 'text-error-primary' : 'text-text-tertiary'
                      )}>
                        {vbplUrlError
                          ? 'Link không đúng dạng vbpl.vn/van-ban/chi-tiet/...--<mã>. Sửa lại hoặc để trống.'
                          : 'Để trống = nạp từ PDF như thường. Có link hợp lệ = lấy toàn văn từ VBPL, PDF dùng để đối chiếu.'}
                      </p>
                      {/* Tải PDF gốc từ VBPL → khỏi tự tìm file. Văn bản nào không có PDF
                          gốc thì BE báo lỗi, admin tải tay như thường. */}
                      {vbplUrl.trim() && !vbplUrlError && (
                        <Button
                          type='button'
                          variant='outline'
                          onClick={handleFetchVbplPdf}
                          disabled={isFetchingVbplPdf}
                          className='mt-2.5 h-9 text-xs font-bold rounded-xl border-primary/40 text-primary hover:bg-primary/5 flex items-center gap-2'
                        >
                          {isFetchingVbplPdf
                            ? <Loader2 className='w-4 h-4 animate-spin' />
                            : <UploadCloud className='w-4 h-4' />}
                          {isFetchingVbplPdf ? 'Đang tải PDF từ VBPL...' : 'Tải PDF gốc từ VBPL'}
                        </Button>
                      )}
                    </div>
                    <div className='flex items-center gap-3 my-4'>
                      <div className='flex-1 h-px bg-border-secondary' />
                      <span className='text-[10px] font-bold text-text-tertiary uppercase'>hoặc</span>
                      <div className='flex-1 h-px bg-border-secondary' />
                    </div>
                    <h3 className='text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4 text-center'>
                      Tải lên văn bản pháp luật (PDF)
                    </h3>
                    <div className='border-2 border-dashed border-border-secondary hover:border-primary/50 transition-all rounded-2xl p-12 bg-background-secondary/20 flex flex-col items-center justify-center gap-3 relative group min-h-[320px]'>
                      <input
                        type='file'
                        accept='.pdf,application/pdf'
                        onChange={handlePreviewUpload}
                        className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                      />
                      <UploadCloud className='w-12 h-12 text-text-tertiary group-hover:text-primary transition-all' />
                      <span className='text-sm font-bold text-text-secondary text-center'>
                        Kéo thả file .pdf vào đây hoặc click để chọn
                      </span>
                      <span className='text-[11px] text-text-tertiary font-semibold text-center max-w-sm'>
                        Hệ thống sẽ tự trích xuất số hiệu, tiêu đề, ngày tháng và tóm tắt sơ bộ để bạn kiểm tra trước khi tạo. Chấp nhận PDF tối đa 20MB.
                      </span>
                    </div>
                  </div>
                </div>
              ) : !isEdit ? (
                /* PREVIEW / CONFIRMING: 2 cột (trái = thông tin lock + card PDF + tóm tắt; phải = tiến trình) */
                <div className='flex-1 flex overflow-hidden'>
                  {/* Cột trái */}
                  <div className='flex-1 overflow-y-auto p-6 space-y-6 border-r border-border-secondary text-left'>
                    <h3 className='text-xs font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-2'>
                      Thông tin chi tiết
                      <span className='inline-flex items-center gap-1 text-[10px] font-bold text-text-tertiary normal-case tracking-normal bg-background-secondary/60 border border-border-secondary rounded-full px-2 py-0.5'>
                        <Pencil className='w-3 h-3' /> Tự động điền · có thể sửa lại
                      </span>
                    </h3>

                    {/* Tiêu đề — CHO SỬA TAY. Đồng bộ previewFields để bước confirm gửi
                        đúng giá trị admin nhập (BE đọc previewFields, không đọc state rời). */}
                    <div>
                      <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                        Tiêu đề văn bản <span className='text-primary'>*</span>
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value)
                          setPreviewFields((prev) =>
                            prev ? { ...prev, title: e.target.value } : prev
                          )
                        }}
                        placeholder='Đang trích xuất...'
                        className='h-10 text-sm bg-background-secondary/30 border-border-secondary focus:bg-background-primary rounded-xl text-text-primary'
                      />
                    </div>

                    {/* Số hiệu & Ngày ban hành — CHO SỬA TAY (sync previewFields) */}
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                          Số hiệu <span className='text-primary'>*</span>
                        </label>
                        <Input
                          value={documentNumber}
                          onChange={(e) => {
                            setDocumentNumber(e.target.value)
                            setPreviewFields((prev) =>
                              prev ? { ...prev, official_code: e.target.value } : prev
                            )
                          }}
                          placeholder='—'
                          className='h-10 text-sm bg-background-secondary/30 border-border-secondary focus:bg-background-primary rounded-xl text-text-primary'
                        />
                      </div>
                      <div>
                        <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                          Ngày ban hành <span className='text-primary'>*</span>
                        </label>
                        <Input
                          type='date'
                          value={issuedDate}
                          onChange={(e) => {
                            setIssuedDate(e.target.value)
                            setPreviewFields((prev) =>
                              prev ? { ...prev, issue_date: e.target.value } : prev
                            )
                          }}
                          className='h-10 text-sm bg-background-secondary/30 border-border-secondary focus:bg-background-primary rounded-xl text-text-primary'
                        />
                      </div>
                    </div>

                    {/* Ngày hiệu lực — CHO SỬA TAY: LLM hay đọc trượt/để trống ngày hiệu
                        lực (nằm cuối văn bản), admin chỉnh trực tiếp. Đồng bộ previewFields
                        để bước confirm gửi đúng giá trị admin nhập. */}
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                          Ngày hiệu lực <span className='text-primary'>*</span>
                        </label>
                        <Input
                          type='date'
                          value={effectiveDate}
                          onChange={(e) => {
                            setEffectiveDate(e.target.value)
                            setPreviewFields((prev) =>
                              prev ? { ...prev, effective_date: e.target.value } : prev
                            )
                          }}
                          className='h-10 text-sm bg-background-secondary/30 border-border-secondary focus:bg-background-primary rounded-xl text-text-primary'
                        />
                      </div>
                      {/* Loại văn bản — CHO SỬA TAY (sync previewFields). LLM suy từ ký
                          hiệu nên hay đúng, nhưng admin chỉnh được nếu lệch. */}
                      <div>
                        <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                          Loại văn bản <span className='text-primary'>*</span>
                        </label>
                        <Select
                          value={previewFields?.doc_type || undefined}
                          onValueChange={(v) =>
                            setPreviewFields((prev) => (prev ? { ...prev, doc_type: v } : prev))
                          }
                        >
                          <SelectTrigger className='h-10 text-sm bg-background-secondary/30 border-border-secondary focus:bg-background-primary rounded-xl text-text-primary'>
                            <SelectValue placeholder='Chọn loại văn bản' />
                          </SelectTrigger>
                          {/* z-[210] > drawer z-[201]: dropdown portal mặc định z-50 sẽ
                              chui xuống dưới drawer → nâng lên trên. side=bottom +
                              avoidCollisions=false: ÉP luôn mở XUỐNG dưới (radix mặc định
                              tự lật lên khi gần cuối màn → tắt). */}
                          <SelectContent
                            className='z-[210]'
                            position='popper'
                            side='bottom'
                            avoidCollisions={false}
                          >
                            {DOC_TYPE_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Card PDF (dưới phần thông tin) */}
                    {uploadedFile && (
                      <div className='border border-success-primary/20 bg-success-primary/5 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm'>
                        <div className='flex items-center gap-3 overflow-hidden'>
                          <div className='w-10 h-10 rounded-xl bg-success-primary/10 text-success-primary flex items-center justify-center shrink-0 border border-success-primary/15'>
                            <FileText className='w-5 h-5' />
                          </div>
                          <div className='flex flex-col gap-0.5 min-w-0 text-left'>
                            <span className='text-xs font-bold text-text-primary truncate'>
                              {uploadedFile.name}
                            </span>
                            <span className='text-[10px] text-text-tertiary font-semibold'>
                              {uploadedFile.size}
                              {cloudinaryUrl ? ' • Đã tải lên Cloudinary' : ''}
                            </span>
                          </div>
                        </div>
                        <div className='flex items-center gap-1.5 shrink-0'>
                          {cloudinaryUrl && (
                            <button
                              type='button'
                              onClick={() => setShowPdf((v) => !v)}
                              className='h-8 px-2.5 flex items-center text-[10px] font-bold text-primary border border-border-primary rounded-xl hover:bg-background-secondary'
                            >
                              {showPdf ? 'Ẩn PDF' : 'Xem PDF'}
                            </button>
                          )}
                          <Button
                            type='button'
                            variant='outline'
                            size='icon'
                            onClick={handleRemoveFile}
                            disabled={phase === 'confirming'}
                            className='h-8 w-8 text-error-primary hover:text-error-secondary border-border-primary hover:bg-error-primary/5 rounded-xl'
                          >
                            <Trash2 className='w-4.5 h-4.5' />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* PDF inline viewer — xem ngay tại chỗ, không tải về */}
                    {uploadedFile && cloudinaryUrl && showPdf && (
                      <div className='border border-border-secondary rounded-2xl overflow-hidden bg-background-secondary/20'>
                        <iframe
                          src={`${cloudinaryUrl}#toolbar=1&navpanes=0`}
                          title='Xem PDF văn bản'
                          className='w-full h-[480px]'
                        />
                      </div>
                    )}

                    {/* Đối chiếu VBPL ↔ PDF (chỉ hiện khi dán link VBPL). Cảnh báo, không chặn. */}
                    {compare && <VbplCompare compare={compare} />}

                    {/* Cảnh báo trùng — đặt TRƯỚC tóm tắt để admin thấy ngay, quyết sớm */}
                    {isSuspect && !forceConfirmed && (
                      <DuplicateWarning
                        candidates={duplicate?.candidates || []}
                        onForceCreate={() => setForceConfirmed(true)}
                        onCancel={handleRemoveFile}
                      />
                    )}

                    {/* Tóm tắt sơ bộ (read-only) */}
                    <div>
                      <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                        Tóm tắt sơ bộ
                      </label>
                      <div className='bg-background-secondary/20 border border-border-secondary rounded-2xl p-4 max-h-72 overflow-y-auto'>
                        {summary ? (
                          <MarkdownPreview content={summary} />
                        ) : (
                          <p className='text-[11px] text-text-tertiary font-semibold italic'>
                            Đang tạo tóm tắt sơ bộ...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: tiến trình */}
                  <div className='w-[420px] bg-background-secondary/25 p-6 flex flex-col gap-4 overflow-y-auto shrink-0 text-left border-l border-border-secondary'>
                    <h3 className='text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1'>
                      Tiến trình xử lý
                    </h3>
                    <PipelineLoader filename={uploadingFileName || 'document.pdf'} pdfProgress={pdfProgress} />
                  </div>
                </div>
              ) : (
              <div className='flex-1 flex overflow-hidden'>
                {/* Left Column: Form Inputs */}
                <div className='flex-1 overflow-y-auto p-6 space-y-6 border-r border-border-secondary text-left'>
                  {/* Lịch sử phiên bản (Chỉ hiện khi Edit) */}
                  {isEdit && law.versions && law.versions.length > 0 && (
                    <div className='bg-background-secondary/40 rounded-2xl border border-border-secondary overflow-hidden mb-6'>
                      <button
                        type='button'
                        onClick={() => setShowVersions(!showVersions)}
                        className='w-full flex items-center justify-between p-4 text-xs font-bold text-text-secondary hover:bg-background-secondary/60 transition-all'
                      >
                        <div className='flex items-center gap-2'>
                          <span>LỊCH SỬ PHIÊN BẢN</span>
                          <span className='bg-background-secondary text-text-secondary border border-border-secondary px-1.5 py-0.5 rounded-lg text-[10px] font-extrabold'>
                            {law.versions.length}
                          </span>
                        </div>
                        {showVersions ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
                      </button>

                      <AnimatePresence>
                        {showVersions && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className='overflow-hidden border-t border-border-secondary divide-y divide-border-secondary max-h-48 overflow-y-auto'
                          >
                            {getSortedVersions().map((ver) => (
                              <div key={ver.id} className='flex items-center justify-between p-3.5 bg-background-primary'>
                                <div className='flex flex-col gap-0.5'>
                                  <span className='text-xs font-bold text-text-primary uppercase'>
                                    {ver.version}
                                  </span>
                                  <span className='text-[10px] text-text-tertiary font-semibold'>
                                    {formatDate(ver.createdAt)} - bởi {ver.authorName}
                                  </span>
                                  {ver.changeNote && (
                                    <span className='text-[11px] text-text-description italic font-medium truncate max-w-[230px]'>
                                      "{ver.changeNote}"
                                    </span>
                                  )}
                                </div>
                                {onRestoreVersion && (
                                  <Button
                                    type='button'
                                    variant='outline'
                                    size='sm'
                                    onClick={() => {
                                      onRestoreVersion(ver)
                                      setShowVersions(false)
                                    }}
                                    className='h-7.5 text-[10px] font-bold rounded-xl flex items-center gap-1 border-border-primary hover:bg-background-secondary'
                                  >
                                    <RotateCcw className='w-3 h-3' />
                                    Phục hồi
                                  </Button>
                                )}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <h3 className='text-xs font-bold text-text-tertiary uppercase tracking-widest'>
                    Thông tin chi tiết
                  </h3>

                  {/* Tiêu đề */}
                  <div>
                    <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                      Tiêu đề văn bản <span className='text-primary'>*</span>
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder='Ví dụ: Luật Đất đai 2024'
                      required
                      className='h-10 text-sm bg-background-secondary/30 border-border-secondary focus:bg-background-primary rounded-xl text-text-primary'
                    />
                  </div>

                  {/* Số hiệu & Ngày ban hành */}
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                        Số hiệu <span className='text-primary'>*</span>
                      </label>
                      <Input
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(e.target.value)}
                        placeholder='Ví dụ: 31/2024/QH15'
                        required
                        className='h-10 text-sm bg-background-secondary/30 border-border-secondary focus:bg-background-primary rounded-xl text-text-primary'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                        Ngày ban hành <span className='text-primary'>*</span>
                      </label>
                      <Input
                        type='date'
                        value={issuedDate}
                        onChange={(e) => setIssuedDate(e.target.value)}
                        required
                        className='h-10 text-sm bg-background-secondary/30 border-border-secondary focus:bg-background-primary rounded-xl text-text-primary'
                      />
                    </div>
                  </div>

                  {/* Ngày hiệu lực & Website URL */}
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                        Ngày hiệu lực <span className='text-primary'>*</span>
                      </label>
                      <Input
                        type='date'
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        required
                        className='h-10 text-sm bg-background-secondary/30 border-border-secondary focus:bg-background-primary rounded-xl text-text-primary'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                        Website chính thức (URL)
                      </label>
                      <Input
                        type='url'
                        value={officialUrl}
                        onChange={(e) => setOfficialUrl(e.target.value)}
                        placeholder='https://...'
                        className='h-10 text-sm bg-background-secondary/30 border-border-secondary focus:bg-background-primary rounded-xl text-text-primary'
                      />
                    </div>
                  </div>

                  {isEdit && (
                    <div>
                      <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                        Đường dẫn tài liệu PDF (URL)
                      </label>
                      <Input
                        type='url'
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        placeholder='https://...'
                        className='h-10 text-sm bg-background-secondary/30 border-border-secondary focus:bg-background-primary rounded-xl text-text-primary'
                      />
                    </div>
                  )}

                  {/* Ghi chú thay đổi (Chỉ hiện khi Edit) */}
                  {isEdit && (
                    <div className='pt-4 border-t border-border-secondary space-y-4'>
                      <div>
                        <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                          Ghi chú thay đổi <span className='text-primary'>*</span>
                        </label>
                        <Input
                          value={changeNote}
                          onChange={(e) => setChangeNote(e.target.value)}
                          placeholder='Mô tả tóm tắt nội dung chỉnh sửa mới...'
                          required={isEdit}
                          className='h-10 text-sm bg-background-secondary/30 border-border-secondary focus:bg-background-primary rounded-xl text-text-primary'
                        />
                      </div>

                      {/* Warning box */}
                      <div className='flex gap-3 bg-warning-primary/10 p-4 rounded-xl border border-warning-primary/20'>
                        <Info className='w-4.5 h-4.5 text-warning-secondary shrink-0 mt-0.5' />
                        <p className='text-[11px] text-warning-secondary leading-normal font-semibold'>
                          Một version mới sẽ được tạo khi lưu thay đổi để đảm bảo tính toàn vẹn của lịch sử pháp lý.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Upload / Content Input */}
                <div className='w-[420px] bg-background-secondary/25 p-6 flex flex-col gap-4 overflow-y-auto shrink-0 text-left border-l border-border-secondary'>
                  <h3 className='text-xs font-bold text-text-tertiary uppercase tracking-widest mb-1'>
                    Tài liệu & Nội dung
                  </h3>

                  {isEdit && (
                    /* Edit mode: Option switcher for text/docx input */
                    <div className='flex gap-1.5 bg-background-secondary/40 p-1 rounded-xl w-fit border border-border-secondary/30 mb-2'>
                      <button
                        type='button'
                        onClick={() => setEditSourceType('text')}
                        className={cn(
                          'px-3.5 py-1.5 text-[10px] font-bold rounded-lg transition-all focus:outline-none',
                          editSourceType === 'text'
                            ? 'bg-background-primary text-primary shadow-sm border border-border-secondary/20'
                            : 'text-text-secondary hover:text-text-primary'
                        )}
                      >
                        Nhập trực tiếp
                      </button>
                      <button
                        type='button'
                        onClick={() => setEditSourceType('docx')}
                        className={cn(
                          'px-3.5 py-1.5 text-[10px] font-bold rounded-lg transition-all focus:outline-none',
                          editSourceType === 'docx'
                            ? 'bg-background-primary text-primary shadow-sm border border-border-secondary/20'
                            : 'text-text-secondary hover:text-text-primary'
                        )}
                      >
                        Tải file Docx
                      </button>
                    </div>
                  )}

                  {(!isEdit || editSourceType === 'docx') ? (
                    <div className='space-y-4 flex-1 flex flex-col min-h-0'>
                      {/* Drag and Drop File Upload Area */}
                      {!uploadedFile && !isUploading ? (
                        <div className='border-2 border-dashed border-border-secondary hover:border-primary/50 transition-all rounded-2xl p-8 bg-background-secondary/20 flex flex-col items-center justify-center gap-2 relative group min-h-[180px] shrink-0'>
                          <input
                            type='file'
                            accept='.docx'
                            onChange={handleEditFileUpload}
                            className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                          />
                          <UploadCloud className='w-8 h-8 text-text-tertiary group-hover:text-primary transition-all' />
                          <span className='text-xs font-bold text-text-secondary text-center'>
                            Kéo thả file .docx vào đây hoặc click để chọn
                          </span>
                          <span className='text-[10px] text-text-tertiary font-semibold'>
                            Chấp nhận định dạng Word (.docx) tối đa 20MB
                          </span>
                        </div>
                      ) : isUploading ? (
                        isPdfUpload ? (
                          <PipelineLoader filename={uploadingFileName || 'document.pdf'} pdfProgress={pdfProgress} />
                        ) : (
                          <div className='border border-border-secondary rounded-2xl p-8 bg-background-secondary/20 flex flex-col items-center justify-center gap-3 min-h-[180px] shrink-0'>
                            <Loader2 className='w-6 h-6 text-primary animate-spin' />
                            <span className='text-xs font-bold text-text-secondary animate-pulse text-center'>
                              Đang tải lên và trích xuất dữ liệu điều khoản...
                            </span>
                          </div>
                        )
                      ) : (
                        <div className='border border-success-primary/20 bg-success-primary/5 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm shrink-0'>
                          <div className='flex items-center gap-3 overflow-hidden'>
                            <div className='w-10 h-10 rounded-xl bg-success-primary/10 text-success-primary flex items-center justify-center shrink-0 border border-success-primary/15'>
                              <FileText className='w-5 h-5' />
                            </div>
                            <div className='flex flex-col gap-0.5 min-w-0 text-left'>
                              <span className='text-xs font-bold text-text-primary truncate'>
                                {uploadedFile?.name}
                              </span>
                              <span className='text-[10px] text-text-tertiary font-semibold'>
                                Dung lượng: {uploadedFile?.size} • Đã trích xuất thành công
                              </span>
                            </div>
                          </div>
                          <Button
                            type='button'
                            variant='outline'
                            size='icon'
                            onClick={handleRemoveFile}
                            className='h-8 w-8 text-error-primary hover:text-error-secondary border-border-primary hover:bg-error-primary/5 rounded-xl shrink-0'
                          >
                            <Trash2 className='w-4.5 h-4.5' />
                          </Button>
                        </div>
                      )}

                      {uploadedFile && (
                        <div className='flex-1 flex flex-col min-h-0 bg-background-secondary/20 border border-border-secondary rounded-2xl p-4'>
                          <div className='flex items-center justify-between mb-3 shrink-0'>
                            <span className='text-xs font-bold text-text-primary uppercase tracking-wider'>
                              Xem trước nội dung đã trích xuất
                            </span>
                            <div className='flex bg-background-secondary p-0.5 rounded-lg border border-border-secondary/60 shadow-sm shrink-0'>
                              <button
                                type='button'
                                onClick={() => setPreviewMode('preview')}
                                className={cn(
                                  'px-2.5 py-1 text-[10px] font-bold rounded-md transition-all',
                                  previewMode === 'preview'
                                    ? 'bg-background-primary text-primary shadow-sm'
                                    : 'text-text-tertiary hover:text-text-secondary'
                                )}
                              >
                                Xem trước
                              </button>
                              <button
                                type='button'
                                onClick={() => setPreviewMode('edit')}
                                className={cn(
                                  'px-2.5 py-1 text-[10px] font-bold rounded-md transition-all',
                                  previewMode === 'edit'
                                    ? 'bg-background-primary text-primary shadow-sm'
                                    : 'text-text-tertiary hover:text-text-secondary'
                                )}
                              >
                                Chỉnh sửa
                              </button>
                            </div>
                          </div>
                          <div className='flex-1 overflow-y-auto bg-background-primary border border-border-secondary rounded-xl p-4 min-h-[300px]'>
                            {previewMode === 'preview' ? (
                              <MarkdownPreview content={content} />
                            ) : (
                              <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className='w-full h-full text-xs font-mono bg-transparent border-0 focus:outline-none text-text-primary resize-none leading-relaxed'
                                placeholder='Nội dung trích xuất sẽ hiển thị ở đây...'
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Edit mode: Text input editor */
                    <div className='flex-1 flex flex-col min-h-0'>
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder='Nhập chi tiết các chương, điều khoản của văn bản pháp quy...'
                        required
                        className='w-full flex-1 min-h-[300px] p-3.5 text-xs bg-background-secondary/20 border border-border-secondary rounded-xl text-text-primary resize-none font-medium outline-none leading-relaxed'
                      />
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Footer Actions */}
              <div className='p-5 border-t border-border-secondary bg-background-secondary/30 flex items-center justify-end gap-3 shrink-0'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={onClose}
                  className='h-11 border-border-primary text-text-primary px-6 font-semibold text-sm rounded-xl hover:bg-background-secondary transition-all'
                >
                  Hủy
                </Button>
                <Button
                  type='submit'
                  disabled={(!isEdit && !confirmReady) || phase === 'confirming'}
                  className='h-11 bg-primary text-white hover:opacity-90 px-6 font-semibold text-sm rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                >
                  {phase === 'confirming' && <Loader2 className='w-4 h-4 animate-spin' />}
                  {isEdit ? 'Lưu thay đổi' : phase === 'confirming' ? 'Đang nạp KB...' : 'Tạo văn bản'}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}

// Bảng đối chiếu text cào VBPL ↔ metadata LLM rút từ PDF (số hiệu/loại/tên). CHỈ cảnh
// báo: metadata PDF scan hay sai nên lệch không có nghĩa văn bản sai; nguồn chân lý =
// VBPL. Admin nhìn để yên tâm "đúng văn bản" trước khi xác nhận.
const FIELD_LABELS: Record<CompareCheck['field'], string> = {
  official_code: 'Số hiệu',
  doc_type: 'Loại văn bản',
  title: 'Tên văn bản',
}

const VbplCompare: React.FC<{ compare: CompareReport }> = ({ compare }) => {
  // VBPL fetch lỗi → BE lùi về PDF; báo cho admin biết toàn văn dùng PDF (không cào).
  if (compare.error) {
    return (
      <div className='flex gap-3 bg-warning-primary/10 p-4 rounded-2xl border border-warning-primary/20'>
        <AlertTriangle className='w-4.5 h-4.5 text-warning-secondary shrink-0 mt-0.5' />
        <div className='text-[11px] text-warning-secondary leading-normal font-semibold'>
          <p className='font-bold mb-0.5'>Không lấy được dữ liệu từ VBPL</p>
          <p>{compare.error}</p>
          <p className='mt-1 text-text-tertiary'>Hệ thống sẽ nạp từ PDF như thường.</p>
        </div>
      </div>
    )
  }

  const allMatch = compare.overall_match
  return (
    <div className={cn(
      'rounded-2xl border p-4',
      allMatch
        ? 'bg-success-primary/5 border-success-primary/20'
        : 'bg-warning-primary/5 border-warning-primary/20'
    )}>
      <div className='flex items-center gap-2 mb-3'>
        <Link2 className='w-4 h-4 text-primary' />
        <span className='text-xs font-bold text-text-primary uppercase tracking-wide'>
          Đối chiếu VBPL ↔ PDF
        </span>
        <span className={cn(
          'ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full',
          allMatch
            ? 'bg-success-primary/10 text-success-primary'
            : 'bg-warning-primary/10 text-warning-secondary'
        )}>
          {allMatch ? 'Khớp' : 'Có điểm lệch'}
        </span>
      </div>
      <div className='space-y-2'>
        {compare.checks.map((c) => (
          <div key={c.field} className='flex items-start gap-2 text-[11px]'>
            {c.match
              ? <CheckCircle2 className='w-3.5 h-3.5 text-success-primary shrink-0 mt-0.5' />
              : <AlertTriangle className='w-3.5 h-3.5 text-warning-secondary shrink-0 mt-0.5' />}
            <div className='min-w-0 flex-1'>
              <span className='font-bold text-text-secondary'>{FIELD_LABELS[c.field]}</span>
              {typeof c.score === 'number' && (
                <span className='text-text-tertiary font-semibold'> · {c.score}%</span>
              )}
              <div className='text-text-tertiary font-medium mt-0.5 break-words'>
                <span className='text-primary font-semibold'>VBPL:</span> {c.vbpl || '—'}
              </div>
              {!c.match && (
                <div className='text-text-tertiary font-medium break-words'>
                  <span className='text-text-secondary font-semibold'>PDF:</span> {c.pdf || '—'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {!allMatch && (
        <p className='text-[10px] text-text-tertiary font-semibold mt-3 leading-normal'>
          Lệch không hẳn là sai — metadata đọc từ PDF (nhất là bản scan) thường kém chính xác.
          Toàn văn lấy từ VBPL. Kiểm tra rồi xác nhận nếu đúng văn bản.
        </p>
      )}
    </div>
  )
}
