import { ShieldCheck } from 'lucide-react'

import { type BillingPlanCatalogItem } from '@/models/ai-chat/contracts'

import PlanCard from './PlanCard'
import ServiceExplanationSection from './ServiceExplanationSection'

interface ExplorePlansViewProps {
  plans: BillingPlanCatalogItem[]
  currentPlanCode: string
  busyPlan: string | null
  onSelectPlan: (code: string) => void
}

export default function ExplorePlansView({
  plans,
  currentPlanCode,
  busyPlan,
  onSelectPlan
}: ExplorePlansViewProps) {
  return (
    <div className='space-y-8 animate-in fade-in duration-300 w-full'>
      {/* Grid Danh sách các gói cước */}
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full'>
        {plans.map((plan) => (
          <PlanCard
            key={plan.code}
            plan={plan}
            isCurrent={plan.code === currentPlanCode}
            busyPlan={busyPlan}
            onSelectPlan={onSelectPlan}
          />
        ))}
      </div>

      {/* Phần Giải Thích Dịch Vụ Chi Tiết Nằm Bên Dưới Các Gói */}
      <ServiceExplanationSection />

      {/* Note cam kết */}
      <div className='rounded-3xl border border-border-secondary/60 bg-background-secondary/50 p-6 text-xs text-text-description flex items-start gap-4 shadow-sm'>
        <ShieldCheck className='h-6 w-6 shrink-0 text-primary mt-0.5' />
        <div>
          <p className='font-bold text-main text-sm'>Thông Tin Thanh Toán & Cam Kết Dịch Vụ</p>
          <p className='mt-1 leading-relaxed'>Mọi giao dịch thanh toán đổi gói cước đều được lưu vết minh bạch trong nhật ký hệ thống. Quý khách hàng cần giải đáp thắc mắc hoặc cần thiết kế gói cước đặc thù cho doanh nghiệp, xin vui lòng liên hệ đội ngũ chăm sóc khách hàng của FairInsight.</p>
        </div>
      </div>
    </div>
  )
}
