import React, { useEffect, useState } from 'react'

import {
  Cloud,
  ArrowUp,
  Scan,
  Sparkles,
  Layers,
  Network,
  Database,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  Check
} from 'lucide-react'

import { cn } from '@/core/lib/utils'

type StepKey = 'upload' | 'scan' | 'summarize' | 'chunk' | 'embed' | 'store'

interface StepConfig {
  key: StepKey
  label: string
  desc: string
  icon: React.ComponentType<any>
}

const STEPS: StepConfig[] = [
  {
    key: 'upload',
    label: 'Tải tài liệu lên đám mây',
    desc: 'Chuyển tệp tin an toàn lên Cloud Storage',
    icon: Cloud,
  },
  {
    key: 'scan',
    label: 'Đọc & Trích xuất chữ (OCR)',
    desc: 'Trích xuất văn bản thô và nhận diện bố cục',
    icon: Scan,
  },
  {
    key: 'summarize',
    label: 'AI phân tích & Tóm tắt',
    desc: 'Tổng hợp tài liệu và phân tích siêu dữ liệu bằng LLM',
    icon: Sparkles,
  },
  {
    key: 'chunk',
    label: 'Cắt nhỏ điều khoản văn bản',
    desc: 'Chia nhỏ văn bản thành các phân đoạn logic',
    icon: Layers,
  },
  {
    key: 'embed',
    label: 'Mã hóa dữ liệu Vector',
    desc: 'Khởi tạo vector không gian đa chiều (Embedding)',
    icon: Network,
  },
  {
    key: 'store',
    label: 'Lưu trữ vào cơ sở tri thức',
    desc: 'Đồng bộ hóa dữ liệu vào Graph & Vector Database',
    icon: Database,
  },
]

interface PipelineLoaderProps {
  filename: string
  pdfProgress: {
    step: string
    status: 'pending' | 'running' | 'completed' | 'error'
    error?: string
  }[]
}

