import { useState, useEffect, useMemo } from 'react'

import { motion } from 'framer-motion'
import {
  FileText,
  Search,
  Download,
  Calendar,
  AlertCircle,
  X,
  FileCheck,
  TrendingUp,
  Brain,
  HelpCircle,
  Star,
  ShieldCheck,
  Briefcase
} from 'lucide-react'
import { marked } from 'marked'
import { useTranslation } from 'react-i18next'

import { fetchLawyers } from '@/api/lawyerApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toastifyCommon from '@/core/lib/toastify-common'
import { analysisApi, type AnalysisHistoryItem } from '@/core/services/analysis.service'
import { consultationApi } from '@/core/services/consultation.service'
import { exportAnalysisPdf } from '@/utils/pdfExport'

import ConsultationWorkflow from './components/ConsultationWorkflow'

// Mock fallback data for demonstration when database is empty
const MOCK_HISTORY: AnalysisHistoryItem[] = [
  {
    id: 'ana-1082',
    user_id: 'user-mock-id',
    input_data: {
      question: 'Tư vấn tranh chấp hợp đồng đặt cọc mua bán nhà đất khi bên bán đơn phương chấm dứt.'
    },
    result: `### BẢN PHÂN TÍCH PHÁP LÝ
**Chủ đề:** Tranh chấp hợp đồng đặt cọc mua bán nhà đất
**Ngày lập:** 29/06/2026

#### 1. Căn cứ pháp lý áp dụng
- Bộ luật Dân sự 2015 (Điều 328 về Đặt cọc).
- Luật Đất đai và các văn bản hướng dẫn thi hành.

#### 2. Nhận định tình huống
- Bên mua đã giao tiền đặt cọc đúng hạn và có biên nhận hợp lệ.
- Bên bán đơn phương hủy bỏ giao dịch mà không có lý do bất khả kháng.

#### 3. Khuyến nghị giải quyết
- **Khởi kiện:** Yêu cầu bên bán trả lại tiền đặt cọc và phạt cọc tương đương giá trị đặt cọc theo quy định tại Khoản 2 Điều 328 BLDS 2015.
- **Thương lượng:** Đề xuất mức bồi thường phù hợp trước khi đưa ra tòa án để tiết kiệm thời gian và chi phí.`,
    context_summary: 'Tranh chấp hợp đồng đặt cọc nhà đất',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    deleted_at: null
  },
  {
    id: 'ana-1095',
    user_id: 'user-mock-id',
    input_data: {
      question: 'Quy trình đơn phương ly hôn khi chồng đang ở nước ngoài và không liên lạc được.'
    },
    result: `### BẢN PHÂN TÍCH PHÁP LÝ
**Chủ đề:** Đơn phương ly hôn có yếu tố nước ngoài
**Ngày lập:** 28/06/2026

#### 1. Căn cứ pháp lý áp dụng
- Luật Hôn nhân và Gia đình 2014.
- Bộ luật Tố tụng Dân sự 2015.

#### 2. Nhận định tình huống
- Người chồng đã đi nước ngoài hơn 2 năm, gia đình không liên lạc được và không rõ địa chỉ cụ thể hiện tại.
- Thẩm quyền giải quyết thuộc Tòa án nhân dân cấp Tỉnh.

#### 3. Các bước thực hiện
1. Nộp đơn yêu cầu thông báo tìm kiếm người vắng mặt tại nơi cư trú.
2. Nộp đơn xin ly hôn đơn phương kèm chứng cứ chứng minh mâu thuẫn gia đình.
3. Thực hiện thủ tục niêm yết công khai theo quy định tố tụng dân sự.`,
    context_summary: 'Đơn phương ly hôn có yếu tố nước ngoài',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    deleted_at: null
  }
]

