import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, FileText } from 'lucide-react'
import nunjucks from 'nunjucks'

import { Button } from '@/components/ui/button'
import { type Template } from '@/models/types/form-library'

interface TemplatePreviewModalProps {
  template: Template | null
  onClose: () => void
  onUse: (template: Template) => void
}

// ---- Helper compile giống TemplateEditor (dùng giá trị mẫu defaultValue) ----
const formatMoneyJs = (val: string | number | unknown) => {
  if (!val) return ''
  const numStr = String(val).replace(/,/g, '').replace(/\./g, '').replace(/ /g, '')
  const num = parseInt(numStr, 10)
  return !isNaN(num) ? num.toLocaleString('vi-VN').replace(/,/g, '.') : String(val)
}

const formatDateJs = (val: string, format = 'slash') => {
  if (!val) return format === 'words' ? '...... tháng ...... năm ......' : '..../..../....'
  const parts = val.trim().includes('-') ? val.trim().split('-') : val.trim().split('/')
  if (parts.length === 3) {
    const yearFirst = parts[0].length === 4
    const day = yearFirst ? parts[2] : parts[0]
    const year = yearFirst ? parts[0] : parts[2]
    return format === 'words' ? `${day} tháng ${parts[1]} năm ${year}` : `${day}/${parts[1]}/${year}`
  }
  return val
}

