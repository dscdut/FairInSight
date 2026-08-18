import React, { useState, useEffect } from 'react'


import { motion, AnimatePresence } from 'framer-motion'
import { X, History, Clock, Save } from 'lucide-react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import config from '@/core/configs/env'
import { lawAiApi } from '@/core/services/law-ai.service'
import { lawApi } from '@/core/services/law.service'
import { type Law, type LawVersion } from '@/models/types/law.type'

import { DOC_TYPE_LABELS } from '../doc-type'

import { DocumentDetailContent, type MetadataDraft } from './document-detail-content'
import { DocumentVersionItem } from './document-version-item'

interface DocumentDetailDrawerProps {
  isOpen: boolean
  onClose: () => void
  law: Law | null
  onRestoreVersion?: (version: LawVersion) => void
  onSaveNewVersion?: (lawId: string, content: string, changeNote: string, sourceUrl?: string) => void
  readOnly?: boolean
  // CHỈ admin: cho phép sửa metadata (tên, số hiệu, ngày, tóm tắt) qua nút bút chì.
  allowMetadataEdit?: boolean
  // Gọi sau khi lưu metadata thành công để parent reload danh sách.
  onMetadataUpdated?: () => void
}

export const DocumentDetailDrawer: React.FC<DocumentDetailDrawerProps> = ({
  isOpen,
  onClose,
  law,
  onRestoreVersion,
  onSaveNewVersion,
  readOnly = false,
  allowMetadataEdit = false,
  onMetadataUpdated,
}) => {
  const [selectedVersion, setSelectedVersion] = useState<LawVersion | null>(null)

  // Inline edit state managed in parent drawer
  const [isEditing, setIsEditing] = useState(false)
  const [editableContent, setEditableContent] = useState('')
  const [newChangeNote, setNewChangeNote] = useState('')
  const [editSourceType, setEditSourceType] = useState<'text' | 'docx'>('text')
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingFileName, setUploadingFileName] = useState('')
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)

  // PDF progress states
  const [isPdfUpload, setIsPdfUpload] = useState(false)
  const [pdfProgress, setPdfProgress] = useState<{
    step: string
    status: 'pending' | 'running' | 'completed' | 'error'
    error?: string
  }[]>([])

  // --- State sửa metadata (admin, nút bút chì) ---
  // isEditingMetadata: đang mở bảng sửa. metadataDraft: bản nháp các field admin gõ.
  // isSavingMetadata: đang gọi API cập nhật.
  const [isEditingMetadata, setIsEditingMetadata] = useState(false)
  const [isSavingMetadata, setIsSavingMetadata] = useState(false)
  const [metadataDraft, setMetadataDraft] = useState<MetadataDraft>({
    title: '',
    documentNumber: '',
    docType: '',
    issuedDate: '',
    effectiveDate: '',
    summary: '',
  })
  // Bản gốc lúc mở bảng sửa — so với draft để biết có thay đổi chưa (bật/tắt nút Lưu).
  const [metadataOriginal, setMetadataOriginal] = useState<MetadataDraft | null>(null)

  // Initialize/reset states when drawer opens or law changes
  useEffect(() => {
    if (isOpen && law && law.versions && law.versions.length > 0) {
      const sorted = [...law.versions].sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
      const initialVer = sorted[0]
      setSelectedVersion(initialVer)
      setEditableContent(initialVer.content || '')
    } else {
      setSelectedVersion(null)
      setEditableContent('')
    }
    setIsEditing(false)
    setNewChangeNote('')
    setEditSourceType('text')
    setUploadedFile(null)
    setIsUploading(false)
    setIsPdfUpload(false)
    setPdfProgress([])
    setSourceUrl(null)
    setIsEditingMetadata(false)
    setIsSavingMetadata(false)
  }, [isOpen, law])

  // Sync state when selectedVersion changes
  useEffect(() => {
    if (selectedVersion) {
      setEditableContent(selectedVersion.content || '')
    }
    setIsEditing(false)
    setNewChangeNote('')
    setEditSourceType('text')
    setUploadedFile(null)
    setIsUploading(false)
    setIsPdfUpload(false)
    setPdfProgress([])
    setSourceUrl(null)
  }, [selectedVersion])

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

  if (!law || !law.versions) return null

  const sortedVersions = [...law.versions].sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
  const latestVersion = sortedVersions[0]
  const isLatest = selectedVersion ? selectedVersion.id === latestVersion.id : true

  // Tên hiển thị đầy đủ = title (tên sạch) + " số " + số hiệu — KHỚP cột "Tên văn bản"
  // ở danh sách (DocumentListRow.displayName). DB lưu title không kèm số hiệu.
  const headerTitle = selectedVersion?.title ?? law.title
  const headerNumber = selectedVersion?.documentNumber ?? law.documentNumber
  const headerDisplayName = headerNumber ? `${headerTitle} số ${headerNumber}` : headerTitle

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays === 1) return 'Hôm qua'
    if (diffDays < 7) return `${diffDays} ngày trước`

    return date.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  // Nhãn loại VB từ doc_type thật (DB). Fallback đoán theo số hiệu/tên cho data cũ
  // chưa có doc_type. Hiển thị badge UPPERCASE ở header.
  const getDocumentTypeLabel = (docType: string, docNum: string, docTitle: string) => {
    const label = docType ? DOC_TYPE_LABELS[docType] : undefined
    if (label) return label.toUpperCase()

    const numLower = (docNum || '').toLowerCase()
    const titleLower = (docTitle || '').toLowerCase()
    if (numLower.includes('tt-') || titleLower.includes('thông tư')) return 'THÔNG TƯ'
    if (numLower.includes('nd-') || numLower.includes('nđ-') || titleLower.includes('nghị định')) return 'NGHỊ ĐỊNH'
    if (numLower.includes('qd-') || numLower.includes('qđ-') || titleLower.includes('quyết định')) return 'QUYẾT ĐỊNH'
    if (numLower.includes('luật') || titleLower.includes('luật')) return 'LUẬT'
    if (numLower.includes('nq-') || titleLower.includes('nghị quyết')) return 'NGHỊ QUYẾT'

    return 'VĂN BẢN PHÁP LUẬT'
  }

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
      const wsBase = config.legalCorpusBaseUrl.replace(/^http/, 'ws')
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
        // Step 1: Preview through the legal corpus gateway.
        setPdfProgress((prev) => prev.map((item) => item.step === 'upload' ? { ...item, status: 'running' } : item))

        const preview = await lawAiApi.previewLaw(file, clientId)
        setSourceUrl(preview.cloudinary_url || null)
        setPdfProgress((prev) =>
          prev.map((item) =>
            ['upload', 'scan', 'summarize'].includes(item.step)
              ? { ...item, status: 'completed' }
              : item
          )
        )

        const text = preview.summary || 'Đã trích xuất và phân tích thành công tài liệu luật.'

        setUploadedFile({
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        })
        setEditableContent(text)
      } catch (error: unknown) {
        console.error('Lỗi tải file PDF:', error)
        const errorMsg = (error as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string }).response?.data?.error?.message || (error as { response?: { data?: { message?: string } } }).response?.data?.message || (error as { message?: string }).message || 'Có lỗi xảy ra khi xử lý file PDF.'
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
        setSourceUrl(secureUrl)

        // 3. Extract text content via Mammoth parser backend API
        const parseRes = await lawApi.parseDocx(secureUrl)

        setUploadedFile({
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        })
        setEditableContent(parseRes.text)
      } catch (error: unknown) {
        console.error('Lỗi tải file:', error)
        const errorMsg = (error as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string }).response?.data?.error?.message || (error as { response?: { data?: { message?: string } } }).response?.data?.message || (error as { message?: string }).message || 'Có lỗi xảy ra khi upload hoặc trích xuất văn bản.'
        alert(errorMsg)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setEditableContent('')
    setSourceUrl(null)
  }

  const handleSave = () => {
    if (!editableContent.trim()) {
      alert('Nội dung văn bản không được để trống.')
      return
    }
    if (!newChangeNote.trim()) {
      alert('Vui lòng nhập ghi chú thay đổi để tạo phiên bản mới.')
      return
    }
    onSaveNewVersion?.(law.id, editableContent, newChangeNote, sourceUrl || undefined)
    setIsEditing(false)
    setNewChangeNote('')
  }

  // Mở bảng sửa metadata: nạp giá trị hiện tại (bản mới nhất) vào nháp.
  // Ngày cắt phần time (yyyy-MM-dd) cho input[type=date].
  const handleStartEditMetadata = () => {
    const t = latestVersion?.title ?? law.title
    const initial: MetadataDraft = {
      title: t || '',
      documentNumber: latestVersion?.documentNumber || law.documentNumber || '',
      docType: law.docType || '',
      issuedDate: (latestVersion?.issuedDate || law.issuedDate || '').split('T')[0],
      effectiveDate: (latestVersion?.effectiveDate || law.effectiveDate || '').split('T')[0],
      summary: latestVersion?.content || law.content || '',
    }
    setMetadataDraft(initial)
    setMetadataOriginal(initial) // mốc so sánh để bật nút Lưu khi có thay đổi
    setIsEditingMetadata(true)
  }

  // Nút Lưu chỉ bật khi draft KHÁC bản gốc (có ít nhất 1 field bị sửa).
  const isMetadataDirty =
    !!metadataOriginal &&
    (Object.keys(metadataDraft) as (keyof MetadataDraft)[]).some(
      (k) => metadataDraft[k] !== metadataOriginal[k]
    )

  const handleCancelMetadata = () => {
    setIsEditingMetadata(false)
  }

  const handleMetadataField = (field: keyof MetadataDraft, value: string) => {
    setMetadataDraft((prev) => ({ ...prev, [field]: value }))
  }

  // Lưu metadata: gọi PATCH /documents/{id}. BE backend_reasoning HIỆN CHƯA CÓ endpoint
  // này → bọc try/catch, báo lỗi thân thiện nếu 404/405 để form không vỡ. Thành công
  // thì đóng bảng + báo parent reload danh sách.
  const handleSaveMetadata = async () => {
    if (!metadataDraft.title.trim()) {
      alert('Tên văn bản không được để trống.')
      return
    }
    setIsSavingMetadata(true)
    try {
      await lawAiApi.updateLaw(law.id, {
        title: metadataDraft.title,
        official_code: metadataDraft.documentNumber,
        doc_type: metadataDraft.docType || undefined,
        issue_date: metadataDraft.issuedDate || undefined,
        effective_date: metadataDraft.effectiveDate || undefined,
        summary: metadataDraft.summary,
      })
      setIsEditingMetadata(false)
      onMetadataUpdated?.()
    } catch (error: unknown) {
      console.error('Lỗi cập nhật văn bản:', error)
      const status = (error as { response?: { status?: number } }).response?.status
      if (status === 404 || status === 405) {
        alert('Chức năng cập nhật văn bản chưa được hỗ trợ trên máy chủ (thiếu endpoint). Vui lòng liên hệ quản trị hệ thống.')
      } else {
        const errorMsg = (error as { response?: { data?: { detail?: string; message?: string } } }).response?.data?.detail || (error as { response?: { data?: { message?: string } } }).response?.data?.message || (error as { message?: string }).message || 'Có lỗi xảy ra khi cập nhật văn bản.'
        alert(errorMsg)
      }
    } finally {
      setIsSavingMetadata(false)
    }
  }

  // Render qua PORTAL ở document.body: layout admin (LayoutMain) có backdrop-blur tạo
  // containing block khiến position:fixed bị tính theo khung mờ đó (bị bó/che) thay vì
  // viewport. Portal đưa drawer ra ngoài → fixed bám đúng viewport, z-index ăn thật.
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

          {/* Large Centered Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-52%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-54%' }}
            exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-52%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='fixed left-1/2 top-1/2 z-[201] w-[95vw] max-w-6xl h-[85vh] bg-background-primary shadow-2xl rounded-2xl flex flex-col border border-border-secondary overflow-hidden'
          >
            {/* Upper Title Header bar */}
            <div className='flex items-center justify-between px-8 py-5 bg-background-primary border-b border-border-secondary'>
              <div className='flex flex-col gap-1 text-left'>
                <h1 className='text-xl font-extrabold text-text-primary leading-tight'>
                  {headerDisplayName}
                </h1>
                <div className='flex items-center gap-4 text-xs mt-1.5'>
                  <span className='inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-[#EBE5FC] text-[#5525CD]'>
                    {getDocumentTypeLabel(law.docType || '', selectedVersion?.documentNumber || law.documentNumber, selectedVersion?.title || law.title)}
                  </span>
                  <div className='flex items-center gap-1.5 text-text-description font-semibold'>
                    <Clock className='w-4 h-4 text-text-tertiary' />
                    <span>Chỉnh sửa cuối: {selectedVersion ? formatTimeAgo(selectedVersion.createdAt) : formatTimeAgo(law.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type='button'
                onClick={onClose}
                className='h-10 w-10 bg-[#0A2540] text-white flex items-center justify-center rounded-lg hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-ring shrink-0'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Split Columns Layout */}
            <div className='flex-1 flex overflow-hidden bg-background-primary'>
              {/* Left Column: Document Body Details */}
              <DocumentDetailContent
                law={law}
                selectedVersion={selectedVersion}
                latestVersion={latestVersion}
                onRestoreVersion={onRestoreVersion}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                editableContent={editableContent}
                setEditableContent={setEditableContent}
                editSourceType={editSourceType}
                setEditSourceType={setEditSourceType}
                uploadedFile={uploadedFile}
                setUploadedFile={setUploadedFile}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
                handleFileUpload={handleFileUpload}
                handleRemoveFile={handleRemoveFile}
                isPdfUpload={isPdfUpload}
                pdfProgress={pdfProgress}
                uploadingFileName={uploadingFileName}
                readOnly={readOnly}
                canEditMetadata={allowMetadataEdit}
                isEditingMetadata={isEditingMetadata}
                onStartEditMetadata={handleStartEditMetadata}
                onCancelMetadata={handleCancelMetadata}
                onSaveMetadata={handleSaveMetadata}
                isSavingMetadata={isSavingMetadata}
                isMetadataDirty={isMetadataDirty}
                metadataDraft={metadataDraft}
                setMetadataField={handleMetadataField}
              />

              {/* Right Column: Version Timeline Sidebar */}
              <div className='w-[350px] bg-[#F4F6F8] dark:bg-background-secondary/30 flex flex-col overflow-hidden border-l border-border-secondary shrink-0'>
                {/* Header */}
                <div className='p-6 pb-3 border-b border-border-secondary shrink-0 flex items-center justify-between'>
                  <div className='flex items-center gap-2 text-left'>
                    <History className='w-4.5 h-4.5 text-text-secondary' />
                    <h3 className='text-sm font-bold text-text-primary'>Lịch sử phiên bản</h3>
                  </div>
                  <span className='bg-[#0D3880] text-white px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0'>
                    {law.versions.length} BẢN
                  </span>
                </div>

                {/* Timeline List */}
                <div className='flex-1 overflow-y-auto p-6 flex flex-col gap-4'>
                  {sortedVersions.map((ver) => (
                    <DocumentVersionItem
                      key={ver.id}
                      ver={ver}
                      latestVersion={latestVersion}
                      selectedVersion={selectedVersion}
                      setSelectedVersion={setSelectedVersion}
                      onRestoreVersion={onRestoreVersion}
                      readOnly={readOnly}
                    />
                  ))}
                </div>

                {/* Fixed Change Note Card at Bottom of Sidebar */}
                <div className='p-6 border-t border-border-secondary bg-[#F4F6F8] dark:bg-background-secondary/35 shrink-0 text-left'>
                  <h4 className='text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2'>
                    GHI CHÚ THAY ĐỔI
                  </h4>
                  {isLatest && isEditing ? (
                    <div className='flex flex-col gap-3'>
                      <textarea
                        value={newChangeNote}
                        onChange={(e) => setNewChangeNote(e.target.value)}
                        className='w-full min-h-[60px] p-2.5 text-xs bg-white dark:bg-background-primary border border-border-secondary rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-text-primary placeholder-text-tertiary resize-none font-medium'
                        placeholder='Mô tả tóm tắt nội dung chỉnh sửa mới...'
                      />
                      <div className='flex items-center justify-end gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            setIsEditing(false)
                            if (selectedVersion) {
                              setEditableContent(selectedVersion.content || '')
                            }
                            setNewChangeNote('')
                          }}
                          className='h-7.5 rounded-lg border-border-primary text-text-secondary hover:bg-background-secondary transition-all text-[10px] font-bold'
                        >
                          Hủy bỏ
                        </Button>
                        <Button
                          size='sm'
                          onClick={handleSave}
                          disabled={!newChangeNote.trim() || editableContent.trim() === (selectedVersion?.content || law.content).trim()}
                          className='h-7.5 bg-[#0A2540] hover:bg-[#0A2540]/90 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5 transition-all text-[10px] font-bold border-none shadow-sm px-3'
                        >
                          <Save className='w-3 h-3' />
                          Lưu bản mới
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className='text-[11px] text-text-secondary font-medium italic min-h-[30px] whitespace-pre-wrap leading-relaxed bg-white dark:bg-background-primary p-2.5 rounded-lg border border-border-secondary/60'>
                      {selectedVersion?.changeNote 
                        ? `"${selectedVersion.changeNote}"` 
                        : 'Không có ghi chú thay đổi cho phiên bản này.'
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
