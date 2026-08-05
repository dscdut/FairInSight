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
  AlertCircle
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toastifyCommon from '@/core/lib/toastify-common'
import { useAppointmentStore } from '@/core/store/features/appointments'

interface Attachment {
  name: string
  size: string
  url?: string
}

interface AppointmentRequest {
  id: string
  lawyerName: string
  lawyerAvatar?: string
  date: string
  topicVI: string
  topicEN: string
  message: string
  status: 'pending' | 'confirmed' | 'rejected'
  attachments: Attachment[]
}

export default function Appointments() {
  const { t, i18n } = useTranslation('common')
  const isEn = i18n.language === 'en'

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all')
  const [selectedRequest, setSelectedRequest] = useState<AppointmentRequest | null>(null)

  const requestsList = useAppointmentStore((state) => state.requests)
  const cancelRequest = useAppointmentStore((state) => state.cancelRequest)

  const handleCancel = (id: string) => {
    cancelRequest(id)
    toastifyCommon.success(
      isEn ? 'Cancelled request successfully!' : 'Đã huỷ và xoá yêu cầu tư vấn thành công!'
    )
  }

  // Filter requests based on tab and search query
  const filteredRequests = useMemo(() => {
    return requestsList.filter((req) => {
      const matchesTab = activeTab === 'all' || req.status === activeTab
      const matchesSearch =
        req.lawyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.topicVI.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.topicEN.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.id.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesTab && matchesSearch
    })
  }, [requestsList, activeTab, searchQuery])

  // Count requests by status for tabs badge
  const counts = useMemo(() => {
    return {
      all: requestsList.length,
      pending: requestsList.filter((r) => r.status === 'pending').length,
      confirmed: requestsList.filter((r) => r.status === 'confirmed').length,
      rejected: requestsList.filter((r) => r.status === 'rejected').length
    }
  }, [requestsList])

  // Helper to render status badges
  const renderStatusBadge = (status: 'pending' | 'confirmed' | 'rejected') => {
    switch (status) {
      case 'pending':
        return (
          <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-warning-secondary/15 text-warning-secondary border border-warning-secondary/20'>
            <Clock className='w-3 h-3' />
            {t('common.appointments.statusPending')}
          </span>
        )
      case 'confirmed':
        return (
          <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-success-primary/15 text-success-primary border border-success-primary/20'>
            <CheckCircle className='w-3 h-3' />
            {t('common.appointments.statusConfirmed')}
          </span>
        )
      case 'rejected':
        return (
          <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-error-primary/15 text-error-primary border border-error-primary/20'>
            <XCircle className='w-3 h-3' />
            {t('common.appointments.statusRejected')}
          </span>
        )
    }
  }

  return (
    <div className='w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-left'>
      {/* Title Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-secondary pb-5'>
        <div>
          <h1 className='text-h3 text-text-main'>
            {t('common.appointments.title')}
          </h1>
          <p className='text-sm text-text-secondary mt-1.5'>
            {isEn
              ? 'Track and monitor your legal consultation requests sent to lawyers.'
              : 'Theo dõi và giám sát trạng thái các yêu cầu tư vấn pháp lý bạn đã gửi tới các luật sư.'}
          </p>
        </div>

        {/* Stats card */}
        <div className='flex items-center gap-3 bg-background-secondary border border-border-primary rounded-xl px-4 py-2.5 shadow-sm'>
          <div className='p-2 bg-primary/10 rounded-lg text-primary'>
            <Calendar className='w-5 h-5' />
          </div>
          <div>
            <p className='text-[10px] uppercase font-bold text-text-tertiary tracking-wider'>
              {isEn ? 'Total Appointments' : 'Tổng số lịch hẹn'}
            </p>
            <p className='text-p-medium font-extrabold text-text-primary'>{counts.all}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className='flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-background-secondary p-4 rounded-xl border border-border-primary shadow-200'>
        {/* Search */}
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary' />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.appointments.searchPlaceholder')}
            className='pl-10 h-10 border-border-secondary bg-background-primary text-sm focus-visible:ring-primary focus-visible:ring-1'
          />
        </div>

        {/* Tabs */}
        <div className='flex flex-wrap gap-1.5 p-1 bg-background-tertiary border border-border-primary rounded-lg shrink-0'>
          {(['all', 'pending', 'confirmed', 'rejected'] as const).map((tab) => {
            const isActive = activeTab === tab
            const labelMap = {
              all: t('common.appointments.statusAll'),
              pending: t('common.appointments.statusPending'),
              confirmed: t('common.appointments.statusConfirmed'),
              rejected: t('common.appointments.statusRejected')
            }
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-background-primary text-text-primary shadow-sm border border-border-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {labelMap[tab]}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-background-secondary text-text-secondary'
                  }`}
                >
                  {counts[tab]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Request Grid */}
      <AnimatePresence mode='wait'>
        {filteredRequests.length > 0 ? (
          <motion.div
            key={activeTab + searchQuery}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full'
          >
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className='flex flex-col justify-between bg-background-secondary border border-border-primary rounded-xl p-5 hover:shadow-400 transition-all duration-300 relative group overflow-hidden'
              >
                {/* Visual Accent */}
                <div
                  className={`absolute top-0 left-0 bottom-0 w-1 ${
                    req.status === 'pending'
                      ? 'bg-warning-secondary'
                      : req.status === 'confirmed'
                      ? 'bg-success-primary'
                      : 'bg-error-primary'
                  }`}
                />

                <div className='space-y-3.5 pl-2.5'>
                  {/* Card Header: Lawyer profile and status */}
                  <div className='flex justify-between items-start gap-2'>
                    <div className='flex gap-3 items-center'>
                      <div className='w-11 h-11 rounded-full overflow-hidden shrink-0 border border-border-secondary shadow-sm'>
                        <img
                          src={req.lawyerAvatar || ''}
                          alt={req.lawyerName}
                          className='w-full h-full object-cover'
                        />
                      </div>
                      <div>
                        <h3 className='text-sm font-bold text-text-primary group-hover:text-primary transition-colors'>
                          {req.lawyerName}
                        </h3>
                        <p className='text-xs text-text-tertiary flex items-center gap-1.5 mt-0.5'>
                          <Calendar className='w-3 h-3' />
                          {req.date}
                        </p>
                      </div>
                    </div>
                    {renderStatusBadge(req.status)}
                  </div>

                  {/* Topic and Message Excerpt */}
                  <div className='space-y-1.5'>
                    <div className='flex items-center gap-1.5'>
                      <span className='px-2 py-0.5 bg-background-tertiary rounded text-[10px] font-bold text-text-secondary uppercase border border-border-secondary'>
                        {isEn ? req.topicEN : req.topicVI}
                      </span>
                      <span className='text-[11px] text-text-description font-mono'>
                        {req.id}
                      </span>
                    </div>
                    <p className='text-xs text-text-secondary line-clamp-3 leading-relaxed mt-1'>
                      {req.message}
                    </p>
                  </div>

                  {/* Attachments quick count */}
                  {req.attachments.length > 0 && (
                    <div className='flex items-center gap-1 text-[11px] text-text-tertiary font-semibold'>
                      <FileText className='w-3.5 h-3.5 text-primary' />
                      <span>
                        {req.attachments.length} {isEn ? 'attachment(s)' : 'tài liệu đính kèm'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer action */}
                <div className='border-t border-border-secondary pt-3 flex justify-between items-center gap-2 mt-4 pl-2.5'>
                  <Button
                    onClick={() => handleCancel(req.id)}
                    disabled={req.status !== 'pending'}
                    variant='outline'
                    size='sm'
                    className='h-8 px-2.5 text-[11px] font-bold text-error-primary hover:text-error-hover border-error-primary/20 hover:bg-error-primary/5 disabled:opacity-40 disabled:hover:bg-transparent shrink-0'
                  >
                    {t('common.appointments.cancel')}
                  </Button>
                  <Button
                    onClick={() => setSelectedRequest(req)}
                    variant='ghost'
                    size='sm'
                    className='h-8 px-2 text-[11px] flex items-center gap-0.5 hover:bg-background-tertiary font-bold text-text-primary group/btn shrink-0'
                  >
                    {t('common.appointments.viewDetail')}
                    <ChevronRight className='w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform' />
                  </Button>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='w-full flex flex-col items-center justify-center py-20 px-6 bg-background-secondary/60 border border-border-primary border-dashed rounded-2xl text-center min-h-[300px]'
          >
            <AlertCircle className='w-12 h-12 text-text-tertiary mb-3 animate-pulse' />
            <p className='text-sm text-text-secondary font-medium'>
              {t('common.appointments.noRequests')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Dialog Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className='bg-background-secondary border border-border-secondary w-full max-w-xl rounded-xl shadow-800 text-left overflow-hidden flex flex-col'
            >
              {/* Header */}
              <div className='flex items-center justify-between p-5 border-b border-border-secondary bg-background-tertiary'>
                <div className='space-y-0.5'>
                  <h2 className='text-p-medium font-bold text-text-primary'>
                    {t('common.appointments.detailTitle')}
                  </h2>
                  <p className='text-xs text-text-description font-mono'>
                    ID: {selectedRequest.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className='p-1 rounded-full text-text-description hover:bg-background-secondary hover:text-text-primary transition-colors'
                >
                  <X className='w-4.5 h-4.5' />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className='p-6 space-y-5 overflow-y-auto max-h-[70vh]'>
                {/* Lawyer details and status */}
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-background-primary rounded-lg border border-border-primary'>
                  <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 rounded-full overflow-hidden shrink-0 border border-border-secondary shadow-sm'>
                      <img
                        src={selectedRequest.lawyerAvatar || ''}
                        alt={selectedRequest.lawyerName}
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <div>
                      <p className='text-xs text-text-tertiary font-bold uppercase tracking-wider'>
                        {t('common.appointments.detailLawyer')}
                      </p>
                      <h4 className='text-sm font-extrabold text-text-primary'>
                        {selectedRequest.lawyerName}
                      </h4>
                    </div>
                  </div>
                  <div className='space-y-1 sm:text-right'>
                    <p className='text-[10px] text-text-tertiary font-bold uppercase tracking-wider'>
                      {t('common.appointments.detailStatus')}
                    </p>
                    {renderStatusBadge(selectedRequest.status)}
                  </div>
                </div>

                {/* Topic and Date */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-xs font-bold text-text-tertiary block'>
                      {t('common.appointments.colTopic')}
                    </span>
                    <span className='inline-block px-2.5 py-0.5 bg-background-tertiary rounded text-xs font-semibold text-text-secondary border border-border-secondary'>
                      {isEn ? selectedRequest.topicEN : selectedRequest.topicVI}
                    </span>
                  </div>
                  <div className='space-y-1'>
                    <span className='text-xs font-bold text-text-tertiary block'>
                      {t('common.appointments.detailDate')}
                    </span>
                    <span className='text-xs font-bold text-text-primary flex items-center gap-1.5'>
                      <Calendar className='w-3.5 h-3.5 text-text-description' />
                      {selectedRequest.date}
                    </span>
                  </div>
                </div>

                {/* Description details */}
                <div className='space-y-2'>
                  <span className='text-xs font-bold text-text-tertiary block'>
                    {t('common.appointments.detailMessage')}
                  </span>
                  <div className='p-3.5 bg-background-primary rounded-lg border border-border-primary text-xs text-text-secondary leading-relaxed whitespace-pre-wrap'>
                    {selectedRequest.message}
                  </div>
                </div>

                {/* Attachments */}
                <div className='space-y-2'>
                  <span className='text-xs font-bold text-text-tertiary block'>
                    {t('common.appointments.detailFiles')}
                  </span>
                  {selectedRequest.attachments.length > 0 ? (
                    <div className='space-y-2'>
                      {selectedRequest.attachments.map((file, idx) => (
                        <div
                          key={idx}
                          className='flex items-center justify-between p-2.5 bg-background-primary rounded-lg border border-border-primary text-xs'
                        >
                          <div className='flex items-center gap-2 overflow-hidden mr-2'>
                            <FileText className='w-4 h-4 text-primary shrink-0' />
                            <span className='font-semibold text-text-primary truncate'>
                              {file.name}
                            </span>
                            <span className='text-text-description text-[10px] shrink-0'>
                              ({file.size})
                            </span>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            className={`h-7 w-7 p-0 rounded-full hover:bg-background-tertiary text-text-description hover:text-text-primary shrink-0 ${!file.url ? 'pointer-events-none opacity-50' : ''}`}
                            onClick={() => {
                              if (file.url) {
                                window.open(file.url, '_blank', 'noopener,noreferrer')
                              }
                            }}
                          >
                            <Download className='w-3.5 h-3.5' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-xs text-text-description italic pl-1'>
                      {isEn ? 'No files attached.' : 'Không có tài liệu đính kèm.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className='p-4 border-t border-border-secondary bg-background-tertiary flex justify-end'>
                <Button
                  onClick={() => setSelectedRequest(null)}
                  className='px-5 h-9.5 text-xs font-bold'
                >
                  {t('common.appointments.close')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
