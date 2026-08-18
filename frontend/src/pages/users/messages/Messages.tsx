import { useState, useRef, useEffect } from 'react'

import axios from 'axios'
import { Search, Send, ArrowLeft, MessageCircle, FileText, Clock, Download, AlertCircle, ChevronRight, Phone, Video, Sparkles, MonitorUp, Pin } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import ReportDialog from '@/components/reports/ReportDialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import toastifyCommon from '@/core/lib/toastify-common'
import { cn } from '@/core/lib/utils'
import { consultationApi, type ConsultationProcess, type ConsultationStage } from '@/core/services/consultation.service'
import { getSocket } from '@/core/services/socket'
import { templateApi } from '@/core/services/template.service'
import { useAuthStore } from '@/core/store/features/auth/authStore'
import { type Template } from '@/models/types/form-library'
import ClientStageCompleted from '@/pages/users/report/components/stages/ClientStageCompleted'
import ClientStagePdfGeneration from '@/pages/users/report/components/stages/ClientStagePdfGeneration'
import ClientStagePortalSubmitting from '@/pages/users/report/components/stages/ClientStagePortalSubmitting'

const STAGES: { stage: ConsultationStage; label: string; desc: string }[] = [
  { stage: 'PENDING', label: '1. Chờ duyệt', desc: 'Yêu cầu tư vấn mới gửi' },
  { stage: 'CHATTING', label: '2. Trao đổi', desc: 'Hội thoại trực tiếp' },
  { stage: 'PDF_GENERATION', label: '3. Bản báo cáo', desc: 'Ý kiến tư vấn bằng văn bản' },
  { stage: 'PORTAL_SUBMITTING', label: '4. Dịch vụ công', desc: 'Nộp hồ sơ DVC trực tuyến' },
  { stage: 'COMPLETED', label: '5. Hoàn thành', desc: 'Đánh giá & nghiệm thu' }
]

