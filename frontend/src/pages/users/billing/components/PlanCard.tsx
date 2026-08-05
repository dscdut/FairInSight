import { Check, Clock, Coins, FileText, Layers, type ShieldCheck, Sparkles, UserCheck, Zap } from 'lucide-react'

import { Button } from '@/components/ui'
import { type BillingPlanCatalogItem } from '@/models/ai-chat/contracts'

import PlanBadge from './PlanBadge'

interface PlanCardProps {
  plan: BillingPlanCatalogItem
  isCurrent: boolean
  busyPlan: string | null
  onSelectPlan: (code: string) => void
}

const ENTITLEMENT_CONFIG: Record<
  string,
  { label: string; description: string; icon: typeof ShieldCheck; formatVal?: (v: unknown) => string }
> = {
  can_export_pdf: {
    label: 'Xuất báo cáo PDF',
    description: 'Xuất hồ sơ tư vấn & báo cáo pháp lý định dạng PDF',
    icon: FileText
  },
  can_generate_dynamic_form: {
    label: 'Tạo biểu mẫu theo vụ việc',
    description: 'Tự động sinh mẫu đơn & văn bản tố tụng tùy chỉnh',
    icon: Sparkles
  },
  can_use_lawyer_handoff: {
    label: 'Kết nối luật sư phù hợp',
    description: 'Chuyển giao hồ sơ cho luật sư chuyên môn kết nối',
    icon: UserCheck
  },
  history_retention_days: {
    label: 'Thời gian lưu trữ lịch sử',
    description: 'Thời hạn lưu giữ lịch sử trao đổi & hồ sơ',
    icon: Clock,
    formatVal: (v) => `${v} ngày`
  },
  max_active_cases: {
    label: 'Số vụ việc xử lý tối đa',
    description: 'Số lượng vụ việc có thể mở cùng lúc',
    icon: Layers,
    formatVal: (v) => `${v} vụ việc`
  },
  max_auto_spend_per_turn: {
    label: 'Hạn mức tự động / lượt',
    description: 'Số credit tự động sử dụng tối đa mỗi câu hỏi',
    icon: Coins,
    formatVal: (v) => `${v} credit`
  },
  max_upload_pages_per_job: {
    label: 'Số trang tài liệu / lần tải',
    description: 'Giới hạn số trang tài liệu đọc và phân tích mỗi lần',
    icon: FileText,
    formatVal: (v) => `${v} trang`
  },
  monthly_included_credits: {
    label: 'Credit định kỳ hàng tháng',
    description: 'Số lượng credit được cộng tự động mỗi kỳ cước',
    icon: Coins,
    formatVal: (v) => `${v} credit`
  },
  priority_class: {
    label: 'Hàng chờ xử lý ưu tiên',
    description: 'Mức độ ưu tiên khi hệ thống xử lý yêu cầu',
    icon: Zap,
    formatVal: (v) => v === 'HIGH' ? 'Ưu tiên cao' : v === 'PRIORITY' ? 'Ưu tiên' : 'Tiêu chuẩn'
  },
  allowed_requested_modes: {
    label: 'Chế độ tư vấn cho phép',
    description: 'Các chế độ trò chuyện được quyền sử dụng',
    icon: Sparkles,
    formatVal: (v) => {
      const arr = Array.isArray(v) ? v : [v]
      return arr.map((m) => {
        switch (String(m).toUpperCase()) {
          case 'NORMAL': return 'Thường'
          case 'DEEP': return 'Chuyên sâu'
          case 'AUTO': return 'Tự động'
          case 'LOOKUP': return 'Tra cứu'
          default: return String(m)
        }
      }).join(', ')
    }
  }
}

