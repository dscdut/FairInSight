import React, { useState, useEffect } from 'react';

import { FileText, FileCheck, CheckCircle, Clock, Send, Download } from 'lucide-react';
import nunjucks from 'nunjucks';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { type ConsultationProcess, type SubmissionMethod } from '@/core/services/consultation.service';
import { type Template } from '@/models/types/form-library';

// Configure nunjucks for client-side without HTML escaping
const defaultEnv = nunjucks.configure({ autoescape: false });

const formatMoneyJs = (val: string | number | unknown) => {
  if (!val) return '';
  const numStr = String(val).replace(/,/g, '').replace(/\./g, '').replace(/ /g, '');
  const num = parseInt(numStr, 10);
  if (!isNaN(num)) {
    return num.toLocaleString('vi-VN').replace(/,/g, '.');
  }
  return val;
};

const formatDateJs = (val: string, format = 'slash') => {
  if (!val) return format === 'words' ? '...... tháng ...... năm ......' : '..../..../....';
  const cleanVal = val.trim();
  const parts = cleanVal.includes('-') ? cleanVal.split('-') : cleanVal.split('/');
  if (parts.length === 3) {
    const isYearFirst = parts[0].length === 4;
    const day = isYearFirst ? parts[2] : parts[0];
    const month = parts[1];
    const year = isYearFirst ? parts[0] : parts[2];
    if (format === 'words') {
      return `${day} tháng ${month} năm ${year}`;
    }
    return `${day}/${month}/${year}`;
  }
  return val;
};

defaultEnv.addGlobal('format_money_js', formatMoneyJs);
defaultEnv.addGlobal('format_date_js', formatDateJs);

// Helper to convert full URL (e.g. Cloudinary) to local Vite public path
const getLocalTemplatePath = (url: string): string => {
  try {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    return `/templates/${fileName}`;
  } catch (e) {
    return url;
  }
};

interface ClientStagePdfGenerationProps {
  isLawyer: boolean;
  process: ConsultationProcess;
  partnerName: string;
  suggestedTemplates: Template[];
  templates: Template[];
  selectedTemplate: Template | undefined;
  handleSelectTemplate: (id: string) => Promise<void>;
  adviceSummary: string;
  setAdviceSummary: (v: string) => void;
  submissionMethod: SubmissionMethod;
  setSubmissionMethod: (v: SubmissionMethod) => void;
  handlePdfSubmit: () => Promise<void>;
  submittingPdf: boolean;
  formValues: Record<string, string>;
  setFormValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleSubmitTemplateData: (e: React.FormEvent) => void;
  submittingData?: boolean;
}