export default function Messages() {
  const user = useAuthStore((state) => state.user)
  const [processes, setProcesses] = useState<ConsultationProcess[]>([])
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null)
  const [activeStage, setActiveStage] = useState<ConsultationStage>('PENDING')
  const [searchText, setSearchText] = useState<string>('')
  const [inputText, setInputText] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [showMobileList, setShowMobileList] = useState<boolean>(true)

  // Review states
  const [rating, setRating] = useState<number>(5)
  const [reviewComment, setReviewComment] = useState<string>('')
  const [submittingReview, setSubmittingReview] = useState<boolean>(false)
  const [submittingData, setSubmittingData] = useState<boolean>(false)

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
  const [pinnedVideo, setPinnedVideo] = useState<'remote' | 'local'>('remote')
  const [layoutMode, setLayoutMode] = useState<'split' | 'video-focus'>('split')

  const [templates, setTemplates] = useState<Template[]>([])
  const [formValues, setFormValues] = useState<Record<string, string>>({})

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
        } else {
          // Sync stage of the selected process if it updated
          const current = data.find((p) => p.id === activeProcessId)
          if (current) {
            // Keep user's activeStage selection unless it was not selected
          }
        }
      }
    } catch (err) {
      console.error('Failed to load consultation processes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Hộp thư tư vấn | LegalAI'
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

  const activeProcess = processes.find((p) => p.id === activeProcessId)
  const selectedTemplate = templates.find(t => t.id === activeProcess?.template_id);

  // Initialize formValues when selectedTemplate or activeProcess.template_data changes
  useEffect(() => {
    if (selectedTemplate) {
      setFormValues(prev => {
        const initial = { ...prev };
        const dbData = (activeProcess?.template_data as Record<string, string>) || {};
        
        selectedTemplate.fields?.forEach((sec) => {
          sec.inputs.forEach((input) => {
            if (initial[input.key] === undefined || initial[input.key] === '') {
              initial[input.key] = dbData[input.key] !== undefined ? dbData[input.key] : (input.defaultValue || '');
            }
          });
        });
        return initial;
      });
    }
  }, [selectedTemplate, activeProcess?.template_data]);

  const handleSubmitTemplateData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProcessId || submittingData) return;

    const missingFields: string[] = [];
    selectedTemplate?.fields?.forEach(sec => {
      sec.inputs.forEach(inp => {
        if (inp.required && !formValues[inp.key]) {
          missingFields.push(inp.label);
        }
      });
    });

    if (missingFields.length > 0) {
      toastifyCommon.error(`Vui lòng điền: ${missingFields.join(', ')}`);
      return;
    }

    setSubmittingData(true);
    try {
      await consultationApi.submitTemplateData(activeProcessId, formValues);
      toastifyCommon.success('Gửi dữ liệu biểu mẫu thành công!');
      await loadProcesses(false);
    } catch (err) {
      if (axios.isCancel(err)) {
        return;
      }
      console.error(err);
      toastifyCommon.error('Gửi dữ liệu biểu mẫu thất bại!');
    } finally {
      setSubmittingData(false);
    }
  };


  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !activeProcessId) return

    const textToSend = inputText
    setInputText('')

    try {
      await consultationApi.sendMessage(activeProcessId, textToSend)
      // Instant reload
      await loadProcesses(false)
    } catch (err) {
      console.error('Failed to send message:', err)
      toastifyCommon.error('Không thể gửi tin nhắn. Vui lòng thử lại!')
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu tư vấn này không?')) return
    try {
      await consultationApi.cancelConsultation(activeProcessId!)
      toastifyCommon.success('Hủy yêu cầu tư vấn thành công!')
      await loadProcesses(false)
    } catch (err) {
      console.error(err)
      toastifyCommon.error('Không thể hủy yêu cầu tư vấn. Vui lòng thử lại!')
    }
  }

  const handleReviewSubmit = async () => {
    if (!activeProcessId) return
    setSubmittingReview(true)
    try {
      await consultationApi.submitReview(activeProcessId, { rating, reviewComment })
      toastifyCommon.success('Gửi đánh giá thành công! Cảm ơn bạn.')
      await loadProcesses(false)
    } catch (err) {
      console.error(err)
      toastifyCommon.error('Đánh giá thất bại. Vui lòng thử lại!')
    } finally {
      setSubmittingReview(false)
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

  interface LawyerGroup {
    lawyerId: string
    fullName: string
    avatarUrl: string
    processes: ConsultationProcess[]
  }

  const lawyerGroups: LawyerGroup[] = []
  processes.forEach((p) => {
    const lawyerId = p.lawyer_id
    const lawyerName = p.lawyer_details?.users?.full_name || 'Luật sư chuyên nghiệp'
    const avatarUrl = p.lawyer_details?.users?.avatar_url || ''

    let group = lawyerGroups.find((g) => g.lawyerId === lawyerId)
    if (!group) {
      group = { lawyerId, fullName: lawyerName, avatarUrl, processes: [] }
      lawyerGroups.push(group)
    }
    group.processes.push(p)
  })

  const filteredGroups = lawyerGroups
    .map((g) => {
      const matchesLawyer = g.fullName.toLowerCase().includes(searchText.toLowerCase())
      const matchingProcesses = g.processes.filter((p) => {
        const summary = p.analysis?.context_summary || 'Tư vấn chuyên sâu'
        return matchesLawyer || summary.toLowerCase().includes(searchText.toLowerCase())
      })
      return { ...g, processes: matchingProcesses }
    })
    .filter((g) => g.processes.length > 0)

  // Help determine if a stage is accessible (i.e. has been reached or completed)
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
            Hồ sơ & Tiến trình tư vấn
          </h1>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-description' />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder='Tìm kiếm hồ sơ, luật sư...'
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
            <p className='text-xs text-text-description text-center mt-8'>Chưa có hồ sơ tư vấn nào.</p>
          ) : (
            filteredGroups.map((group) => {
              return (
                <div key={group.lawyerId} className='space-y-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0'>
                  {/* Lawyer Item Header */}
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

                  {/* Processes list for this Lawyer */}
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
                    Luật sư hỗ trợ: {activeProcess.lawyer_details?.users?.full_name || 'Luật sư chuyên nghiệp'}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-3 shrink-0'>
                <ReportDialog
                  type='LAWYER'
                  targetUserId={activeProcess.lawyer_details?.user_id || activeProcess.lawyer_details?.users?.id || null}
                  targetLabel={activeProcess.lawyer_details?.users?.full_name || 'luật sư'}
                  triggerLabel='Báo cáo luật sư'
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
                <div className='bg-primary/10 text-primary font-bold text-xs px-2.5 py-1 rounded-full'>
                  Giai đoạn: {STAGES.find((s) => s.stage === activeStage)?.label || activeStage}
                </div>
              </div>
            </header>

            {/* Dynamic Content Panel */}
            <div className='flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/35 text-left'>
              {activeProcess.current_stage === 'REJECTED' ? (
                <div className='max-w-2xl mx-auto space-y-4'>
                  <Card className='p-6 border border-border-secondary bg-background-primary shadow-sm text-center space-y-4'>
                    <div className='w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto border border-red-100'>
                      <AlertCircle className='w-6 h-6' />
                    </div>
                    <h3 className='font-bold text-base text-text-main'>Hồ sơ yêu cầu tư vấn đã bị hủy hoặc từ chối</h3>
                    <p className='text-sm text-text-description max-w-sm mx-auto'>
                      Yêu cầu tư vấn này đã kết thúc ở trạng thái Đã hủy/Từ chối. Bạn không thể thực hiện thêm hoạt động nào trên hồ sơ này.
                    </p>
                  </Card>
                </div>
              ) : (
                <>
                  {/* STAGE 1: PENDING */}
                  {activeStage === 'PENDING' && (
                    <div className='max-w-2xl mx-auto space-y-4'>
                      <Card className='p-6 border border-border-secondary bg-background-primary shadow-sm text-center space-y-4'>
                        <div className='w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto'>
                          <Clock className='w-6 h-6 animate-pulse' />
                        </div>
                        <h3 className='font-bold text-base text-text-main'>Trạng thái yêu cầu duyệt</h3>
                        {isStageReached(activeProcess, 'CHATTING') ? (
                          <p className='text-sm text-emerald-600 font-medium'>
                            Luật sư đã chấp nhận hồ sơ yêu cầu tư vấn này. Bạn có thể tiến hành trao đổi trực tiếp ở giai đoạn tiếp theo.
                          </p>
                        ) : (
                          <div className='space-y-4'>
                            <p className='text-sm text-text-description'>
                              Yêu cầu tư vấn của bạn đã được gửi đến Luật sư chuyên gia và đang chờ duyệt hồ sơ. Chúng tôi sẽ thông báo cho bạn ngay lập tức khi được tiếp nhận.
                            </p>
                            <Button
                              variant='destructive'
                              onClick={handleCancel}
                              className='bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg'
                            >
                              Hủy yêu cầu tư vấn này
                            </Button>
                          </div>
                        )}
                      </Card>

                      {/* Display Analysis Info & Reports */}
                      <Card className='p-5 border border-border-secondary bg-background-primary shadow-sm text-left space-y-4'>
                        <h4 className='font-bold text-sm text-text-main flex items-center gap-2 border-b border-border-secondary pb-3.5'>
                          <FileText className='w-4.5 h-4.5 text-primary' />
                          Thông tin tóm tắt & Hồ sơ đính kèm từ AI
                        </h4>
                        <div className='space-y-3.5 text-sm'>
                          <div>
                            <span className='text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1'>Bối cảnh vụ việc (AI Tóm tắt)</span>
                            <div className='p-3 bg-slate-50 border border-slate-100 rounded-lg text-text-secondary leading-relaxed'>
                              {activeProcess.analysis?.context_summary || 'Chưa có thông tin tóm tắt bối cảnh.'}
                            </div>
                          </div>
                          <div>
                            <span className='text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1'>Chẩn đoán pháp lý sơ bộ</span>
                            <div className='p-4 bg-primary/5 border border-primary/10 rounded-xl text-text-primary leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none text-left'>
                              {activeProcess.analysis?.result ? (
                                <ReactMarkdown>{activeProcess.analysis.result}</ReactMarkdown>
                              ) : (
                                'Đang phân tích chẩn đoán sơ bộ...'
                              )}
                            </div>
                          </div>
                          <div>
                            <span className='text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-1.5'>Tài liệu & Báo cáo đi kèm</span>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                              <div className='flex items-center justify-between p-2.5 border border-border-primary bg-background-primary hover:bg-slate-50/50 rounded-lg transition-colors cursor-pointer group'>
                                <div className='flex items-center gap-2 min-w-0'>
                                  <FileText className='w-4.5 h-4.5 text-red-500 shrink-0' />
                                  <span className='text-xs font-medium text-text-primary truncate'>Bao_cao_phan_tich_AI.pdf</span>
                                </div>
                                <Download className='w-3.5 h-3.5 text-text-secondary group-hover:text-primary shrink-0' />
                              </div>
                              <div className='flex items-center justify-between p-2.5 border border-border-primary bg-background-primary hover:bg-slate-50/50 rounded-lg transition-colors cursor-pointer group'>
                                <div className='flex items-center gap-2 min-w-0'>
                                  <FileText className='w-4.5 h-4.5 text-blue-500 shrink-0' />
                                  <span className='text-xs font-medium text-text-primary truncate'>Tai_lieu_minh_chung.pdf</span>
                                </div>
                                <Download className='w-3.5 h-3.5 text-text-secondary group-hover:text-primary shrink-0' />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

              {/* STAGE 2: CHATTING */}
              {activeStage === 'CHATTING' && (
                <div className='flex h-[480px] max-w-5xl mx-auto rounded-xl border border-border-secondary bg-background-primary overflow-hidden shadow-sm'>
                  {/* Left: Chat history & input */}
                  <div className='flex flex-1 flex-col min-w-0 h-full'>
                    {/* Message History */}
                    <div
                      ref={scrollContainerRef}
                      className='flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/40'
                    >
                      {activeProcess.conversations?.messages && activeProcess.conversations.messages.length > 0 ? (
                        activeProcess.conversations.messages.map((m) => {
                          const isMe = m.sender_id === user?.userId
                          return (
                            <div key={m.id} className={cn('flex w-full', isMe ? 'justify-end' : 'justify-start')}>
                              <div className={cn('flex flex-col max-w-[75%]', isMe ? 'items-end' : 'items-start')}>
                                <div
                                  className={cn(
                                    'p-3 text-sm leading-relaxed rounded-2xl shadow-sm',
                                    isMe
                                      ? 'bg-gradient-to-r from-primary to-primary-400 text-white rounded-tr-none'
                                      : 'bg-background-primary border border-border-primary text-text-primary rounded-tl-none'
                                  )}
                                >
                                  {m.content}
                                </div>
                                <span className='text-[10px] text-text-description mt-1 px-1'>
                                  {new Date(m.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className='text-xs text-text-description text-center mt-8'>Chưa có tin nhắn nào. Hãy bắt đầu cuộc hội thoại.</p>
                      )}
                    </div>

                    {/* Message Input */}
                    <form onSubmit={handleSend} className='p-3 bg-background-primary border-t border-border-secondary flex items-center gap-2 shrink-0'>
                      <Textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder='Nhập nội dung tư vấn gửi luật sư...'
                        className='flex-1 rounded-lg text-sm bg-background-primary border-border-secondary min-h-[40px] max-h-[80px] py-2 resize-none focus-visible:ring-primary'
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSend(e)
                          }
                        }}
                      />
                      <Button type='submit' size='icon' className='h-10 w-10 shrink-0 bg-primary hover:bg-primary/95 text-white rounded-lg'>
                        <Send className='w-4.5 h-4.5' />
                      </Button>
                    </form>
                  </div>
                </div>
              )}

              {/* STAGE 3: PDF_GENERATION */}
              {activeStage === 'PDF_GENERATION' && activeProcess && (
                <ClientStagePdfGeneration
                  isLawyer={false}
                  process={activeProcess}
                  partnerName={activeProcess.lawyer_details?.users?.full_name || 'Luật sư'}
                  suggestedTemplates={[]}
                  templates={templates}
                  selectedTemplate={selectedTemplate}
                  handleSelectTemplate={async (id) => {
                    await consultationApi.selectTemplate(activeProcessId!, id)
                    await loadProcesses(false)
                  }}
                  adviceSummary={''}
                  setAdviceSummary={() => {}}
                  submissionMethod={'MANUAL'}
                  setSubmissionMethod={() => {}}
                  handlePdfSubmit={async () => {}}
                  submittingPdf={false}
                  formValues={formValues}
                  setFormValues={setFormValues}
                  handleSubmitTemplateData={handleSubmitTemplateData}
                  submittingData={submittingData}
                />
              )}

              {/* STAGE 4: PORTAL_SUBMITTING */}
              {activeStage === 'PORTAL_SUBMITTING' && (
                <div className='max-w-2xl mx-auto space-y-5'>
                  <ClientStagePortalSubmitting
                    process={activeProcess}
                  />
                </div>
              )}

              {/* STAGE 5: COMPLETED / REVIEWED */}
              {activeStage === 'COMPLETED' && (
                <div className='max-w-2xl mx-auto space-y-5'>
                  <ClientStageCompleted
                    process={activeProcess}
                    isClient={true}
                    partnerName={activeProcess.lawyer_details?.users?.full_name || 'Luật sư'}
                    rating={rating}
                    setRating={setRating}
                    reviewComment={reviewComment}
                    setReviewComment={setReviewComment}
                    handleReviewSubmit={handleReviewSubmit}
                    submittingReview={submittingReview}
                    handleSkip={async () => {}}
                    onClose={undefined}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </>
    ) : (
          <div className='flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/20'>
            <MessageCircle className='w-12 h-12 text-slate-300 mb-3' />
            <p className='text-sm text-text-description font-medium'>Chọn một hồ sơ tư vấn từ danh sách để xem tiến trình chi tiết.</p>
          </div>
        )}
      </section>

      {/* Interactive WebRTC Call Modal / Meeting Room */}
      {isCalling && (
        <div className='fixed inset-0 bg-slate-50 text-text-primary z-50 flex flex-col md:flex-row animate-in fade-in duration-300 font-sans'>
          {callStatus === 'ringing' ? (
            // Ringing Overlay (Caller/Callee Ringing UI - Keep modal centered and neat)
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
                        Luật sư đang yêu cầu cuộc gọi {callType === 'voice' ? 'thoại' : 'video'}...
                      </p>
                    </div>
                    <div className='flex justify-center gap-4'>
                      <Button
                        onClick={handleAcceptCall}
                        className='bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-6 rounded-xl'
                      >
                        Trả lời
                      </Button>
                      <Button
                        onClick={() => handleHangup(true)}
                        className='bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-xl'
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
                      <p className='text-xs text-text-description mt-1.5'>Đang chờ luật sư kết nối máy...</p>
                    </div>
                    <div className='flex justify-center'>
                      <Button
                        onClick={() => handleHangup(true)}
                        className='bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-xl'
                      >
                        Hủy cuộc gọi
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
                                    // Active Call Room Layout (Unified DOM Tree to prevent WebRTC unmount/black screen issues)
            <>
              {/* Left/Right Workspace Panel */}
              <div className={cn(
                'flex flex-col bg-white h-full overflow-hidden transition-all duration-300',
                layoutMode === 'split'
                  ? 'flex-1 min-w-0 order-1'
                  : 'w-full md:w-80 lg:w-96 border-l border-border-secondary shrink-0 text-left relative order-2'
              )}>
                {/* Workspace Header */}
                <div className='flex items-center justify-between border-b border-border-secondary bg-slate-50/80 px-4 py-3 shrink-0 gap-2'>
                  <div className='flex items-center gap-1.5'>
                    <Sparkles className='w-4 h-4 text-primary shrink-0' />
                    <h3 className='text-xs font-bold uppercase tracking-wider text-text-main'>
                      {layoutMode === 'split' ? 'Không gian làm việc chung' : 'Tài liệu & Thảo luận'}
                    </h3>
                  </div>
                  <div className='flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200'>
                    <button
                      onClick={() => setCallRoomTab('report')}
                      className={cn(
                        'text-[9px] font-bold py-1 px-1.5 rounded transition-all uppercase tracking-wider',
                        callRoomTab === 'report' ? 'bg-white text-primary border border-slate-200 shadow-sm' : 'text-text-secondary hover:text-text-main'
                      )}
                    >
                      Report
                    </button>
                    <button
                      onClick={() => setCallRoomTab('board')}
                      className={cn(
                        'text-[9px] font-bold py-1 px-1.5 rounded transition-all uppercase tracking-wider',
                        callRoomTab === 'board' ? 'bg-white text-primary border border-slate-200 shadow-sm' : 'text-text-secondary hover:text-text-main'
                      )}
                    >
                      Board
                    </button>
                    <button
                      onClick={() => setCallRoomTab('pdf')}
                      className={cn(
                        'text-[9px] font-bold py-1 px-1.5 rounded transition-all uppercase tracking-wider',
                        callRoomTab === 'pdf' ? 'bg-white text-primary border border-slate-200 shadow-sm' : 'text-text-secondary hover:text-text-main'
                      )}
                    >
                      PDF
                    </button>
                  </div>
                </div>

                {/* Workspace Body */}
                <div className='flex-1 overflow-y-auto bg-slate-50/30 p-4 min-h-0'>
                  {callRoomTab === 'report' && (
                    <div className='bg-white border border-border-secondary rounded-2xl p-6 shadow-sm text-text-primary prose prose-slate prose-sm max-w-none leading-relaxed text-left whitespace-pre-wrap'>
                      {activeProcess?.analysis?.result ? (
                        <ReactMarkdown>{activeProcess.analysis.result}</ReactMarkdown>
                      ) : (
                        <p className='text-text-description italic text-center'>Đang tải tài liệu phân tích...</p>
                      )}
                    </div>
                  )}

                  {callRoomTab === 'board' && (
                    <div className='bg-white border border-border-secondary rounded-2xl p-6 shadow-sm flex flex-col space-y-4 text-left h-full min-h-[300px]'>
                      <div className='flex items-center justify-between border-b border-border-secondary pb-3'>
                        <div>
                          <h4 className='text-xs font-bold text-text-main uppercase tracking-wider'>Bản ghi chú cuộc họp</h4>
                          <p className='text-[10px] text-text-description mt-0.5'>Cả hai bên có thể cùng ghi chú ý chính</p>
                        </div>
                        <span className='text-[9px] bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded border border-emerald-200'>Đồng bộ</span>
                      </div>
                      <textarea
                        value={boardNotes}
                        onChange={(e) => {
                          const newNotes = e.target.value
                          setBoardNotes(newNotes)
                          getSocket().emit('update_board_notes', { roomId: activeProcessId, notes: newNotes })
                        }}
                        className='flex-1 w-full bg-slate-50 border border-border-secondary text-text-primary rounded-xl p-4 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed min-h-[220px]'
                        placeholder='Nhập nội dung thảo luận tại đây...'
                      />
                    </div>
                  )}

                  {callRoomTab === 'pdf' && (
                    <div className='bg-white text-slate-900 rounded-2xl p-8 shadow-2xl aspect-[1/1.4] overflow-y-auto select-none border border-slate-200 text-left font-serif text-[11px] leading-relaxed relative max-w-md mx-auto my-4'>
                      <div className='absolute top-3 right-3 text-[9px] bg-slate-100 px-2 py-0.5 rounded font-sans text-slate-500'>Độc quyền LegalAI</div>
                      <h3 className='font-bold text-center text-sm border-b-2 border-slate-800 pb-2.5 mb-4 uppercase tracking-wider font-sans'>Báo Cáo Phân Tích</h3>
                      <p className='mb-2'><strong>Kính gửi:</strong> {activeProcess?.users?.full_name || 'Khách hàng'}</p>
                      <div className='space-y-4 font-sans text-xs'>
                        <div>
                          <h4 className='font-bold border-b border-slate-300 pb-1 mb-1.5 uppercase font-sans text-[10px] text-slate-800'>1. Tóm Tắt Bối Cảnh</h4>
                          <p className='text-slate-600 italic'>{activeProcess?.analysis?.context_summary || 'Chưa cập nhật.'}</p>
                        </div>
                        <div>
                          <h4 className='font-bold border-b border-slate-300 pb-1 mb-1.5 uppercase font-sans text-[10px] text-slate-800'>2. Chẩn Đoán Chi Tiết</h4>
                          <p className='text-slate-600 whitespace-pre-line text-[11px] leading-relaxed'>{activeProcess?.analysis?.result?.slice(0, 400) || 'Đang lập chẩn đoán...'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* If in video-focus mode, render call details and actions at the bottom of the sidebar */}
                {layoutMode === 'video-focus' && (
                  <div className='p-4 border-t border-border-secondary bg-slate-50/50'>
                    <div className='flex items-center justify-between pb-3'>
                      <div>
                        <h4 className='text-[10px] font-bold text-text-secondary uppercase tracking-wider'>Đang gọi cùng</h4>
                        <h3 className='text-xs font-bold text-text-main mt-0.5'>
                          {activeProcess?.lawyer_details?.users?.full_name || 'Luật sư Chuyên nghiệp'}
                        </h3>
                      </div>
                      <button
                        onClick={() => setLayoutMode('split')}
                        className='text-[9px] font-bold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-text-primary transition-all flex items-center gap-1 shrink-0'
                      >
                        <Pin className='w-3 h-3 text-primary rotate-45' />
                        Bản ghi chú
                      </button>
                    </div>

                    <div className='border-t border-border-secondary pt-3 mt-1 shrink-0 flex items-center justify-between gap-2'>
                      <Button
                        onClick={toggleScreenShare}
                        className={cn(
                          'flex-1 font-bold py-1.5 px-2 rounded-lg shadow-sm text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all duration-200 border',
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
                        className='bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded-lg shrink-0 shadow-lg text-[9px] uppercase tracking-wider border border-red-600'
                      >
                        Gác máy
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Left/Right Media Panel (Holds video streams, NEVER unmounted) */}
              <div className={cn(
                'bg-white flex flex-col transition-all duration-300 relative overflow-hidden',
                layoutMode === 'split'
                  ? 'w-full md:w-80 lg:w-96 border-l border-border-secondary shrink-0 text-left order-2 h-full'
                  : 'flex-1 min-w-0 order-1 h-full'
              )}>
                {/* Peer streams */}
                <div className={cn(
                  'relative bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 transition-all duration-300',
                  layoutMode === 'video-focus' ? 'flex-1 h-full' : 'w-full aspect-[4/3] border-b border-border-secondary'
                )}>
                  {callType === 'video' ? (
                    <>
                      {/* Swappable Video Feeds (Screen Pinning) */}
                      {pinnedVideo === 'remote' ? (
                        <>
                          <video ref={remoteVideoRef} autoPlay playsInline className='w-full h-full object-cover' />
                          <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            onClick={() => {
                              setPinnedVideo('local')
                              setLayoutMode('video-focus')
                            }}
                            className='absolute top-3 right-3 w-20 h-28 object-cover rounded-lg border-2 border-white shadow-lg bg-slate-900 cursor-pointer hover:scale-105 transition-transform z-10'
                            title='Bấm để phóng to camera của bạn'
                          />
                        </>
                      ) : (
                        <>
                          <video ref={localVideoRef} autoPlay playsInline muted className='w-full h-full object-cover' />
                          <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            onClick={() => {
                              setPinnedVideo('remote')
                              setLayoutMode('video-focus')
                            }}
                            className='absolute top-3 right-3 w-20 h-28 object-cover rounded-lg border-2 border-white shadow-lg bg-slate-900 cursor-pointer hover:scale-105 transition-transform z-10'
                            title='Bấm để phóng to camera đối tác'
                          />
                        </>
                      )}

                      {/* Explicit Screen Pinning Toggle Button Overlay */}
                      <button
                        onClick={() => {
                          setPinnedVideo((prev) => (prev === 'remote' ? 'local' : 'remote'))
                          setLayoutMode(prev => prev === 'video-focus' ? 'split' : 'video-focus')
                        }}
                        className='absolute bottom-3 left-3 bg-white/90 hover:bg-white text-text-primary rounded-lg p-1.5 shadow-md flex items-center gap-1.5 text-[9px] font-bold border border-border-secondary transition-all z-10'
                      >
                        <Pin className='w-3.5 h-3.5 text-primary shrink-0' />
                        {layoutMode === 'video-focus' ? 'Thu nhỏ video' : 'Ghim phóng to video'}
                      </button>
                    </>
                  ) : (
                    <div className='space-y-3.5 text-center p-6'>
                      <div className='w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto text-primary animate-pulse'>
                        <Phone className='w-6 h-6' />
                      </div>
                      <p className='text-xs text-slate-300'>Đang đàm thoại thoại bảo mật...</p>
                      <video ref={remoteVideoRef} autoPlay playsInline className='hidden' />
                      <video ref={localVideoRef} autoPlay playsInline muted className='hidden' />
                    </div>
                  )}

                  {/* Connecting status overlay */}
                  {callStatus === 'connecting' && (
                    <div className='absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-3 z-20'>
                      <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin' />
                      <p className='text-[10px] text-slate-400 font-semibold tracking-wider uppercase'>Đang đồng bộ cuộc gọi...</p>
                    </div>
                  )}
                </div>

                {/* Call & Participant Details (Only visible in Split Mode to prevent overlapping) */}
                {layoutMode === 'split' && (
                  <div className='flex-1 p-4 flex flex-col justify-between overflow-y-auto min-h-0 bg-background-primary'>
                    <div className='space-y-5'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h4 className='text-xs font-bold text-text-secondary uppercase tracking-wider'>Đang đàm thoại cùng</h4>
                          <h3 className='text-sm font-bold text-text-main mt-1'>
                            {activeProcess?.lawyer_details?.users?.full_name || 'Luật sư Chuyên nghiệp'}
                          </h3>
                          <p className='text-[10px] text-text-description mt-0.5'>Trạng thái: {callStatus === 'connected' ? 'Đã kết nối' : 'Đang kết nối'}</p>
                        </div>
                        <button
                          onClick={() => setLayoutMode('video-focus')}
                          className='text-[9px] font-bold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-text-primary transition-all flex items-center gap-1.5 shrink-0'
                        >
                          <Pin className='w-3 h-3 text-primary' />
                          Ghim video
                        </button>
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
                              onClick={() => setAiToggles((prev) => ({ ...prev, autoRecord: !prev.autoRecord }))}
                              className={cn('text-[9px] px-2 py-0.5 rounded font-bold transition-all border', aiToggles.autoRecord ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-100 text-text-secondary border-slate-200')}
                            >
                              {aiToggles.autoRecord ? 'BẬT' : 'TẮT'}
                            </button>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-text-primary font-medium'>Gỡ băng đàm thoại (STT)</span>
                            <button
                              onClick={() => setAiToggles((prev) => ({ ...prev, autoSTT: !prev.autoSTT }))}
                              className={cn('text-[9px] px-2 py-0.5 rounded font-bold transition-all border', aiToggles.autoSTT ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-text-secondary border-slate-200')}
                            >
                              {aiToggles.autoSTT ? 'BẬT' : 'TẮT'}
                            </button>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-text-primary font-medium'>Tự động tóm tắt</span>
                            <button
                              onClick={() => setAiToggles((prev) => ({ ...prev, autoSummarize: !prev.autoSummarize }))}
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
                        className='bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl shrink-0 shadow-lg text-[10px] uppercase tracking-wider border border-red-600'
                      >
                        Gác máy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>          )}
        </div>
      )}
    </main>
  )
}
