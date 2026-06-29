import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Search,
  FileText,
  X,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  AlertCircle,
  User
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toastifyCommon from '@/core/lib/toastify-common'
import { useAppointmentStore, type AppointmentRequest } from '@/core/store/features/appointments'

export default function LawyerAppointments() {
  const { i18n } = useTranslation('common')
  const isEn = i18n.language === 'en'

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all')
  const [selectedRequest, setSelectedRequest] = useState<AppointmentRequest | null>(null)
  
  // Modal state for rejection reason
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectReasonText, setRejectReasonText] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const requestsList = useAppointmentStore((state) => state.requests)
  const updateRequestStatus = useAppointmentStore((state) => state.updateRequestStatus)

  const handleConfirm = (id: string) => {
    updateRequestStatus(id, 'confirmed')
    toastifyCommon.success(
      isEn ? 'Confirmed appointment successfully!' : 'Đã chấp nhận yêu cầu tư vấn thành công!'
    )
    // Update selected request view
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest({ ...selectedRequest, status: 'confirmed' })
    }
  }

  const openRejectModal = (id: string) => {
    setRejectingId(id)
    setRejectReasonText('')
    setIsRejectModalOpen(true)
  }

  const handleRejectSubmit = () => {
    if (!rejectingId) return
    if (!rejectReasonText.trim()) {
      toastifyCommon.error(
        isEn ? 'Please enter a reason for rejection!' : 'Vui lòng nhập lý do từ chối!'
      )
      return
    }

    updateRequestStatus(rejectingId, 'rejected', rejectReasonText)
    toastifyCommon.success(
      isEn ? 'Rejected request successfully!' : 'Đã từ chối yêu cầu tư vấn!'
    )

    if (selectedRequest && selectedRequest.id === rejectingId) {
      setSelectedRequest({ ...selectedRequest, status: 'rejected', rejectReason: rejectReasonText })
    }

    setIsRejectModalOpen(false)
    setRejectingId(null)
    setRejectReasonText('')
  }

  // Filter requests based on tab and search query
  const filteredRequests = useMemo(() => {
    return requestsList.filter((req) => {
      const matchesTab = activeTab === 'all' || req.status === activeTab
      const matchesSearch =
        req.topicVI.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.topicEN.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.id.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesTab && matchesSearch
    })
  }, [requestsList, activeTab, searchQuery])

  // Count requests by status
  const counts = useMemo(() => {
    return {
      all: requestsList.length,
      pending: requestsList.filter((r) => r.status === 'pending').length,
      confirmed: requestsList.filter((r) => r.status === 'confirmed').length,
      rejected: requestsList.filter((r) => r.status === 'rejected').length
    }
  }, [requestsList])

  const renderStatusBadge = (status: 'pending' | 'confirmed' | 'rejected') => {
    switch (status) {
      case 'pending':
        return (
          <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20'>
            <Clock className='w-3 h-3' />
            Chờ duyệt
          </span>
        )
      case 'confirmed':
        return (
          <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'>
            <CheckCircle className='w-3 h-3' />
            Đã xác nhận
          </span>
        )
      case 'rejected':
        return (
          <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20'>
            <XCircle className='w-3 h-3' />
            Đã từ chối
          </span>
        )
    }
  }

  return (
    <div className='flex flex-col h-full lg:p-6 p-4 space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-h4 font-bold text-text-main flex items-center gap-2'>
          <Calendar className='w-6 h-6 text-primary' />
          Quản lý yêu cầu tư vấn
        </h1>
        <p className='text-xs text-text-description mt-1'>
          Xem danh sách và duyệt lịch hẹn trực tiếp từ khách hàng gửi tới bạn.
        </p>
      </div>

      {/* Main Container */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-[500px]'>
        
        {/* Left Side: Requests List */}
        <div className='lg:col-span-5 flex flex-col h-full space-y-4'>
          {/* Search and Tabs */}
          <div className='bg-background-primary rounded-xl border border-border-secondary p-4 space-y-4 shadow-sm'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-description' />
              <Input
                type='text'
                placeholder='Tìm kiếm mã yêu cầu hoặc chủ đề...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9 rounded-lg border-border-secondary'
              />
            </div>

            <div className='flex flex-wrap gap-1.5 border-b border-border-secondary pb-1'>
              {(['all', 'pending', 'confirmed', 'rejected'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                    activeTab === tab
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-description hover:bg-background-secondary hover:text-text-main'
                  }`}
                >
                  <span className='capitalize'>
                    {tab === 'all' ? 'Tất cả' : tab === 'pending' ? 'Chờ duyệt' : tab === 'confirmed' ? 'Đã xác nhận' : 'Từ chối'}
                  </span>
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                      activeTab === tab
                        ? 'bg-white/20 text-white'
                        : 'bg-background-secondary text-text-description'
                    }`}
                  >
                    {counts[tab]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className='flex-1 overflow-y-auto space-y-3 max-h-[600px] pr-1'>
            {filteredRequests.length === 0 ? (
              <div className='bg-background-primary rounded-xl border border-border-secondary p-8 text-center text-text-description'>
                <AlertCircle className='w-10 h-10 text-slate-300 mx-auto mb-3' />
                <p className='text-sm'>Không tìm thấy yêu cầu tư vấn nào.</p>
              </div>
            ) : (
              filteredRequests.map((req) => (
                <motion.div
                  key={req.id}
                  layoutId={`req-card-${req.id}`}
                  onClick={() => setSelectedRequest(req)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedRequest?.id === req.id
                      ? 'bg-background-secondary border-primary/45 shadow-md transform scale-[1.01]'
                      : 'bg-background-primary border-border-secondary hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className='flex justify-between items-start gap-4'>
                    <div className='flex items-center gap-3'>
                      <div className='w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-500 text-xs shrink-0'>
                        {req.id.slice(-2)}
                      </div>
                      <div>
                        <h4 className='font-bold text-xs text-text-main truncate max-w-[180px]'>
                          {isEn ? req.topicEN : req.topicVI}
                        </h4>
                        <p className='text-[10px] text-text-description mt-0.5'>Mã yêu cầu: {req.id}</p>
                      </div>
                    </div>
                    {renderStatusBadge(req.status)}
                  </div>

                  <div className='flex items-center justify-between mt-4 border-t border-border-secondary pt-3 text-[11px] text-text-description'>
                    <span className='flex items-center gap-1'>
                      <Calendar className='w-3.5 h-3.5 text-primary' />
                      {req.date}
                    </span>
                    <span className='flex items-center gap-1 font-semibold text-primary group'>
                      Chi tiết
                      <ChevronRight className='w-3 h-3 transition-transform group-hover:translate-x-0.5' />
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Detail View */}
        <div className='lg:col-span-7 h-full'>
          <AnimatePresence mode='wait'>
            {selectedRequest ? (
              <motion.div
                key={selectedRequest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className='bg-background-primary rounded-xl border border-border-secondary p-6 shadow-sm space-y-6'
              >
                {/* Detail Header */}
                <div className='flex justify-between items-start border-b border-border-secondary pb-4'>
                  <div>
                    <span className='text-xs text-primary font-bold tracking-wider uppercase'>Chi tiết cuộc hẹn</span>
                    <h2 className='text-lg font-bold text-text-main mt-1'>
                      {isEn ? selectedRequest.topicEN : selectedRequest.topicVI}
                    </h2>
                    <p className='text-xs text-text-description mt-0.5'>Mã lịch hẹn: {selectedRequest.id}</p>
                  </div>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className='p-1.5 rounded-lg hover:bg-background-secondary border border-transparent hover:border-border-secondary transition-colors'
                  >
                    <X className='w-4 h-4 text-text-description' />
                  </button>
                </div>

                {/* Info block */}
                <div className='grid grid-cols-2 gap-4 bg-background-secondary p-4 rounded-xl border border-border-secondary'>
                  <div>
                    <span className='text-[10px] text-text-description uppercase tracking-wider block'>Khách hàng</span>
                    <span className='font-bold text-sm text-text-main mt-1 flex items-center gap-1.5'>
                      <User className='w-4 h-4 text-slate-500' />
                      Khách hàng ẩn danh
                    </span>
                  </div>
                  <div>
                    <span className='text-[10px] text-text-description uppercase tracking-wider block'>Ngày gửi yêu cầu</span>
                    <span className='font-semibold text-sm text-text-main mt-1 block'>{selectedRequest.date}</span>
                  </div>
                  <div>
                    <span className='text-[10px] text-text-description uppercase tracking-wider block'>Hình thức tư vấn</span>
                    <span className='font-semibold text-sm text-text-main mt-1 block'>Trực tuyến qua Chatbox</span>
                  </div>
                  <div>
                    <span className='text-[10px] text-text-description uppercase tracking-wider block'>Trạng thái hiện tại</span>
                    <span className='mt-1 block'>{renderStatusBadge(selectedRequest.status)}</span>
                  </div>
                </div>

                {/* Message detail */}
                <div className='space-y-2'>
                  <h4 className='font-bold text-xs text-text-main uppercase tracking-wider'>Nội dung yêu cầu từ khách:</h4>
                  <div className='p-4 rounded-xl border border-border-secondary bg-background-primary text-sm text-text-main leading-relaxed max-h-[200px] overflow-y-auto'>
                    {selectedRequest.message}
                  </div>
                </div>

                {/* Attachments */}
                {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                  <div className='space-y-2'>
                    <h4 className='font-bold text-xs text-text-main uppercase tracking-wider'>Tài liệu đính kèm ({selectedRequest.attachments.length}):</h4>
                    <div className='space-y-2'>
                      {selectedRequest.attachments.map((file, i) => (
                        <div
                          key={i}
                          className='flex items-center justify-between p-3 rounded-lg border border-border-secondary bg-background-secondary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors'
                        >
                          <div className='flex items-center gap-2.5 min-w-0'>
                            <FileText className='w-5 h-5 text-primary shrink-0' />
                            <div className='min-w-0'>
                              <p className='text-xs font-semibold text-text-main truncate'>{file.name}</p>
                              <p className='text-[10px] text-text-description'>{file.size}</p>
                            </div>
                          </div>
                          <Button size='icon' variant='ghost' className='w-8 h-8 rounded-full text-indigo-500'>
                            <Download className='w-4 h-4' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection reason display if rejected */}
                {selectedRequest.status === 'rejected' && selectedRequest.rejectReason && (
                  <div className='p-4 rounded-xl border border-rose-200 bg-rose-50/50 dark:bg-rose-950/15 dark:border-rose-900/35 space-y-1.5'>
                    <span className='text-xs font-bold text-rose-500 block uppercase tracking-wider'>Lý do từ chối:</span>
                    <p className='text-xs text-rose-700 dark:text-rose-300 leading-relaxed'>{selectedRequest.rejectReason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedRequest.status === 'pending' && (
                  <div className='flex gap-3 pt-2'>
                    <Button
                      onClick={() => handleConfirm(selectedRequest.id)}
                      className='flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg'
                    >
                      Chấp nhận cuộc hẹn
                    </Button>
                    <Button
                      onClick={() => openRejectModal(selectedRequest.id)}
                      variant='outline'
                      className='flex-1 border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:border-rose-900/40 dark:hover:bg-rose-950/20'
                    >
                      Từ chối
                    </Button>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className='bg-background-primary rounded-xl border border-border-secondary p-12 text-center text-text-description h-full flex flex-col items-center justify-center shadow-sm'>
                <Calendar className='w-14 h-14 text-slate-200 mb-4' />
                <h3 className='font-semibold text-text-main text-base'>Chưa chọn yêu cầu tư vấn</h3>
                <p className='text-xs mt-1 max-w-sm'>Chọn một yêu cầu ở danh sách bên trái để xem đầy đủ nội dung chi tiết và phê duyệt lịch hẹn.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-background-primary rounded-xl border border-border-secondary p-6 shadow-2xl max-w-md w-full mx-4 space-y-4'
          >
            <div className='flex justify-between items-center'>
              <h3 className='font-bold text-text-main text-base'>Lý do từ chối yêu cầu</h3>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className='p-1 rounded-lg hover:bg-background-secondary border border-transparent'
              >
                <X className='w-4 h-4 text-text-description' />
              </button>
            </div>

            <p className='text-xs text-text-description leading-relaxed'>
              Vui lòng nhập lý do từ chối lịch hẹn tư vấn này để gửi thông báo giải thích cho khách hàng của bạn.
            </p>

            <textarea
              className='w-full min-h-[100px] p-3 rounded-lg border border-border-secondary text-sm text-text-main bg-background-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary'
              placeholder='Nhập lý do tại đây... (Ví dụ: Trùng lịch biểu, Lĩnh vực không đúng chuyên môn...)'
              value={rejectReasonText}
              onChange={(e) => setRejectReasonText(e.target.value)}
            />

            <div className='flex gap-3 justify-end pt-2'>
              <Button
                variant='outline'
                onClick={() => setIsRejectModalOpen(false)}
                className='rounded-lg text-xs'
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleRejectSubmit}
                className='bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold'
              >
                Xác nhận Từ chối
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
