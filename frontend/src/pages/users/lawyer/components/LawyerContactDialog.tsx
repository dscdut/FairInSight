import { useState, useEffect } from 'react'

import { MapPin, Star, MessageSquare, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { type Lawyer } from '@/models/lawyer/list-lawyer.type'

interface LawyerContactDialogProps {
  lawyer: Lawyer | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function LawyerContactDialog({
  lawyer,
  isOpen,
  onOpenChange
}: LawyerContactDialogProps) {
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false)

  // Reset/Initialize form when modal opens or lawyer changes
  useEffect(() => {
    if (lawyer && isOpen) {
      setContactForm({
        name: '',
        phone: '',
        email: '',
        message: `Tôi muốn nhận tư vấn pháp lý từ Luật sư ${lawyer.fullName}.`
      })
      setIsSubmitSuccess(false)
    }
  }, [lawyer, isOpen])

  if (!lawyer) return null

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock submit logic
    setIsSubmitSuccess(true)
    setTimeout(() => {
      onOpenChange(false)
      setIsSubmitSuccess(false)
    }, 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='bg-background-secondary border-border-secondary text-text-primary max-w-lg rounded-lg shadow-600 p-6'>
        <DialogHeader className='text-left pb-4 border-b border-border-primary'>
          <DialogTitle className='text-h4 font-bold flex items-center gap-2 text-text-primary'>
            Thông tin Luật sư
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-4 text-left'>
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
          <div className='space-y-2.5'>
            <div>
              <h5 className='text-xs font-bold uppercase tracking-wider text-text-tertiary'>Kinh nghiệm</h5>
              <p className='text-sm text-text-primary font-medium mt-0.5'>{lawyer.careerHistory}</p>
            </div>
            <div>
              <h5 className='text-xs font-bold uppercase tracking-wider text-text-tertiary'>Giới thiệu chi tiết</h5>
              <p className='text-sm text-text-secondary leading-relaxed mt-0.5'>{lawyer.bio}</p>
            </div>
            <div>
              <h5 className='text-xs font-bold uppercase tracking-wider text-text-tertiary'>Lĩnh vực chuyên môn</h5>
              <div className='flex flex-wrap gap-1.5 mt-1'>
                {lawyer.specializations.map((spec) => (
                  <span key={spec} className='px-2.5 py-0.5 bg-background-tertiary border border-border-primary rounded-full text-[11px] font-medium text-text-secondary'>
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Request Form */}
          <form onSubmit={handleContactSubmit} className='border-t border-border-primary pt-4 space-y-3.5'>
            <h4 className='text-sm font-bold text-text-primary flex items-center gap-1.5'>
              <MessageSquare className='w-4.5 h-4.5 text-primary' /> Đặt lịch hẹn tư vấn
            </h4>

            {isSubmitSuccess ? (
              <div className='bg-success-primary/10 border border-success-primary/20 text-success-secondary rounded-lg p-4 flex items-center gap-3 animate-in fade-in duration-300'>
                <div className='w-8 h-8 rounded-full bg-success-primary/10 text-success-primary flex items-center justify-center shrink-0 border border-success-primary/15'>
                  <Check className='w-4.5 h-4.5' />
                </div>
                <div>
                  <p className='text-sm font-bold'>Gửi yêu cầu thành công!</p>
                  <p className='text-xs text-text-description mt-0.5'>Luật sư sẽ chủ động liên hệ lại với bạn sớm nhất.</p>
                </div>
              </div>
            ) : (
              <div className='space-y-3'>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-1'>
                    <label className='text-xs font-bold text-text-secondary'>Họ và tên của bạn</label>
                    <Input
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder='Nhập họ tên...'
                      className='h-9.5 border-border-secondary bg-background-primary text-sm'
                    />
                  </div>
                  <div className='space-y-1'>
                    <label className='text-xs font-bold text-text-secondary'>Số điện thoại</label>
                    <Input
                      required
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder='Nhập số điện thoại...'
                      className='h-9.5 border-border-secondary bg-background-primary text-sm'
                    />
                  </div>
                </div>

                <div className='space-y-1'>
                  <label className='text-xs font-bold text-text-secondary'>Email liên hệ</label>
                  <Input
                    required
                    type='email'
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder='Nhập địa chỉ email...'
                    className='h-9.5 border-border-secondary bg-background-primary text-sm'
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

                <DialogFooter className='pt-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => onOpenChange(false)}
                    className='h-9 text-xs rounded-md border-border-secondary'
                  >
                    Đóng
                  </Button>
                  <Button
                    type='submit'
                    className='h-9 text-xs rounded-md bg-primary text-white font-bold px-4'
                  >
                    Gửi yêu cầu
                  </Button>
                </DialogFooter>
              </div>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
