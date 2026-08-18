import { useState, useRef, useEffect } from 'react'

import { Search, ArrowLeft, MessageCircle, AlertCircle, ChevronRight, Phone, Video, Sparkles, MonitorUp, RotateCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import ReportDialog from '@/components/reports/ReportDialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import toastifyCommon from '@/core/lib/toastify-common'
import { cn } from '@/core/lib/utils'
import { consultationApi, type ConsultationProcess, type ConsultationStage, type SubmissionMethod } from '@/core/services/consultation.service'
import { getSocket } from '@/core/services/socket'
import { templateApi } from '@/core/services/template.service'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { type Template } from '@/models/types/form-library'

import LawyerStageChatting from './components/LawyerStageChatting'
import LawyerStageCompleted from './components/LawyerStageCompleted'
import LawyerStagePdfGeneration from './components/LawyerStagePdfGeneration'
import LawyerStagePending from './components/LawyerStagePending'
import LawyerStagePortalSubmitting from './components/LawyerStagePortalSubmitting'

const STAGES: { stage: ConsultationStage; label: string; desc: string }[] = [
  { stage: 'PENDING', label: '1. Chờ duyệt', desc: 'Duyệt yêu cầu tư vấn' },
  { stage: 'CHATTING', label: '2. Trao đổi', desc: 'Thảo luận với khách' },
  { stage: 'PDF_GENERATION', label: '3. Bản báo cáo', desc: 'Soạn thảo ý kiến tư vấn' },
  { stage: 'PORTAL_SUBMITTING', label: '4. Dịch vụ công', desc: 'Nộp hồ sơ Cổng DVC' },
  { stage: 'COMPLETED', label: '5. Hoàn thành', desc: 'Khách đánh giá hồ sơ' }
]

export default function LawyerMessages() {
  const user = useAuthStore((state) => state.user)
  const [processes, setProcesses] = useState<ConsultationProcess[]>([])
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null)
  const [activeStage, setActiveStage] = useState<ConsultationStage>('PENDING')
  const [searchText, setSearchText] = useState<string>('')
  const [inputText, setInputText] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [showMobileList, setShowMobileList] = useState<boolean>(true)

  // Report creation states
  const [adviceSummary, setAdviceSummary] = useState<string>('')
  const [submissionMethod, setSubmissionMethod] = useState<SubmissionMethod>('MANUAL')
  const [submittingReport, setSubmittingReport] = useState<boolean>(false)

  // DVC portal update loading state
  const [updatingPortal, setUpdatingPortal] = useState<boolean>(false)

  // Call and AI assistant states
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null)
  const [isCalling, setIsCalling] = useState<boolean>(false)
  const [callRole, setCallRole] = useState<'caller' | 'callee' | null>(null)
  const [callStatus, setCallStatus] = useState<'ringing' | 'connecting' | 'connected' | 'ended' | null>(null)
  const [callRoomTab, setCallRoomTab] = useState<'report' | 'board' | 'pdf'>('report')
  const [boardNotes, setBoardNotes] = useState<string>('Biên bản thảo luận:\n- Nhận dạng vụ việc: Tranh chấp hợp đồng đặt cọc mua bán nhà đất\n- Phương án xử lý sơ bộ: Yêu cầu bồi thường cọc và phạt cọc gấp đôi\n- Ghi chú bổ sung:\n  ')
  const [aiToggles, setAiToggles] = useState({
    autoRecord: false,
    autoSTT: true,
    autoSummarize: true,
    autoTTS: false
  })
  const [isSharingScreen, setIsSharingScreen] = useState<boolean>(false)
  const [templates, setTemplates] = useState<Template[]>([])

  const activeProcess = processes.find((p) => p.id === activeProcessId)
  const textContent = ((activeProcess?.analysis?.result || '') + ' ' + (activeProcess?.analysis?.context_summary || '')).toLowerCase();
  const suggestedTemplates = templates.filter(t => {
    if (textContent.includes('nhượng quyền') && t.title.includes('nhượng quyền')) return true;
    if ((textContent.includes('doanh nghiệp') || textContent.includes('đăng ký') || textContent.includes('thành lập')) && t.title.includes('doanh nghiệp')) return true;
    if ((textContent.includes('thuê') || textContent.includes('văn phòng') || textContent.includes('nhà')) && t.title.includes('thuê')) return true;
    return false;
  });
  const selectedTemplate = templates.find(t => t.id === activeProcess?.template_id);

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const pendingOfferRef = useRef<any>(null)
  const pendingIceCandidatesRef = useRef<any[]>([])

  const loadProcesses = async (selectFirst = false) => {
    try {
      const data = await consultationApi.getConsultations()
      setProcesses(data || [])
      if (data && data.length > 0) {
        if (selectFirst || !activeProcessId) {
          setActiveProcessId(data[0].id)
          setActiveStage(data[0].current_stage)
        }
      }
    } catch (err) {
      console.error('Failed to load lawyer consultation processes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Hộp thư tư vấn Luật sư | LegalAI'
    loadProcesses(true)

    const fetchTemplates = async () => {
      try {
        const data = await templateApi.listTemplates()
        setTemplates(data || [])
      } catch (err) {
        console.error('Failed to load templates:', err)
      }
    }
    fetchTemplates()
  }, [])

  // Listen for real-time WebSocket updates
  useEffect(() => {
    if (!activeProcessId) return
    const socket = getSocket()

    // Join process room
    socket.emit('join_process', activeProcessId)

    // Listen for events
    socket.on('process_updated', () => {
      loadProcesses(false)
    })

    socket.on('message_received', () => {
      loadProcesses(false)
    })

    // WebRTC signaling
    socket.on('call_incoming', ({ callType: incomingType }) => {
      setCallType(incomingType)
      setCallRole('callee')
      setCallStatus('ringing')
      setIsCalling(true)
    })

    socket.on('call_accepted', () => {
      if (callRole === 'caller') {
        startPeerConnection(true)
      }
    })

    socket.on('webrtc_offer', async ({ offer }) => {
      pendingOfferRef.current = offer
      await processPendingOffer()
    })

    socket.on('webrtc_answer', async ({ answer }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
          await processPendingIceCandidates()
        } catch (err) {
          console.error('Error setting remote description from answer:', err)
        }
      }
    })

    socket.on('webrtc_ice_candidate', async ({ candidate }) => {
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (e) {
          console.error('Error adding ICE candidate:', e)
        }
      } else {
        pendingIceCandidatesRef.current.push(candidate)
      }
    })

    socket.on('end_call', () => {
      handleHangup(false)
    })

    socket.on('board_notes_updated', ({ notes }) => {
      setBoardNotes(notes)
    })

    return () => {
      socket.off('process_updated')
      socket.off('message_received')
      socket.off('call_incoming')
      socket.off('call_accepted')
      socket.off('webrtc_offer')
      socket.off('webrtc_answer')
      socket.off('webrtc_ice_candidate')
      socket.off('end_call')
      socket.off('board_notes_updated')
    }
  }, [activeProcessId, callRole, callType])

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [activeProcessId, activeStage, processes])

  useEffect(() => {
    if (isCalling && (callStatus === 'connecting' || callStatus === 'connected')) {
      if (localVideoRef.current && localStreamRef.current && !localVideoRef.current.srcObject) {
        localVideoRef.current.srcObject = localStreamRef.current
      }
      if (remoteVideoRef.current && remoteStreamRef.current && !remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current
      }
    }
  }, [callStatus, isCalling])

  // Update editor states when active process changes
  useEffect(() => {
    if (activeProcess) {
      setAdviceSummary(activeProcess.advice_summary || '')
      setSubmissionMethod(activeProcess.submission_method || 'MANUAL')
    }
  }, [activeProcessId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !activeProcessId) return

    const textToSend = inputText
    setInputText('')

    try {
      await consultationApi.sendMessage(activeProcessId, textToSend)
      await loadProcesses(false)
    } catch (err) {
      console.error(err)
      toastifyCommon.error('Không thể gửi tin nhắn. Vui lòng thử lại!')
    }
  }

  const handleReject = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối/hủy yêu cầu tư vấn này không?')) return
    try {
      await consultationApi.cancelConsultation(activeProcessId!)
      toastifyCommon.success('Từ chối yêu cầu tư vấn thành công!')
      await loadProcesses(false)
    } catch (err) {
      console.error(err)
      toastifyCommon.error('Không thể từ chối yêu cầu. Vui lòng thử lại!')
    }
  }

  const handleEndChat = async () => {
    if (!activeProcessId) return
    if (!window.confirm('Bạn có chắc chắn muốn kết thúc thảo luận trực tuyến và chuyển sang soạn báo cáo kết luận không?')) return
    try {
      await consultationApi.updateStage(activeProcessId, 'PDF_GENERATION')
      toastifyCommon.success('Đã chuyển sang giai đoạn soạn thảo báo cáo kết quả!')
      setActiveStage('PDF_GENERATION')
      await loadProcesses(false)
    } catch (err) {
      console.error(err)
      toastifyCommon.error('Chuyển giai đoạn thất bại!')
    }
  }

  const processPendingOffer = async () => {
    if (peerConnectionRef.current && pendingOfferRef.current) {
      const offer = pendingOfferRef.current
      pendingOfferRef.current = null
      
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await peerConnectionRef.current.createAnswer()
        await peerConnectionRef.current.setLocalDescription(answer)
        
        const socket = getSocket()
        socket.emit('webrtc_answer', { roomId: activeProcessId, answer })
        await processPendingIceCandidates()
      } catch (err) {
        console.error('Error processing pending offer:', err)
      }
    }
  }

  const processPendingIceCandidates = async () => {
    if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
      const candidates = pendingIceCandidatesRef.current
      pendingIceCandidatesRef.current = []
      for (const candidate of candidates) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (e) {
          console.error('Failed to add queued ICE candidate:', e)
        }
      }
    }
  }

  const startPeerConnection = async (isInitiator: boolean) => {
    try {
      setCallStatus('connecting')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      })
      localStreamRef.current = stream
      
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      peerConnectionRef.current = pc

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      pc.ontrack = (event) => {
        setCallStatus('connected')
        if (event.streams[0]) {
          remoteStreamRef.current = event.streams[0]
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0]
          }
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const socket = getSocket()
          socket.emit('webrtc_ice_candidate', {
            roomId: activeProcessId,
            candidate: event.candidate
          })
        }
      }

      const socket = getSocket()

      if (isInitiator) {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('webrtc_offer', { roomId: activeProcessId, offer })
      } else {
        // Callee processes pending offer if it arrived early
        await processPendingOffer()
      }
    } catch (err) {
      console.error('Failed to start peer connection:', err)
      toastifyCommon.error('Không thể truy cập camera hoặc microphone!')
      handleHangup(false)
    }
  }

  const handleStopScreenShareSilently = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop())
      screenStreamRef.current = null
    }
    if (peerConnectionRef.current && localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video')
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack)
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current
      }
    }
    setIsSharingScreen(false)
  }

  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return
    try {
      if (isSharingScreen) {
        await handleStopScreenShareSilently()
      } else {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        screenStreamRef.current = screenStream
        const screenTrack = screenStream.getVideoTracks()[0]
        const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === 'video')
        if (sender && screenTrack) {
          await sender.replaceTrack(screenTrack)
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream
        }
        screenTrack.onended = () => {
          handleStopScreenShareSilently()
        }
        setIsSharingScreen(true)
      }
    } catch (err) {
      console.error('Failed to toggle screen share:', err)
      toastifyCommon.error('Không thể chia sẻ màn hình!')
    }
  }

  const handleHangup = (notifyPeer = true) => {
    if (notifyPeer && activeProcessId) {
      const socket = getSocket()
      socket.emit('end_call', { roomId: activeProcessId })
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop())
      screenStreamRef.current = null
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }

    remoteStreamRef.current = null
    pendingOfferRef.current = null
    pendingIceCandidatesRef.current = []
    setIsCalling(false)
    setIsSharingScreen(false)
    setCallType(null)
    setCallRole(null)
    setCallStatus(null)
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
  }

  const handleCall = (type: 'voice' | 'video') => {
    if (!activeProcessId) return
    setCallType(type)
    setCallRole('caller')
    setCallStatus('ringing')
    setIsCalling(true)

    const socket = getSocket()
    socket.emit('call_user', { roomId: activeProcessId, callType: type })
  }

  const handleAcceptCall = () => {
    const socket = getSocket()
    socket.emit('accept_call', { roomId: activeProcessId })
    startPeerConnection(false)
  }

  const handleAcceptConsultation = async () => {
    if (!activeProcessId) return
    try {
      await consultationApi.updateStage(activeProcessId, 'CHATTING')
      toastifyCommon.success('Đã chấp nhận yêu cầu tư vấn! Bắt đầu trò chuyện.')
      setActiveStage('CHATTING')
      await loadProcesses(false)
    } catch (err) {
      console.error(err)
      toastifyCommon.error('Duyệt hồ sơ thất bại!')
    }
  }

  const handleSelectTemplate = async (templateId: string) => {
    if (!activeProcessId) return
    try {
      await consultationApi.selectTemplate(activeProcessId, templateId)
      toastifyCommon.success('Đã đề xuất biểu mẫu thành công cho khách hàng!')
      await loadProcesses(false)
    } catch (err) {
      console.error(err)
      toastifyCommon.error('Đề xuất biểu mẫu thất bại!')
    }
  }

  const handleExportPDF = () => {
    if (activeProcess?.pdf_url) {
      window.open(activeProcess.pdf_url, '_blank');
      return;
    }
    const printEl = document.getElementById('pdf-document-print');
    if (!printEl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedTemplate?.title || 'Văn bản tư vấn pháp lý'}</title>
          <style>
            body {
              font-family: Times, "Times New Roman", Georgia, serif;
              padding: 40px;
              font-size: 13px;
              line-height: 1.6;
              color: #111;
            }
            .text-center { text-align: center; }
            .space-y-1 > * { margin-bottom: 4px; }
            .mb-6 { margin-bottom: 24px; }
            .uppercase { text-transform: uppercase; }
            .font-bold { font-weight: bold; }
            .border-b { border-bottom: 1px solid #000; }
            .pb-2 { padding-bottom: 8px; }
            .pb-1 { padding-bottom: 4px; }
            .mt-12 { margin-top: 48px; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: 1fr 1fr; }
            .gap-4 { gap: 16px; }
            .pl-3 { padding-left: 12px; }
            .border-l-2 { border-left: 2px solid #ddd; }
            .italic { font-style: italic; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .min-w-[150px] { min-w: 150px; }
            .underline { text-decoration: underline; }
            .decoration-dotted { text-decoration-style: dotted; }
          </style>
        </head>
        <body>
          ${printEl.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          <\/script>
        </body>
      </html>
    `);
  };

  const handlePublishReport = async () => {
    if (!activeProcessId || !adviceSummary.trim()) {
      toastifyCommon.error('Ý kiến kết luận của luật sư không được để trống!')
      return
    }

    setSubmittingReport(true)
    try {
      await consultationApi.submitPdf(activeProcessId, { adviceSummary, submissionMethod })
      toastifyCommon.success('Xuất bản bản báo cáo tư vấn PDF thành công!')
      
      const nextStage = 'PORTAL_SUBMITTING'
      setActiveStage(nextStage)
      await loadProcesses(false)
    } catch (err) {
      console.error(err)
      toastifyCommon.error('Lỗi khi xuất bản báo cáo!')
    } finally {
      setSubmittingReport(false)
    }
  }

  const handleRevertStage = async (targetStage: ConsultationStage) => {
    if (!activeProcessId) return
    if (!window.confirm(`Bạn có chắc chắn muốn chuyển lùi hồ sơ về giai đoạn "${targetStage}" không?`)) return
    try {
      await consultationApi.updateStage(activeProcessId, targetStage)
      toastifyCommon.success(`Đã chuyển lùi hồ sơ về giai đoạn thành công!`)
      setActiveStage(targetStage)
      await loadProcesses(false)
    } catch (err) {
      console.error(err)
      toastifyCommon.error('Chuyển lùi giai đoạn thất bại!')
    }
  }

  const handleUpdatePortalStatus = async (status: 'APPROVED' | 'REJECTED', feedback: string) => {
    if (!activeProcessId) return
    setUpdatingPortal(true)
    try {
      await consultationApi.mockPortalCallback(activeProcessId, { status, feedback })
      toastifyCommon.success('Cập nhật kết quả giải quyết hồ sơ thành công!')
      setActiveStage('COMPLETED')
      await loadProcesses(false)
    } catch (err) {
      console.error(err)
      toastifyCommon.error('Lỗi khi gửi kết quả giải quyết!')
    } finally {
      setUpdatingPortal(false)
    }
  }

  interface ClientGroup {
    clientId: string
    fullName: string
    avatarUrl: string
    processes: ConsultationProcess[]
  }

  const clientGroups: ClientGroup[] = []
  processes.forEach((p) => {
    const clientId = p.user_id
    const clientName = p.users?.full_name || 'Khách hàng ẩn danh'
    const avatarUrl = p.users?.avatar_url || ''

    let group = clientGroups.find((g) => g.clientId === clientId)
    if (!group) {
      group = { clientId, fullName: clientName, avatarUrl, processes: [] }
      clientGroups.push(group)
    }
    group.processes.push(p)
  })

  const filteredGroups = clientGroups
    .map((g) => {
      const matchesClient = g.fullName.toLowerCase().includes(searchText.toLowerCase())
      const matchingProcesses = g.processes.filter((p) => {
        const summary = p.analysis?.context_summary || 'Tư vấn chuyên sâu'
        return matchesClient || summary.toLowerCase().includes(searchText.toLowerCase())
      })
      return { ...g, processes: matchingProcesses }
    })
    .filter((g) => g.processes.length > 0)

  const isStageReached = (process: ConsultationProcess, stageToCheck: ConsultationStage) => {
    const order: ConsultationStage[] = ['PENDING', 'CHATTING', 'PDF_GENERATION', 'PORTAL_SUBMITTING', 'COMPLETED', 'REVIEWED']
    let current = process.current_stage
    if (current === 'REVIEWED') current = 'COMPLETED'
    
    let target = stageToCheck
    if (target === 'REVIEWED') target = 'COMPLETED'

    const currentIndex = order.indexOf(current)
    const targetIndex = order.indexOf(target)
    return targetIndex <= currentIndex
  }

  const getStageStatusColor = (process: ConsultationProcess, stageToCheck: ConsultationStage) => {
    if (process.current_stage === stageToCheck) return 'border-primary bg-primary text-white animate-pulse'
    if (isStageReached(process, stageToCheck)) return 'border-emerald-500 bg-emerald-50 text-emerald-600'
    return 'border-slate-200 bg-slate-50 text-slate-400'
  }

  return (
    <main className='flex h-[calc(100vh-100px)] w-full overflow-hidden rounded-xl border border-border-secondary bg-background-primary shadow-sm animate-in fade-in duration-300'>
      {/* Left Column: Process List */}
      <section
        className={cn(
          'w-full md:w-[340px] lg:w-[380px] border-r border-border-secondary flex flex-col bg-background-primary shrink-0 transition-all duration-300 md:flex',
          showMobileList ? 'flex' : 'hidden'
        )}
      >
        <header className='p-4 border-b border-border-secondary space-y-3.5'>
          <h1 className='text-lg font-bold text-text-primary flex items-center gap-2'>
            <MessageCircle className='w-5 h-5 text-primary' />
            Hồ sơ yêu cầu từ Khách hàng
          </h1>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-description' />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder='Tìm kiếm khách hàng, hồ sơ...'
              className='pl-9 bg-background-secondary border-border-secondary h-9.5 text-sm rounded-lg focus-visible:ring-primary'
            />
          </div>
        </header>

        <div className='flex-1 overflow-y-auto p-2 space-y-4'>
          {loading ? (
            <div className='flex items-center justify-center p-8'>
              <div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin'></div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <p className='text-xs text-text-description text-center mt-8'>Chưa có yêu cầu tư vấn nào.</p>
          ) : (
            filteredGroups.map((group) => {
              return (
                <div key={group.clientId} className='space-y-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0'>
                  {/* Client Item Header */}
                  <div className='flex items-center gap-2.5 px-2 py-1.5'>
                    <div className='w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0'>
                      {group.avatarUrl ? (
                        <img src={group.avatarUrl} alt={group.fullName} className='w-full h-full object-cover' />
                      ) : (
                        <MessageCircle className='w-4.5 h-4.5 text-slate-400' />
                      )}
                    </div>
                    <div className='min-w-0 text-left'>
                      <h4 className='text-xs font-bold text-text-primary truncate'>{group.fullName}</h4>
                      <p className='text-[10px] text-text-description font-medium'>{group.processes.length} hồ sơ tư vấn</p>
                    </div>
                  </div>

                  {/* Processes list for this Client */}
                  <div className='pl-3.5 space-y-2.5 border-l-2 border-slate-100 ml-4.5'>
                    {group.processes.map((p) => {
                      const isSelected = p.id === activeProcessId
                      return (
                        <div
                          key={p.id}
                          className={cn(
                            'p-2.5 rounded-xl border transition-all duration-200 space-y-2.5 text-left',
                            isSelected
                              ? 'bg-slate-50 border-primary/30 shadow-sm'
                              : 'hover:bg-slate-50/50 border-border-secondary'
                          )}
                        >
                          <button
                            onClick={() => {
                              setActiveProcessId(p.id)
                              setActiveStage(p.current_stage === 'REVIEWED' ? 'COMPLETED' : p.current_stage)
                              setShowMobileList(false)
                            }}
                            className='w-full text-left space-y-1'
                          >
                            <div className='flex items-center justify-between'>
                              <span className='text-[9px] uppercase font-bold text-primary tracking-wider'>
                                Mã: {p.id.slice(0, 8).toUpperCase()}
                              </span>
                              <span className='text-[9px] text-text-description'>
                                {new Date(p.created_at).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            <h5 className='font-bold text-text-primary text-xs line-clamp-1'>
                              {p.analysis?.context_summary || 'Tư vấn chuyên sâu'}
                            </h5>
                          </button>

                          {/* Stage Tree / Timeline */}
                          {isSelected && (
                            <div className='pt-2 border-t border-slate-100 space-y-1.5'>
                              <p className='text-[9px] font-semibold text-text-description mb-1.5'>Tiến trình xử lý:</p>
                              <div className='flex flex-col gap-1.5'>
                                {STAGES.map((s) => {
                                  const reached = isStageReached(p, s.stage)
                                  const active = activeStage === s.stage
                                  return (
                                    <button
                                      key={s.stage}
                                      onClick={() => {
                                        if (reached) setActiveStage(s.stage)
                                      }}
                                      className={cn(
                                        'flex items-center gap-2 p-1.5 rounded-lg text-left text-[11px] font-medium transition-all duration-200 w-full',
                                        active
                                          ? 'bg-primary/5 text-primary'
                                          : reached
                                          ? 'text-slate-700 hover:bg-slate-100/50'
                                          : 'text-slate-400 opacity-60 cursor-not-allowed'
                                      )}
                                      disabled={!reached}
                                    >
                                      <div
                                        className={cn(
                                          'w-4 h-4 rounded-full border flex items-center justify-center font-bold text-[9px] shrink-0',
                                          getStageStatusColor(p, s.stage)
                                        )}
                                      >
                                        {reached && s.stage !== p.current_stage ? '✓' : ''}
                                      </div>
                                      <div className='min-w-0'>
                                        <p className='leading-tight truncate'>{s.label}</p>
                                      </div>
                                      {active && <ChevronRight className='w-3 h-3 ml-auto text-primary' />}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Right Column: Dynamic Stage Content */}
      <section
        className={cn(
          'flex-1 flex flex-col h-full min-w-0 bg-background-secondary transition-all duration-300 md:flex',
          !showMobileList ? 'flex' : 'hidden'
        )}
      >
        {activeProcess ? (
          <>
            {/* Header */}
            <header className='flex items-center justify-between px-4 py-3.5 bg-background-primary border-b border-border-secondary shadow-sm shrink-0 text-left'>
              <div className='flex items-center gap-3 min-w-0'>
                <button
                  onClick={() => setShowMobileList(true)}
                  className='md:hidden p-1.5 rounded-lg text-text-secondary hover:bg-background-secondary shrink-0'
                >
                  <ArrowLeft className='w-5 h-5' />
                </button>
                <div className='min-w-0'>
                  <h2 className='text-sm font-bold text-text-primary truncate'>
                    {activeProcess.analysis?.context_summary || 'Tư vấn chuyên sâu'}
                  </h2>
                  <p className='text-xs text-text-description truncate mt-0.5'>
                    Khách hàng: {activeProcess.users?.full_name || 'Khách hàng ẩn danh'}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-3 shrink-0'>
                <ReportDialog
                  type='USER'
                  targetUserId={activeProcess.users?.id || activeProcess.user_id || null}
                  targetLabel={activeProcess.users?.full_name || 'người dùng'}
                  triggerLabel='Báo cáo người dùng'
                  triggerClassName='h-8 text-xs'
                />
                {activeStage === 'CHATTING' && (
                  <div className='flex items-center gap-1.5 border-r border-border-secondary pr-3 mr-1.5'>
                    <button
                      onClick={() => handleCall('voice')}
                      className='p-1.5 rounded-lg text-text-secondary hover:bg-slate-100 hover:text-primary transition-colors'
                      title='Cuộc gọi thoại'
                    >
                      <Phone className='w-4.5 h-4.5' />
                    </button>
                    <button
                      onClick={() => handleCall('video')}
                      className='p-1.5 rounded-lg text-text-secondary hover:bg-slate-100 hover:text-primary transition-colors'
                      title='Cuộc gọi video'
                    >
                      <Video className='w-4.5 h-4.5' />
                    </button>
                  </div>
                )}
                {activeStage !== 'PENDING' && (
                  <Button
                    onClick={() => {
                      const prevStageMap: Record<ConsultationStage, ConsultationStage> = {
                        PENDING: 'PENDING',
                        CHATTING: 'PENDING',
                        PDF_GENERATION: 'CHATTING',
                        PORTAL_SUBMITTING: 'PDF_GENERATION',
                        COMPLETED: activeProcess.submission_method === 'PORTAL' ? 'PORTAL_SUBMITTING' : 'PDF_GENERATION',
                        REVIEWED: 'COMPLETED',
                        REJECTED: 'PENDING'
                      }
                      handleRevertStage(prevStageMap[activeStage])
                    }}
                    variant='outline'
                    size='sm'
                    className='text-[10px] h-7 font-bold px-2 flex items-center gap-1 border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600'
                    title='Quay lại giai đoạn trước'
                  >
                    <RotateCcw className='w-3 h-3' />
                    Lui bước
                  </Button>
                )}
                <div className='bg-primary/10 text-primary font-bold text-xs px-2.5 py-1 rounded-full'>
                  Giai đoạn: {STAGES.find((s) => s.stage === activeStage)?.label || activeStage}
                </div>
              </div>
            </header>

            {/* Content Panel */}
            <div className='flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/35 text-left'>
              {activeProcess.current_stage === 'REJECTED' ? (
                <div className='max-w-2xl mx-auto space-y-4'>
                  <Card className='p-6 border border-border-secondary bg-background-primary shadow-sm text-center space-y-4'>
                    <div className='w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto border border-red-100'>
                      <AlertCircle className='w-6 h-6' />
                    </div>
                    <h3 className='font-bold text-base text-text-main'>Yêu cầu tư vấn đã bị từ chối hoặc hủy bỏ</h3>
                    <p className='text-sm text-text-description max-w-sm mx-auto'>
                      Yêu cầu tư vấn này đã kết thúc ở trạng thái Đã hủy/Từ chối.
                    </p>
                  </Card>
                </div>
              ) : (
                <>
                  {/* STAGE 1: PENDING */}
                  {activeStage === 'PENDING' && (
                    <LawyerStagePending
                      activeProcess={activeProcess}
                      handleAcceptConsultation={handleAcceptConsultation}
                      handleReject={handleReject}
                    />
                  )}

                  {/* STAGE 2: CHATTING */}
                  {activeStage === 'CHATTING' && (
                    <LawyerStageChatting
                      activeProcess={activeProcess}
                      user={user}
                      inputText={inputText}
                      setInputText={setInputText}
                      handleSend={handleSend}
                      handleEndChat={handleEndChat}
                      scrollContainerRef={scrollContainerRef}
                    />
                  )}

                  {/* STAGE 3: PDF_GENERATION */}
                  {activeStage === 'PDF_GENERATION' && (
                    <LawyerStagePdfGeneration
                      activeProcess={activeProcess}
                      templates={templates}
                      suggestedTemplates={suggestedTemplates}
                      selectedTemplate={selectedTemplate}
                      handleSelectTemplate={handleSelectTemplate}
                      adviceSummary={adviceSummary}
                      setAdviceSummary={setAdviceSummary}
                      submissionMethod={submissionMethod}
                      setSubmissionMethod={setSubmissionMethod}
                      handlePublishReport={handlePublishReport}
                      submittingReport={submittingReport}
                      handleExportPDF={handleExportPDF}
                    />
                  )}

                  {/* STAGE 4: PORTAL_SUBMITTING */}
                  {activeStage === 'PORTAL_SUBMITTING' && (
                    <LawyerStagePortalSubmitting
                      activeProcess={activeProcess}
                      updatingPortal={updatingPortal}
                      handleUpdatePortalStatus={handleUpdatePortalStatus}
                    />
                  )}

                  {/* STAGE 5: COMPLETED */}
                  {activeStage === 'COMPLETED' && (
                    <LawyerStageCompleted
                      activeProcess={activeProcess}
                    />
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className='flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/20'>
            <MessageCircle className='w-12 h-12 text-slate-300 mb-3' />
            <p className='text-sm text-text-description font-medium'>Chọn một hồ sơ từ danh sách bên trái để bắt đầu quản lý tiến trình.</p>
          </div>
        )}
      </section>

      {/* Interactive WebRTC Call Modal / Meeting Room */}
      {isCalling && (
        <div className='fixed inset-0 bg-slate-50 text-text-primary z-50 flex flex-col md:flex-row animate-in fade-in duration-300 font-sans'>
          {callStatus === 'ringing' ? (
            // Ringing Overlay (Caller/Callee Ringing UI)
            <div className='flex-1 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm'>
              <div className='bg-background-primary border border-border-secondary rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-200'>
                {callRole === 'callee' ? (
                  <div className='space-y-6'>
                    <div className='relative w-20 h-20 mx-auto flex items-center justify-center bg-primary/10 rounded-full text-primary border border-primary/20'>
                      {callType === 'voice' ? <Phone className='w-8 h-8 animate-bounce' /> : <Video className='w-8 h-8 animate-bounce' />}
                      <span className='absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-75' />
                    </div>
                    <div>
                      <h3 className='font-bold text-lg text-text-main'>Cuộc gọi đến</h3>
                      <p className='text-xs text-text-description mt-1.5'>
                        Khách hàng đang yêu cầu cuộc gọi {callType === 'voice' ? 'thoại' : 'video'}...
                      </p>
                    </div>
                    <div className='flex justify-center gap-4'>
                      <Button
                        onClick={handleAcceptCall}
                        className='bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-6 rounded-xl shadow-sm'
                      >
                        Trả lời
                      </Button>
                      <Button
                        onClick={() => handleHangup(true)}
                        className='bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-xl shadow-sm'
                      >
                        Từ chối
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className='space-y-6'>
                    <div className='relative w-20 h-20 mx-auto flex items-center justify-center bg-primary/10 rounded-full text-primary border border-primary/20'>
                      {callType === 'voice' ? <Phone className='w-8 h-8 animate-pulse' /> : <Video className='w-8 h-8 animate-pulse' />}
                      <span className='absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-75' />
                    </div>
                    <div>
                      <h3 className='font-bold text-lg text-text-main'>Đang gọi...</h3>
                      <p className='text-xs text-text-description mt-1.5'>Đang chờ khách hàng kết nối máy...</p>
                    </div>
                    <div className='flex justify-center'>
                      <Button
                        onClick={() => handleHangup(true)}
                        className='bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-xl shadow-sm'
                      >
                        Hủy cuộc gọi
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Active Call Room Layout (Split View)
            <>
              {/* Left Workspace Panel */}
              <div className='flex-1 flex flex-col min-w-0 bg-slate-50 h-full overflow-hidden'>
                {/* Workspace Header */}
                <div className='flex items-center justify-between border-b border-border-secondary bg-slate-50/80 px-6 py-3 shrink-0'>
                  <div className='flex items-center gap-2'>
                    <Sparkles className='w-4.5 h-4.5 text-primary' />
                    <h3 className='text-xs font-bold uppercase tracking-wider text-text-main'>Không gian làm việc chung</h3>
                  </div>
                  <div className='flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200'>
                    <button
                      onClick={() => setCallRoomTab('report')}
                      className={cn(
                        'text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all uppercase tracking-wider',
                        callRoomTab === 'report' ? 'bg-white text-primary border border-slate-200 shadow-sm' : 'text-text-secondary hover:text-text-main'
                      )}
                    >
                      Báo cáo AI
                    </button>
                    <button
                      onClick={() => setCallRoomTab('board')}
                      className={cn(
                        'text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all uppercase tracking-wider',
                        callRoomTab === 'board' ? 'bg-white text-primary border border-slate-200 shadow-sm' : 'text-text-secondary hover:text-text-main'
                      )}
                    >
                      Bảng thảo luận
                    </button>
                    <button
                      onClick={() => setCallRoomTab('pdf')}
                      className={cn(
                        'text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all uppercase tracking-wider',
                        callRoomTab === 'pdf' ? 'bg-white text-primary border border-slate-200 shadow-sm' : 'text-text-secondary hover:text-text-main'
                      )}
                    >
                      Tài liệu PDF
                    </button>
                  </div>
                </div>

                {/* Workspace Body */}
                <div className='flex-1 overflow-y-auto bg-slate-50/30 p-6 min-h-0'>
                  {callRoomTab === 'report' && (
                    <div className='text-left max-w-3xl mx-auto'>
                      <div className='p-6 bg-white border border-border-secondary rounded-2xl shadow-sm text-text-primary prose prose-slate prose-sm max-w-none leading-relaxed whitespace-pre-wrap'>
                        {activeProcess?.analysis?.result ? (
                          <ReactMarkdown>{activeProcess.analysis.result}</ReactMarkdown>
                        ) : (
                          <p className='text-text-description italic text-center'>Đang tải tài liệu phân tích pháp lý...</p>
                        )}
                      </div>
                    </div>
                  )}

                  {callRoomTab === 'board' && (
                    <div className='max-w-3xl mx-auto h-full flex flex-col min-h-[400px]'>
                      <div className='flex-1 p-6 bg-white border border-border-secondary rounded-2xl shadow-sm flex flex-col space-y-4 text-left'>
                        <div className='flex items-center justify-between border-b border-border-secondary pb-3'>
                          <div>
                            <h4 className='text-xs font-bold text-text-main uppercase tracking-wider'>Bản ghi chú cuộc họp</h4>
                            <p className='text-[10px] text-text-description mt-0.5'>Cả hai bên có thể cùng ghi chú ý chính</p>
                          </div>
                          <span className='text-[9px] bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded border border-emerald-200'>Đồng bộ thời gian thực</span>
                        </div>
                        <textarea
                          value={boardNotes}
                          onChange={(e) => setBoardNotes(e.target.value)}
                          className='flex-1 w-full bg-slate-50 border border-border-secondary text-text-primary rounded-xl p-4 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed min-h-[300px]'
                          placeholder='Nhập nội dung thảo luận tại đây...'
                        />
                      </div>
                    </div>
                  )}

                  {callRoomTab === 'pdf' && (
                    <div className='flex items-center justify-center min-h-[450px]'>
                      <div className='w-full max-w-lg bg-white text-slate-900 rounded-2xl p-8 shadow-2xl aspect-[1/1.4] overflow-y-auto select-none border border-slate-200 text-left font-serif text-[11px] leading-relaxed relative mx-auto my-4'>
                        <div className='absolute top-3 right-3 text-[9px] bg-slate-100 px-2 py-0.5 rounded font-sans text-slate-500'>Độc quyền LegalAI</div>
                        <h3 className='font-bold text-center text-sm border-b-2 border-slate-800 pb-2.5 mb-4 uppercase tracking-wider font-sans'>Báo Cáo Phân Tích Pháp Lý Sơ Bộ</h3>
                        <p className='mb-2'><strong>Kính gửi:</strong> {activeProcess?.users?.full_name || 'Khách hàng'}</p>
                        <p className='mb-4'><strong>Người thực hiện:</strong> Hệ thống Phân tích Tự động & Xác thực bởi Luật sư</p>
                        <div className='space-y-4 font-sans text-xs'>
                          <div>
                            <h4 className='font-bold border-b border-slate-300 pb-1 mb-1.5 uppercase font-sans text-[10px] text-slate-800'>1. Tóm Tắt Bối Cảnh</h4>
                            <p className='text-slate-600 italic'>{activeProcess?.analysis?.context_summary || 'Chưa cập nhật.'}</p>
                          </div>
                          <div>
                            <h4 className='font-bold border-b border-slate-300 pb-1 mb-1.5 uppercase font-sans text-[10px] text-slate-800'>2. Chẩn Đoán Chi Tiết</h4>
                            <p className='text-slate-600 whitespace-pre-line text-[11px] leading-relaxed'>{activeProcess?.analysis?.result?.slice(0, 400) || 'Đang lập chẩn đoán...'}</p>
                          </div>
                          <p className='text-[9px] text-slate-400 mt-8 pt-4 border-t border-slate-200 text-center font-sans'>Tài liệu này được kết xuất động phục vụ cuộc gọi đàm thoại giữa Khách hàng và Luật sư.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Media Panel */}
              <div className='w-full md:w-80 lg:w-96 border-l border-border-secondary bg-white flex flex-col h-full shrink-0 text-left relative overflow-hidden'>
                {/* Peer streams */}
                <div className='relative w-full aspect-[4/3] bg-slate-950 border-b border-border-secondary flex items-center justify-center overflow-hidden shrink-0'>
                  {callType === 'video' ? (
                    <>
                      <video ref={remoteVideoRef} autoPlay playsInline className='w-full h-full object-cover' />
                      <video ref={localVideoRef} autoPlay playsInline muted className='absolute top-3 right-3 w-20 h-28 object-cover rounded-lg border border-white/30 shadow-lg bg-slate-950' />
                    </>
                  ) : (
                    <div className='space-y-3.5 text-center'>
                      <div className='w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary animate-pulse'>
                        <Phone className='w-6 h-6' />
                      </div>
                      <p className='text-xs text-text-description'>Đang đàm thoại thoại bảo mật...</p>
                      <video ref={remoteVideoRef} autoPlay playsInline className='hidden' />
                      <video ref={localVideoRef} autoPlay playsInline muted className='hidden' />
                    </div>
                  )}

                  {/* Connecting status overlay */}
                  {callStatus === 'connecting' && (
                    <div className='absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center gap-3'>
                      <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin' />
                      <p className='text-[10px] text-slate-400 font-semibold tracking-wider uppercase'>Đang đồng bộ cuộc gọi...</p>
                    </div>
                  )}
                </div>

                {/* Call & Participant Details */}
                <div className='flex-1 p-4 flex flex-col justify-between overflow-y-auto min-h-0 bg-slate-50/30'>
                  <div className='space-y-5'>
                    <div>
                      <h4 className='text-[10px] font-bold text-text-secondary uppercase tracking-wider'>Đang đàm thoại cùng</h4>
                      <h3 className='text-sm font-bold text-text-main mt-1'>
                        {activeProcess?.users?.full_name || 'Khách hàng'}
                      </h3>
                      <p className='text-[10px] text-text-description mt-0.5'>Trạng thái: {callStatus === 'connected' ? 'Đã kết nối' : 'Đang kết nối'}</p>
                    </div>

                    {/* AI assistance quick options */}
                    <div className='space-y-3.5 border-t border-border-secondary pt-4'>
                      <h4 className='text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5'>
                        <Sparkles className='w-3.5 h-3.5 text-primary' /> Trợ lý AI Cuộc gọi
                      </h4>
                      
                      <div className='space-y-3 text-[11px]'>
                        <div className='flex items-center justify-between'>
                          <span className='text-text-primary font-medium'>Ghi âm cuộc gọi</span>
                          <button
                            onClick={() => setAiToggles(prev => ({ ...prev, autoRecord: !prev.autoRecord }))}
                            className={cn('text-[9px] px-2 py-0.5 rounded font-bold transition-all border', aiToggles.autoRecord ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-100 text-text-secondary border-slate-200')}
                          >
                            {aiToggles.autoRecord ? 'BẬT' : 'TẮT'}
                          </button>
                        </div>
                        <div className='flex items-center justify-between'>
                          <span className='text-text-primary font-medium'>Gỡ băng đàm thoại (STT)</span>
                          <button
                            onClick={() => setAiToggles(prev => ({ ...prev, autoSTT: !prev.autoSTT }))}
                            className={cn('text-[9px] px-2 py-0.5 rounded font-bold transition-all border', aiToggles.autoSTT ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-text-secondary border-slate-200')}
                          >
                            {aiToggles.autoSTT ? 'BẬT' : 'TẮT'}
                          </button>
                        </div>
                        <div className='flex items-center justify-between'>
                          <span className='text-text-primary font-medium'>Tự động tóm tắt</span>
                          <button
                            onClick={() => setAiToggles(prev => ({ ...prev, autoSummarize: !prev.autoSummarize }))}
                            className={cn('text-[9px] px-2 py-0.5 rounded font-bold transition-all border', aiToggles.autoSummarize ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-text-secondary border-slate-200')}
                          >
                            {aiToggles.autoSummarize ? 'BẬT' : 'TẮT'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='border-t border-border-secondary pt-4 mt-4 shrink-0 flex items-center justify-between gap-2.5'>
                    <Button
                      onClick={toggleScreenShare}
                      className={cn(
                        'flex-1 font-bold py-2 px-3 rounded-xl shadow-sm text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 border',
                        isSharingScreen
                          ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-100 hover:bg-slate-200 text-text-primary border-slate-200'
                      )}
                    >
                      <MonitorUp className='w-3.5 h-3.5' />
                      {isSharingScreen ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}
                    </Button>
                    <Button
                      onClick={() => handleHangup(true)}
                      className='bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl shrink-0 shadow-sm text-[10px] uppercase tracking-wider border border-red-600'
                    >
                      Gác máy
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  )
}