// Xem trước HÌNH DẠNG biểu mẫu ngay tại thư viện (không vào editor): fetch file HTML
// của template, compile bằng nunjucks với giá trị mẫu (defaultValue), nhúng iframe.
export default function TemplatePreviewModal({ template, onClose, onUse }: TemplatePreviewModalProps) {
  const [rawHtml, setRawHtml] = useState('')
  const [componentsHtml, setComponentsHtml] = useState('')
  const [loading, setLoading] = useState(false)

  // Giá trị mẫu từ defaultValue của các trường (giống initial của editor).
  const sampleValues = useMemo(() => {
    const v: Record<string, string> = {}
    template?.fields?.forEach((sec) => sec.inputs.forEach((i) => { v[i.key] = i.defaultValue || '' }))
    return v
  }, [template])

  // Tải components.html (chứa style + macro) một lần.
  useEffect(() => {
    fetch('/templates/components.html')
      .then((r) => (r.ok ? r.text() : ''))
      .then(setComponentsHtml)
      .catch(() => setComponentsHtml(''))
  }, [])

  // Tải file HTML của template mỗi khi mở 1 template.
  useEffect(() => {
    if (!template?.fileUrl) { setRawHtml(''); return }
    setLoading(true)
    fetch(template.fileUrl)
      .then((r) => (r.ok ? r.text() : ''))
      .then((t) => setRawHtml(t))
      .catch(() => setRawHtml(''))
      .finally(() => setLoading(false))
  }, [template])

  const compiledHtml = useMemo(() => {
    if (!rawHtml) return ''
    const ownerName = sampleValues.ownerName || sampleValues.fullName || ''
    const context = {
      ...sampleValues,
      signer: {
        first_name: ownerName, last_name: '',
        date_of_birth: sampleValues.ownerDob || sampleValues.dob || '',
        gender: sampleValues.ownerGender || '',
        personal_id: sampleValues.ownerId || sampleValues.idNumber || '',
        address: sampleValues.currentAddress || '', phone: sampleValues.phone || '',
        permanent_address: sampleValues.permanentAddress || '',
      },
      signer_full_name: ownerName,
      business: { business_name: sampleValues.businessName || '' },
      office: { number_house: '', street: sampleValues.officeAddress || '', ward: '', province: 'Đà Nẵng', phone: sampleValues.phone || '' },
      office_address_full: sampleValues.officeAddress || '',
      investment: { capital: sampleValues.capital || '' },
      format_date: (val: string, format = 'slash') => formatDateJs(val, format),
      format_money: (val: string | number | unknown) => formatMoneyJs(val),
    }
    try {
      let compiled: string
      if (componentsHtml) {
        const loader: nunjucks.ILoader = {
          async: false,
          getSource: (name: string): nunjucks.LoaderSource => {
            if (name.includes('components.html') || name === 'self') {
              return { src: componentsHtml, path: name, noCache: true }
            }
            throw new Error(`Template not found: ${name}`)
          },
        }
        const env = new nunjucks.Environment(loader, { autoescape: false })
        env.addGlobal('format_money_js', formatMoneyJs)
        env.addGlobal('format_date_js', formatDateJs)
        const processed = rawHtml.replace(
          /{%\s*import\s+['"]self['"]\s+as\s+c\s*%}/g,
          "{% import 'bcc_template/templates/html/components.html' as c %}"
        )
        compiled = env.renderString(processed, context)
        if (!compiled.includes('var(--bcc-serif-font)')) {
          const styleMatch = componentsHtml.match(/<style>([\s\S]*?)<\/style>/)
          const css = styleMatch ? styleMatch[1] : ''
          if (css) {
            const tag = `<style>${css}</style>`
            compiled = compiled.includes('</head>') ? compiled.replace('</head>', `${tag}</head>`) : tag + compiled
          }
        }
      } else {
        compiled = nunjucks.renderString(rawHtml, context)
      }
      return compiled
    } catch {
      // Fallback: thay {{ key }} thô.
      let c = rawHtml
      Object.keys(sampleValues).forEach((k) => {
        c = c.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), sampleValues[k] || '')
      })
      return c
    }
  }, [rawHtml, componentsHtml, sampleValues])

  return createPortal(
    <AnimatePresence>
      {template && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className='fixed inset-0 z-[200] bg-black'
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-52%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-52%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='fixed left-1/2 top-1/2 z-[201] w-[95vw] max-w-4xl h-[90vh] bg-background-primary shadow-2xl rounded-2xl flex flex-col border border-border-secondary overflow-hidden'
          >
            {/* Header — phông nền đỏ (primary) chữ trắng, hợp tông brand */}
            <div className='flex items-center justify-between gap-4 px-6 py-4 shrink-0 bg-gradient-to-r from-primary to-primary-400 text-white'>
              <div className='flex items-center gap-3 min-w-0'>
                <div className='w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0'>
                  <FileText className='w-5 h-5 text-white' />
                </div>
                <div className='min-w-0'>
                  <h2 className='text-base font-bold text-white truncate'>{template.title}</h2>
                  <p className='text-xs text-white/80'>Xem trước biểu mẫu · dữ liệu mẫu</p>
                </div>
              </div>
              <button
                type='button'
                onClick={onClose}
                className='h-9 w-9 shrink-0 flex items-center justify-center rounded-lg text-white/90 hover:bg-white/15 hover:text-white transition-all'
                aria-label='Đóng'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Body — iframe render hình dạng biểu mẫu */}
            <div className='flex-1 bg-background-tertiary overflow-hidden flex items-center justify-center p-4'>
              {loading ? (
                <div className='flex flex-col items-center gap-2 text-text-description'>
                  <Loader2 className='w-7 h-7 animate-spin text-primary' />
                  <span className='text-xs font-semibold'>Đang tải biểu mẫu...</span>
                </div>
              ) : compiledHtml ? (
                <iframe
                  srcDoc={compiledHtml}
                  title={`Xem trước ${template.title}`}
                  className='w-full h-full border-none bg-white rounded-lg shadow-lg'
                />
              ) : (
                <p className='text-sm text-text-description italic px-6 text-center'>
                  Biểu mẫu này chưa có bản xem trước. Bấm “Sử dụng” để mở và điền nội dung.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-border-secondary bg-background-secondary/30 shrink-0'>
              <Button variant='outline' onClick={onClose} className='rounded-xl text-sm font-semibold h-10 px-5'>
                Đóng
              </Button>
              <Button
                onClick={() => onUse(template)}
                className='rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 h-10 px-5'
              >
                Sử dụng biểu mẫu
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
