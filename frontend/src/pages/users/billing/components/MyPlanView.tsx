import { useState } from 'react'

import {
  Check,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  History,
  Info,
  Layers,
  type ShieldCheck,
  Sparkles,
  UserCheck,
  Zap
} from 'lucide-react'

import { Button } from '@/components/ui'
import {
  type BillingAccountSummary,
  type BillingAiUsageItem,
  type BillingLedgerItem
} from '@/models/ai-chat/contracts'

import AiUsageTable from './AiUsageTable'
import CreditLedgerTable from './CreditLedgerTable'
import PlanBadge from './PlanBadge'

interface MyPlanViewProps {
  account: BillingAccountSummary
  ledger: BillingLedgerItem[]
  usage: BillingAiUsageItem[]
  nextCursor: string | null
  busyPlan: string | null
  onCancelSubscription: () => void
  onLoadMoreLedger: () => void
  onSwitchToPlansTab: () => void
}

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Không giới hạn'

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

export default function MyPlanView({
  account,
  ledger,
  usage,
  nextCursor,
  busyPlan,
  onCancelSubscription,
  onLoadMoreLedger,
  onSwitchToPlansTab
}: MyPlanViewProps) {
  const [subTab, setSubTab] = useState<'ledger' | 'usage'>('ledger')

  const includedCredits = account.wallet.includedCredits || 1
  const availableCredits = account.wallet.availableCredits || 0
  const reservedCredits = account.wallet.reservedCredits || 0
  const usedCredits = Math.max(0, includedCredits - availableCredits)
  const usagePercentage = Math.min(100, Math.round((usedCredits / includedCredits) * 100))

  return (
    <div className='space-y-6 animate-in fade-in duration-300'>
      {/* Top Banner Alert Shadow Mode */}
      {account.billingMode === 'SHADOW' && (
        <div className='flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-semibold text-amber-600 dark:text-amber-400 shadow-sm'>
          <Info className='h-4 w-4 shrink-0' />
          <span>Hệ thống đang ở chế độ đo Shadow thử nghiệm. Số dư credit thực tế chưa bị trừ.</span>
        </div>
      )}

      {/* Main Grid: Card Gói Cước & Tiện Ích */}
      <div className='grid gap-6 lg:grid-cols-12'>
        {/* Left Section (7 cols): Hero Card & Credit Progress */}
        <section className='lg:col-span-7 space-y-6'>
          <div className='relative overflow-hidden rounded-3xl border border-border-secondary bg-background-primary p-6 sm:p-8 shadow-sm'>
            <div className='absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none' />

            <div className='flex items-center justify-between gap-3'>
              <span className='text-xs font-extrabold uppercase tracking-wider text-text-description'>Gói Đang Sử Dụng</span>
              <PlanBadge code={account.plan.code} />
            </div>

            <div className='mt-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2'>
              <h2 className='text-3xl font-black text-main'>{account.plan.name}</h2>
              <span className='text-xs text-text-description'>
                Kỳ cước hết hạn: <strong className='text-main font-bold'>{formatDate(account.plan.periodEnd)}</strong>
              </span>
            </div>

            {/* Credit Progress Bar */}
            <div className='mt-6 rounded-2xl border border-border-secondary/60 bg-background-secondary/60 p-5 space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2 text-xs font-bold text-text-description'>
                  <Coins className='h-4 w-4 text-primary' />
                  <span>Tiến Trình Sử Dụng Credit</span>
                </div>
                <span className='text-xs font-black text-main'>
                  {availableCredits.toLocaleString('vi-VN')} / {includedCredits.toLocaleString('vi-VN')} Credit còn lại
                </span>
              </div>

              {/* Progress bar */}
              <div className='relative h-3 w-full overflow-hidden rounded-full bg-border-secondary/60'>
                <div
                  className='h-full bg-gradient-to-r from-primary via-indigo-500 to-emerald-500 transition-all duration-500 rounded-full'
                  style={{ width: `${Math.max(5, 100 - usagePercentage)}%` }}
                />
              </div>

              <div className='grid grid-cols-3 gap-3 pt-2 text-center text-xs'>
                <div className='rounded-xl bg-background-primary p-3 border border-border-secondary/40 shadow-2xs'>
                  <p className='text-[11px] text-text-description font-medium'>Khả dụng</p>
                  <p className='mt-1 font-black text-emerald-600 dark:text-emerald-400 text-base'>{availableCredits.toLocaleString('vi-VN')}</p>
                </div>
                <div className='rounded-xl bg-background-primary p-3 border border-border-secondary/40 shadow-2xs'>
                  <p className='text-[11px] text-text-description font-medium'>Tạm giữ</p>
                  <p className='mt-1 font-bold text-amber-600 dark:text-amber-400 text-base'>{reservedCredits.toLocaleString('vi-VN')}</p>
                </div>
                <div className='rounded-xl bg-background-primary p-3 border border-border-secondary/40 shadow-2xs'>
                  <p className='text-[11px] text-text-description font-medium'>Định mức gói</p>
                  <p className='mt-1 font-bold text-main text-base'>{includedCredits.toLocaleString('vi-VN')}</p>
                </div>
              </div>
            </div>

            {/* CTA Đổi Gói */}
            <div className='mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-secondary'>
              <p className='text-xs text-text-description'>Bạn muốn mở rộng thêm định mức credit và tính năng nâng cao?</p>
              <Button variant='default' onClick={onSwitchToPlansTab} className='w-full sm:w-auto font-bold text-white shadow-md'>
                Nâng Cấp Gói Cước
              </Button>
            </div>
          </div>
        </section>

        {/* Right Section (5 cols): Active Entitlements Checklist */}
        <section className='lg:col-span-5 rounded-3xl border border-border-secondary bg-background-primary p-6 sm:p-8 shadow-sm flex flex-col justify-between'>
          <div>
            <div className='flex items-center justify-between border-b border-border-secondary pb-4'>
              <h3 className='text-sm font-extrabold uppercase tracking-wider text-main flex items-center gap-2'>
                <Zap className='h-4 w-4 text-primary' />
                Quyền Lợi Đang Kích Hoạt
              </h3>
              <span className='text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20'>
                {Object.values(account.entitlements).filter(Boolean).length} Tính năng
              </span>
            </div>

            <div className='mt-5 space-y-3'>
              {Object.entries(account.entitlements).map(([key, val]) => {
                const isEnabled = val === true || (typeof val === 'number' && val > 0) || (Array.isArray(val) && val.length > 0) || (typeof val === 'string' && val.length > 0)
                const cfg = ENTITLEMENT_CONFIG[key]
                const Icon = cfg?.icon || CheckCircle2
                return (
                  <div
                    key={key}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 text-xs transition-all ${
                      isEnabled
                        ? 'border-emerald-500/20 bg-emerald-500/5 text-main'
                        : 'border-border-secondary/40 bg-background-secondary/30 text-text-description opacity-60'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                        isEnabled ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-secondary text-text-description'
                      }`}
                    >
                      {isEnabled ? <Check className='h-4 w-4' /> : <Clock className='h-4 w-4' />}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='font-bold text-main flex items-center gap-1.5 text-xs sm:text-sm'>
                        <Icon className='h-4 w-4 text-primary shrink-0' />
                        {cfg?.label || key.replace(/_/g, ' ')}
                      </p>
                      <p className='mt-1 text-xs text-text-description'>
                        {cfg?.description
                          ? (cfg.formatVal ? `${cfg.description} (${cfg.formatVal(val)})` : cfg.description)
                          : (typeof val === 'boolean' ? (val ? 'Đã kích hoạt' : 'Chưa được cấp') : `Giá trị: ${Array.isArray(val) ? val.join(', ') : String(val)}`)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {account.plan.code !== 'FREE' && (
            <div className='mt-6 pt-4 border-t border-border-secondary flex justify-end'>
              <Button
                variant='ghost'
                size='sm'
                onClick={onCancelSubscription}
                disabled={Boolean(busyPlan)}
                className='text-xs text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 font-semibold'
              >
                Hủy gia hạn khi kết thúc kỳ cước
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* Full Width Section: Lịch Sử Credit & Mức Sử Dụng AI */}
      <section className='rounded-3xl border border-border-secondary bg-background-primary p-6 sm:p-8 shadow-sm'>
        <div className='flex items-center gap-4 border-b border-border-secondary pb-4'>
          <button
            onClick={() => setSubTab('ledger')}
            className={`flex items-center gap-2 pb-2 text-sm font-extrabold transition-all border-b-2 ${
              subTab === 'ledger' ? 'border-primary text-primary' : 'border-transparent text-text-description hover:text-main'
            }`}
          >
            <History className='h-4 w-4' />
            Lịch Sử Giao Dịch Credit ({ledger.length})
          </button>
          <button
            onClick={() => setSubTab('usage')}
            className={`flex items-center gap-2 pb-2 text-sm font-extrabold transition-all border-b-2 ${
              subTab === 'usage' ? 'border-primary text-primary' : 'border-transparent text-text-description hover:text-main'
            }`}
          >
            <Zap className='h-4 w-4' />
            Mức Sử Dụng AI Gần Đây ({usage.length})
          </button>
        </div>

        <div className='mt-6'>
          {subTab === 'ledger' ? (
            <CreditLedgerTable ledger={ledger} nextCursor={nextCursor} onLoadMore={onLoadMoreLedger} />
          ) : (
            <AiUsageTable usage={usage} />
          )}
        </div>
      </section>
    </div>
  )
}
