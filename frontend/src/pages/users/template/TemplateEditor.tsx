import { useState, useEffect } from 'react'

<<<<<<< HEAD
import { ArrowLeft, Save, FileDown, Eye } from 'lucide-react'
import nunjucks from 'nunjucks'

import { Button } from '@/components/ui/button'
import { printDocument } from '@/core/helpers/print-document'
import { documentApi } from '@/core/services/document.service'
import { type Template } from '@/models/types/form-library'

import ExportLoadingOverlay from './components/ExportLoadingOverlay'
import SuccessModal from './components/SuccessModal'
import TemplateForm from './components/TemplateForm'
import TemplatePreview from './components/TemplatePreview'

// Configure nunjucks for clientside without HTML escaping
const defaultEnv = nunjucks.configure({ autoescape: false })

const formatMoneyJs = (val: any) => {
  if (!val) return ''
  const numStr = String(val).replace(/,/g, '').replace(/\./g, '').replace(/ /g, '')
  const num = parseInt(numStr, 10)
  if (!isNaN(num)) {
    return num.toLocaleString('vi-VN').replace(/,/g, '.')
  }
  return val
}

const formatDateJs = (val: string) => {
  if (!val) return '..../..../....'
  const parts = val.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return val
}

defaultEnv.addGlobal('format_money_js', formatMoneyJs)
defaultEnv.addGlobal('format_date_js', formatDateJs)
=======
import { motion } from 'framer-motion'
import { ArrowLeft, Save, FileDown, Eye, CheckCircle2, Loader2 } from 'lucide-react'
import nunjucks from 'nunjucks'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { documentApi } from '@/core/services/document.service'
import { type Template } from '@/models/types/form-library'

// Configure nunjucks for clientside without HTML escaping
nunjucks.configure({ autoescape: false })
>>>>>>> 80a32bd (fix/(document): fix conflict template page)

interface TemplateEditorProps {
  template: Template
  onBack: () => void
  documentId?: string
  initialValues?: Record<string, string>
}