export default function Report() {
  const { i18n } = useTranslation('common')
  const isEn = i18n.language === 'en'

  const [history, setHistory] = useState<AnalysisHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<AnalysisHistoryItem | null>(null)
  const [renderedHtml, setRenderedHtml] = useState<string>('')

  // Consultation states
  const [showConsultation, setShowConsultation] = useState<boolean>(false)
  const [suggestedLawyers, setSuggestedLawyers] = useState<any[]>([])
  const [isLoadingLawyers, setIsLoadingLawyers] = useState<boolean>(false)
  const [requestingLawyerId, setRequestingLawyerId] = useState<string | null>(null)
  const [sentRequests, setSentRequests] = useState<string[]>([])
  const [linkedConsultationId, setLinkedConsultationId] = useState<string | null>(null)

  // Load history from API
  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true)
      try {
        const data = await analysisApi.getAnalysisHistory()
        if (data && data.length > 0) {
          setHistory(data)
        } else {
          // If database has no records, fallback to mock data for visual demonstration
          setHistory(MOCK_HISTORY)
        }
      } catch (err) {
        console.warn('Failed to load analysis history from API, falling back to mock data:', err)
        setHistory(MOCK_HISTORY)
      } finally {
        setIsLoading(false)
      }
    }
    loadHistory()
  }, [])

  // Parse markdown when selectedItem changes
  useEffect(() => {
    if (selectedItem?.result) {
      try {
        const parsed = marked.parse(selectedItem.result)
        if (typeof parsed === 'string') {
          setRenderedHtml(parsed)
        } else {
          parsed.then((html) => setRenderedHtml(html))
        }
      } catch (err) {
        console.error(err)
        setRenderedHtml(selectedItem.result || '')
      }

      // Check for active consultation process for this analysis report
      const checkActiveConsultation = async () => {
        try {
          const res = await consultationApi.getConsultationByAnalysis(selectedItem!.id)
          if (res) {
            setLinkedConsultationId(res.id)
            setShowConsultation(true)
          } else {
            setLinkedConsultationId(null)
          }
        } catch (err) {
          console.error('Failed to check active consultation:', err)
          setLinkedConsultationId(null)
        }
      }
      checkActiveConsultation()

    } else {
      setRenderedHtml('')
      setShowConsultation(false)
      setSuggestedLawyers([])
      setSentRequests([])
      setLinkedConsultationId(null)
    }
  }, [selectedItem])

  const detectDomain = (summary: string | null) => {
    if (!summary) return null
    const text = summary.toLowerCase()
    if (text.includes('lao động') || text.includes('work') || text.includes('hợp đồng lao động')) return 'lao_dong'
    if (text.includes('đất') || text.includes('đất đai') || text.includes('nhà đất') || text.includes('land')) return 'dat_dai'
    if (text.includes('hình sự') || text.includes('tội') || text.includes('criminal')) return 'hinh_su'
    if (text.includes('hôn nhân') || text.includes('ly hôn') || text.includes('gia đình')) return 'hon_nhan'
    if (text.includes('doanh nghiệp') || text.includes('công ty') || text.includes('kinh doanh')) return 'doanh_nghiep'
    return 'dan_su'
  }

  const handleOpenConsultation = async (item: AnalysisHistoryItem) => {
    setShowConsultation(true)
    setIsLoadingLawyers(true)
    try {
      const domain = detectDomain(item.context_summary)
      const lawyers = await fetchLawyers(domain, true)
      setSuggestedLawyers(lawyers)
    } catch (err) {
      console.error(err)
      toastifyCommon.error('Không thể tải danh sách luật sư đề xuất!')
    } finally {
      setIsLoadingLawyers(false)
    }
  }

  const handleRequestConsultation = async (lawyerId: string) => {
    if (!selectedItem) return
    setRequestingLawyerId(lawyerId)
    try {
      const res = await consultationApi.createConsultation({
        lawyerId,
        analysisId: selectedItem.id
      })
      setLinkedConsultationId(res.id)
      setSentRequests((prev) => [...prev, lawyerId])
      toastifyCommon.success('Gửi yêu cầu tư vấn thành công! Tiến trình tư vấn đã bắt đầu.')
    } catch (err) {
      console.error(err)
      toastifyCommon.error('Không thể gửi yêu cầu tư vấn. Vui lòng thử lại!')
    } finally {
      setRequestingLawyerId(null)
    }
  }

  // Filter history based on search query
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchSummary = item.context_summary?.toLowerCase().includes(searchQuery.toLowerCase()) || false
      const matchId = item.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchQuestion = item.input_data?.question?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.input_data?.text?.toLowerCase().includes(searchQuery.toLowerCase()) || false
      
      return matchSummary || matchId || matchQuestion
    })
  }, [history, searchQuery])

  // Export selected analysis to PDF
  const handleExportPDF = async (item: AnalysisHistoryItem) => {
    if (!item.result) return
    try {
      await exportAnalysisPdf(item.result, { title: item.context_summary || 'Bản phân tích pháp lý' })
      toastifyCommon.success(isEn ? 'Exported PDF successfully!' : 'Xuất file PDF báo cáo thành công!')
    } catch (err) {
      console.error('Failed to export PDF:', err)
      toastifyCommon.error(isEn ? 'Export failed!' : 'Xuất file PDF thất bại!')
    }
  }

  const formatDate = (isoString: string) => {
    const d = new Date(isoString)
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className='flex flex-col h-full lg:p-6 p-4 space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-h4 font-bold text-text-main flex items-center gap-2'>
            <FileCheck className='w-6 h-6 text-primary' />
            Báo cáo phân tích pháp lý
          </h1>
          <p className='text-xs text-text-description mt-1'>
            Xem lịch sử tất cả các bản phân tích văn bản và tình huống pháp luật do AI thực hiện cho bạn.
          </p>
        </div>

        {/* Dashboard Stat Quick View */}
        <div className='flex items-center gap-4 bg-background-secondary p-3 rounded-xl border border-border-secondary shrink-0'>
          <div className='flex items-center gap-2 pr-3 border-r border-border-secondary'>
            <Brain className='w-4.5 h-4.5 text-primary' />
            <div className='text-left'>
              <span className='block text-[10px] text-text-description uppercase tracking-wider font-semibold'>Tổng số phân tích</span>
              <span className='font-bold text-sm text-text-main'>{history.length} bản báo cáo</span>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <TrendingUp className='w-4.5 h-4.5 text-emerald-500' />
            <div className='text-left'>
              <span className='block text-[10px] text-text-description uppercase tracking-wider font-semibold'>Tháng này</span>
              <span className='font-bold text-sm text-text-main'>+{history.length} yêu cầu</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className='space-y-4'>
        {/* Search Bar */}
        <div className='bg-background-primary rounded-xl border border-border-secondary p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between'>
          <div className='relative w-full sm:max-w-md'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-description' />
            <Input
              type='text'
              placeholder='Tìm kiếm chủ đề, mã báo cáo, câu hỏi...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9 rounded-lg border-border-secondary text-sm'
            />
          </div>
          <div className='text-xs text-text-description font-semibold'>
            Hiển thị {filteredHistory.length} trên {history.length} bản ghi
          </div>
        </div>

        {/* History Grid */}
        {isLoading ? (
          <div className='flex flex-col items-center justify-center min-h-[300px] space-y-3'>
            <div className='w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin'></div>
            <p className='text-xs text-text-description'>Đang tải lịch sử báo cáo...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className='bg-background-primary rounded-xl border border-border-secondary p-12 text-center text-text-description shadow-sm'>
            <AlertCircle className='w-12 h-12 text-slate-300 mx-auto mb-3' />
            <h3 className='font-semibold text-text-main text-base'>Không tìm thấy báo cáo nào</h3>
            <p className='text-xs mt-1 max-w-sm mx-auto'>
              Hãy thử tìm kiếm với từ khóa khác hoặc gửi yêu cầu phân tích mới tại cổng trợ lý pháp lý AI.
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
            {filteredHistory.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className='flex flex-col justify-between p-5 rounded-xl border border-border-secondary bg-background-primary hover:border-primary/40 hover:shadow-md transition-all group'
              >
                <div>
                  <div className='flex items-center justify-between mb-3.5'>
                    <span className='text-[10px] text-text-description font-bold bg-background-secondary border border-border-secondary px-2 py-0.5 rounded uppercase tracking-wider'>
                      Mã: {item.id.split('-').pop() || item.id}
                    </span>
                    <span className='text-xs text-text-description flex items-center gap-1 font-medium'>
                      <Calendar className='w-3.5 h-3.5 text-slate-400' />
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  <h3 className='font-bold text-sm text-text-main group-hover:text-primary transition-colors line-clamp-1'>
                    {item.context_summary || 'Phân tích tình huống pháp lý'}
                  </h3>

                  <p className='text-xs text-text-description line-clamp-3 mt-2 leading-relaxed'>
                    {item.input_data?.question || item.input_data?.text || 'Nội dung câu hỏi rỗng...'}
                  </p>
                </div>

                <div className='flex items-center gap-2 mt-5 pt-4 border-t border-border-secondary'>
                  <Button
                    onClick={() => setSelectedItem(item)}
                    variant='outline'
                    size='sm'
                    className='flex-1 text-xs font-semibold rounded-lg'
                  >
                    Xem chi tiết
                  </Button>
                  <Button
                    onClick={() => handleExportPDF(item)}
                    size='sm'
                    className='px-3 rounded-lg text-white font-semibold'
                    title='Tải PDF'
                  >
                    <Download className='w-4 h-4' />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto'>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-background-primary rounded-xl border border-border-secondary w-full shadow-2xl flex flex-col max-h-[85vh] transition-all duration-300 ${
              showConsultation ? 'max-w-5xl' : 'max-w-3xl'
            }`}
          >
            {/* Modal Header */}
            <div className='flex justify-between items-center p-5 border-b border-border-secondary shrink-0'>
              <div className='flex items-center gap-2.5'>
                <FileText className='w-5.5 h-5.5 text-primary' />
                <div className='text-left'>
                  <h3 className='font-bold text-text-main text-sm lg:text-base'>
                    {selectedItem.context_summary || 'Bản phân tích pháp lý'}
                  </h3>
                  <p className='text-[10px] text-text-description mt-0.5'>
                    Mã báo cáo: {selectedItem.id} · Ngày tạo: {formatDate(selectedItem.created_at)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className='p-1.5 rounded-lg hover:bg-background-secondary border border-transparent hover:border-border-secondary transition-colors'
              >
                <X className='w-4.5 h-4.5 text-text-description' />
              </button>
            </div>

            {/* Modal Body */}
            <div className='p-6 overflow-y-auto text-left flex-1'>
              <div className={showConsultation ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : 'space-y-5'}>
                {/* Column 1: AI report detail */}
                <div className={showConsultation ? 'lg:col-span-7 space-y-5 overflow-y-auto max-h-[55vh] pr-2' : 'space-y-5'}>
                  {/* Question area */}
                  <div className='space-y-1.5'>
                    <h4 className='text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5'>
                      <HelpCircle className='w-4 h-4 text-indigo-500' />
                      Câu hỏi / Tình huống phân tích:
                    </h4>
                    <div className='p-4 rounded-xl bg-background-secondary border border-border-secondary text-sm text-text-main italic leading-relaxed'>
                      {selectedItem.input_data?.question || selectedItem.input_data?.text || 'Nội dung câu hỏi không khả dụng.'}
                    </div>
                  </div>

                  {/* Result markdown area */}
                  <div className='space-y-1.5 pt-2'>
                    <h4 className='text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5'>
                      <Brain className='w-4 h-4 text-primary' />
                      Kết quả phân tích từ AI:
                    </h4>
                    <div 
                      className='p-5 rounded-xl border border-border-secondary bg-background-primary text-sm text-text-main leading-relaxed overflow-y-auto max-h-[300px] markdown-body prose dark:prose-invert max-w-none'
                      dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    />
                  </div>
                </div>

                {/* Column 2: Recommended Lawyers or active consultation workflow */}
                {showConsultation && (
                  <div className='lg:col-span-5 border-t lg:border-t-0 lg:border-l border-border-secondary pt-5 lg:pt-0 lg:pl-6 space-y-4 flex flex-col max-h-[55vh]'>
                    {linkedConsultationId ? (
                      <ConsultationWorkflow
                        consultationId={linkedConsultationId}
                        onClose={() => setLinkedConsultationId(null)}
                      />
                    ) : (
                      <>
                        <h4 className='text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5 shrink-0'>
                          <Briefcase className='w-4 h-4 text-primary' />
                          Đề xuất Luật sư phù hợp:
                        </h4>

                        {isLoadingLawyers ? (
                          <div className='flex-1 flex flex-col items-center justify-center py-10 space-y-2'>
                            <div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin'></div>
                            <span className='text-[11px] text-text-description'>Đang tìm luật sư phù hợp...</span>
                          </div>
                        ) : suggestedLawyers.length === 0 ? (
                          <div className='flex-1 flex flex-col items-center justify-center py-10 text-center text-text-description border border-dashed border-border-secondary rounded-xl bg-background-secondary p-4'>
                            <AlertCircle className='w-8 h-8 text-slate-300 mb-2' />
                            <p className='text-xs font-semibold text-text-main'>Không có luật sư trực tuyến</p>
                            <p className='text-[10px] mt-1'>Hiện tại chưa có luật sư thuộc chuyên môn phù hợp đang trực tuyến.</p>
                          </div>
                        ) : (
                          <div className='space-y-3 overflow-y-auto pr-1 flex-1'>
                            {suggestedLawyers.map((lawyer) => {
                              const isSent = sentRequests.includes(lawyer.id)
                              const isSending = requestingLawyerId === lawyer.id
                              return (
                                <div key={lawyer.id} className='p-3 rounded-xl border border-border-secondary bg-background-secondary hover:border-primary/30 transition-all flex flex-col gap-2.5 text-xs'>
                                  <div className='flex items-start gap-2.5'>
                                    <a
                                      href={`/lawyers/${lawyer.id}`}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className='w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border-primary shadow-sm hover:opacity-80 transition-opacity block'
                                      title='Xem hồ sơ chi tiết'
                                    >
                                      <img src={lawyer.avatar || '/placeholder-avatar.png'} alt={lawyer.name} className='w-full h-full object-cover' />
                                    </a>
                                    <div className='flex-1 text-left min-w-0'>
                                      <h5 className='font-bold text-text-main truncate text-xs flex items-center gap-1'>
                                        <a
                                          href={`/lawyers/${lawyer.id}`}
                                          target='_blank'
                                          rel='noopener noreferrer'
                                          className='hover:text-primary transition-colors flex items-center gap-1'
                                          title='Xem hồ sơ chi tiết'
                                        >
                                          {lawyer.name}
                                          <ShieldCheck className='w-3.5 h-3.5 text-primary shrink-0' />
                                        </a>
                                      </h5>
                                      <p className='text-[9px] text-text-description font-semibold uppercase tracking-wide mt-0.5'>{lawyer.specialty}</p>
                                      <div className='flex items-center gap-2 mt-0.5'>
                                        <span className='flex items-center gap-0.5 text-amber-500 font-bold text-[10px]'>
                                          <Star className='w-2.5 h-2.5 fill-amber-500' />
                                          {lawyer.rating ? lawyer.rating.toFixed(1) : '5.0'}
                                        </span>
                                        <span className='text-[9px] text-text-description'>• {lawyer.experienceYears || 3} năm KN</span>
                                      </div>
                                    </div>
                                  </div>

                                  {lawyer.bio && (
                                    <p className='text-[10px] text-text-secondary line-clamp-2 italic leading-relaxed'>{lawyer.bio}</p>
                                  )}

                                  <div className='flex items-center justify-between gap-2 pt-2 border-t border-border-secondary/60'>
                                    <div className='text-left'>
                                      <span className='block text-[8px] text-text-description uppercase font-bold'>Biểu phí tư vấn</span>
                                      <span className='font-bold text-text-main text-[11px]'>
                                        {lawyer.pricePerHour ? `${Number(lawyer.pricePerHour).toLocaleString('vi-VN')} đ/h` : 'Miễn phí'}
                                      </span>
                                    </div>

                                    <Button
                                      size='sm'
                                      onClick={() => handleRequestConsultation(lawyer.id)}
                                      disabled={isSent || isSending}
                                      className={`text-[9px] font-bold h-6 rounded px-2.5 transition-all ${
                                        isSent
                                          ? 'bg-slate-100 text-slate-450 border border-slate-200 hover:bg-slate-100 cursor-not-allowed shadow-none'
                                          : 'bg-primary hover:bg-primary-600 text-white'
                                      }`}
                                    >
                                      {isSending ? (
                                        <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                                      ) : isSent ? (
                                        'Đã gửi yêu cầu'
                                      ) : (
                                        'Gửi yêu cầu'
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className='flex gap-3 justify-end p-4 border-t border-border-secondary shrink-0 bg-background-secondary rounded-b-xl'>
              <Button
                variant='outline'
                onClick={() => setSelectedItem(null)}
                className='rounded-lg text-xs font-semibold'
              >
                Đóng lại
              </Button>
              <Button
                onClick={() => handleExportPDF(selectedItem)}
                className='bg-background-primary hover:bg-background-secondary border border-border-secondary text-text-main rounded-lg flex items-center gap-1.5 text-xs font-semibold'
              >
                <Download className='w-4 h-4' />
                Tải xuống PDF
              </Button>
              {!showConsultation && (
                <Button
                  onClick={() => handleOpenConsultation(selectedItem)}
                  className='bg-primary hover:bg-primary-600 text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold'
                >
                  <Brain className='w-4 h-4 text-white' />
                  Tư vấn chuyên sâu cùng Luật sư
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
