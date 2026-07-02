import { Check } from 'lucide-react';

import { type ConsultationStage } from '@/core/services/consultation.service';

interface TimelineProps {
  currentStage: ConsultationStage;
  submissionMethod?: 'MANUAL' | 'PORTAL' | null;
}

export default function ConsultationTimeline({ currentStage, submissionMethod }: TimelineProps) {
  // Define steps
  const baseSteps = [
    { key: 'PENDING', label: 'Gửi yêu cầu' },
    { key: 'CHATTING', label: 'Tư vấn trực tuyến' },
    { key: 'PDF_GENERATION', label: 'Biên bản tư vấn' }
  ];


  
  const closingSteps = [
    { key: 'COMPLETED', label: 'Hoàn thành' },
    { key: 'REVIEWED', label: 'Đánh giá' }
  ];

  // If submission method is selected, insert the submitting step with dynamic label
  const steps = submissionMethod
    ? [
        ...baseSteps,
        {
          key: 'PORTAL_SUBMITTING',
          label: submissionMethod === 'PORTAL' ? 'Duyệt Dịch vụ công' : 'Thẩm duyệt hồ sơ'
        },
        ...closingSteps
      ]
    : [...baseSteps, ...closingSteps];

  // Calculate current active index
  const activeIndex = steps.findIndex(step => step.key === currentStage);

  return (
    <div className='w-full py-4 border-b border-border-primary shrink-0 bg-background-primary px-2'>
      <div className='flex items-center justify-between relative max-w-2xl mx-auto'>
        {/* Background connector line */}
        <div className='absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 z-0' />
        
        {/* Active connector line */}
        <div 
          className='absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-500 z-0' 
          style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < activeIndex || currentStage === 'REVIEWED';
          const isActive = idx === activeIndex;
          
          return (
            <div key={step.key} className='flex flex-col items-center relative z-10 space-y-1.5 flex-1'>
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-success-primary text-success-secondary shadow-md scale-105 border-none' 
                    : isActive 
                    ? 'bg-primary text-white ring-4 ring-primary/20 scale-110 shadow-lg border-none'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check className='w-4 h-4 text-white font-extrabold' />
                ) : (
                  idx + 1
                )}
              </div>
              
              <span 
                className={`text-[9.5px] font-bold text-center select-none ${
                  isActive 
                    ? 'text-primary' 
                    : isCompleted 
                    ? 'text-success-secondary' 
                    : 'text-text-tertiary'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
