import { useState, useEffect } from 'react'

import { MapPin, Star, Check, Paperclip, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import FileUpload from '@/components/upload-file/file-upload'
import { useAppointmentStore } from '@/core/store/features/appointments'
import { useUserInfo } from '@/hooks/tanstack-query/auth/use-query-auth'
import { type Lawyer } from '@/models/lawyer/list-lawyer.type'

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [prepopulatedFiles, setPrepopulatedFiles] = useState<any[]>([])

  const { data: user } = useUserInfo()

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

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // eslint-disable-next-line no-console
    console.log('Submitted contact request:', { ...contactForm, files: selectedFiles, prepopulatedFiles })

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
          size: file.size || 'N/A'
        })),
        ...selectedFiles.map((file) => ({
          name: file.name,
          size: formatContactFileSize(file.size)
        }))
      ]
    })

    setStep(3)
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
                    <MapPin className='w-3 h-3' /> {lawyer.city}
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
                  <h4 className='text-sm font-bold text-text-primary'>Đăng ký tư vấn với Luật sư {lawyer.fullName}</h4>
                  <p className='text-xs text-text-description'>{lawyer.city}</p>
                </div>
              </div>

              <div className='space-y-3'>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-1'>
                    <label className='text-xs font-bold text-text-secondary'>Họ và tên của bạn</label>
                    <Input
                      disabled
                      value={contactForm.name}
                      placeholder='Nhập họ tên...'
                      className='h-9.5 border-border-secondary bg-background-tertiary text-sm cursor-not-allowed opacity-75'
                    />
                  </div>
                  <div className='space-y-1'>
                    <label className='text-xs font-bold text-text-secondary'>Số điện thoại</label>
                    <Input
                      disabled
                      value={contactForm.phone}
                      placeholder='Nhập số điện thoại...'
                      className='h-9.5 border-border-secondary bg-background-tertiary text-sm cursor-not-allowed opacity-75'
                    />
                  </div>
                </div>

                <div className='space-y-1'>
                  <label className='text-xs font-bold text-text-secondary'>Email liên hệ</label>
                  <Input
                    disabled
                    type='email'
                    value={contactForm.email}
                    placeholder='Nhập địa chỉ email...'
                    className='h-9.5 border-border-secondary bg-background-tertiary text-sm cursor-not-allowed opacity-75'
                  />
                </div>

                <div className='space-y-1'>
                  <label className='text-xs font-bold text-text-secondary'>Nội dung yêu cầu tư vấn</label>
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
                  <label className='text-xs font-bold text-text-secondary block'>Tài liệu đính kèm</label>
                  <FileUpload
                    multiple
                    accept='.pdf,.doc,.docx,.png,.jpg,.jpeg,.txt'
                    onChange={(files) => {
                      if (files) {
                        const fileList = Array.from(files)
                        setSelectedFiles((prev) => [...prev, ...fileList])
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
                            <Paperclip className='w-3.5 h-3.5 text-text-tertiary shrink-0' />
                            <span className='font-medium truncate text-text-primary'>{file.name}</span>
                            <span className='text-text-description shrink-0'>({formatContactFileSize(file.size)})</span>
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
                    className='w-full'
                  >
                    Gửi yêu cầu
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
              <Button
                type='button'
                onClick={() => onOpenChange(false)}
                className='mt-6 h-9.5 text-xs rounded-md bg-primary text-white font-bold px-6'
              >
                Đóng
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
