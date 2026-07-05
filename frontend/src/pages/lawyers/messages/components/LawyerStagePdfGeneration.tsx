import { FileText, Download, FileCheck, CheckCircle2, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/core/lib/utils';
import { type ConsultationProcess } from '@/core/services/consultation.service';
import { type Template } from '@/models/types/form-library';

interface LawyerStagePdfGenerationProps {
  activeProcess: ConsultationProcess;
  templates: Template[];
  suggestedTemplates: Template[];
  selectedTemplate: Template | undefined;
  handleSelectTemplate: (id: string) => Promise<void>;
  adviceSummary: string;
  setAdviceSummary: (v: string) => void;
  submissionMethod: 'MANUAL' | 'PORTAL';
  setSubmissionMethod: (v: 'MANUAL' | 'PORTAL') => void;
  handlePublishReport: () => Promise<void>;
  submittingReport: boolean;
  handleExportPDF: () => void;
}

export default function LawyerStagePdfGeneration({
  activeProcess,
  templates,
  suggestedTemplates,
  selectedTemplate,
  handleSelectTemplate,
  adviceSummary,
  setAdviceSummary,
  submissionMethod,
  setSubmissionMethod,
  handlePublishReport,
  submittingReport,
  handleExportPDF
}: LawyerStagePdfGenerationProps) {
  // Report is published when process stage has moved past PDF_GENERATION (e.g. PORTAL_SUBMITTING, COMPLETED, REVIEWED)
  const isReportPublished = 
    activeProcess.current_stage !== 'PENDING' && 
    activeProcess.current_stage !== 'CHATTING' && 
    activeProcess.current_stage !== 'PDF_GENERATION';

  return (
    <div className='max-w-6xl mx-auto space-y-5 text-left w-full h-full flex flex-col justify-between'>
      {isReportPublished ? (
        <Card className='p-6 border border-border-secondary bg-background-primary shadow-sm space-y-4 max-w-3xl mx-auto w-full'>
          <div className='flex items-center gap-3.5 border-b border-border-secondary pb-4'>
            <div className='w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 border border-red-100'>
              <FileText className='w-6 h-6' />
            </div>
            <div>
              <h3 className='font-bold text-base text-text-main'>Bản ý kiến tư vấn pháp lý</h3>
              <p className='text-xs text-text-description'>Trạng thái: Đã xuất bản thành công</p>
            </div>
            <Button
              onClick={handleExportPDF}
              variant='outline'
              size='sm'
              className='ml-auto flex items-center gap-1.5 rounded-lg'
            >
              <Download className='w-4 h-4' />
              Xem bản PDF
            </Button>
          </div>

          <div className='space-y-4'>
            <div className='space-y-1.5'>
              <h4 className='text-sm font-bold text-text-main'>Ý kiến kết luận của bạn:</h4>
              <div className='p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-text-primary leading-relaxed whitespace-pre-wrap'>
                {activeProcess.advice_summary}
              </div>
            </div>
          </div>
        </Card>
      ) : !activeProcess.template_id ? (
        <Card className='p-6 border border-border-secondary bg-background-primary shadow-sm space-y-5 max-w-3xl mx-auto w-full'>
          <div className='flex items-center gap-2 pb-3 border-b border-slate-100'>
            <FileCheck className='w-5 h-5 text-primary' />
            <div>
              <h3 className='font-bold text-sm text-text-main uppercase tracking-wider'>Đề xuất biểu mẫu thủ tục</h3>
              <p className='text-[10px] text-text-description mt-0.5'>Hệ thống tự động đề xuất dựa trên phân tích hồ sơ vụ việc</p>
            </div>
          </div>

          <div className='space-y-4'>
            {/* Auto-suggested templates */}
            <div className='space-y-2.5'>
              <h4 className='text-xs font-bold text-primary uppercase tracking-wider'>Đề xuất hàng đầu:</h4>
              {suggestedTemplates.length > 0 ? (
                <div className='grid grid-cols-1 gap-3'>
                  {suggestedTemplates.map((t) => (
                    <div key={t.id} className='p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start justify-between gap-4'>
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2'>
                          <span className='bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded'>Đề xuất</span>
                          <h5 className='text-xs font-bold text-text-main'>{t.title}</h5>
                        </div>
                        <p className='text-[10px] text-text-description'>{t.description}</p>
                      </div>
                      <Button onClick={() => handleSelectTemplate(t.id)} size='sm' className='bg-primary text-white text-[10px] font-bold rounded-lg shrink-0'>
                        Chọn mẫu này
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-xs text-text-description italic'>Không tìm thấy đề xuất tự động chính xác cho vụ việc này.</p>
              )}
            </div>

            {/* All templates */}
            <div className='space-y-2.5 border-t border-border-secondary pt-4'>
              <h4 className='text-xs font-bold text-text-secondary uppercase tracking-wider'>Tất cả biểu mẫu trong thư viện:</h4>
              <div className='grid grid-cols-1 gap-2.5 max-h-[220px] overflow-y-auto pr-1'>
                {templates.filter(t => !suggestedTemplates.find(s => s.id === t.id)).map((t) => (
                  <div key={t.id} className='p-3.5 rounded-xl border border-border-secondary bg-white hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors'>
                    <div className='space-y-0.5'>
                      <h5 className='text-xs font-bold text-text-main'>{t.title}</h5>
                      <p className='text-[10px] text-text-description'>{t.description}</p>
                    </div>
                    <Button onClick={() => handleSelectTemplate(t.id)} variant='outline' size='sm' className='text-[10px] font-bold rounded-lg shrink-0'>
                      Chọn
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ) : activeProcess.template_status === 'SELECTED' ? (
        <Card className='p-6 border border-border-secondary bg-background-primary shadow-sm text-center py-10 space-y-4 max-w-3xl mx-auto w-full'>
          <div className='w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500'>
            <Clock className='w-7 h-7 animate-pulse' />
          </div>
          <div className='space-y-1.5'>
            <h3 className='font-bold text-sm text-text-main'>Đã đề xuất biểu mẫu</h3>
            <p className='text-xs text-text-description max-w-md mx-auto'>
              Bạn đã gửi biểu mẫu <strong className='text-text-main'>"{selectedTemplate?.title}"</strong> cho khách hàng. Đang chờ khách hàng điền các trường thông tin và nộp lại.
            </p>
          </div>
          <div className='pt-2'>
            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider animate-pulse'>
              Chờ khách hàng khai báo thông tin
            </span>
          </div>
        </Card>
      ) : (
        // Client submitted template data - SHOW CLIENT INFO AND PDF SIDE-BY-SIDE ON TOP, LAWYER ACTION FORM AT BOTTOM
        <div className='flex flex-col space-y-4 w-full flex-1 justify-between'>
          {/* Top section: side-by-side client data and PDF preview */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1 min-h-0'>
            {/* Left side: Client data (lg:col-span-5) */}
            <div className='lg:col-span-5 flex flex-col h-full'>
              <Card className='p-5 border border-border-secondary bg-background-primary shadow-sm space-y-3 h-full flex flex-col justify-start'>
                <div className='flex items-center gap-2 pb-2.5 border-b border-slate-100 shrink-0'>
                  <CheckCircle2 className='w-5 h-5 text-emerald-500' />
                  <div>
                    <h3 className='font-bold text-sm text-text-main uppercase tracking-wider'>Thông tin khách hàng khai báo</h3>
                    <p className='text-[10px] text-text-description mt-0.5'>
                      Đã nộp thành công cho biểu mẫu "{selectedTemplate?.title}"
                    </p>
                  </div>
                </div>

                <div className='bg-slate-50 rounded-2xl p-4 border border-slate-100/80 space-y-3 overflow-y-auto flex-1 text-xs max-h-[380px]'>
                  {selectedTemplate?.fields?.map((section, idx) => (
                    <div key={idx} className='space-y-1.5'>
                      <h4 className='text-[10px] font-bold text-text-secondary uppercase tracking-wider border-b border-slate-200/60 pb-0.5'>{section.section}</h4>
                      <div className='grid grid-cols-1 gap-2'>
                        {section.inputs.map((input) => (
                          <div key={input.key} className='flex justify-between items-center border-b border-slate-100 last:border-0 pb-1 last:pb-0'>
                            <span className='text-[10px] text-text-description'>{input.label}:</span>
                            <span className='text-xs font-semibold text-text-main'>{activeProcess.template_data?.[input.key] || <span className='text-text-description italic font-normal'>Chưa điền</span>}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right side: PDF Preview (lg:col-span-7) */}
            <div className='lg:col-span-7 space-y-3 flex flex-col h-full'>
              <div className='flex items-center justify-between pl-1 shrink-0'>
                <h4 className='text-xs font-bold text-text-secondary uppercase tracking-wider'>
                  Bản PDF khách hàng khai báo:
                </h4>
                <Button
                  onClick={handleExportPDF}
                  size='sm'
                  variant='outline'
                  className='text-[10px] h-7 px-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 flex items-center gap-1 bg-white shadow-sm'
                >
                  <Download className='w-3.5 h-3.5' />
                  Tải/In PDF
                </Button>
              </div>
              
              <div className='flex-1 bg-slate-100 border border-border-secondary rounded-2xl flex items-center justify-center shadow-inner overflow-hidden p-0 min-h-[380px]'>
                {activeProcess.pdf_url ? (
                  <div className='max-w-[480px] w-full h-full max-h-[420px] aspect-[1/1.414] overflow-hidden relative bg-white rounded-xl shadow-lg border-none'>
                    <iframe
                      src={activeProcess.pdf_url}
                      title="Client Submitted PDF Preview"
                      style={{
                        width: '166.67%',
                        height: '166.67%',
                        transform: 'scale(0.6)',
                        transformOrigin: 'top left',
                        border: 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div className='text-center space-y-2 p-6'>
                    <Clock className='w-8 h-8 text-slate-400 animate-spin mx-auto' />
                    <p className='text-xs text-text-description'>Đang kết xuất tệp PDF từ Cloudinary...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom section: Lawyer's advice & Decision (full width) - Compact Sticky footer */}
          <div className='sticky -bottom-6 z-10 py-3 px-5 border-t border-border-secondary bg-background-primary shadow-[0_-8px_24px_rgba(0,0,0,0.06)] space-y-3 shrink-0 rounded-t-2xl -mx-6 -mb-6 text-left'>
            <div className='grid grid-cols-1 md:grid-cols-12 gap-4 items-end'>
              {/* Left Column: Textarea (md:col-span-7) */}
              <div className='md:col-span-7 space-y-1'>
                <label className='text-[10px] font-bold text-text-secondary uppercase tracking-wider block'>
                  Ý kiến tư vấn / Đề xuất kết luận của Luật sư
                </label>
                <Textarea
                  value={adviceSummary}
                  onChange={(e) => setAdviceSummary(e.target.value)}
                  placeholder='Tóm tắt hướng giải quyết, căn cứ pháp lý áp dụng...'
                  className='rounded-lg text-xs bg-background-primary border-border-secondary min-h-[70px] h-[70px] resize-none'
                />
              </div>

              {/* Right Column: Submission Method & Publish (md:col-span-5) */}
              <div className='md:col-span-5 space-y-2 flex flex-col justify-between h-[92px]'>
                <div className='space-y-1'>
                  <label className='text-[10px] font-bold text-text-secondary uppercase tracking-wider block'>
                    Phương thức nộp & Hoàn thiện:
                  </label>
                  <div className='grid grid-cols-2 gap-2'>
                    <button
                      type='button'
                      onClick={() => setSubmissionMethod('MANUAL')}
                      className={cn(
                        'px-2 py-1.5 rounded-lg border text-center transition-all flex items-center justify-center gap-1 text-[11px] font-bold',
                        submissionMethod === 'MANUAL'
                          ? 'border-primary bg-primary/5 text-primary shadow-sm'
                          : 'border-border-secondary hover:bg-slate-50 text-text-secondary bg-white'
                      )}
                    >
                      Nộp trực tiếp (tay)
                    </button>

                    <button
                      type='button'
                      onClick={() => setSubmissionMethod('PORTAL')}
                      className={cn(
                        'px-2 py-1.5 rounded-lg border text-center transition-all flex items-center justify-center gap-1 text-[11px] font-bold',
                        submissionMethod === 'PORTAL'
                          ? 'border-primary bg-primary/5 text-primary shadow-sm'
                          : 'border-border-secondary hover:bg-slate-50 text-text-secondary bg-white'
                      )}
                    >
                      Nộp qua Cổng DVC
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handlePublishReport}
                  disabled={submittingReport || !adviceSummary.trim()}
                  className='w-full bg-primary hover:bg-primary/95 text-white font-bold py-1.5 rounded-lg flex items-center justify-center gap-2 shadow transition-all duration-200 text-[10px] uppercase tracking-wider h-8 shrink-0'
                >
                  {submittingReport ? 'Đang xử lý...' : 'Xác nhận & Hoàn thiện báo cáo'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