export const PipelineLoader: React.FC<PipelineLoaderProps> = ({
  filename,
  pdfProgress,
}) => {
  const [extractedTokens, setExtractedTokens] = useState<string[]>([])
  const [activeProgress, setActiveProgress] = useState(0)

  // Find active step index based on progress status from WebSockets
  const activeStepIdx = STEPS.findIndex(
    (step) => {
      const p = pdfProgress.find((item) => item.step === step.key)
      return p?.status === 'running' || p?.status === 'error'
    }
  )

  const resolvedActiveStepIdx =
    activeStepIdx !== -1
      ? activeStepIdx
      : STEPS.every((step) => pdfProgress.find((item) => item.step === step.key)?.status === 'completed')
      ? STEPS.length - 1
      : 0

  const activeStep = STEPS[resolvedActiveStepIdx]
  const activeStatus = pdfProgress.find((item) => item.step === activeStep.key)

  // Simulate ticking progress within the running step
  useEffect(() => {
    setActiveProgress(0)
    if (activeStatus?.status !== 'running') return

    const interval = setInterval(() => {
      setActiveProgress((prev) => {
        if (prev >= 95) return 95
        return prev + 5
      })
    }, 120)

    return () => clearInterval(interval)
  }, [resolvedActiveStepIdx, activeStatus?.status])

  // Mock text tokens streaming for OCR (scan) Step
  useEffect(() => {
    if (activeStep.key !== 'scan' || activeStatus?.status !== 'running') return
    const mockWords = [
      'Điều_1',
      'Phạm_vi',
      'Hợp_đồng',
      'Điều_khoản',
      'Trách_nhiệm',
      'Đơn_vị',
      'Quy_định',
      'Pháp_luật',
      'Bên_A',
      'Bên_B',
      'Hiệu_lực',
      'Ký_kết',
      'Phục_lục',
      'Giải_quyết',
      'Tranh_chấp',
    ]
    let tokenIdx = 0
    const tokenTimer = setInterval(() => {
      if (tokenIdx < mockWords.length) {
        setExtractedTokens((prev) => [...prev, mockWords[tokenIdx]].slice(-5))
        tokenIdx++
      }
    }, 150)

    return () => clearInterval(tokenTimer)
  }, [activeStep.key, activeStatus?.status])

  return (
    <div className='flex flex-col h-full p-5 bg-background-primary border border-border-secondary rounded-2xl shadow-sm min-h-[500px] text-left shrink-0'>
      <style>{`
        @keyframes pipeline-scan {
          0%, 100% { top: 5%; }
          50% { top: 90%; }
        }
        @keyframes pipeline-arrowUp {
          0% { transform: translateY(8px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-16px); opacity: 0; }
        }
        @keyframes pipeline-float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(6px, -10px); }
        }
        @keyframes pipeline-radar {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        .animate-pipeline-scan {
          animation: pipeline-scan 2s infinite ease-in-out;
        }
        .animate-pipeline-arrowUp {
          animation: pipeline-arrowUp 1.2s infinite ease-in-out;
        }
        .animate-pipeline-float {
          animation: pipeline-float 3s infinite ease-in-out;
        }
        .animate-pipeline-radar {
          animation: pipeline-radar 2s infinite linear;
        }
      `}</style>

      {/* Header */}
      <div className='flex items-center gap-3.5 pb-4 border-b border-border-secondary/50 mb-4 shrink-0'>
        <div className='w-11 h-11 rounded-xl bg-error-primary/10 text-error-primary flex items-center justify-center border border-error-primary/15 animate-pulse shrink-0'>
          <FileText className='w-5.5 h-5.5' />
        </div>
        <div className='min-w-0 flex-1'>
          <h3 className='text-[13px] font-bold text-text-primary truncate'>Đang xử lý tài liệu</h3>
          <p className='text-[10px] text-text-tertiary font-semibold truncate max-w-[240px] mt-0.5'>{filename}</p>
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className='flex-grow flex flex-col gap-3.5 min-h-0 overflow-y-auto pr-1'>
        {STEPS.map((step, idx) => {
          const stepStatus = pdfProgress.find((item) => item.step === step.key)?.status || 'pending'
          const isCompleted = stepStatus === 'completed' || idx < resolvedActiveStepIdx
          const isActive = stepStatus === 'running' || (idx === resolvedActiveStepIdx && stepStatus !== 'completed')
          const isError = stepStatus === 'error'

          const IconComponent = step.icon

          return (
            <div
              key={step.key}
              className={cn(
                'flex gap-3 relative transition-all duration-300',
                isCompleted && 'opacity-100',
                isActive && 'opacity-100',
                isError && 'opacity-100',
                stepStatus === 'pending' && 'opacity-40'
              )}
            >
              {/* Step indicator */}
              <div className='flex flex-col items-center w-6 shrink-0 relative'>
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center border text-[10px] z-10 transition-all duration-300',
                    isCompleted && 'bg-success-primary/10 border-success-primary text-success-primary',
                    isActive && 'bg-primary border-primary text-background-primary shadow-sm shadow-primary/30',
                    isError && 'bg-error-primary/10 border-error-primary text-error-primary',
                    stepStatus === 'pending' && 'bg-background-secondary border-border-secondary text-text-tertiary'
                  )}
                >
                  {isError ? (
                    <AlertCircle className='w-3.5 h-3.5' />
                  ) : isCompleted ? (
                    <CheckCircle2 className='w-3.5 h-3.5' />
                  ) : (
                    <IconComponent className='w-3.5 h-3.5' />
                  )}
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-[1.5px] absolute top-6 bottom-[-14px] z-0 transition-all duration-300',
                      isCompleted ? 'bg-success-primary' : isError ? 'bg-error-primary' : 'bg-border-secondary/60'
                    )}
                  />
                )}
              </div>

              {/* Step content */}
              <div className='flex-grow flex flex-col justify-center min-w-0'>
                <div className='flex items-center justify-between gap-2'>
                  <h4
                    className={cn(
                      'text-[11px] font-bold transition-colors',
                      isCompleted && 'text-success-primary',
                      isActive && 'text-text-primary',
                      isError && 'text-error-primary',
                      stepStatus === 'pending' && 'text-text-tertiary'
                    )}
                  >
                    {step.label}
                  </h4>
                  {isActive && (
                    <span className='px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-primary/10 text-primary shrink-0 animate-pulse'>
                      Đang chạy
                    </span>
                  )}
                </div>
                <p className='text-[9px] text-text-tertiary mt-0.5 leading-relaxed truncate'>{step.desc}</p>
                {isActive && stepStatus === 'running' && (
                  <div className='w-full h-1 bg-border-secondary/40 rounded-full mt-2 overflow-hidden shrink-0'>
                    <div
                      className='h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-150 ease-linear'
                      style={{ width: `${activeProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Visualizer Panel */}
      <div
        className={cn(
          'h-28 mt-4 bg-background-secondary/20 border rounded-xl flex flex-col justify-center items-center overflow-hidden p-3.5 relative shrink-0',
          activeStatus?.status === 'error' ? 'border-error-primary/35' : 'border-border-secondary'
        )}
      >
        {activeStatus?.status === 'error' ? (
          <div className='flex flex-col items-center text-center px-2 animate-fadeIn'>
            <AlertCircle className='w-7 h-7 text-error-primary mb-1' />
            <p className='text-[11px] font-extrabold text-error-primary'>Lỗi hệ thống</p>
            <span className='text-[9px] text-text-tertiary mt-0.5 truncate max-w-[260px] font-medium'>
              {activeStatus.error || 'Quá trình phân tách tài liệu thất bại.'}
            </span>
          </div>
        ) : activeStep.key === 'upload' ? (
          <div className='flex flex-col items-center relative py-1 animate-fadeIn'>
            <div className='absolute text-primary animate-pipeline-arrowUp top-2'>
              <ArrowUp className='w-4.5 h-4.5' />
            </div>
            <div className='text-primary mt-3'>
              <Cloud className='w-9 h-9' />
            </div>
            <p className='text-[9px] text-text-tertiary font-bold mt-1.5'>Đang đồng bộ tệp lên đám mây...</p>
          </div>
        ) : activeStep.key === 'scan' ? (
          <div className='flex w-full h-full items-center justify-around gap-3 px-1.5 animate-fadeIn'>
            <div className='w-11 h-15 border border-border-secondary rounded-lg bg-background-primary relative overflow-hidden flex flex-col gap-1.5 p-2 shrink-0 shadow-sm'>
              <div className='absolute h-0.5 bg-error-primary w-full left-0 shadow-sm shadow-error-primary animate-pipeline-scan' />
              <div className='space-y-1.5 mt-0.5'>
                <div className='h-1 bg-border-secondary/60 rounded-full w-full' />
                <div className='h-1 bg-border-secondary/60 rounded-full w-5/6' />
                <div className='h-1 bg-border-secondary/60 rounded-full w-4/6' />
                <div className='h-1 bg-border-secondary/60 rounded-full w-2/6' />
              </div>
            </div>
            <div className='flex flex-col font-mono text-[9px] font-semibold text-primary/80 leading-normal'>
              {extractedTokens.map((token, i) => (
                <span key={i} className='animate-fadeIn shrink-0'>
                  {token}
                </span>
              ))}
            </div>
          </div>
        ) : activeStep.key === 'summarize' ? (
          <div className='flex flex-col items-start w-full gap-2 px-3.5 animate-fadeIn'>
            <div className='flex items-center gap-2 text-[10px] font-bold text-text-secondary'>
              <Sparkles className='w-4 h-4 text-primary shrink-0 animate-pulse' />
              <span>Đang phân tích điều khoản & thông tin...</span>
            </div>
            <div className='flex flex-col gap-1 w-full pl-6 text-[9px] text-text-tertiary font-medium'>
              <div className='flex items-center gap-1.5'>
                <Check className='w-3 h-3 text-primary shrink-0' />
                <span>Trích xuất cấu trúc văn bản hành chính</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <Loader2 className='w-3 h-3 text-primary animate-spin shrink-0' />
                <span>Tạo dữ liệu tóm tắt pháp lý bằng LLM</span>
              </div>
            </div>
          </div>
        ) : activeStep.key === 'chunk' ? (
          <div className='flex flex-col gap-1 w-full px-2 animate-fadeIn'>
            <div className='border border-primary-light/35 bg-primary/5 rounded-lg p-2 flex flex-col text-left'>
              <h5 className='text-[9px] font-bold text-primary'>Phân mảnh văn bản #01</h5>
              <p className='text-[8px] text-text-tertiary font-medium mt-0.5 truncate'>
                Đang cắt văn bản thành các node logic...
              </p>
            </div>
            <div className='flex justify-between text-[8px] text-text-tertiary font-semibold px-0.5 mt-0.5'>
              <span>Độ dài tối đa: 1000 kí tự</span>
              <span>Trạng thái: Hoạt động</span>
            </div>
          </div>
        ) : activeStep.key === 'embed' ? (
          <div className='flex flex-col justify-center items-center w-full h-full relative py-1 animate-fadeIn'>
            <div className='absolute w-12 h-12 border border-primary/20 rounded-full animate-pipeline-radar' />
            <div className='absolute w-20 h-20 border border-primary/25 rounded-full animate-pipeline-radar [animation-delay:0.7s]' />
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              <div className='absolute w-1.5 h-1.5 bg-primary rounded-full shadow-sm shadow-primary animate-pipeline-float top-1/4 left-1/4' />
              <div className='absolute w-1.5 h-1.5 bg-secondary rounded-full shadow-sm shadow-secondary animate-pipeline-float top-2/3 left-1/5 [animation-delay:0.5s]' />
              <div className='absolute w-1.5 h-1.5 bg-primary rounded-full shadow-sm shadow-primary animate-pipeline-float top-1/3 left-2/3 [animation-delay:1.2s]' />
            </div>
            <p className='text-[8px] font-mono text-text-tertiary z-10 bg-background-primary/80 px-2 py-0.5 rounded border border-border-secondary mt-1'>
              dense vector mapping (1536 dims)
            </p>
          </div>
        ) : (
          <div className='flex items-center gap-2 px-4 animate-fadeIn text-left'>
            <CheckCircle2 className='w-6 h-6 text-success-primary shrink-0' />
            <div className='flex flex-col min-w-0'>
              <p className='text-[10px] font-bold text-success-primary'>Đã lưu trữ dữ liệu!</p>
              <span className='text-[8px] text-text-tertiary font-medium mt-0.5 truncate'>
                Đồng bộ hóa đồ thị tri thức thành công.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
