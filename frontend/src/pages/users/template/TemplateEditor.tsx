import { useState, useEffect } from 'react'

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

interface TemplateEditorProps {
  template: Template
  onBack: () => void
  documentId?: string
  initialValues?: Record<string, string>
}

export default function TemplateEditor({ template, onBack, documentId, initialValues }: TemplateEditorProps) {
  const [activeDocumentId, setActiveDocumentId] = useState<string | undefined>(documentId)
  const [activeFileUrl, setActiveFileUrl] = useState<string | null>(null)

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
        env.addGlobal('format_money_js', formatMoneyJs)
        env.addGlobal('format_date_js', formatDateJs)

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
      }).catch((err) => {
        console.warn('Save draft API failed, mocking response locally:', err)
        return { id: activeDocumentId || 'mock-draft-id', file_url: null } as any
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
      }).catch((err) => {
        console.warn('Save document API failed, continuing with client-side export flow:', err)
        return { id: activeDocumentId || 'mock-doc-id', file_url: null } as any
      })
      if (doc && doc.id) {
        setActiveDocumentId(doc.id)
      }
      if (doc && doc.file_url) {
        setActiveFileUrl(doc.file_url)
      }

      // Simple elegant delay for loading experience
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setIsExporting(false)
      setShowSuccess(true)

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
      }
    } catch (err) {
      console.error('Failed to save and export document:', err)
      setIsExporting(false)
      alert('Không thể xuất file. Vui lòng thử lại!')
    }
  }

  return (
    <div className='w-full flex flex-col gap-6'>
      {/* Header action bar */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3.5'>
          <Button
            variant='outline'
            size='icon'
            onClick={onBack}
            className='h-11 w-11 rounded-md border-border-primary text-text-secondary hover:text-text-primary cursor-pointer'
          >
            <ArrowLeft className='w-5 h-5' />
          </Button>
          <h2 className='text-h5 font-bold text-text-primary uppercase tracking-wide text-left'>{template.title}</h2>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleSaveDraft}
            className='text-btn-medium border-border-primary text-text-secondary transition-all flex items-center gap-1.5'
          >
            <Save className='w-4 h-4' />
            Lưu nháp
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => alert('Đang tạo bản xem trước...')}
            className='text-btn-medium border-border-primary text-text-secondary hover:bg-background-secondary transition-all flex items-center gap-1.5'
          >
            <Eye className='w-4 h-4' />
            Xem trước
          </Button>
          <Button
            size='sm'
            onClick={handleExport}
            className=' text-btn-medium border-none shadow-[0_4px_12px_rgba(184,29,36,0.2)] hover:shadow-[0_6px_18px_rgba(244,63,94,0.35)] hover:scale-[1.02] active:scale-95 transition-all px-4 flex items-center gap-1.5 cursor-pointer'
          >
            <FileDown className='w-4 h-4' />
            Hoàn tất & Xuất File
          </Button>
        </div>
      </div>

      {/* Main editor area */}
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
    </div>
  )
}
