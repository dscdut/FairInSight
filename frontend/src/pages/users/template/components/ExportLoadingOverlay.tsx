import { Loader2 } from 'lucide-react'

interface ExportLoadingOverlayProps {
  isExporting: boolean
}

export default function ExportLoadingOverlay({ isExporting }: ExportLoadingOverlayProps) {
  if (!isExporting) return null

  return (
    <div className='fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6'>
      <div className='w-full max-w-xs bg-background-secondary border border-border-secondary rounded-lg p-6 shadow-600 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200'>
        <Loader2 className='w-10 h-10 animate-spin text-primary' />
        <div>
          <p className='text-sm font-bold text-text-primary uppercase tracking-wide'>Đang tạo tài liệu</p>
          <p className='text-xs text-text-description font-semibold mt-1'>Vui lòng đợi trong giây lát...</p>
        </div>
      </div>
    </div>
  )
}
