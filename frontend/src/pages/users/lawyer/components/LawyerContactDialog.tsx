import { useState, useEffect } from 'react'

import { MapPin, Star, Check, Paperclip, X, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import FileUpload from '@/components/upload-file/file-upload'
import toastifyCommon from '@/core/lib/toastify-common'
import { consultationApi } from '@/core/services/consultation.service'
import { lawApi } from '@/core/services/law.service'
import { useAppointmentStore } from '@/core/store/features/appointments'
import { useUserInfo } from '@/hooks/tanstack-query/auth/use-query-auth'
import { type Lawyer } from '@/models/lawyer/list-lawyer.type'

interface UploadedFile {
  name: string
  size: number
  url?: string
  isUploading?: boolean
  error?: boolean
}

interface LawyerContactDialogProps {
  lawyer: Lawyer | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialAttachments?: any[]
  onPreviewChatPdf?: () => void
}

const formatContactFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function LawyerContactDialog({
  lawyer,
  isOpen,
  onOpenChange,
  initialAttachments = [],
  onPreviewChatPdf
}: LawyerContactDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([])
  const [prepopulatedFiles, setPrepopulatedFiles] = useState<any[]>([])
  // const [submitting, setSubmitting] = useState(false)

  const { data: user } = useUserInfo()
  const navigate = useNavigate()

  // Reset/Initialize form and step when modal opens or lawyer changes
  useEffect(() => {
    if (lawyer && isOpen) {
      setContactForm({
        name: user?.fullName || 'Khách hàng',
        phone: user?.phone || '0912832123',
        email: user?.email || 'user@example.com',
        message: `Tôi muốn nhận tư vấn pháp lý từ Luật sư ${lawyer.fullName}.`
      })
      setSelectedFiles([])
      setPrepopulatedFiles(initialAttachments)
      setStep(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lawyer, isOpen, user])

  if (!lawyer) return null

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // setSubmitting(true)
    try {
      // Create a real consultation process in the database with the user's manually typed context/message
      await consultationApi.createConsultation({
        lawyerId: lawyer.id,
        contextSummary: `Đăng ký tư vấn: ${contactForm.message.slice(0, 40)}...`,
        message: contactForm.message
      })

    // Add new request to the global appointments store
    const addRequest = useAppointmentStore.getState().addRequest
    addRequest({
      lawyerName: lawyer.fullName,
      lawyerAvatar: lawyer.avatar || '',
      topicVI: lawyer.specializations[0] || 'Tư vấn pháp lý',
      topicEN: lawyer.specializations[0] || 'Legal Consultation',
      message: contactForm.message,
      attachments: [
        ...prepopulatedFiles.map((file) => ({
          name: file.name,
          size: file.size || 'N/A',
          url: file.url
        })),
        ...selectedFiles
          .filter((file) => !file.isUploading && !file.error)
          .map((file) => ({
            name: file.name,
            size: formatContactFileSize(file.size),
            url: file.url
          }))
      ]
    })

      setStep(3)
    } catch (err) {
      console.error('Failed to create consultation:', err)
      toastifyCommon.error('Đăng ký tư vấn thất bại. Vui lòng thử lại!')
    } finally {
      // setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='bg-background-secondary border-border-secondary text-text-primary max-w-lg rounded-lg shadow-600 p-6'>
        {step !== 3 && (
          <DialogHeader className='text-left pb-4 border-b border-border-primary'>
            <DialogTitle className='text-h4 font-bold flex items-center gap-2 text-text-primary'>
              {step === 1 ? 'Thông tin Luật sư' : 'Đặt lịch hẹn tư vấn'}
            </DialogTitle>
          </DialogHeader>
        )}

        <div className='space-y-4 py-4 text-left'>
          {step === 1 && (
            <>
              {/* Profile Card Summary */}
              <div className='flex gap-4 items-center bg-background-tertiary p-3.5 rounded-lg border border-border-primary'>
                <div className='w-16 h-16 rounded-full overflow-hidden border-2 border-background-primary shadow-sm shrink-0'>
                  <img src={lawyer.avatar || ''} alt={lawyer.fullName} className='w-full h-full object-cover' />
                </div>
                <div>
                  <h4 className='text-p-medium font-bold text-text-primary'>{lawyer.fullName}</h4>
                  <p className='text-xs text-text-description font-medium flex items-center gap-1 mt-0.5'>
                    <MapPin className='w-3 h-3' /> {lawyer.location}
                  </p>
                  <div className='flex gap-4 items-center mt-1.5'>
                    <span className='text-xs font-bold text-warning-secondary flex items-center gap-0.5'>
                      <Star className='w-3.5 h-3.5 fill-current' /> {lawyer.averageRating.toFixed(1)}
                    </span>
                    <span className='text-xs font-bold text-text-tertiary'>
                      {lawyer.successfulCases}+ vụ thành công
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio & Details */}
              <div className='space-y-3.5'>
                <div>
                  <h5 className='text-sm font-semibold tracking-wider text-text-tertiary'>Kinh nghiệm</h5>
                  <p className='text-sm text-text-primary mt-0.5'>{lawyer.careerHistory}</p>
                </div>
                <div>
                  <h5 className='text-sm font-semibold tracking-wider text-text-tertiary'>Giới thiệu chi tiết</h5>
                  <p className='text-sm text-text-secondary leading-relaxed mt-0.5'>{lawyer.bio}</p>
                </div>
                <div>
                  <h5 className='text-sm font-semibold tracking-wider text-text-tertiary'>Lĩnh vực chuyên môn</h5>
                  <div className='flex flex-wrap gap-1.5 mt-1'>
                    {lawyer.specializations.map((spec) => (
                      <span key={spec} className='px-2.5 py-0.5 bg-background-tertiary border border-border-primary rounded-full text-[11px] font-medium text-text-secondary'>
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className='border-t border-border-primary pt-4'>
                <Button
                  type='button'
                  onClick={() => setStep(2)}
                  className='w-full'
                >
                  Yêu cầu tư vấn với Luật sư
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <form onSubmit={handleContactSubmit} className='space-y-4'>
              {/* Mini Profile Context */}
              <div className='flex gap-3 items-center bg-background-tertiary p-2.5 rounded-lg border border-border-primary'>
                <div className='w-10 h-10 rounded-full overflow-hidden shrink-0 border border-background-primary shadow-sm'>
                  <img src={lawyer.avatar || ''} alt={lawyer.fullName} className='w-full h-full object-cover' />
                </div>
                <div>
                  <h4 className='text-sm font-semibold text-text-main'>Luật sư {lawyer.fullName}</h4>
                  <p className='text-xs text-text-description'>{lawyer.location}</p>
                </div>
              </div>

              <div className='space-y-3'>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-1'>
                    <label className='text-sm font-medium text-text-secondary'>Họ và tên</label>
                    <Input
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder='Nhập họ tên...'
                      className='h-9.5 border-border-secondary bg-background-primary text-sm'
                    />
                  </div>
                  <div className='space-y-1'>
                    <label className='text-sm font-medium text-text-secondary'>Số điện thoại</label>
                    <Input
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder='Nhập số điện thoại...'
                      className='h-9.5 border-border-secondary bg-background-primary text-sm'
                    />
                  </div>
                </div>

                <div className='space-y-1'>
                  <label className='text-sm font-medium text-text-secondary'>Email liên hệ</label>
                  <Input
                    type='email'
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder='Nhập địa chỉ email...'
                    className='h-9.5 border-border-secondary bg-background-primary text-sm'
                  />
                </div>

                <div className='space-y-1'>
                  <label className='text-sm font-medium text-text-secondary'>Nội dung yêu cầu tư vấn</label>
                  <textarea
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder='Nhập nội dung vụ việc cần tư vấn...'
                    rows={3}
                    className='w-full p-2.5 rounded-md border border-border-secondary bg-background-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm text-text-primary'
                  />
                </div>

                <div className='space-y-1.5'>
                  <label className='text-sm font-medium text-text-secondary block'>Tài liệu đính kèm</label>
                  <FileUpload
                    multiple
                    accept='.pdf,.doc,.docx,.png,.jpg,.jpeg,.txt'
                    onChange={(files) => {
                      if (files) {
                        const fileList = Array.from(files)
                        fileList.forEach((file) => {
                          const newFile: UploadedFile = {
                            name: file.name,
                            size: file.size,
                            isUploading: true
                          }
                          setSelectedFiles((prev) => [...prev, newFile])

                          lawApi.uploadFile(file)
                            .then((res) => {
                              setSelectedFiles((prev) =>
                                prev.map((item) =>
                                  item.name === file.name && item.isUploading
                                    ? { ...item, url: res.url, isUploading: false }
                                    : item
                                )
                              )
                            })
                            .catch((error) => {
                              console.error('Failed to upload file:', error)
                              setSelectedFiles((prev) =>
                                prev.map((item) =>
                                  item.name === file.name && item.isUploading
                                    ? { ...item, isUploading: false, error: true }
                                    : item
                                )
                              )
                            })
                        })
                      }
                    }}
                  >
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='h-9 text-xs flex items-center gap-1.5 border-border-secondary text-text-secondary hover:text-text-primary hover:bg-background-tertiary w-full justify-center border-dashed border'
                    >
                      <Paperclip className='w-4 h-4 text-primary' />
                      Đính kèm tài liệu (PDF, DOCX, Hình ảnh...)
                    </Button>
                  </FileUpload>

                  {/* List of prepopulated files */}
                  {prepopulatedFiles.length > 0 && (
                    <div className='mt-2 space-y-1.5 max-h-28 overflow-y-auto pr-1'>
                      {prepopulatedFiles.map((file, idx) => (
                        <div
                          key={`pre-${file.id || idx}`}
                          className='flex items-center justify-between p-2 bg-background-tertiary rounded-md border border-border-primary text-xs'
                        >
                          <div className='flex items-center gap-2 overflow-hidden mr-2'>
                            <Paperclip className='w-3.5 h-3.5 text-success-secondary shrink-0' />
                            {file.id === 'chat-pdf-report' ? (
                              <button
                                type='button'
                                onClick={() => onPreviewChatPdf?.()}
                                className='font-semibold underline text-primary hover:text-primary/80 truncate text-left cursor-pointer'
                                title='Bấm để xem trước / tải về PDF nội dung phân tích'
                              >
                                {file.name}
                              </button>
                            ) : (
                              <span className='font-medium truncate text-text-primary'>{file.name}</span>
                            )}
                            <span className='text-text-description shrink-0'>({file.size || 'N/A'})</span>
                            <span className='text-[9px] font-bold text-success-secondary bg-success-background px-1.5 py-0.5 rounded shrink-0'>
                              Chat
                            </span>
                          </div>
                          <button
                            type='button'
                            onClick={() => setPrepopulatedFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className='text-text-description hover:text-error-secondary transition-colors p-0.5 rounded-full hover:bg-background-secondary shrink-0'
                          >
                            <X className='w-3.5 h-3.5' />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* List of uploaded files */}
                  {selectedFiles.length > 0 && (
                    <div className='mt-2 space-y-1.5 max-h-28 overflow-y-auto pr-1'>
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={`${file.name}-${idx}`}
                          className='flex items-center justify-between p-2 bg-background-tertiary rounded-md border border-border-primary text-xs'
                        >
                          <div className='flex items-center gap-2 overflow-hidden mr-2'>
                            {file.isUploading ? (
                              <Loader2 className='w-3.5 h-3.5 text-primary shrink-0 animate-spin' />
                            ) : (
                              <Paperclip className={`w-3.5 h-3.5 shrink-0 ${file.error ? 'text-error-primary' : 'text-text-tertiary'}`} />
                            )}
                            <span className={`font-medium truncate ${file.error ? 'text-error-primary line-through' : 'text-text-primary'}`}>
                              {file.name}
                            </span>
                            <span className='text-text-description shrink-0'>
                              {file.isUploading ? '(Đang tải lên...)' : file.error ? '(Lỗi tải lên)' : `(${formatContactFileSize(file.size)})`}
                            </span>
                          </div>
                          <button
                            type='button'
                            onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className='text-text-description hover:text-error-secondary transition-colors p-0.5 rounded-full hover:bg-background-secondary shrink-0'
                          >
                            <X className='w-3.5 h-3.5' />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className='pt-4 border-t border-border-primary mt-4 grid grid-cols-2 gap-3'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setStep(1)}
                    className='w-full'
                  >
                    Quay lại
                  </Button>
                  <Button
                    type='submit'
                    // disabled={submitting}
                    className='w-full'
                    disabled={selectedFiles.some((f) => f.isUploading)}
                  >
                    {selectedFiles.some((f) => f.isUploading) ? 'Đang tải tệp lên...' : 'Gửi yêu cầu'}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className='py-6 flex flex-col items-center text-center space-y-4'>
              <div className='w-16 h-16 rounded-full bg-success-primary/10 text-success-primary flex items-center justify-center border border-success-primary/20 animate-bounce'>
                <Check className='w-8 h-8' />
              </div>
              <div className='space-y-1.5 max-w-sm'>
                <h4 className='text-lg font-bold text-text-primary'>Yêu cầu tư vấn thành công!</h4>
                <p className='text-sm text-text-secondary leading-relaxed'>
                  Yêu cầu của bạn với Luật sư <span className='font-bold text-text-primary'>{lawyer.fullName}</span> đã được gửi đi thành công.
                </p>
              </div>
              <div className='flex gap-3 mt-6'>
                <Button
                  type='button'
                  onClick={() => {
                    onOpenChange(false)
                    navigate('/messages')
                  }}
                  className='h-9.5 text-xs rounded-md bg-primary text-white font-bold px-4 hover:bg-primary/95 transition-all shadow-sm'
                >
                  Đi đến Chat & Xem tiến trình
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                  className='h-9.5 text-xs rounded-md border-border-secondary hover:bg-background-tertiary text-text-primary px-4'
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
