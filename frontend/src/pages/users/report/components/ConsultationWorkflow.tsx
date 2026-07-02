import { useState, useEffect, useRef } from 'react';

import axios from 'axios';
import { RotateCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import toastifyCommon from '@/core/lib/toastify-common';
import { 
  consultationApi, 
  type ConsultationProcess, 
  type ConsultationStage,
  type SubmissionMethod
} from '@/core/services/consultation.service';
import { getSocket } from '@/core/services/socket';
import { templateApi } from '@/core/services/template.service';
import { getUserFromLocalStorage } from '@/core/shared/storage';
import { type Template } from '@/models/types/form-library';

import ConsultationTimeline from './ConsultationTimeline';
import ClientStageChatting from './stages/ClientStageChatting';
import ClientStageCompleted from './stages/ClientStageCompleted';
import ClientStagePdfGeneration from './stages/ClientStagePdfGeneration';
import ClientStagePending from './stages/ClientStagePending';
import ClientStagePortalSubmitting from './stages/ClientStagePortalSubmitting';


interface WorkflowProps {
  consultationId: string;
  onClose?: () => void;
  onStageChange?: (stage: ConsultationStage) => void;
}

export default function ConsultationWorkflow({ consultationId, onClose, onStageChange }: WorkflowProps) {
  const currentUser = getUserFromLocalStorage();
  const currentUserId = currentUser?.userId;

  const [process, setProcess] = useState<ConsultationProcess | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgContent, setMsgContent] = useState('');
  
  // PDF Gen Stage States
  const [adviceSummary, setAdviceSummary] = useState('');
  const [submittingPdf, setSubmittingPdf] = useState(false);
  const [submittingData, setSubmittingData] = useState(false);
  const [submissionMethod, setSubmissionMethod] = useState<SubmissionMethod>('MANUAL');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // Review Stage States
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const messageEndRef = useRef<HTMLDivElement>(null);

  // Load process details
  const fetchProcess = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await consultationApi.getConsultation(consultationId);
      setProcess(res);
      if (res.advice_summary && !adviceSummary) {
        setAdviceSummary(res.advice_summary);
      }
    } catch (err) {
      console.error('Error fetching consultation process:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcess(true);
    // Poll process state every 3000ms
    const interval = setInterval(() => {
      fetchProcess(false);
    }, 3000);

    // Real-time WebSocket updates
    const socket = getSocket();
    socket.emit('join_process', consultationId);
    
    socket.on('process_updated', () => {
      fetchProcess(false);
    });

    const fetchTemplates = async () => {
      try {
        const data = await templateApi.listTemplates();
        setTemplates(data || []);
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    };
    fetchTemplates();

    return () => {
      clearInterval(interval);
      socket.off('process_updated');
    };
  }, [consultationId]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [process?.conversations?.messages]);

  // Propagate stage change
  useEffect(() => {
    if (process?.current_stage && onStageChange) {
      onStageChange(process.current_stage);
    }
  }, [process?.current_stage, onStageChange]);
  const isClient = process ? process.user_id === currentUserId : false;
  const isLawyer = process ? process.lawyer_id === currentUserId : false;
  const partnerName = process ? (isLawyer ? process.users?.full_name : process.lawyer_details?.users?.full_name) : '';

  const textContent = process ? ((process.analysis?.result || '') + ' ' + (process.analysis?.context_summary || '')).toLowerCase() : '';
  const suggestedTemplates = templates.filter(t => {
    if (textContent.includes('nhượng quyền') && t.title.includes('nhượng quyền')) return true;
    if ((textContent.includes('doanh nghiệp') || textContent.includes('đăng ký') || textContent.includes('thành lập')) && t.title.includes('doanh nghiệp')) return true;
    if ((textContent.includes('thuê') || textContent.includes('văn phòng') || textContent.includes('nhà')) && t.title.includes('thuê')) return true;
    return false;
  });
  const selectedTemplate = process ? templates.find(t => t.id === process.template_id) : undefined;

  // Initialize formValues when selectedTemplate or process.template_data changes
  useEffect(() => {
    if (selectedTemplate) {
      setFormValues(prev => {
        const initial = { ...prev };
        const dbData = (process?.template_data as Record<string, string>) || {};
        
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
  }, [selectedTemplate, process?.template_data]);

  if (loading || !process) {
    return (
      <div className='flex flex-col items-center justify-center p-12 space-y-4 min-h-[350px] bg-background-primary'>
        <div className='w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin'></div>
        <span className='text-xs text-text-description font-semibold'>Đang tải quy trình tư vấn...</span>
      </div>
    );
  }

  const handleSelectTemplate = async (templateId: string) => {
    try {
      await consultationApi.selectTemplate(consultationId, templateId);
      toastifyCommon.success('Đề xuất biểu mẫu thành công!');
      fetchProcess(false);
    } catch (err) {
      console.error(err);
      toastifyCommon.error('Đề xuất biểu mẫu thất bại!');
    }
  };

  const handleSubmitTemplateData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingData) return;
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
      await consultationApi.submitTemplateData(consultationId, formValues);
      toastifyCommon.success('Gửi thông tin biểu mẫu thành công!');
      fetchProcess(false);
    } catch (err) {
      if (axios.isCancel(err)) {
        return;
      }
      console.error(err);
      toastifyCommon.error('Gửi thông tin thất bại!');
    } finally {
      setSubmittingData(false);
    }
  };

  const handleTransition = async (stage: ConsultationStage) => {
    try {
      await consultationApi.updateStage(consultationId, stage);
      toastifyCommon.success('Cập nhật trạng thái thành công!');
      fetchProcess(true);
    } catch (err) {
      console.error(err);
      toastifyCommon.error('Không thể cập nhật trạng thái.');
    }
  };

  const handleRevertStage = async (targetStage: ConsultationStage) => {
    if (!window.confirm(`Bạn có chắc chắn muốn chuyển lùi hồ sơ về giai đoạn "${targetStage}" không?`)) return;
    try {
      await consultationApi.updateStage(consultationId, targetStage);
      toastifyCommon.success(`Đã chuyển lùi hồ sơ về giai đoạn thành công!`);
      fetchProcess(true);
    } catch (err) {
      console.error(err);
      toastifyCommon.error('Chuyển lùi giai đoạn thất bại!');
    }
  };

  // Handle skip stage
  const handleSkip = async (targetStage: ConsultationStage) => {
    try {
      await consultationApi.skipStage(consultationId, targetStage);
      toastifyCommon.success('Đã bỏ qua giai đoạn và chuyển tiếp!');
      fetchProcess(true);
    } catch (err) {
      console.error(err);
      toastifyCommon.error('Bỏ qua thất bại.');
    }
  };

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgContent.trim() || sendingMsg) return;
    setSendingMsg(true);
    try {
      await consultationApi.sendMessage(consultationId, msgContent.trim());
      setMsgContent('');
      await fetchProcess(false);
    } catch (err) {
      console.error(err);
      toastifyCommon.error('Không thể gửi tin nhắn.');
    } finally {
      setSendingMsg(false);
    }
  };

  // Handle PDF submission
  const handlePdfSubmit = async () => {
    if (!adviceSummary.trim()) {
      toastifyCommon.warning('Vui lòng viết tóm tắt lời khuyên tư vấn!');
      return;
    }
    setSubmittingPdf(true);
    try {
      await consultationApi.submitPdf(consultationId, {
        adviceSummary: adviceSummary.trim(),
        submissionMethod
      });
      toastifyCommon.success('Biên bản tư vấn đã được xuất bản!');
      fetchProcess(true);
    } catch (err) {
      console.error(err);
      toastifyCommon.error('Thao tác thất bại.');
    } finally {
      setSubmittingPdf(false);
    }
  };


  // Handle Review submit
  const handleReviewSubmit = async () => {
    if (!reviewComment.trim()) {
      toastifyCommon.warning('Vui lòng nhập nhận xét tư vấn!');
      return;
    }
    setSubmittingReview(true);
    try {
      await consultationApi.submitReview(consultationId, {
        rating,
        reviewComment: reviewComment.trim()
      });
      toastifyCommon.success('Cảm ơn bạn đã gửi đánh giá!');
      fetchProcess(true);
    } catch (err) {
      console.error(err);
      toastifyCommon.error('Gửi đánh giá thất bại.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const partnerAvatar = isLawyer 
    ? process.users.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + process.users.full_name
    : process.lawyer_details.users.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + process.lawyer_details.users.full_name;

  return (
    <div className='flex flex-col h-full bg-background-primary text-xs rounded-xl overflow-hidden border border-border-secondary'>
      {/* Header Info */}
      <div className='p-3 bg-slate-50 border-b border-border-primary flex items-center justify-between shrink-0'>
        <div className='flex items-center gap-2.5'>
          <img src={partnerAvatar} alt={partnerName} className='w-8 h-8 rounded-full border border-border-primary object-cover' />
          <div className='text-left'>
            <h4 className='font-bold text-text-primary text-xs'>{partnerName}</h4>
            <p className='text-[10px] text-text-description'>{isLawyer ? 'Khách hàng' : 'Luật sư phụ trách'}</p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {isLawyer && process.current_stage !== 'PENDING' && (
            <Button
              onClick={() => {
                const prevStageMap: Record<ConsultationStage, ConsultationStage> = {
                  PENDING: 'PENDING',
                  CHATTING: 'PENDING',
                  PDF_GENERATION: 'CHATTING',
                  PORTAL_SUBMITTING: 'PDF_GENERATION',
                  COMPLETED: process.submission_method === 'PORTAL' ? 'PORTAL_SUBMITTING' : 'PDF_GENERATION',
                  REVIEWED: 'COMPLETED',
                  REJECTED: 'PENDING'
                }
                handleRevertStage(prevStageMap[process.current_stage])
              }}
              variant='outline'
              size='sm'
              className='text-[9px] h-6 py-0.5 px-1.5 font-bold flex items-center gap-1 border-slate-200 hover:bg-slate-100 rounded-lg text-slate-500 shadow-sm bg-white'
              title='Quay lại giai đoạn trước'
            >
              <RotateCcw className='w-2.5 h-2.5' />
              Lui bước
            </Button>
          )}
          <Badge variant={process.current_stage === 'REVIEWED' ? 'secondary' : 'default'} className='text-[9px] px-2 py-0.5 rounded-full'>
            {process.current_stage}
          </Badge>
        </div>
      </div>

      {/* Progress Timeline */}
      <ConsultationTimeline 
        currentStage={process.current_stage} 
        submissionMethod={process.submission_method} 
      />

      {/* Workspace Area */}
      <div className='flex-1 overflow-y-auto p-4 flex flex-col min-h-0 bg-background-primary'>
        
        {/* PENDING STAGE */}
        {process.current_stage === 'PENDING' && (
          <ClientStagePending
            isClient={isClient}
            partnerName={partnerName}
            handleTransition={handleTransition}
          />
        )}

        {/* CHATTING STAGE */}
        {process.current_stage === 'CHATTING' && (
          <ClientStageChatting
            process={process}
            currentUserId={currentUserId!}
            msgContent={msgContent}
            setMsgContent={setMsgContent}
            handleSendMessage={handleSendMessage}
            messageEndRef={messageEndRef}
            isLawyer={isLawyer}
            handleTransition={handleTransition}
            handleSkip={handleSkip}
          />
        )}

        {/* PDF GENERATION STAGE */}
        {process.current_stage === 'PDF_GENERATION' && (
          <ClientStagePdfGeneration
            isLawyer={isLawyer}
            process={process}
            partnerName={partnerName}
            suggestedTemplates={suggestedTemplates}
            templates={templates}
            selectedTemplate={selectedTemplate}
            handleSelectTemplate={handleSelectTemplate}
            adviceSummary={adviceSummary}
            setAdviceSummary={setAdviceSummary}
            submissionMethod={submissionMethod}
            setSubmissionMethod={setSubmissionMethod}
            handlePdfSubmit={handlePdfSubmit}
            submittingPdf={submittingPdf}
            formValues={formValues}
            setFormValues={setFormValues}
            handleSubmitTemplateData={handleSubmitTemplateData}
            submittingData={submittingData}
          />
        )}

        {/* PORTAL SUBMITTING STAGE */}
        {process.current_stage === 'PORTAL_SUBMITTING' && (
          <ClientStagePortalSubmitting
            process={process}
          />
        )}

        {/* COMPLETED / REVIEWED / REJECTED STAGES */}
        {(process.current_stage === 'COMPLETED' || process.current_stage === 'REVIEWED' || process.current_stage === 'REJECTED') && (
          <ClientStageCompleted
            process={process}
            isClient={isClient}
            partnerName={partnerName}
            rating={rating}
            setRating={setRating}
            reviewComment={reviewComment}
            setReviewComment={setReviewComment}
            handleReviewSubmit={handleReviewSubmit}
            submittingReview={submittingReview}
            handleSkip={handleSkip}
            onClose={onClose}
          />
        )}

      </div>
    </div>
  );
}
