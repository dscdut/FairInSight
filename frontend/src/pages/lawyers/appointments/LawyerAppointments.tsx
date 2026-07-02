import { useState, useEffect, useMemo } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  Search,
  X,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  List,
  Grid,
  ChevronLeft,
  BookOpen,
  Send
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toastifyCommon from '@/core/lib/toastify-common'
import { chatRequestApi, type ChatRequestItem } from '@/core/services/chat-request.service'

export default function LawyerAppointments() {
  const { i18n } = useTranslation('common')
  const isEn = i18n.language === 'en'

  const [requestsList, setRequestsList] = useState<ChatRequestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all')
  const [selectedRequest, setSelectedRequest] = useState<ChatRequestItem | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  // Calendar navigation states
  const [currentDate, setCurrentDate] = useState(new Date())

  // Modal states
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectReasonText, setRejectReasonText] = useState('')
  
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [adviceSummaryText, setAdviceSummaryText] = useState('')

  // Load requests from backend API
  const loadRequests = async () => {
    setIsLoading(true)
    try {
      const data = await chatRequestApi.getReceivedRequests()
      setRequestsList(data || [])
    } catch (err) {
      console.warn('Failed to load received requests from API:', err)
      setRequestsList([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])



  // Status handlers
  const handleConfirm = async (id: string) => {
    try {
      await chatRequestApi.updateRequestStatus(id, { status: 'ACCEPTED' })
      toastifyCommon.success(isEn ? 'Confirmed successfully!' : 'Chấp nhận yêu cầu tư vấn thành công!')
      loadRequests()
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest({ ...selectedRequest, status: 'ACCEPTED' })
      }
    } catch (err) {
      console.error(err)
      toastifyCommon.error(isEn ? 'Action failed!' : 'Thao tác thất bại!')
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return
    if (!rejectReasonText.trim()) {
      toastifyCommon.error(isEn ? 'Please enter a reason!' : 'Vui lòng nhập lý do từ chối!')
      return
    }
    try {
      await chatRequestApi.updateRequestStatus(selectedRequest.id, {
        status: 'REJECTED',
        rescheduleReason: rejectReasonText
      })
      toastifyCommon.success(isEn ? 'Rejected successfully!' : 'Đã từ chối yêu cầu tư vấn!')
      setIsRejectModalOpen(false)
      loadRequests()
      setSelectedRequest({
        ...selectedRequest,
        status: 'REJECTED',
        reschedule_reason: rejectReasonText
      })
    } catch (err) {
      console.error(err)
      toastifyCommon.error('Thao tác thất bại!')
    }
  }

  const handleReschedule = async () => {
    if (!selectedRequest) return
    if (!rescheduleDate) {
      toastifyCommon.error(isEn ? 'Please select a new date/time!' : 'Vui lòng chọn thời gian mới!')
      return
    }
    try {
      await chatRequestApi.updateRequestStatus(selectedRequest.id, {
        status: 'RESCHEDULED',
        proposedDate: new Date(rescheduleDate).toISOString(),
        rescheduleReason: rescheduleReason
      })
      toastifyCommon.success(isEn ? 'Proposed reschedule successfully!' : 'Đã đề xuất đổi lịch hẹn!')
      setIsRescheduleModalOpen(false)
      loadRequests()
      setSelectedRequest({
        ...selectedRequest,
        status: 'RESCHEDULED',
        proposed_date: new Date(rescheduleDate).toISOString(),
        reschedule_reason: rescheduleReason
      })
    } catch (err) {
      console.error(err)
      toastifyCommon.error('Đổi lịch thất bại!')
    }
  }

  const handleComplete = async () => {
    if (!selectedRequest) return
    if (!adviceSummaryText.trim()) {
      toastifyCommon.error(isEn ? 'Please enter advice summary!' : 'Vui lòng viết biên bản tư vấn!')
      return
    }
    try {
      await chatRequestApi.updateRequestStatus(selectedRequest.id, {
        status: 'COMPLETED',
        adviceSummary: adviceSummaryText
      })
      toastifyCommon.success(isEn ? 'Completed consultation successfully!' : 'Hoàn tất tư vấn thành công!')
      setIsCompleteModalOpen(false)
      loadRequests()
      setSelectedRequest({
        ...selectedRequest,
        status: 'COMPLETED',
        advice_summary: adviceSummaryText
      })
    } catch (err) {
      console.error(err)
      toastifyCommon.error('Hoàn tất thất bại!')
    }
  }

  // Filter requests based on tab and search
  const filteredRequests = useMemo(() => {
    return requestsList.filter((req) => {
      const dbStatus = req.status.toLowerCase()
      // Map pending/rescheduled together, accepted/completed together for better filter grouping if desired
      const isPendingGroup = dbStatus === 'pending' || dbStatus === 'rescheduled'
      const isConfirmedGroup = dbStatus === 'accepted' || dbStatus === 'completed'
      
      let matchesTab = true
      if (activeTab === 'pending') matchesTab = isPendingGroup
      else if (activeTab === 'confirmed') matchesTab = isConfirmedGroup
      else if (activeTab === 'rejected') matchesTab = dbStatus === 'rejected'

      const matchesSearch =
        req.analysis?.context_summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.id.toLowerCase().includes(searchQuery.toLowerCase()) || false

      return matchesTab && matchesSearch
    })
  }, [requestsList, activeTab, searchQuery])

  // Count requests by status tabs
  const counts = useMemo(() => {
    return {
      all: requestsList.length,
      pending: requestsList.filter((r) => r.status === 'PENDING' || r.status === 'RESCHEDULED').length,
      confirmed: requestsList.filter((r) => r.status === 'ACCEPTED' || r.status === 'COMPLETED').length,
      rejected: requestsList.filter((r) => r.status === 'REJECTED').length
    }
  }, [requestsList])

  const renderStatusBadge = (status: string) => {
    const s = status.toUpperCase()
    if (s === 'PENDING') {
      return (
        <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20'>
          <Clock className='w-3 h-3' />
          Chờ duyệt
        </span>
      )
    } else if (s === 'RESCHEDULED') {
      return (
        <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20'>
          <Clock className='w-3 h-3' />
          Đã đổi lịch
        </span>
      )
    } else if (s === 'ACCEPTED') {
      return (
        <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'>
          <CheckCircle className='w-3 h-3' />
          Đã xác nhận
        </span>
      )
    } else if (s === 'COMPLETED') {
      return (
        <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20'>
          <CheckCircle className='w-3 h-3' />
          Hoàn thành
        </span>
      )
    } else {
      return (
        <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20'>
          <XCircle className='w-3 h-3' />
          Đã từ chối
        </span>
      )
    }
  }

  // CALENDAR GENERATION HELPERS
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay() // 0 = Sunday, 1 = Monday...
    const totalDays = new Date(year, month + 1, 0).getDate()

    // Adjust firstDayIndex to make Monday start index = 0 (standard Vietnam calendar starting T2)
    // Sunday: getDay() is 0. We want index 6.
    // Monday: getDay() is 1. We want index 0.
    const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1

    const daysArray: (Date | null)[] = []
    
    // Empty cells before first day
    for (let i = 0; i < adjustedFirstDayIndex; i++) {
      daysArray.push(null)
    }

    // Actual day cells
    for (let day = 1; day <= totalDays; day++) {
      daysArray.push(new Date(year, month, day))
    }

    return daysArray
  }, [currentDate])

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const getAppointmentsForDay = (day: Date) => {
    return requestsList.filter((req) => {
      const dateStr = req.proposed_date || req.created_at
      if (!dateStr) return false
      const appDate = new Date(dateStr)
      return (
        appDate.getDate() === day.getDate() &&
        appDate.getMonth() === day.getMonth() &&
        appDate.getFullYear() === day.getFullYear()
      )
    })
  }

  const formatDate = (isoString: string | null) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className='flex flex-col h-full lg:p-6 p-4 space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-h4 font-bold text-text-main flex items-center gap-2'>
            <CalendarIcon className='w-6 h-6 text-primary' />
            Quản lý yêu cầu tư vấn chuyên sâu
          </h1>
          <p className='text-xs text-text-description mt-1'>
            Xem danh sách yêu cầu tư vấn, quản lý thời gian biểu và biên bản tư vấn khách hàng.
          </p>
        </div>

        {/* View mode toggle */}
        <div className='flex p-1 bg-background-secondary border border-border-secondary rounded-xl shrink-0 self-start sm:self-auto shadow-sm'>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-background-primary text-text-main shadow-sm'
                : 'text-text-description hover:text-text-main'
            }`}
          >
            <List className='w-4 h-4' />
            Danh sách
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'calendar'
                ? 'bg-background-primary text-text-main shadow-sm'
                : 'text-text-description hover:text-text-main'
            }`}
          >
            <Grid className='w-4 h-4' />
            Lịch biểu
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-[500px]'>
        
        {/* Left Column: List or Calendar */}
        <div className='lg:col-span-5 flex flex-col h-full space-y-4'>
          {/* SEARCH & FILTERS */}
          <div className='bg-background-primary rounded-xl border border-border-secondary p-4 space-y-4 shadow-sm'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-description' />
              <Input
                type='text'
                placeholder='Tìm kiếm khách hàng, mã lịch...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9 rounded-lg border-border-secondary text-sm'
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
                  <span className='capitalize font-semibold text-[11px] lg:text-xs'>
                    {tab === 'all' ? 'Tất cả' : tab === 'pending' ? 'Chờ duyệt' : tab === 'confirmed' ? 'Xác nhận' : 'Từ chối'}
                  </span>
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
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

          {/* RENDERING DYNAMIC VIEW MODE */}
          {isLoading ? (
            <div className='flex flex-col items-center justify-center min-h-[250px] space-y-2'>
              <div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin'></div>
              <span className='text-xs text-text-description'>Đang tải lịch hẹn...</span>
            </div>
          ) : viewMode === 'list' ? (
            /* LIST VIEW MODE */
            <div className='flex-1 overflow-y-auto space-y-3 max-h-[500px] pr-1'>
              {filteredRequests.length === 0 ? (
                <div className='bg-background-primary rounded-xl border border-border-secondary p-8 text-center text-text-description shadow-sm'>
                  <AlertCircle className='w-10 h-10 text-slate-350 mx-auto mb-3' />
                  <p className='text-xs font-semibold text-text-main'>Không tìm thấy lịch hẹn nào</p>
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <motion.div
                    key={req.id}
                    layoutId={`req-card-${req.id}`}
                    onClick={() => setSelectedRequest(req)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      selectedRequest?.id === req.id
                        ? 'bg-background-secondary border-primary/45 shadow-md'
                        : 'bg-background-primary border-border-secondary hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className='flex justify-between items-start gap-3'>
                      <div className='flex items-center gap-2.5'>
                        <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0'>
                          {req.users?.full_name?.charAt(0) || 'K'}
                        </div>
                        <div className='text-left min-w-0'>
                          <h4 className='font-bold text-xs text-text-main truncate max-w-[150px]'>
                            {req.users?.full_name || 'Khách hàng ẩn danh'}
                          </h4>
                          <p className='text-[10px] text-text-description truncate max-w-[150px] mt-0.5'>
                            {req.analysis?.context_summary || 'Tư vấn pháp lý'}
                          </p>
                        </div>
                      </div>
                      {renderStatusBadge(req.status)}
                    </div>

                    <div className='flex items-center justify-between mt-3.5 border-t border-border-secondary/60 pt-3 text-[10px] text-text-description font-medium'>
                      <span className='flex items-center gap-1.5'>
                        <CalendarIcon className='w-3.5 h-3.5 text-primary' />
                        {formatDate(req.proposed_date || req.created_at)}
                      </span>
                      <span className='flex items-center gap-0.5 text-primary font-bold group'>
                        Duyệt
                        <ChevronRight className='w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5' />
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            /* CALENDAR VIEW MODE (Visual Grid) */
            <div className='bg-background-primary rounded-xl border border-border-secondary p-4 shadow-sm flex flex-col space-y-4'>
              {/* Month Selector header */}
              <div className='flex items-center justify-between'>
                <h3 className='font-bold text-sm text-text-main uppercase tracking-wider'>
                  Tháng {currentDate.getMonth() + 1} / {currentDate.getFullYear()}
                </h3>
                <div className='flex gap-1'>
                  <Button variant='outline' size='icon' className='h-8 w-8 rounded-lg' onClick={prevMonth}>
                    <ChevronLeft className='w-4 h-4' />
                  </Button>
                  <Button variant='outline' size='icon' className='h-8 w-8 rounded-lg' onClick={nextMonth}>
                    <ChevronRight className='w-4 h-4' />
                  </Button>
                </div>
              </div>

              {/* Day Headers */}
              <div className='grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-text-description border-b border-border-secondary pb-2'>
                <span>T2</span>
                <span>T3</span>
                <span>T4</span>
                <span>T5</span>
                <span>T6</span>
                <span>T7</span>
                <span className='text-rose-500'>CN</span>
              </div>

              {/* Grid cell dates */}
              <div className='grid grid-cols-7 gap-1.5'>
                {monthDays.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} className='aspect-square bg-slate-50/50 rounded-lg dark:bg-slate-900/10' />
                  
                  const appts = getAppointmentsForDay(day)
                  const hasAppts = appts.length > 0
                  const isToday = new Date().toDateString() === day.toDateString()

                  return (
                    <button
                      type='button'
                      key={`day-${day.getDate()}`}
                      onClick={() => {
                        if (hasAppts) {
                          setSelectedRequest(appts[0])
                        }
                      }}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-between p-1 border cursor-pointer transition-all relative text-left bg-transparent ${
                        isToday
                          ? 'border-primary bg-primary/5 text-primary font-bold'
                          : hasAppts
                          ? 'border-border-secondary bg-indigo-50/20 hover:border-indigo-400 dark:bg-indigo-950/5'
                          : 'border-transparent hover:bg-background-secondary text-text-main'
                      }`}
                    >
                      <span className='text-[10px] self-start'>{day.getDate()}</span>
                      
                      {/* Appointment dot indicators */}
                      {hasAppts && (
                        <div className='flex gap-0.5 justify-center w-full mb-0.5'>
                           {appts.map((ap) => {
                            const status = ap.status.toUpperCase()
                            const colorClass =
                              status === 'PENDING' || status === 'RESCHEDULED'
                                ? 'bg-amber-500'
                                : status === 'ACCEPTED' || status === 'COMPLETED'
                                ? 'bg-emerald-500'
                                : 'bg-rose-500'
                            return (
                              <span
                                key={ap.id}
                                className={`w-1.5 h-1.5 rounded-full ${colorClass}`}
                                title={ap.analysis?.context_summary || 'Lịch hẹn'}
                              />
                            )
                          })}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Detailed panel */}
        <div className='lg:col-span-7 h-full'>
          <AnimatePresence mode='wait'>
            {selectedRequest ? (
              <motion.div
                key={selectedRequest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className='bg-background-primary rounded-xl border border-border-secondary p-6 shadow-sm space-y-6 text-left'
              >
                {/* Detail Header */}
                <div className='flex justify-between items-start border-b border-border-secondary/60 pb-4'>
                  <div>
                    <span className='text-[10px] text-primary font-bold tracking-wider uppercase'>Chi tiết cuộc hẹn</span>
                    <h2 className='text-base lg:text-lg font-bold text-text-main mt-1'>
                      {selectedRequest.analysis?.context_summary || 'Yêu cầu tư vấn chuyên sâu'}
                    </h2>
                    <p className='text-[10px] text-text-description mt-0.5 font-mono'>Mã lịch hẹn: {selectedRequest.id}</p>
                  </div>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className='p-1.5 rounded-lg hover:bg-background-secondary border border-transparent hover:border-border-secondary transition-colors'
                  >
                    <X className='w-4.5 h-4.5 text-text-description' />
                  </button>
                </div>

                {/* Details blocks grid */}
                <div className='grid grid-cols-2 gap-4 bg-background-secondary p-4 rounded-xl border border-border-secondary text-xs'>
                  <div>
                    <span className='text-[9px] text-text-description uppercase tracking-wider block font-bold'>Khách hàng</span>
                    <span className='font-bold text-text-main mt-1 flex items-center gap-1.5'>
                      <User className='w-4 h-4 text-slate-500' />
                      {selectedRequest.users?.full_name || 'Khách hàng ẩn danh'}
                    </span>
                    <span className='block text-[10px] text-text-description mt-0.5'>{selectedRequest.users?.email}</span>
                  </div>
                  <div>
                    <span className='text-[9px] text-text-description uppercase tracking-wider block font-bold'>Thời gian hẹn</span>
                    <span className='font-bold text-text-main mt-1 block'>
                      {formatDate(selectedRequest.proposed_date || selectedRequest.created_at)}
                    </span>
                  </div>
                  <div>
                    <span className='text-[9px] text-text-description uppercase tracking-wider block font-bold'>Hình thức</span>
                    <span className='font-bold text-text-main mt-1 block'>Trực tuyến qua Chatbox</span>
                  </div>
                  <div>
                    <span className='text-[9px] text-text-description uppercase tracking-wider block font-bold'>Trạng thái hiện tại</span>
                    <span className='mt-1 block'>{renderStatusBadge(selectedRequest.status)}</span>
                  </div>
                </div>

                {/* AI report link info */}
                {selectedRequest.analysis && (
                  <div className='p-4 rounded-xl border border-indigo-150 bg-indigo-50/20 dark:bg-indigo-950/10 dark:border-indigo-900/35 space-y-2 text-xs'>
                    <div className='flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400'>
                      <BookOpen className='w-4.5 h-4.5' />
                      Hồ sơ phân tích AI đính kèm:
                    </div>
                    <p className='text-text-main italic font-medium leading-relaxed'>
                      "{selectedItemText(selectedRequest.analysis.input_data)}"
                    </p>
                    <div className='pt-2 border-t border-indigo-200/50 dark:border-indigo-900/30'>
                      <span className='block font-bold text-[9px] uppercase text-text-description'>Tóm tắt kết luận AI:</span>
                      <p className='text-text-secondary leading-relaxed line-clamp-3 mt-1 whitespace-pre-line'>
                        {selectedRequest.analysis.result}
                      </p>
                    </div>
                  </div>
                )}

                {/* advice summary display if completed */}
                {selectedRequest.status.toUpperCase() === 'COMPLETED' && selectedRequest.advice_summary && (
                  <div className='p-4 rounded-xl border border-purple-200 bg-purple-50/40 dark:bg-purple-950/10 dark:border-purple-900/30 space-y-1.5 text-xs'>
                    <span className='text-[10px] font-bold text-purple-600 block uppercase tracking-wider'>Biên bản kết luận tư vấn:</span>
                    <p className='text-purple-750 dark:text-purple-300 leading-relaxed font-medium whitespace-pre-wrap'>{selectedRequest.advice_summary}</p>
                  </div>
                )}

                {/* reschedule reasons display if rescheduled */}
                {selectedRequest.status.toUpperCase() === 'RESCHEDULED' && selectedRequest.reschedule_reason && (
                  <div className='p-4 rounded-xl border border-blue-200 bg-blue-50/40 dark:bg-blue-950/10 dark:border-blue-900/30 space-y-1.5 text-xs'>
                    <span className='text-[10px] font-bold text-blue-600 block uppercase tracking-wider'>Lý do đổi lịch:</span>
                    <p className='text-blue-750 dark:text-blue-300 leading-relaxed font-medium'>{selectedRequest.reschedule_reason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className='flex flex-wrap gap-2.5 pt-3 border-t border-border-secondary/60'>
                  {/* Pending actions */}
                  {(selectedRequest.status.toUpperCase() === 'PENDING' || selectedRequest.status.toUpperCase() === 'RESCHEDULED') && (
                    <>
                      <Button
                        onClick={() => handleConfirm(selectedRequest.id)}
                        className='flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs h-9'
                      >
                        Chấp nhận cuộc hẹn
                      </Button>
                      <Button
                        onClick={() => {
                          setRescheduleDate('')
                          setRescheduleReason('')
                          setIsRescheduleModalOpen(true)
                        }}
                        className='bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs h-9'
                      >
                        Đổi lịch hẹn
                      </Button>
                      <Button
                        onClick={() => {
                          setRejectReasonText('')
                          setIsRejectModalOpen(true)
                        }}
                        variant='outline'
                        className='border-rose-200 text-rose-500 hover:bg-rose-50 rounded-lg text-xs h-9'
                      >
                        Từ chối
                      </Button>
                    </>
                  )}

                  {/* Confirmed action */}
                  {selectedRequest.status.toUpperCase() === 'ACCEPTED' && (
                    <Button
                      onClick={() => {
                        setAdviceSummaryText('')
                        setIsCompleteModalOpen(true)
                      }}
                      className='w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs h-9 flex items-center justify-center gap-1.5'
                    >
                      <CheckCircle className='w-4.5 h-4.5' />
                      Hoàn thành & Ghi biên bản tư vấn
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className='bg-background-primary rounded-xl border border-border-secondary p-12 text-center text-text-description h-full flex flex-col items-center justify-center shadow-sm min-h-[400px]'>
                <CalendarIcon className='w-14 h-14 text-slate-200 mb-4' />
                <h3 className='font-semibold text-text-main text-base'>Chưa chọn yêu cầu tư vấn</h3>
                <p className='text-xs mt-1 max-w-sm'>Chọn một yêu cầu ở danh sách bên trái hoặc lịch biểu để xem nội dung chi tiết và thao duyệt.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && selectedRequest && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-background-primary rounded-xl border border-border-secondary p-6 shadow-2xl max-w-md w-full space-y-4 text-left'
          >
            <div className='flex justify-between items-center'>
              <h3 className='font-bold text-text-main text-sm lg:text-base'>Từ chối cuộc hẹn tư vấn</h3>
              <button onClick={() => setIsRejectModalOpen(false)} className='p-1 rounded-lg hover:bg-background-secondary border border-transparent'>
                <X className='w-4 h-4 text-text-description' />
              </button>
            </div>
            <p className='text-xs text-text-description leading-relaxed'>
              Vui lòng viết lý do từ chối để gửi thông báo giải thích chi tiết cho khách hàng.
            </p>
            <textarea
              className='w-full min-h-[100px] p-3 rounded-lg border border-border-secondary text-xs text-text-main bg-background-primary focus:outline-none focus:ring-1 focus:ring-primary'
              placeholder='Lý do từ chối...'
              value={rejectReasonText}
              onChange={(e) => setRejectReasonText(e.target.value)}
            />
            <div className='flex gap-2 justify-end pt-2'>
              <Button variant='outline' onClick={() => setIsRejectModalOpen(false)} className='rounded-lg text-xs h-8.5'>Hủy bỏ</Button>
              <Button onClick={handleReject} className='bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold h-8.5'>Xác nhận từ chối</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && selectedRequest && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-background-primary rounded-xl border border-border-secondary p-6 shadow-2xl max-w-md w-full space-y-4 text-left'
          >
            <div className='flex justify-between items-center'>
              <h3 className='font-bold text-text-main text-sm lg:text-base'>Đề xuất thời gian hẹn mới</h3>
              <button onClick={() => setIsRescheduleModalOpen(false)} className='p-1 rounded-lg hover:bg-background-secondary border border-transparent'>
                <X className='w-4 h-4 text-text-description' />
              </button>
            </div>
            <div className='space-y-3.5 text-xs'>
              <div className='space-y-1.5'>
                <label className='block font-bold text-text-main'>Chọn ngày & giờ mới:</label>
                <Input
                  type='datetime-local'
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className='rounded-lg border-border-secondary'
                />
              </div>
              <div className='space-y-1.5'>
                <label className='block font-bold text-text-main'>Lý do đổi lịch (gửi kèm khách hàng):</label>
                <textarea
                  className='w-full min-h-[80px] p-3 rounded-lg border border-border-secondary text-xs text-text-main bg-background-primary focus:outline-none focus:ring-1 focus:ring-primary'
                  placeholder='Ví dụ: Trùng lịch toà án, cần dời lịch sang giờ chiều...'
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                />
              </div>
            </div>
            <div className='flex gap-2 justify-end pt-2'>
              <Button variant='outline' onClick={() => setIsRescheduleModalOpen(false)} className='rounded-lg text-xs h-8.5'>Hủy bỏ</Button>
              <Button onClick={handleReschedule} className='bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold h-8.5'>Gửi đề xuất</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Complete/Advice Summary Modal */}
      {isCompleteModalOpen && selectedRequest && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-background-primary rounded-xl border border-border-secondary p-6 shadow-2xl max-w-lg w-full space-y-4 text-left'
          >
            <div className='flex justify-between items-center'>
              <h3 className='font-bold text-text-main text-sm lg:text-base flex items-center gap-1.5'>
                <Send className='w-5 h-5 text-purple-600' />
                Hoàn thành & Ghi biên bản tư vấn
              </h3>
              <button onClick={() => setIsCompleteModalOpen(false)} className='p-1 rounded-lg hover:bg-background-secondary border border-transparent'>
                <X className='w-4 h-4 text-text-description' />
              </button>
            </div>
            <p className='text-xs text-text-description leading-relaxed'>
              Biên bản tư vấn này sẽ được lưu lại trong lịch sử yêu cầu của khách hàng. Hãy tóm tắt các điểm kết luận và lời khuyên pháp lý quan trọng nhất.
            </p>
            <textarea
              className='w-full min-h-[150px] p-3 rounded-lg border border-border-secondary text-xs text-text-main bg-background-primary focus:outline-none focus:ring-1 focus:ring-primary'
              placeholder='Nhập nội dung ý kiến tư vấn tóm tắt hoặc các bước hướng dẫn pháp luật...'
              value={adviceSummaryText}
              onChange={(e) => setAdviceSummaryText(e.target.value)}
            />
            <div className='flex gap-2 justify-end pt-2'>
              <Button variant='outline' onClick={() => setIsCompleteModalOpen(false)} className='rounded-lg text-xs h-8.5'>Quay lại</Button>
              <Button onClick={handleComplete} className='bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold h-8.5'>Xác nhận hoàn tất</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function selectedItemText(inputData: any) {
  if (!inputData) return ''
  return inputData.question || inputData.text || 'Phân tích tài liệu'
}