export default function TemplateEditor({ template, onBack, documentId, initialValues }: TemplateEditorProps) {
  const [activeDocumentId, setActiveDocumentId] = useState<string | undefined>(documentId)
<<<<<<< HEAD
  const [activeFileUrl, setActiveFileUrl] = useState<string | null>(null)
=======
>>>>>>> 80a32bd (fix/(document): fix conflict template page)

  // Store form values in a dictionary
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      return initialValues
    }
    const initial: Record<string, string> = {}
    template.fields?.forEach((sec) => {
      sec.inputs.forEach((input) => {
        initial[input.key] = input.defaultValue || ''
      })
    })
    return initial
  })

  const [htmlContent, setHtmlContent] = useState<string>('')
  const [componentsHtml, setComponentsHtml] = useState<string>('')

  useEffect(() => {
    fetch('/templates/components.html')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch components.html')
        return res.text()
      })
      .then((text) => setComponentsHtml(text))
      .catch((err) => {
        console.error('Failed to fetch local components.html:', err)
      })
  }, [])

  useEffect(() => {
    if (template.fileUrl) {
      fetch(template.fileUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch')
          return res.text()
        })
        .then((text) => setHtmlContent(text))
        .catch((err) => {
          console.error('Failed to fetch HTML template from Cloudinary:', err)
        })
    }
  }, [template.fileUrl])

  const compileHtml = (rawHtml: string, values: Record<string, string>) => {
    const ownerName = values.ownerName || values.fullName || ''
    const ownerDob = values.ownerDob || values.dob || ''
    const ownerId = values.ownerId || values.idNumber || ''

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
<<<<<<< HEAD
      format_date: (val: string) => {
        if (!val) return '..../..../....'
        const parts = val.split('-')
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`
        }
        return val
      },
      format_money: (val: any) => {
        if (!val) return ''
        const numStr = String(val).replace(/,/g, '').replace(/\./g, '').replace(/ /g, '')
        const num = parseInt(numStr, 10)
        if (!isNaN(num)) {
          return num.toLocaleString('vi-VN').replace(/,/g, '.')
        }
        return val
      },
=======
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
    }

    try {
      let compiled = ''
      if (componentsHtml) {
        const loader: nunjucks.ILoader = {
          async: false,
          getSource: (name: string): nunjucks.LoaderSource => {
            if (name.includes('components.html') || name === 'self') {
              return {
                src: componentsHtml,
                path: name,
                noCache: true,
              }
            }
            throw new Error(`Template not found: ${name}`)
          },
        }

        const env = new nunjucks.Environment(loader, { autoescape: false })
<<<<<<< HEAD
        env.addGlobal('format_money_js', formatMoneyJs)
        env.addGlobal('format_date_js', formatDateJs)
=======
>>>>>>> 80a32bd (fix/(document): fix conflict template page)

        let processedHtml = rawHtml.replace(
          /{%\s*import\s+['"]self['"]\s+as\s+c\s*%}/g,
          "{% import 'bcc_template/templates/html/components.html' as c %}"
        )

        compiled = env.renderString(processedHtml, context)
      } else {
        compiled = nunjucks.renderString(rawHtml, context)
      }

      if (componentsHtml && !compiled.includes('var(--bcc-serif-font)')) {
        const styleMatch = componentsHtml.match(/<style>([\s\S]*?)<\/style>/)
        const cssStyles = styleMatch ? styleMatch[1] : ''
        if (cssStyles) {
          const styleTag = `<style>${cssStyles}</style>`
          if (compiled.includes('</head>')) {
            compiled = compiled.replace('</head>', `${styleTag}</head>`)
          } else {
            compiled = styleTag + compiled
          }
        }
      }

      return compiled
    } catch (err) {
      console.error('Nunjucks compilation failed, falling back to regex replacement:', err)
      let compiled = rawHtml
      Object.keys(values).forEach((key) => {
        const val = values[key] || ''
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
        compiled = compiled.replace(regex, val)
      })
      return compiled
    }
  }

  // Export states
  const [isExporting, setIsExporting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  // Handle Save Draft
  const handleSaveDraft = async () => {
    try {
      const doc = await documentApi.saveDocument({
        templateId: template.id,
        content: formValues,
        isDraft: true,
        documentId: activeDocumentId
<<<<<<< HEAD
      }).catch((err) => {
        console.warn('Save draft API failed, mocking response locally:', err)
        return { id: activeDocumentId || 'mock-draft-id', file_url: null } as any
=======
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
      })
      if (doc && doc.id) {
        setActiveDocumentId(doc.id)
      }
      alert('Lưu bản nháp thành công!')
    } catch (err) {
      console.error('Failed to save draft:', err)
      alert('Lưu bản nháp thất bại!')
    }
  }

  // Handle export flow
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const doc = await documentApi.saveDocument({
        templateId: template.id,
        content: formValues,
        isDraft: false,
        documentId: activeDocumentId,
        html: compileHtml(htmlContent, formValues)
<<<<<<< HEAD
      }).catch((err) => {
        console.warn('Save document API failed, continuing with client-side export flow:', err)
        return { id: activeDocumentId || 'mock-doc-id', file_url: null } as any
=======
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
      })
      if (doc && doc.id) {
        setActiveDocumentId(doc.id)
      }
<<<<<<< HEAD
      if (doc && doc.file_url) {
        setActiveFileUrl(doc.file_url)
      }
=======
>>>>>>> 80a32bd (fix/(document): fix conflict template page)

      // Simple elegant delay for loading experience
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setIsExporting(false)
      setShowSuccess(true)

<<<<<<< HEAD
      // Automatically download PDF if fileUrl is available, otherwise open print dialog
      if (doc && doc.file_url) {
        const link = document.createElement('a')
        link.href = doc.file_url
        link.download = `${template.title.replace(/\s+/g, '_')}.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        printDocument(template.title)
=======
      const iframe = document.querySelector('iframe')
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.print()
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
      }
    } catch (err) {
      console.error('Failed to save and export document:', err)
      setIsExporting(false)
      alert('Không thể xuất file. Vui lòng thử lại!')
    }
  }

