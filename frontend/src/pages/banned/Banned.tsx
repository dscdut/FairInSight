import { Calendar, FileText, LogIn, ShieldAlert } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ROUTE } from '@/core/constants/path'


export default function Banned() {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Extract ban details from router state or search query parameters (from axios interceptor direct page reloads)
  const queryParams = new URLSearchParams(location.search)
  const banReason = (location.state as { banReason?: string })?.banReason || queryParams.get('reason') || 'Vi phạm điều khoản dịch vụ hệ thống.'
  const bannedAt = (location.state as { bannedAt?: string })?.bannedAt || queryParams.get('at') || ''

  const formattedDate = bannedAt 
    ? new Date(bannedAt).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Không xác định'

  return (
    <div className='min-h-screen w-full flex items-center justify-center bg-background-primary p-4 relative overflow-hidden'>
      {/* Decorative background glows */}
      <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl -z-10' />
      <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -z-10' />

      <Card className='max-w-lg w-full p-8 space-y-6 text-center border-none shadow-2xl bg-background-secondary/40 backdrop-blur-xl relative overflow-hidden rounded-2xl'>
        {/* Glow effect border header */}
        <div className='absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500' />

        {/* Banned Icon Header */}
        <div className='flex flex-col items-center space-y-3 pt-2'>
          <div className='w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/25 animate-pulse shadow-lg shadow-red-500/10'>
            <ShieldAlert className='w-8 h-8' />
          </div>
          <h1 className='text-h3 font-bold text-text-primary tracking-tight'>Tài khoản đã bị khóa</h1>
          <p className='text-xs text-text-description uppercase tracking-wider font-semibold'>
            Quy định bảo mật LegalAI
          </p>
        </div>

        {/* Ban Details Container */}
        <div className='space-y-4 bg-background-secondary/85 p-6 rounded-xl border border-border-secondary text-left'>
          {/* Reason */}
          <div className='space-y-1.5'>
            <span className='text-xs text-text-description font-semibold flex items-center gap-1.5'>
              <FileText className='w-3.5 h-3.5' /> Lý do khóa tài khoản:
            </span>
            <p className='text-sm text-text-primary leading-relaxed font-medium bg-red-500/5 p-3 rounded-lg border border-red-500/10 italic text-red-400'>
              {banReason || 'Vi phạm điều khoản dịch vụ hệ thống.'}
            </p>
          </div>

          {/* Time */}
          <div className='space-y-1.5 pt-2 border-t border-border-secondary/50'>
            <span className='text-xs text-text-description font-semibold flex items-center gap-1.5'>
              <Calendar className='w-3.5 h-3.5' /> Thời gian khóa:
            </span>
            <p className='text-sm text-text-primary font-semibold'>
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Note / Action */}
        <p className='text-xs text-text-description leading-relaxed px-4'>
          Nếu bạn cho rằng đây là một sự nhầm lẫn, vui lòng liên hệ với bộ phận hỗ trợ khách hàng của LegalAI qua email <strong>support@legalai.vn</strong>.
        </p>

        <div className='pt-2'>
          <Button 
            onClick={() => navigate(ROUTE.AUTH.LOGIN)} 
            className='w-full py-6 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 border-none'
          >
            <LogIn className='w-5 h-5' /> Quay lại đăng nhập
          </Button>
        </div>
      </Card>
    </div>
  )
}
