import { Crown } from 'lucide-react'

interface PlanBadgeProps {
  code: string
  className?: string
}

export function getPlanBadgeStyle(code: string) {
  switch (code.toUpperCase()) {
    case 'PRO':
    case 'MAX':
      return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
    case 'PLUS':
      return 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
    default:
      return 'bg-secondary text-text-description border border-border-secondary'
  }
}

const PLAN_LABEL_MAP: Record<string, string> = {
  FREE: 'Gói Miễn Phí',
  PLUS: 'Gói Plus',
  PRO: 'Gói Pro',
  MAX: 'Gói Max'
}

export default function PlanBadge({ code, className = '' }: PlanBadgeProps) {
  const style = getPlanBadgeStyle(code)
  const label = PLAN_LABEL_MAP[code.toUpperCase()] || code.toUpperCase()
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${style} ${className}`}>
      <Crown className='h-3.5 w-3.5' />
      {label}
    </span>
  )
}
