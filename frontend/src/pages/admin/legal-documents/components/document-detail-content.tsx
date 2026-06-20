import React, { useState, useEffect } from 'react'

import { Info, Globe, FileDown, Edit3, Eye, UploadCloud, FileText, Trash2, Loader2, Pencil, Save, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/core/lib/utils'
import { type Law, type LawVersion } from '@/models/types/law.type'

import { MarkdownPreview } from './markdown-preview'
import { PipelineLoader } from './pipeline-loader'

// Giá trị metadata văn bản admin có thể sửa (chỉ chữ — không xoá). Khớp các field
// mà form import nhập: tên, số hiệu, ngày ban hành, ngày hiệu lực, tóm tắt.
export interface MetadataDraft {
  title: string
  documentNumber: string
  issuedDate: string
  effectiveDate: string
  summary: string
}

interface DocumentDetailContentProps {
  law: Law
  selectedVersion: LawVersion | null
  latestVersion: LawVersion
  onRestoreVersion?: (version: LawVersion) => void
  isEditing: boolean
  setIsEditing: (val: boolean) => void
  editableContent: string
  setEditableContent: (val: string) => void
  editSourceType: 'text' | 'docx'
  setEditSourceType: (val: 'text' | 'docx') => void
  uploadedFile: { name: string; size: string } | null
  setUploadedFile: (val: { name: string; size: string } | null) => void
  isUploading: boolean
  setIsUploading: (val: boolean) => void
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRemoveFile: () => void
  isPdfUpload?: boolean
  pdfProgress?: {
    step: string
    status: 'pending' | 'running' | 'completed' | 'error'
    error?: string
  }[]
  uploadingFileName?: string
  readOnly?: boolean
  // --- Sửa metadata (admin) ---
  // canEditMetadata: cho phép hiện nút bút chì (admin). isEditingMetadata: đang mở
  // bảng sửa. metadataDraft + setMetadataField: form sửa các field. onSaveMetadata /
  // onCancelMetadata / isSavingMetadata: lưu/huỷ + trạng thái đang lưu.
  canEditMetadata?: boolean
  isEditingMetadata?: boolean
  onStartEditMetadata?: () => void
  onCancelMetadata?: () => void
  onSaveMetadata?: () => void
  isSavingMetadata?: boolean
  metadataDraft?: MetadataDraft
  setMetadataField?: (field: keyof MetadataDraft, value: string) => void
}

export const DocumentDetailContent: React.FC<DocumentDetailContentProps> = ({
  law,
  selectedVersion,
  latestVersion,
  onRestoreVersion,
  isEditing,
  setIsEditing,
  editableContent,
  setEditableContent,
  editSourceType,
  setEditSourceType,
  uploadedFile,
  isUploading,
  handleFileUpload,
  handleRemoveFile,
  isPdfUpload = false,
  pdfProgress = [],
  uploadingFileName = '',
  readOnly = false,
  canEditMetadata = false,
  isEditingMetadata = false,
  onStartEditMetadata,
  onCancelMetadata,
  onSaveMetadata,
  isSavingMetadata = false,
  metadataDraft,
  setMetadataField,
}) => {
  const currentContent = selectedVersion ? selectedVersion.content : law.content
  const currentTitle = selectedVersion ? selectedVersion.title : law.title
  const officialUrl = selectedVersion?.officialUrl || law.officialUrl
  const pdfUrl = selectedVersion?.sourceUrl || law.sourceUrl

  const isLatest = selectedVersion ? selectedVersion.id === latestVersion.id : true

  // Check if docx (text content) exists
  const hasDocx = !!currentContent && currentContent.trim().length > 15 // Avoid short OCR placeholders
  
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('preview')

  // Viewing mode: 'docx' or 'pdf'
  const [viewMode, setViewMode] = useState<'docx' | 'pdf'>('docx')

  // Auto fallback/adjust when document changes
  useEffect(() => {
    if (!hasDocx) {
      setViewMode('pdf')
    } else {
      setViewMode('docx')
    }
  }, [hasDocx, selectedVersion])

  const renderDocumentContent = (text: string) => {
    if (!text) return null
    return <MarkdownPreview content={text} />
  }

  // Khi nhúng PDF, ẩn cột thumbnail/bookmark bên trái của trình xem PDF (chỉ hiện văn bản).
  // #pagemode=none: tắt panel trái; toolbar=1 giữ thanh điều khiển phải để cuộn/zoom.
  const getInlinePdfUrl = (url: string) => {
    if (!url) return ''
    const hashFragment = 'pagemode=none&toolbar=1&navpanes=0'
    return url.includes('#') ? url : `${url}#${hashFragment}`
  }

  return (
    <div className='flex-1 flex flex-col overflow-hidden bg-background-primary border-r border-border-secondary text-left'>
      {/* Scrollable Document Content Area */}
      <div className='flex-1 overflow-y-auto px-10 py-8'>
        <div className='max-w-2xl mx-auto w-full pb-6'>
          {/* Preview Banner if viewing old version */}
          {selectedVersion && selectedVersion.id !== latestVersion.id && (
            <div className='bg-warning-primary/10 border-l-4 border-warning-primary p-4.5 rounded-r-xl mb-8 flex items-center justify-between shadow-sm'>
              <div className='text-xs font-semibold text-warning-secondary text-left'>
                Đang xem phiên bản cũ:{' '}
                <strong className='font-bold uppercase'>{selectedVersion.version}</strong> (Ban hành:{' '}
                {new Date(selectedVersion.createdAt).toLocaleDateString('vi-VN')})
              </div>
              {!readOnly && onRestoreVersion && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => onRestoreVersion(selectedVersion)}
                  className='h-8 text-[11px] font-bold rounded-xl border-warning-secondary/40 text-warning-secondary hover:bg-warning-primary/20 shrink-0'
                >
                  Khôi phục bản này
                </Button>
              )}
            </div>
          )}

          {/* Bảng SỬA metadata văn bản (admin) — hiện thay cho header khi bật chế độ
              sửa. Style input giống form import (Input/Textarea). Admin chỉ sửa chữ. */}
          {isEditingMetadata && metadataDraft ? (
            <div className='mb-6 pb-6 border-b border-border-secondary/60 space-y-4'>
              <div className='flex items-center justify-between gap-3'>
                <h2 className='text-sm font-bold text-text-primary uppercase tracking-wider'>
                  Sửa thông tin văn bản
                </h2>
                <div className='flex items-center gap-2 shrink-0'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={onCancelMetadata}
                    disabled={isSavingMetadata}
                    className='h-8.5 rounded-xl border-border-primary text-text-secondary hover:text-text-primary flex items-center gap-1.5 text-xs font-bold'
                  >
                    <X className='w-3.5 h-3.5' />
                    Huỷ
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    onClick={onSaveMetadata}
                    disabled={isSavingMetadata}
                    className='h-8.5 bg-primary text-white hover:opacity-90 rounded-xl flex items-center gap-1.5 text-xs font-bold disabled:opacity-50'
                  >
                    {isSavingMetadata ? <Loader2 className='w-3.5 h-3.5 animate-spin' /> : <Save className='w-3.5 h-3.5' />}
                    Lưu
                  </Button>
                </div>
              </div>

              {/* Tên (title) */}
              <div>
                <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                  Tên văn bản <span className='text-primary'>*</span>
                </label>
                <Input
                  value={metadataDraft.title}
                  onChange={(e) => setMetadataField?.('title', e.target.value)}
                  placeholder='Ví dụ: Luật Đất đai 2024'
                  className='h-10 text-sm bg-background-secondary/30 border-border-secondary focus:bg-background-primary rounded-xl text-text-primary'
                />
              </div>

              {/* Số hiệu & Ngày ban hành */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                    Số hiệu
                  </label>
                  <Input
                    value={metadataDraft.documentNumber}
                    onChange={(e) => setMetadataField?.('documentNumber', e.target.value)}
                    placeholder='Ví dụ: 31/2024/QH15'
                    className='h-10 text-sm bg-background-secondary/30 border-border-secondary focus:bg-background-primary rounded-xl text-text-primary'
                  />
                </div>
                <div>
                  <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                    Ngày ban hành
                  </label>
                  <Input
                    type='date'
                    value={metadataDraft.issuedDate}
                    onChange={(e) => setMetadataField?.('issuedDate', e.target.value)}
                    className='h-10 text-sm bg-background-secondary/30 border-border-secondary focus:bg-background-primary rounded-xl text-text-primary'
                  />
                </div>
              </div>

              {/* Ngày hiệu lực */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                    Ngày hiệu lực
                  </label>
                  <Input
                    type='date'
                    value={metadataDraft.effectiveDate}
                    onChange={(e) => setMetadataField?.('effectiveDate', e.target.value)}
                    className='h-10 text-sm bg-background-secondary/30 border-border-secondary focus:bg-background-primary rounded-xl text-text-primary'
                  />
                </div>
              </div>

              {/* Tóm tắt (content/summary) */}
              <div>
                <label className='block text-xs font-bold text-text-secondary mb-1.5'>
                  Tóm tắt
                </label>
                <Textarea
                  value={metadataDraft.summary}
                  onChange={(e) => setMetadataField?.('summary', e.target.value)}
                  placeholder='Tóm tắt nội dung văn bản...'
                  className='w-full min-h-[120px] p-3.5 text-xs bg-background-secondary/20 border border-border-secondary rounded-xl text-text-primary resize-y font-medium outline-none leading-relaxed'
                />
              </div>
            </div>
          ) : (
          /* Document Header Info Card */
          <div className='mb-6 pb-6 border-b border-border-secondary/60 flex items-start justify-between gap-4'>
            <div className='text-left'>
              <h2 className='text-lg font-bold text-text-primary mb-1'>{currentTitle}</h2>
              <p className='text-xs text-text-description font-semibold'>Số hiệu: {selectedVersion?.documentNumber || law.documentNumber}</p>

              {officialUrl && (
                <div className='flex items-center gap-1.5 mt-3 text-xs text-text-secondary'>
                  <Globe className='w-4 h-4 text-primary shrink-0' />
                  <span>Đường dẫn văn bản: </span>
                  <a
                    href={officialUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:underline font-bold truncate max-w-sm ml-1'
                  >
                    {officialUrl}
                  </a>
                </div>
              )}
            </div>

            {/* Nút SỬA metadata (bút chì) — CHỈ hiện cho admin, khi đang xem bản mới
                nhất và không ở chế độ sửa nội dung điều khoản. */}
            {canEditMetadata && isLatest && !isEditing && (
              <Button
                variant='outline'
                size='sm'
                onClick={onStartEditMetadata}
                className='h-8.5 rounded-xl border-border-primary text-text-secondary hover:text-text-primary flex items-center gap-1.5 shrink-0 text-xs font-bold'
              >
                <Pencil className='w-3.5 h-3.5' />
                Sửa
              </Button>
            )}

            {/* Inline Edit Toggle (Only when viewing latest version in Docx mode) */}
            {!readOnly && isLatest && viewMode === 'docx' && hasDocx && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setIsEditing(!isEditing)}
                className='h-8.5 rounded-xl border-border-primary text-text-secondary hover:text-text-primary flex items-center gap-1.5 shrink-0 text-xs font-bold'
              >
                {isEditing ? (
                  <>
                    <Eye className='w-3.5 h-3.5' />
                    Hủy chỉnh sửa
                  </>
                ) : (
                  <>
                    <Edit3 className='w-3.5 h-3.5' />
                    Chỉnh sửa
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Mode Selector Tabs (Shown only if both docx text and PDF url exist and not editing) */}
          {hasDocx && pdfUrl && !isEditing && (
            <div className='flex gap-1.5 mb-6 bg-background-secondary/40 p-1 rounded-xl w-fit border border-border-secondary/30'>
              <button
                type='button'
                onClick={() => setViewMode('docx')}
                className={cn(
                  'px-4 py-1.5 text-xs font-bold rounded-lg transition-all focus:outline-none',
                  viewMode === 'docx'
                    ? 'bg-background-primary text-primary shadow-sm border border-border-secondary/20'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                Văn bản (Docx)
              </button>
              <button
                type='button'
                onClick={() => setViewMode('pdf')}
                className={cn(
                  'px-4 py-1.5 text-xs font-bold rounded-lg transition-all focus:outline-none',
                  viewMode === 'pdf'
                    ? 'bg-background-primary text-primary shadow-sm border border-border-secondary/20'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                Xem bản PDF
              </button>
            </div>
          )}

          {/* Viewing Content Area */}
          {isEditing ? (
            /* Inline Editor with Option Switcher */
            <div className='flex flex-col gap-3.5'>
              <div className='flex items-center gap-2 bg-primary/5 border border-primary/15 p-3.5 rounded-xl text-left'>
                <Info className='w-4.5 h-4.5 text-primary shrink-0' />
                <p className='text-[11px] text-text-secondary font-semibold leading-normal'>
                  Bạn đang chỉnh sửa nội dung văn bản. Chọn soạn thảo trực tiếp hoặc tải file word (.docx) để trích xuất điều khoản.
                </p>
              </div>

              <div className='flex gap-1.5 bg-background-secondary/40 p-1 rounded-xl w-fit border border-border-secondary/30'>
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
                  Soạn thảo
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

              {editSourceType === 'text' ? (
                <textarea
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  className='w-full min-h-[420px] p-5 text-xs font-mono bg-background-secondary/25 border border-border-secondary rounded-2xl focus:outline-none focus:ring-1 focus:ring-primary text-text-primary resize-y leading-relaxed'
                  placeholder='Nhập nội dung điều khoản văn bản pháp luật...'
                />
              ) : (
                <div className='space-y-3.5'>
                  {/* Drag and Drop File Upload Area */}
                  {!uploadedFile && !isUploading ? (
                    <div className='border-2 border-dashed border-border-secondary hover:border-primary/50 transition-all rounded-2xl p-8 bg-background-secondary/20 flex flex-col items-center justify-center gap-2 relative group min-h-[200px]'>
                      <input
                        type='file'
                        accept='.docx,.pdf'
                        onChange={handleFileUpload}
                        className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                      />
                      <UploadCloud className='w-10 h-10 text-text-tertiary group-hover:text-primary transition-all' />
                      <span className='text-xs font-bold text-text-secondary'>
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
                      <div className='border border-border-secondary rounded-2xl p-8 bg-background-secondary/20 flex flex-col items-center justify-center gap-3 min-h-[200px]'>
                        <Loader2 className='w-7 h-7 text-primary animate-spin' />
                        <span className='text-xs font-bold text-text-secondary animate-pulse'>
                          Đang tải lên và trích xuất dữ liệu điều khoản...
                        </span>
                      </div>
                    )
                  ) : (
                    <div className='border border-success-primary/20 bg-success-primary/5 rounded-2xl p-5 flex items-center justify-between gap-3 shadow-sm'>
                      <div className='flex items-center gap-3.5 overflow-hidden'>
                        <div className='w-12 h-12 rounded-xl bg-success-primary/10 text-success-primary flex items-center justify-center shrink-0 border border-success-primary/15'>
                          <FileText className='w-6 h-6' />
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
                    <div className='flex-grow flex flex-col min-h-0 bg-background-secondary/20 border border-border-secondary rounded-2xl p-4 space-y-3'>
                      <div className='flex items-center justify-between mb-1 shrink-0'>
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
                      <div className='flex-grow overflow-y-auto bg-background-primary border border-border-secondary rounded-xl p-4 min-h-[300px]'>
                        {previewMode === 'preview' ? (
                          <MarkdownPreview content={editableContent} />
                        ) : (
                          <textarea
                            value={editableContent}
                            onChange={(e) => setEditableContent(e.target.value)}
                            className='w-full h-full text-xs font-mono bg-transparent border-0 focus:outline-none text-text-primary resize-none leading-relaxed'
                            placeholder='Nội dung trích xuất sẽ hiển thị ở đây...'
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : viewMode === 'docx' && hasDocx ? (
            /* Docx (Formatted text clauses) view mode */
            <div className='bg-background-primary p-6 rounded-2xl border border-border-secondary shadow-sm'>
              {renderDocumentContent(currentContent)}
            </div>
          ) : (
            /* PDF Preview view mode */
            <div className='flex flex-col gap-3'>
              <div className='w-full h-[620px] border border-border-secondary rounded-2xl overflow-hidden shadow-inner bg-background-secondary/20 relative'>
                {pdfUrl ? (
                  <iframe
                    src={getInlinePdfUrl(pdfUrl)}
                    className='w-full h-full border-none'
                    title={`Bản PDF của ${currentTitle}`}
                  />
                ) : (
                  <div className='absolute inset-0 flex flex-col items-center justify-center text-text-tertiary gap-2 p-6 text-center'>
                    <Info className='w-10 h-10 text-text-tertiary' />
                    <p className='text-sm font-semibold'>Không tìm thấy liên kết PDF cho tài liệu này.</p>
                  </div>
                )}
              </div>
              
              {pdfUrl && (
                <div className='flex items-center justify-between px-4 py-3 bg-background-secondary/35 rounded-xl border border-border-secondary/60'>
                  <span className='text-[11px] text-text-secondary font-semibold text-left'>
                    Không xem được tài liệu? Trình duyệt chưa cài hỗ trợ iframe PDF.
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    asChild
                    className='h-7.5 text-[10px] font-bold rounded-xl border-border-primary text-text-secondary hover:text-text-primary flex items-center gap-1.5'
                  >
                    <a href={pdfUrl} target='_blank' rel='noopener noreferrer'>
                      <FileDown className='w-3.5 h-3.5' />
                      Tải về máy
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