<<<<<<< HEAD
  return (
    <div className='w-full flex flex-col gap-6'>
      {/* Header action bar */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
=======
  const formatNumberString = (val: string) => {
    if (!val) return ''
    return val.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  return (
    <div className='w-full flex flex-col gap-6'>
      {/* Header action bar */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-background-secondary p-5 rounded-2xl border border-border-secondary shadow-sm'>
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
        <div className='flex items-center gap-3.5'>
          <Button
            variant='outline'
            size='icon'
            onClick={onBack}
<<<<<<< HEAD
            className='h-11 w-11 rounded-md border-border-primary text-text-secondary hover:text-text-primary cursor-pointer'
          >
            <ArrowLeft className='w-5 h-5' />
          </Button>
          <h2 className='text-h5 font-bold text-text-primary uppercase tracking-wide text-left'>{template.title}</h2>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
=======
            className='h-9 w-9 rounded-xl border-border-primary text-text-secondary hover:text-text-primary'
          >
            <ArrowLeft className='w-4.5 h-4.5' />
          </Button>
          <div className='text-left'>
            <h2 className='text-lg font-bold text-text-primary uppercase tracking-wide'>{template.title}</h2>
            <p className='text-xs text-text-description font-semibold'>Điền thông tin hợp đồng ở cột bên trái để cập nhật bản xem trước</p>
          </div>
        </div>

        <div className='flex items-center gap-2.5'>
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
          <Button
            variant='outline'
            size='sm'
            onClick={handleSaveDraft}
<<<<<<< HEAD
            className='text-btn-medium border-border-primary text-text-secondary transition-all flex items-center gap-1.5'
          >
            <Save className='w-4 h-4' />
=======
            className='h-9 text-xs font-bold rounded-xl border-border-primary text-text-secondary hover:bg-background-secondary transition-all px-4 flex items-center gap-1.5'
          >
            <Save className='w-3.5 h-3.5' />
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
            Lưu nháp
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => alert('Đang tạo bản xem trước...')}
<<<<<<< HEAD
            className='text-btn-medium border-border-primary text-text-secondary hover:bg-background-secondary transition-all flex items-center gap-1.5'
          >
            <Eye className='w-4 h-4' />
=======
            className='h-9 text-xs font-bold rounded-xl border-border-primary text-text-secondary hover:bg-background-secondary transition-all px-4 flex items-center gap-1.5'
          >
            <Eye className='w-3.5 h-3.5' />
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
            Xem trước
          </Button>
          <Button
            size='sm'
            onClick={handleExport}
<<<<<<< HEAD
            className=' text-btn-medium border-none shadow-[0_4px_12px_rgba(184,29,36,0.2)] hover:shadow-[0_6px_18px_rgba(244,63,94,0.35)] hover:scale-[1.02] active:scale-95 transition-all px-4 flex items-center gap-1.5 cursor-pointer'
          >
            <FileDown className='w-4 h-4' />
=======
            className='h-9 text-xs font-bold rounded-xl bg-[#0A2540] hover:bg-[#0A2540]/90 text-white border-none shadow-md px-4.5 flex items-center gap-1.5 active:scale-95 transition-all'
          >
            <FileDown className='w-3.5 h-3.5' />
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
            Hoàn tất & Xuất File
          </Button>
        </div>
      </div>

      {/* Main editor area */}
<<<<<<< HEAD
      <div className='w-full grid grid-cols-1 lg:grid-cols-12 gap-2 items-start'>
        {/* Left Form column */}
        <TemplateForm 
          template={template} 
          formValues={formValues} 
          onInputChange={handleInputChange} 
        />

        {/* Right PDF Preview column */}
        <TemplatePreview 
          template={template} 
          htmlContent={htmlContent} 
          formValues={formValues} 
          compiledHtml={compileHtml(htmlContent, formValues)} 
        />
      </div>

      {/* Export loading overlay */}
      <ExportLoadingOverlay isExporting={isExporting} />

      {/* Success Modal */}
      <SuccessModal 
        showSuccess={showSuccess} 
        activeFileUrl={activeFileUrl} 
        templateTitle={template.title} 
        onClose={() => setShowSuccess(false)} 
      />
=======
      <div className='w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        {/* Left Form column */}
        <div className='lg:col-span-5 bg-white dark:bg-background-secondary border border-border-secondary rounded-2xl p-6 shadow-sm space-y-6 max-h-[720px] overflow-y-auto'>
          {template.fields?.map((sec, secIdx) => (
            <div key={secIdx} className='space-y-4.5 border-b border-border-secondary/55 pb-6 last:border-b-0 last:pb-0'>
              <h3 className='text-sm font-extrabold text-text-primary border-l-3 border-primary pl-2.5 text-left uppercase tracking-wide'>
                {sec.section}
              </h3>
              
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {sec.inputs.map((input) => (
                  <div 
                    key={input.key} 
                    className={
                      input.key === 'contractNumber' || 
                      input.key === 'ownerName' || 
                      input.key === 'businessName' || 
                      input.key === 'officeAddress' || 
                      input.key === 'lessorName' || 
                      input.key === 'lessorAddress'
                        ? 'sm:col-span-2 space-y-1 text-left' 
                        : 'space-y-1 text-left'
                    }
                  >
                    <label className='text-[11px] font-bold text-text-secondary flex items-center gap-0.5'>
                      {input.label}
                      {input.required && <span className='text-error-primary'>*</span>}
                    </label>

                    {input.disabled ? (
                      <div className='relative'>
                        <Input
                          value={formValues[input.key]}
                          disabled
                          className='h-10 bg-background-secondary/30 border-border-secondary text-xs rounded-xl font-semibold text-text-description'
                        />
                        <span className='absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider text-text-tertiary bg-background-secondary px-1.5 py-0.5 rounded border border-border-secondary/60'>
                          Disabled
                        </span>
                      </div>
                    ) : (
                      <Input
                        type={input.type}
                        value={formValues[input.key]}
                        onChange={(e) => handleInputChange(input.key, e.target.value)}
                        placeholder={`Nhập ${input.label.toLowerCase()}...`}
                        className='h-10 border-border-secondary focus:border-primary focus:bg-background-primary transition-all text-xs rounded-xl text-text-primary font-medium'
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right PDF Preview column */}
        <div className='lg:col-span-7 bg-[#E2E8F0] dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 flex items-center justify-center min-h-[500px] lg:min-h-[720px] shadow-inner overflow-hidden relative'>
          {htmlContent ? (
            <iframe
              srcDoc={compileHtml(htmlContent, formValues)}
              title="Template Preview"
              className='w-full h-full min-h-[600px] lg:min-h-[680px] border-none bg-white rounded-lg shadow-2xl'
            />
          ) : (
            /* A4 Sheet Container Fallback */
            <div className='bg-white text-slate-800 w-full max-w-[540px] aspect-[1/1.414] shadow-2xl rounded-sm p-8 sm:p-10 text-left font-serif text-[11px] leading-relaxed relative flex flex-col border border-slate-200 overflow-y-auto max-h-[680px]'>
              {/* Stamp / Decorative header */}
              <div className='flex flex-col items-center justify-center border-b border-double border-slate-300 pb-4 mb-6 text-center font-sans'>
                <h1 className='text-[14px] font-extrabold uppercase tracking-wide text-slate-900 mb-0.5'>
                  {template.title}
                </h1>
                <p className='text-[9px] font-semibold text-slate-500 uppercase tracking-widest'>HỆ THỐNG PHÁP LÝ CHUẨN MỰC</p>
              </div>

              {/* Template-specific rendered text */}
              {(template.id === '1' || template.id === 'd3b07384-d113-4c9f-a2e6-ebcd2a2f8c5b') && (
                <div className='space-y-4'>
                  <div className='space-y-1.5'>
                    <p className='font-bold uppercase'>BÊN NHƯỢNG QUYỀN (BÊN A):</p>
                    <p className='pl-4'><span className='font-bold'>Công ty:</span> IKEA</p>
                    <p className='pl-4'><span className='font-bold'>Địa chỉ trụ sở chính:</span> Älmhult, Thụy Điển</p>
                  </div>

                  <div className='space-y-1.5'>
                    <p className='font-bold uppercase'>BÊN NHẬN QUYỀN (BÊN B):</p>
                    <p className='pl-4'><span className='font-bold'>Họ và Tên:</span> {formValues.fullName || '.......................................'}</p>
                    <p className='pl-4'><span className='font-bold'>Số điện thoại:</span> {formValues.phone || '.......................................'}</p>
                    <p className='pl-4'><span className='font-bold'>Ngày sinh:</span> {formValues.dob || '.......................................'}</p>
                    <p className='pl-4'><span className='font-bold'>Số CCCD:</span> {formValues.idNumber || '.......................................'}</p>
                    <p className='pl-4'><span className='font-bold'>Ngày cấp, nơi cấp:</span> {formValues.idIssueInfo || '.......................................'}</p>
                    <p className='pl-4'><span className='font-bold'>Địa chỉ thường trú:</span> {formValues.permanentAddress || '.......................................'}</p>
                  </div>

                  <p className='indent-6 text-justify'>
                    Hai bên thống nhất ký kết Hợp đồng nhượng quyền thương mại số <span className='font-bold'>{formValues.contractNumber || '...........................'}</span> ký tại <span className='font-bold'>{formValues.signLocation || '.................'}</span> vào ngày <span className='font-bold'>{formValues.signDate ? new Date(formValues.signDate).toLocaleDateString('vi-VN') : '..../..../2026'}</span> với các điều khoản thỏa thuận chi tiết như sau:
                  </p>

                  <div className='space-y-2.5'>
                    <p className='font-bold uppercase'>ĐIỀU 1: QUYỀN VÀ NGHĨA VỤ CỦA BÊN A</p>
                    <p className='pl-4 text-justify'>
                      1.1. Bên A cấp quyền cho Bên B sử dụng nhãn hiệu thương mại "IKEA", hệ thống nhận diện thương hiệu, cùng toàn bộ công thức và mô hình vận hành cửa hàng đồ nội thất nhượng quyền trên lãnh thổ Việt Nam.
                    </p>
                    <p className='pl-4 text-justify'>
                      1.2. Bên A có trách nhiệm chuyển giao tài liệu vận hành chi tiết, tổ chức các lớp huấn luyện nghiệp vụ định kỳ cho đội ngũ quản lý và nhân viên của Bên B.
                    </p>
                  </div>

                  <div className='space-y-2.5'>
                    <p className='font-bold uppercase'>ĐIỀU 2: QUYỀN VÀ NGHĨA VỤ CỦA BÊN B</p>
                    <p className='pl-4 text-justify'>
                      2.1. Bên B cam kết đầu tư tài chính thiết lập mặt bằng theo đúng thiết kế tiêu chuẩn mà Bên A đưa ra.
                    </p>
                    <p className='pl-4 text-justify'>
                      2.2. Thanh toán đầy đủ và đúng thời hạn phí nhượng quyền ban đầu cùng phí duy trì định kỳ theo thỏa thuận của Hợp đồng này. Tổng giá trị nhượng quyền thỏa thuận là: <span className='font-bold text-slate-900'>{formatNumberString(formValues.contractValue) || '...........................'}</span> VND.
                    </p>
                  </div>

                  <div className='flex justify-between pt-10 text-center font-sans'>
                    <div className='flex flex-col gap-1'>
                      <span className='font-bold uppercase text-[10px]'>ĐẠI DIỆN BÊN A</span>
                      <span className='text-[9px] text-slate-400 italic'>(Ký, ghi rõ họ tên)</span>
                      <span className='font-bold mt-12 text-slate-800'>IKEA Inc.</span>
                    </div>
                    <div className='flex flex-col gap-1'>
                      <span className='font-bold uppercase text-[10px]'>ĐẠI DIỆN BÊN B</span>
                      <span className='text-[9px] text-slate-400 italic'>(Ký, ghi rõ họ tên)</span>
                      <span className='font-bold mt-12 text-slate-800'>{formValues.fullName || '...........................'}</span>
                    </div>
                  </div>
                </div>
              )}

              {(template.id === '2' || template.id === 'cf401a02-d224-4f8e-a3f7-fbcd3a3f9c6c') && (
                <div className='space-y-4'>
                  <div className='text-center font-sans space-y-1 mb-4'>
                    <p className='font-bold text-[12px]'>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className='font-bold text-[10px] border-b border-slate-300 pb-2 w-fit mx-auto'>Độc lập - Tự do - Hạnh phúc</p>
                  </div>

                  <div className='space-y-1.5'>
                    <p className='font-bold uppercase'>Kính gửi: Phòng Đăng ký kinh doanh tỉnh/thành phố Đà Nẵng</p>
                  </div>

                  <p className='indent-6 text-justify'>
                    Tôi là: <span className='font-bold uppercase'>{formValues.ownerName || '.......................................'}</span>, sinh ngày <span className='font-bold'>{formValues.ownerDob ? new Date(formValues.ownerDob).toLocaleDateString('vi-VN') : '..../..../....'}</span>, giới tính: <span className='font-bold'>{formValues.ownerGender || '..............'}</span>, mang số CMND/CCCD/Hộ chiếu: <span className='font-bold'>{formValues.ownerId || '...........................'}</span>.
                  </p>

                  <p className='text-justify'>
                    Đề nghị đăng ký doanh nghiệp tư nhân với các thông tin sau:
                  </p>

                  <div className='space-y-1.5 pl-4'>
                    <p><span className='font-bold'>1. Tên doanh nghiệp:</span> {formValues.businessName || '..................................................................'}</p>
                    <p><span className='font-bold'>2. Địa chỉ trụ sở:</span> {formValues.officeAddress || '..................................................................'}</p>
                    <p><span className='font-bold'>3. Vốn đầu tư của chủ doanh nghiệp:</span> {formValues.capital ? `${formValues.capital}` : '...........................'} VND.</p>
                  </div>

                  <p className='indent-6 text-justify'>
                    Tôi cam kết hoàn toàn chịu trách nhiệm trước pháp luật về tính hợp pháp, chính xác và trung thực của các nội dung đăng ký doanh nghiệp trên đây.
                  </p>

                  <div className='flex justify-end pt-10 text-center font-sans'>
                    <div className='flex flex-col gap-1 pr-6'>
                      <span className='italic text-[9px] text-slate-500'>Đà Nẵng, ngày .... tháng .... năm 2026</span>
                      <span className='font-bold uppercase text-[10px] mt-1'>CHỦ DOANH NGHIỆP</span>
                      <span className='text-[9px] text-slate-400 italic'>(Ký, ghi rõ họ tên)</span>
                      <span className='font-bold mt-12 text-slate-800'>{formValues.ownerName || '...........................'}</span>
                    </div>
                  </div>
                </div>
              )}

              {(template.id === '3' || template.id === 'e4c01b03-d335-4f9e-b4f8-abcd4a4f0d7d') && (
                <div className='space-y-4'>
                  <div className='space-y-1.5'>
                    <p className='font-bold uppercase'>BÊN CHO THUÊ (BÊN A):</p>
                    <p className='pl-4'><span className='font-bold'>Tên:</span> {formValues.lessorName || '.......................................'}</p>
                    <p className='pl-4'><span className='font-bold'>Địa chỉ:</span> {formValues.lessorAddress || '.......................................'}</p>
                  </div>

                  <div className='space-y-1.5'>
                    <p className='font-bold uppercase'>THÔNG TIN VĂN PHÒNG THUÊ:</p>
                    <p className='pl-4'><span className='font-bold'>Diện tích thuê:</span> {formValues.area || '.........'} m2</p>
                    <p className='pl-4'><span className='font-bold'>Giá thuê hàng tháng:</span> {formValues.price ? `${formatNumberString(formValues.price)} VND` : '.......................'}</p>
                    <p className='pl-4'><span className='font-bold'>Thời hạn thuê:</span> {formValues.rentPeriod || '.........'} tháng</p>
                  </div>

                  <p className='text-justify indent-6'>
                    Bên A đồng ý cho Bên B thuê văn phòng tại địa chỉ trên với diện tích và giá cả thỏa thuận. Hai bên cam kết thực hiện đúng các quy định về đóng tiền đặt cọc và thanh toán tiền thuê đúng kỳ hạn.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Export loading overlay */}
      {isExporting && (
        <div className='fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6'>
          <div className='w-full max-w-xs bg-white dark:bg-background-secondary border border-border-secondary rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200'>
            <Loader2 className='w-10 h-10 animate-spin text-primary' />
            <div>
              <p className='text-sm font-bold text-text-primary uppercase tracking-wide'>Đang tạo tài liệu</p>
              <p className='text-xs text-text-description font-semibold mt-1'>Vui lòng đợi trong giây lát...</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className='fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6'>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-white dark:bg-background-secondary border border-border-secondary p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center flex flex-col items-center gap-4.5'
          >
            <div className='w-16 h-16 rounded-full bg-success-primary/10 text-success-primary flex items-center justify-center shrink-0 border border-success-primary/15 mb-1 animate-bounce'>
              <CheckCircle2 className='w-8 h-8' />
            </div>
            <h3 className='text-lg font-extrabold text-text-primary uppercase tracking-wide'>Tạo văn bản thành công!</h3>
            <p className='text-xs text-text-secondary leading-relaxed font-semibold'>
              File PDF của bạn đã được xuất bản và tự động tải xuống. Bạn có thể kiểm tra tệp tin trong thư mục tải về của trình duyệt.
            </p>
            <Button
              onClick={() => setShowSuccess(false)}
              className='h-9.5 w-full bg-primary text-white hover:opacity-90 font-bold text-xs rounded-xl shadow-md border-none mt-2'
            >
              Quay lại chỉnh sửa
            </Button>
          </motion.div>
        </div>
      )}
>>>>>>> 80a32bd (fix/(document): fix conflict template page)
    </div>
  )
}