export default function ClientStagePdfGeneration({
  isLawyer,
  process,
  partnerName,
  suggestedTemplates,
  templates,
  selectedTemplate,
  handleSelectTemplate,
  adviceSummary,
  setAdviceSummary,
  submissionMethod,
  setSubmissionMethod,
  handlePdfSubmit,
  submittingPdf,
  formValues,
  setFormValues,
  handleSubmitTemplateData,
  submittingData = false
}: ClientStagePdfGenerationProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [componentsHtml, setComponentsHtml] = useState<string>('');

  // Fetch base layout/components HTML
  useEffect(() => {
    fetch('/templates/components.html')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch components.html');
        return res.text();
      })
      .then((text) => setComponentsHtml(text))
      .catch((err) => {
        console.error('Failed to fetch local components.html:', err);
      });
  }, []);

  // Fetch specific template HTML with self-healing local fallback
  useEffect(() => {
    if (selectedTemplate?.fileUrl) {
      const isMockCloudinary = (selectedTemplate.fileUrl || '').includes('drx34env0') || !(selectedTemplate.fileUrl || '').startsWith('http');
      const primaryUrl = isMockCloudinary ? getLocalTemplatePath(selectedTemplate.fileUrl || '') : selectedTemplate.fileUrl;

      fetch(primaryUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch primary');
          return res.text();
        })
        .then((text) => setHtmlContent(text))
        .catch((err) => {
          console.warn('Failed to fetch primary template, trying fallback local path:', err);
          const fallbackUrl = getLocalTemplatePath(selectedTemplate.fileUrl || '');
          fetch(fallbackUrl)
            .then((res) => {
              if (!res.ok) throw new Error('Failed to fetch fallback');
              return res.text();
            })
            .then((text) => setHtmlContent(text))
            .catch((err2) => {
              console.error('All template fetch attempts failed:', err2);
            });
        });
    }
  }, [selectedTemplate?.fileUrl]);

  const compileHtml = (rawHtml: string, values: Record<string, string>) => {
    const ownerName = values.ownerName || values.fullName || '';
    const ownerDob = values.ownerDob || values.dob || '';
    const ownerId = values.ownerId || values.idNumber || '';

    // Map context fields to match standard backend Jinja2 variables
    const context = {
      ...values,
      signer: {
        first_name: ownerName,
        last_name: '',
        date_of_birth: ownerDob,
        gender: values.ownerGender || '',
        personal_id: ownerId,
        address: values.currentAddress || '',
        phone: values.phone || '',
        permanent_address: values.permanentAddress || '',
      },
      signer_full_name: ownerName,
      business: {
        business_name: values.businessName || '',
      },
      office: {
        number_house: '',
        street: values.officeAddress || '',
        ward: '',
        province: 'Đà Nẵng',
        phone: values.phone || '',
      },
      office_address_full: values.officeAddress || '',
      investment: {
        capital: values.capital || '',
      },
      // Fallback flat placeholders
      fullName: ownerName,
      phone: values.phone || '',
      dob: ownerDob,
      idNumber: ownerId,
      permanentAddress: values.permanentAddress || '',
      lessorName: values.lessorName || '',
      lessorAddress: values.lessorAddress || '',
      area: values.area || '',
      price: values.price || '',
      rentPeriod: values.rentPeriod || '',
      format_date: (val: string, format = 'slash') => formatDateJs(val, format),
      format_money: (val: string | number | unknown) => formatMoneyJs(val),
    };

    try {
      let compiled = '';
      if (componentsHtml) {
        const loader: nunjucks.ILoader = {
          async: false,
          getSource: (name: string): nunjucks.LoaderSource => {
            if (name.includes('components.html') || name === 'self') {
              return {
                src: componentsHtml,
                path: name,
                noCache: true,
              };
            }
            throw new Error(`Template not found: ${name}`);
          },
        };

        const env = new nunjucks.Environment(loader, { autoescape: false });
        env.addGlobal('format_money_js', formatMoneyJs);
        env.addGlobal('format_date_js', formatDateJs);

        let processedHtml = rawHtml.replace(
          /{%\s*import\s+['"]self['"]\s+as\s+c\s*%}/g,
          "{% import 'bcc_template/templates/html/components.html' as c %}"
        );

        compiled = env.renderString(processedHtml, context);
      } else {
        compiled = nunjucks.renderString(rawHtml, context);
      }

      if (componentsHtml && !compiled.includes('var(--bcc-serif-font)')) {
        const styleMatch = componentsHtml.match(/<style>([\s\S]*?)<\/style>/);
        const cssStyles = styleMatch ? styleMatch[1] : '';
        if (cssStyles) {
          const styleTag = `<style>${cssStyles}</style>`;
          if (compiled.includes('</head>')) {
            compiled = compiled.replace('</head>', `${styleTag}</head>`);
          } else {
            compiled = styleTag + compiled;
          }
        }
      }

      return compiled;
    } catch (err) {
      console.warn('Nunjucks compilation failed, falling back to regex replacement:', err);
      let compiled = rawHtml;
      Object.keys(values).forEach((key) => {
        const val = values[key] || '';
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        compiled = compiled.replace(regex, val);
      });
      return compiled;
    }
  };

  return (
    <div className='flex-1 flex flex-col space-y-4 justify-start text-left w-full h-full'>
      {isLawyer ? (
        <div className='space-y-4 w-full'>
          {!process.template_id ? (
            <div className='space-y-4 w-full'>
              <div className='space-y-1.5'>
                <h3 className='font-bold text-sm text-text-primary uppercase tracking-wider'>Đề xuất biểu mẫu chuẩn</h3>
                <p className='text-[10px] text-text-description leading-relaxed'>
                  Hệ thống tự động đề xuất dựa trên phân tích hồ sơ vụ việc của khách hàng.
                </p>
              </div>

              {/* Auto-suggested templates */}
              <div className='space-y-2'>
                <h4 className='text-[11px] font-bold text-primary uppercase tracking-wider'>Đề xuất hàng đầu:</h4>
                {suggestedTemplates.length > 0 ? (
                  <div className='grid grid-cols-1 gap-2.5'>
                    {suggestedTemplates.map((t) => (
                      <div key={t.id} className='p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-start justify-between gap-4'>
                        <div className='space-y-0.5'>
                          <div className='flex items-center gap-1.5'>
                            <span className='bg-primary/10 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded'>Đề xuất</span>
                            <h5 className='text-xs font-bold text-text-primary'>{t.title}</h5>
                          </div>
                          <p className='text-[10px] text-text-description'>{t.description}</p>
                        </div>
                        <Button onClick={() => handleSelectTemplate(t.id)} size='sm' className='bg-primary text-white text-[10px] font-bold rounded-lg shrink-0 h-8'>
                          Chọn
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-[11px] text-text-description italic'>Không tìm thấy đề xuất tự động chính xác cho vụ việc này.</p>
                )}
              </div>

              {/* All templates */}
              <div className='space-y-2 border-t border-border-secondary pt-3.5'>
                <h4 className='text-[11px] font-bold text-text-secondary uppercase tracking-wider'>Tất cả biểu mẫu:</h4>
                <div className='grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1'>
                  {templates.filter(t => !suggestedTemplates.find(s => s.id === t.id)).map((t) => (
                    <div key={t.id} className='p-3 rounded-xl border border-border-secondary bg-white hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors'>
                      <div className='space-y-0.5'>
                        <h5 className='text-xs font-bold text-text-primary'>{t.title}</h5>
                        <p className='text-[10px] text-text-description'>{t.description}</p>
                      </div>
                      <Button onClick={() => handleSelectTemplate(t.id)} variant='outline' size='sm' className='text-[10px] font-bold rounded-lg shrink-0 h-8'>
                        Chọn
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : process.template_status === 'SELECTED' ? (
            <div className='flex flex-col items-center justify-center text-center p-6 space-y-3.5 max-w-sm mx-auto w-full'>
              <div className='w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500'>
                <Clock className='w-6 h-6 animate-pulse' />
              </div>
              <div className='space-y-1.5'>
                <h3 className='font-bold text-sm text-text-primary'>Đã đề xuất biểu mẫu</h3>
                <p className='text-[11px] text-text-description leading-relaxed'>
                  Bạn đã gửi biểu mẫu <strong>"{selectedTemplate?.title}"</strong> cho khách hàng. Đang chờ khách hàng điền các trường thông tin và nộp lại.
                </p>
              </div>
              <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider animate-pulse'>
                Chờ khách hàng khai báo thông tin
              </span>
            </div>
          ) : (
            <div className='space-y-4 w-full'>
              {/* View client submitted data */}
              <div className='space-y-2 border border-border-secondary p-3.5 rounded-2xl bg-slate-50/50'>
                <div className='flex items-center gap-2 border-b border-slate-100 pb-2 mb-2'>
                  <CheckCircle className='w-4.5 h-4.5 text-emerald-500' />
                  <h4 className='text-xs font-bold text-text-primary uppercase tracking-wider'>
                    Dữ liệu khách hàng đã điền: "{selectedTemplate?.title}"
                  </h4>
                </div>
                <div className='space-y-3 text-[11px] max-h-[180px] overflow-y-auto pr-1'>
                  {selectedTemplate?.fields?.map((section, idx) => (
                    <div key={idx} className='space-y-1.5'>
                      <h5 className='font-bold text-text-secondary uppercase text-[10px]'>{section.section}</h5>
                      <div className='grid grid-cols-1 gap-2 bg-white p-2.5 rounded-xl border border-slate-100'>
                        {section.inputs.map((input) => (
                          <div key={input.key} className='flex items-center justify-between gap-2 border-b border-slate-50 last:border-0 pb-1 last:pb-0'>
                            <span className='text-text-description'>{input.label}:</span>
                            <span className='font-bold text-text-primary'>{process.template_data?.[input.key] || <span className='italic font-normal text-text-description'>Trống</span>}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='space-y-3 border-t border-border-secondary pt-3.5'>
                <div className='space-y-1.5'>
                  <label className='font-bold text-text-secondary text-xs'>Ý kiến kết luận của Luật sư:</label>
                  <Textarea
                    value={adviceSummary}
                    onChange={(e) => setAdviceSummary(e.target.value)}
                    placeholder='Tóm tắt hướng giải quyết, căn cứ pháp lý và đề xuất hành động cho khách hàng...'
                    className='min-h-[90px] text-xs leading-relaxed text-text-primary'
                  />
                </div>

                <div className='space-y-2 border border-border-secondary p-3 rounded-2xl bg-slate-50/60'>
                  <label className='font-bold text-text-secondary text-[11px] block'>Chọn phương thức chuyển tiếp:</label>
                  <div className='flex flex-col gap-2 mt-1.5 text-xs'>
                    <label className='flex items-center gap-2 font-semibold text-text-primary cursor-pointer select-none'>
                      <input
                        type='radio'
                        name='subMethod'
                        checked={submissionMethod === 'MANUAL'}
                        onChange={() => setSubmissionMethod('MANUAL')}
                        className='accent-primary w-4 h-4'
                      />
                      Quyết định nộp hồ sơ tay (Trực tiếp)
                    </label>
                    <label className='flex items-center gap-2 font-semibold text-text-primary cursor-pointer select-none'>
                      <input
                        type='radio'
                        name='subMethod'
                        checked={submissionMethod === 'PORTAL'}
                        onChange={() => setSubmissionMethod('PORTAL')}
                        className='accent-primary w-4 h-4'
                      />
                      Quyết định nộp trực tuyến (Cổng DVC)
                    </label>
                  </div>
                </div>

                <div className='flex pt-2'>
                  <Button
                    onClick={handlePdfSubmit}
                    disabled={submittingPdf || !adviceSummary.trim()}
                    className='w-full bg-primary hover:bg-primary-600 text-white font-bold text-xs py-2 rounded-xl shadow'
                  >
                    {submittingPdf ? 'Đang hoàn tất...' : 'Đồng ý & Chuyển sang bước tiếp theo'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // CLIENT PERSPECTIVE
        <div className='w-full h-full flex-1 flex flex-col'>
          {!process.template_id ? (
            <div className='flex flex-col items-center justify-center text-center p-8 space-y-3.5 max-w-sm mx-auto my-auto'>
              <div className='w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 ring-8 ring-blue-500/10'>
                <FileText className='w-6 h-6 animate-pulse' />
              </div>
              <div className='space-y-1.5'>
                <h3 className='font-bold text-sm text-text-primary'>Đang chuẩn bị biểu mẫu</h3>
                <p className='text-[11px] text-text-description leading-relaxed'>
                  Luật sư {partnerName} đang nghiên cứu hồ sơ vụ việc để đề xuất biểu mẫu đăng ký/hợp đồng phù hợp nhất cho bạn khai báo. Vui lòng đợi trong giây lát.
                </p>
              </div>
            </div>
          ) : process.template_status === 'SELECTED' ? (
            // SIDE-BY-SIDE EDITOR / PREVIEW LAYOUT
            <div className='w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch h-[calc(100vh-220px)] overflow-hidden'>
              {/* Left Column: Input Form (lg:col-span-5) */}
              <div className='lg:col-span-5 bg-background-primary border border-border-secondary rounded-2xl p-4 pb-2 shadow-sm space-y-4 h-full overflow-y-auto flex flex-col text-left'>
                <div className='space-y-1 border-b border-slate-100 pb-3 shrink-0'>
                  <h3 className='font-bold text-sm text-text-primary uppercase tracking-wider flex items-center gap-1.5'>
                    <FileCheck className='w-4.5 h-4.5 text-primary' /> {selectedTemplate?.title}
                  </h3>
                  <p className='text-[10px] text-text-description leading-relaxed'>
                    Vui lòng điền đầy đủ các thông tin khai báo dưới đây để tự động tạo dự thảo văn bản:
                  </p>
                </div>

                <form onSubmit={handleSubmitTemplateData} className='flex-1 flex flex-col justify-between space-y-4'>
                  <div className='space-y-4 overflow-y-auto pr-1 flex-1'>
                    {selectedTemplate?.fields?.map((section, secIdx) => (
                      <div key={secIdx} className='space-y-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0'>
                        <h4 className='font-bold text-text-secondary uppercase text-[10px] tracking-wider'>{section.section}</h4>
                        <div className='grid grid-cols-1 gap-3'>
                          {section.inputs.map((input) => (
                            <div key={input.key} className='space-y-1'>
                              <label className='font-semibold text-text-primary text-xs flex items-center gap-0.5'>
                                {input.label}
                                {input.required && <span className='text-red-500 font-bold'>*</span>}
                              </label>
                              <Input
                                type={input.type}
                                placeholder={input.placeholder || `Nhập ${input.label.toLowerCase()}...`}
                                required={input.required}
                                value={formValues[input.key] || ''}
                                onChange={(e) => setFormValues(prev => ({ ...prev, [input.key]: e.target.value }))}
                                className='h-9 rounded-xl text-xs bg-white border-border-secondary w-full'
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className='pt-3 border-t border-slate-100 shrink-0'>
                    <Button
                      type='submit'
                      disabled={submittingData}
                      className='w-full bg-primary hover:bg-primary-600 text-white font-bold py-2 rounded-xl shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-1.5'
                    >
                      <Send className='w-4 h-4' />
                      {submittingData ? 'Đang gửi...' : 'Gửi thông tin & Sinh PDF bản thảo'}
                    </Button>
                  </div>
                </form>
              </div>

              <div className='lg:col-span-7 bg-slate-100 border border-border-secondary rounded-2xl flex items-center justify-center h-full shadow-inner overflow-hidden relative p-0'>
                {htmlContent ? (
                  <div className='max-w-[480px] w-full h-full max-h-[640px] aspect-[1/1.414] overflow-hidden relative bg-white rounded-xl shadow-lg border-none'>
                    <iframe
                      key={JSON.stringify(formValues)}
                      srcDoc={compileHtml(htmlContent, formValues)}
                      title="Live Draft Template Preview"
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
                    <p className='text-xs text-text-description'>Đang tải nội dung bản xem trước...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // CLIENT SUBMITTED: VIEW CLOUDINARY PDF DRAFT
            <div className='w-full flex flex-col gap-3 h-[calc(100vh-220px)] overflow-hidden'>
              {/* Top Banner: Status info */}
              <div className='bg-background-primary border border-border-secondary rounded-xl p-3 shadow-sm flex items-center justify-between gap-4 shrink-0 text-left'>
                <div className='flex items-center gap-3 min-w-0'>
                  <div className='w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shrink-0'>
                    <CheckCircle className='w-4.5 h-4.5 animate-pulse' />
                  </div>
                  <div className='min-w-0'>
                    <h4 className='font-bold text-xs text-text-primary'>Đã nộp thông tin & Đang tạo bản PDF</h4>
                    <p className='text-[10px] text-text-description truncate max-w-lg'>
                      Đang chờ Luật sư {partnerName} phê duyệt, viết báo cáo tư vấn và ký xác nhận.
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2 shrink-0'>
                  <span className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[8px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider animate-pulse'>
                    Chờ luật sư bổ sung kết luận
                  </span>
                  {process.pdf_url && (
                    <Button
                      onClick={() => window.open(process.pdf_url!, '_blank')}
                      variant='outline'
                      size='sm'
                      className='border border-slate-200 hover:bg-slate-50 text-[10px] h-7 rounded-lg flex items-center justify-center gap-1 bg-white shadow-sm font-semibold'
                    >
                      <Download className='w-3 h-3' />
                      Mở PDF trong tab mới
                    </Button>
                  )}
                </div>
              </div>

              {/* Bottom: Large PDF Preview */}
              <div className='flex-1 bg-slate-100 border border-border-secondary rounded-2xl flex items-center justify-center h-full shadow-inner overflow-hidden p-0'>
                {process.pdf_url ? (
                  <div className='max-w-[600px] w-full h-full max-h-[85vh] aspect-[1/1.414] overflow-hidden relative bg-white rounded-xl shadow-lg border-none'>
                    <iframe
                      src={process.pdf_url}
                      title="Submitted PDF Draft"
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
          )}
        </div>
      )}
    </div>
  );
}