export default function PlanCard({ plan, isCurrent, busyPlan, onSelectPlan }: PlanCardProps) {
  const enabledFeatures = Object.entries(plan.entitlements).filter(
    ([key, value]) => key !== 'allowed_requested_modes' && (value === true || (typeof value === 'number' && value > 0) || (typeof value === 'string' && value.length > 0))
  )
  const modes = ((plan.entitlements.allowed_requested_modes as unknown as string[]) || ['NORMAL']).map((m) => {
    switch (m.toUpperCase()) {
      case 'NORMAL':
        return 'Thường'
      case 'DEEP':
        return 'Chuyên sâu'
      case 'AUTO':
        return 'Tự động'
      case 'LOOKUP':
        return 'Tra cứu'
      default:
        return m
    }
  })
  const isProOrMax = ['PRO', 'MAX'].includes(plan.code.toUpperCase())

  return (
    <article
      className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 transition-all duration-300 ${
        isCurrent
          ? 'border-2 border-primary bg-background-primary shadow-lg ring-4 ring-primary/10'
          : isProOrMax
          ? 'border border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-transparent shadow-sm hover:shadow-md'
          : 'border border-border-secondary bg-background-primary shadow-sm hover:shadow-md'
      }`}
    >
      {isCurrent && (
        <div className='absolute -top-3.5 right-6 rounded-full bg-primary px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md flex items-center gap-1'>
          <Check className='h-3 w-3' /> Đang Sử Dụng
        </div>
      )}

      <div>
        {/* Header Gói */}
        <div className='flex items-center justify-between gap-2'>
          <h3 className='text-2xl font-black text-main'>{plan.name}</h3>
          <PlanBadge code={plan.code} />
        </div>

        <p className='mt-2 text-xs text-text-description min-h-[36px] line-clamp-2 leading-relaxed'>{plan.audience}</p>

        {/* Giá cước */}
        <div className='mt-5 flex items-baseline gap-1'>
          <span className='text-3xl font-black text-main sm:text-4xl'>
            {plan.priceVnd === 0 ? 'Miễn Phí' : `${plan.priceVnd.toLocaleString('vi-VN')}đ`}
          </span>
          {plan.priceVnd > 0 && (
            <span className='text-xs text-text-description font-medium'>
              /{plan.billingInterval === 'MONTHLY' ? 'tháng' : plan.billingInterval.toLowerCase()}
            </span>
          )}
        </div>

        <div className='mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1 text-xs font-bold text-primary'>
          <Coins className='h-3.5 w-3.5' />
          <span>{plan.includedCredits.toLocaleString('vi-VN')} Credit / kỳ</span>
        </div>

        {/* Danh sách quyền hạn */}
        <div className='mt-6 space-y-3 border-t border-border-secondary/60 pt-5'>
          <p className='text-[11px] font-extrabold uppercase tracking-wider text-text-description'>Quyền Lợi & Dịch Vụ Đi Kèm:</p>
          <ul className='space-y-3 text-xs'>
            <li className='flex items-start gap-2.5 text-main font-medium'>
              <Check className='h-4 w-4 shrink-0 text-emerald-500 mt-0.5' />
              <span>Chế độ tư vấn: <strong className='text-primary'>{modes.join(', ')}</strong></span>
            </li>

            {enabledFeatures.map(([key, val]) => {
              const cfg = ENTITLEMENT_CONFIG[key]
              const formattedVal = cfg?.formatVal ? cfg.formatVal(val) : (typeof val === 'number' ? `${val}` : '')
              return (
                <li key={key} className='flex items-start gap-2.5 text-main'>
                  <Check className='h-4 w-4 shrink-0 text-emerald-500 mt-0.5' />
                  <div>
                    <span className='font-bold'>{cfg?.label || key.replace(/_/g, ' ')}</span>
                    {formattedVal && <span className='ml-1 text-text-description font-semibold'>({formattedVal})</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* Button Đổi Gói */}
      <div className='mt-8 pt-4 border-t border-border-secondary/40'>
        <Button
          variant={isCurrent ? 'outline' : 'default'}
          disabled={isCurrent || Boolean(busyPlan)}
          loading={busyPlan === plan.code}
          onClick={() => onSelectPlan(plan.code)}
          className={`w-full font-bold ${
            isCurrent
              ? 'border-border-secondary text-text-description cursor-default'
              : 'bg-primary text-white hover:bg-primary/90 shadow-md'
          }`}
        >
          {isCurrent ? 'Gói Hiện Tại Của Bạn' : `Chọn Gói ${plan.name}`}
        </Button>
      </div>
    </article>
  )
}
