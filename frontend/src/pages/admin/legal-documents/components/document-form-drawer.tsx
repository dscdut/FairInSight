import React, { useState, useEffect } from 'react'

import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Info, ChevronDown, ChevronUp, RotateCcw, UploadCloud, FileText, Trash2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import config from '@/core/configs/env'
import { cn } from '@/core/lib/utils'
import { lawApi } from '@/core/services/law.service'
import { type Law, type LawVersion } from '@/models/types/law.type'

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
}

interface DocumentFormDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: FormSubmitData) => void
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFileName(file.name)
    const isPdf = file.name.toLowerCase().endsWith('.pdf')
    setIsPdfUpload(isPdf)
    setIsUploading(true)

    if (isPdf) {
      setPdfProgress([
        { step: 'upload', status: 'pending' },
        { step: 'scan', status: 'pending' },
        { step: 'summarize', status: 'pending' },
        { step: 'chunk', status: 'pending' },
        { step: 'embed', status: 'pending' },
        { step: 'store', status: 'pending' },
      ])

      const clientId = 'client-' + Math.random().toString(36).substring(2, 9)
      const aiBase = config.aiBaseUrl || 'http://localhost:8000/api/v1'
      const wsBase = aiBase.replace(/^http/, 'ws')
      const wsUrl = `${wsBase}/ws/progress/${clientId}`
      const socket = new WebSocket(wsUrl)

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setPdfProgress((prev) =>
            prev.map((item) =>
              item.step === data.step
                ? { ...item, status: data.status, error: data.error }
                : item
            )
          )
        } catch (err) {
          console.error('Lỗi WebSocket:', err)
        }
      }

      try {
        // Step 1: Upload to Cloudinary
        setPdfProgress((prev) => prev.map((item) => item.step === 'upload' ? { ...item, status: 'running' } : item))

        const uploadRes = await lawApi.uploadFile(file)
        const secureUrl = uploadRes.url
        setPdfProgress((prev) => prev.map((item) => item.step === 'upload' ? { ...item, status: 'completed' } : item))

        // Step 2: Post to GovDoc Backend
        const importFormData = new FormData()
        importFormData.append('file', file)
        importFormData.append('doc_type', 'luat')
        importFormData.append('clientId', clientId)

        const importRes = await axios.post(
          `${aiBase}/import`,
          importFormData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )

        const text = importRes.data.summary || importRes.data.rawText || 'Đã trích xuất và phân tích thành công tài liệu luật.'

        const extractedTitle = importRes.data.extractedTitle
        const extractedDocumentNumber = importRes.data.extractedDocumentNumber
        const extractedIssuedDate = importRes.data.extractedIssuedDate
        const extractedEffectiveDate = importRes.data.extractedEffectiveDate

        if (extractedTitle) setTitle(extractedTitle)
        if (extractedDocumentNumber) setDocumentNumber(extractedDocumentNumber)
        if (extractedIssuedDate) setIssuedDate(extractedIssuedDate)
        if (extractedEffectiveDate) setEffectiveDate(extractedEffectiveDate)

        setUploadedFile({
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        })
        setContent(text)
        setSourceUrl(secureUrl)
      } catch (error: any) {
        console.error('Lỗi tải file PDF:', error)
        const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Có lỗi xảy ra khi xử lý file PDF.'
        alert(errorMsg)
      } finally {
        socket.close()
        setIsUploading(false)
      }
    } else {
      try {
        // 2. Upload via backend media service
        const uploadRes = await lawApi.uploadFile(file)
        const secureUrl = uploadRes.url

        // 3. Parse docx text content using backend Mammoth integration
        const parseRes = (await lawApi.parseDocx(secureUrl)) as any

        setUploadedFile({
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        })
        setContent(parseRes.text)
        setSourceUrl(secureUrl)
      } catch (error: any) {
        console.error('Lỗi tải file:', error)
        const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Có lỗi xảy ra khi upload hoặc trích xuất văn bản.'
        alert(errorMsg)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setContent('')
    setSourceUrl('')
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
      changeNote: isEdit ? changeNote || 'Cập nhật tài liệu' : 'Khởi tạo văn bản',
    })
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className='fixed inset-0 z-40 bg-black'
          />

          {/* Large Centered Form Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-52%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-54%' }}
            exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-52%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-5xl h-[85vh] bg-background-primary shadow-2xl rounded-2xl flex flex-col border border-border-secondary overflow-hidden'
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
                            accept='.docx,.pdf'
                            onChange={handleFileUpload}
                            className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                          />
                          <UploadCloud className='w-8 h-8 text-text-tertiary group-hover:text-primary transition-all' />
                          <span className='text-xs font-bold text-text-secondary text-center'>
                            Kéo thả file .docx hoặc .pdf vào đây hoặc click để chọn
                          </span>
                          <span className='text-[10px] text-text-tertiary font-semibold'>
                            Chấp nhận định dạng Word (.docx), PDF (.pdf) tối đa 20MB
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
                  className='h-11 bg-primary text-white hover:opacity-90 px-6 font-semibold text-sm rounded-xl transition-all shadow-md active:scale-98'
                >
                  {isEdit ? 'Lưu thay đổi' : 'Tạo văn bản'}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
