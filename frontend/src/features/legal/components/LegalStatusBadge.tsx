import { cn } from '@/core/lib/utils'
import type { DocumentStatus } from '../types'

interface LegalStatusBadgeProps {
  status: DocumentStatus
  className?: string
}

const STATUS_CONFIG: Record<DocumentStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Còn hiệu lực',
    className: 'bg-success-bg text-success-primary border border-success-primary/20',
  },
  EXPIRED: {
    label: 'Hết hiệu lực',
    className: 'bg-background-secondary text-text-tertiary border border-border-primary',
  },
  REPLACED: {
    label: 'Đã thay thế',
    className: 'bg-warning-bg text-warning-primary border border-warning-primary/20',
  },
}

export function LegalStatusBadge({ status, className }: LegalStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
