import { useState } from 'react'

import { ChevronDown, Coins, RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui'
import { useBillingPlans, useMyBilling } from '@/hooks/billing/use-billing'

export default function PlanCreditSummary() {
  const [expanded, setExpanded] = useState(false)
  const { data: billing, status, refetch } = useMyBilling()
  const { data: plans = [] } = useBillingPlans()

  if (status === 'pending') {
    return <div className='h-8 w-32 animate-pulse rounded-lg bg-background-secondary' aria-label='Đang tải thông tin gói' />
  }

  if (status === 'error' || !billing) {
    return (
      <Button variant='ghost' size='sm' onClick={() => void refetch()} className='gap-1.5 text-xs text-text-description'>
        <RefreshCcw className='h-3.5 w-3.5' aria-hidden='true' />
        Tải lại gói
      </Button>
    )
  }

  return (
    <div className='relative'>
      <button
        type='button'
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className='flex items-center gap-2 rounded-lg border border-border-secondary bg-background-secondary/70 px-3 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      >
        <Coins className='h-4 w-4 text-primary' aria-hidden='true' />
        <span>
          <span className='block text-[10px] font-semibold uppercase tracking-wide text-text-description'>{billing.plan.name}</span>
          <span className='block text-xs font-bold text-main'>{billing.wallet.availableCredits.toLocaleString('vi-VN')} credit</span>
        </span>
        {billing.wallet.reservedCredits > 0 && (
          <span className='text-[10px] text-text-description'>{billing.wallet.reservedCredits} tạm giữ</span>
        )}
        <ChevronDown className='h-3.5 w-3.5 text-text-description' aria-hidden='true' />
      </button>

      {expanded && (
        <div className='absolute right-0 z-30 mt-2 w-72 rounded-xl border border-border-secondary bg-background-primary p-3 shadow-xl'>
          <p className='text-xs leading-relaxed text-text-description'>Credit là đơn vị sử dụng AI, không phải điểm đánh giá độ chính xác.</p>
          {billing.billingMode === 'SHADOW' && (
            <p className='mt-2 rounded-lg bg-background-secondary px-2 py-1.5 text-xs text-main'>Chế độ thử nghiệm: hệ thống đo mức dùng nhưng chưa trừ credit.</p>
          )}
          <div className='mt-3 space-y-2 border-t border-border-secondary pt-3'>
            {plans.map((plan) => (
              <div key={plan.code} className='flex items-center justify-between gap-3 text-xs'>
                <span className='font-semibold text-main'>{plan.name}</span>
                <span className='text-right text-text-description'>
                  {plan.priceVnd.toLocaleString('vi-VN')}đ · {plan.includedCredits} credit
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
