import { motion } from 'framer-motion'
import { CheckCircle2, FileDown } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface SuccessModalProps {
  showSuccess: boolean
  activeFileUrl: string | null
  templateTitle: string
  onClose: () => void
  onDownloadFallback?: () => void
}

export default function SuccessModal({ showSuccess, activeFileUrl, templateTitle, onClose, onDownloadFallback }: SuccessModalProps) {
  if (!showSuccess) return null

  const handleDownload = () => {
    if (activeFileUrl) {
      const link = document.createElement('a')
      link.href = activeFileUrl
      link.download = `${templateTitle.replace(/\s+/g, '_')}.pdf`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else if (onDownloadFallback) {
      onDownloadFallback()
    }
  }

  return (
    <div className='fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6'>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className='bg-background-secondary border border-border-secondary p-8 rounded-lg shadow-600 max-w-sm w-full text-center flex flex-col items-center gap-4.5'
      >
        <div className='w-16 h-16 rounded-full bg-success-primary/10 text-success-primary flex items-center justify-center shrink-0 border border-success-primary/15 mb-1 animate-bounce'>
          <CheckCircle2 className='w-8 h-8' />
        </div>
        <h3 className='text-lg font-extrabold text-text-primary uppercase tracking-wide'>Tạo văn bản thành công!</h3>
        <p className='text-xs text-text-secondary leading-relaxed font-semibold'>
          {activeFileUrl 
            ? 'File PDF của bạn đã được xuất bản và tự động tải xuống. Bạn có thể kiểm tra tệp tin trong thư mục tải về của trình duyệt.'
            : 'Văn bản của bạn đã được khởi tạo thành công và sẵn sàng để lưu/in dưới dạng tài liệu PDF.'}
        </p>
        <div className='flex flex-col gap-2.5 w-full mt-2'>
          {activeFileUrl ? (
            <Button
              onClick={handleDownload}
              className='h-9.5 w-full bg-gradient-to-r from-primary to-rose-500 text-white hover:opacity-90 font-bold text-xs rounded-xl shadow-md border-none flex items-center justify-center gap-1.5 cursor-pointer'
            >
              <FileDown className='w-4 h-4' />
              Tải xuống PDF
            </Button>
          ) : (
            <Button
              onClick={handleDownload}
              className='h-9.5 w-full bg-gradient-to-r from-primary to-rose-500 text-white hover:opacity-90 font-bold text-xs rounded-xl shadow-md border-none flex items-center justify-center gap-1.5 cursor-pointer'
            >
              <FileDown className='w-4 h-4' />
              Xuất file PDF / In
            </Button>
          )}
          <Button
            variant='outline'
            onClick={onClose}
            className='h-9.5 w-full border border-border-secondary hover:bg-background-secondary text-text-secondary font-bold text-xs rounded-xl transition-all shadow-sm'
          >
            Quay lại chỉnh sửa
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
