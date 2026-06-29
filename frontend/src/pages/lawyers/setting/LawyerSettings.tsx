import { useState } from 'react'
import { Settings, Bell, Clock, Shield, Key } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toastifyCommon from '@/core/lib/toastify-common'

export default function LawyerSettings() {
  const [notifyAppointment, setNotifyAppointment] = useState(true)
  const [notifyMessage, setNotifyMessage] = useState(true)
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSaveNotifications = () => {
    toastifyCommon.success('Cập nhật cài đặt thông báo thành công!')
  }

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      toastifyCommon.error('Vui lòng nhập đầy đủ thông tin mật khẩu!')
      return
    }
    if (newPassword !== confirmPassword) {
      toastifyCommon.error('Mật khẩu mới và mật khẩu xác nhận không khớp!')
      return
    }
    toastifyCommon.success('Đổi mật khẩu thành công!')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className='max-w-4xl mx-auto lg:p-6 p-4 space-y-6'>
      <div>
        <h1 className='text-h4 font-bold text-text-main flex items-center gap-2'>
          <Settings className='w-6 h-6 text-primary' />
          Cài đặt hệ thống Luật sư
        </h1>
        <p className='text-xs text-text-description mt-1'>
          Quản lý thời gian rảnh, cấu hình nhận thông báo và cài đặt tài khoản bảo mật.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 items-start'>
        
        {/* Left Column: Work Time & Notifications */}
        <div className='space-y-6'>
          {/* Work Time */}
          <Card className='p-6 border border-border-secondary bg-background-primary shadow-sm space-y-4'>
            <CardTitle className='text-sm uppercase tracking-wider text-text-main font-bold border-b border-border-secondary pb-3 flex items-center gap-2'>
              <Clock className='w-4.5 h-4.5 text-indigo-500' />
              Thời gian biểu nhận tư vấn
            </CardTitle>

            <div className='space-y-3.5'>
              <p className='text-xs text-text-description leading-relaxed'>
                Thiết lập khoảng thời gian khách hàng có thể đặt lịch hẹn tư vấn trực tuyến với bạn.
              </p>
              
              <div className='grid grid-cols-2 gap-3 text-xs text-text-main'>
                <div className='space-y-1.5'>
                  <span className='font-semibold block'>Giờ bắt đầu làm việc</span>
                  <Input type='time' defaultValue='08:00' className='rounded-lg text-sm bg-background-primary border-border-secondary' />
                </div>
                <div className='space-y-1.5'>
                  <span className='font-semibold block'>Giờ kết thúc làm việc</span>
                  <Input type='time' defaultValue='17:00' className='rounded-lg text-sm bg-background-primary border-border-secondary' />
                </div>
              </div>

              <div className='space-y-1.5 pt-2'>
                <span className='text-xs font-semibold text-text-main block'>Ngày làm việc nhận lịch trong tuần</span>
                <div className='flex flex-wrap gap-2'>
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                    <button
                      key={day}
                      className={`w-9 h-9 rounded-full border text-xs font-semibold flex items-center justify-center transition-all ${
                        day !== 'CN' && day !== 'T7'
                          ? 'bg-primary/10 border-primary/25 text-primary'
                          : 'border-border-secondary text-text-description hover:bg-background-secondary'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className='flex justify-end pt-3'>
                <Button onClick={() => toastifyCommon.success('Cập nhật khung giờ nhận tư vấn thành công!')} className='rounded-lg text-xs font-semibold'>
                  Cập nhật thời gian
                </Button>
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card className='p-6 border border-border-secondary bg-background-primary shadow-sm space-y-4'>
            <CardTitle className='text-sm uppercase tracking-wider text-text-main font-bold border-b border-border-secondary pb-3 flex items-center gap-2'>
              <Bell className='w-4.5 h-4.5 text-indigo-500' />
              Cài đặt thông báo
            </CardTitle>

            <div className='space-y-4 text-sm text-text-main'>
              <div className='flex items-center justify-between'>
                <div>
                  <h4 className='font-semibold text-xs'>Có yêu cầu tư vấn mới</h4>
                  <p className='text-[10px] text-text-description mt-0.5'>Gửi email khi khách hàng gửi yêu cầu tư vấn mới</p>
                </div>
                <input
                  type='checkbox'
                  checked={notifyAppointment}
                  onChange={(e) => setNotifyAppointment(e.target.checked)}
                  className='w-4.5 h-4.5 text-primary bg-background-primary rounded border-border-secondary focus:ring-primary'
                />
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <h4 className='font-semibold text-xs'>Tin nhắn mới</h4>
                  <p className='text-[10px] text-text-description mt-0.5'>Báo chuông và đẩy thông báo khi có tin nhắn từ khách hàng</p>
                </div>
                <input
                  type='checkbox'
                  checked={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.checked)}
                  className='w-4.5 h-4.5 text-primary bg-background-primary rounded border-border-secondary focus:ring-primary'
                />
              </div>

              <div className='flex justify-end pt-2 border-t border-border-secondary'>
                <Button onClick={handleSaveNotifications} className='rounded-lg text-xs font-semibold'>
                  Lưu cài đặt thông báo
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Security (Change Password) */}
        <div>
          <Card className='p-6 border border-border-secondary bg-background-primary shadow-sm space-y-4'>
            <CardTitle className='text-sm uppercase tracking-wider text-text-main font-bold border-b border-border-secondary pb-3 flex items-center gap-2'>
              <Shield className='w-4.5 h-4.5 text-indigo-500' />
              Mật khẩu & Bảo mật
            </CardTitle>

            <form onSubmit={handleSavePassword} className='space-y-4'>
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-text-main'>Mật khẩu hiện tại</label>
                <Input
                  type='password'
                  placeholder='••••••••'
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className='rounded-lg text-sm bg-background-primary border-border-secondary'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-text-main'>Mật khẩu mới</label>
                <Input
                  type='password'
                  placeholder='••••••••'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className='rounded-lg text-sm bg-background-primary border-border-secondary'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-text-main'>Xác nhận mật khẩu mới</label>
                <Input
                  type='password'
                  placeholder='••••••••'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className='rounded-lg text-sm bg-background-primary border-border-secondary'
                />
              </div>

              <div className='pt-2'>
                <Button
                  type='submit'
                  className='w-full bg-primary hover:bg-primary-600 text-white rounded-lg flex items-center justify-center gap-2 shadow-sm'
                >
                  <Key className='w-4 h-4' />
                  <span>Đổi mật khẩu bảo mật</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>

      </div>
    </div>
  )
}
