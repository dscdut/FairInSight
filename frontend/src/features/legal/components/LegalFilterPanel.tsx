import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/core/lib/utils'
import {
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  ISSUING_AGENCIES,
  LEGAL_FIELDS,
} from '../constants'
import type { LegalDocumentFilters } from '../types'

interface LegalFilterPanelProps {
  filters: LegalDocumentFilters
  onFilterChange: <K extends keyof LegalDocumentFilters>(key: K, value: LegalDocumentFilters[K]) => void
  onReset: () => void
  activeFilterCount: number
  className?: string
}

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className='border-b border-border-primary last:border-0'>
      <button
        onClick={() => setOpen(!open)}
        className='flex items-center justify-between w-full py-3 text-sm font-semibold text-text-primary hover:text-primary transition-colors'
      >
        <span>{title}</span>
        {open ? <ChevronUp className='h-4 w-4 text-text-tertiary' /> : <ChevronDown className='h-4 w-4 text-text-tertiary' />}
      </button>
      {open && <div className='pb-3 space-y-1.5'>{children}</div>}
    </div>
  )
}

interface RadioOptionProps {
  value: string
  label: string
  checked: boolean
  onChange: () => void
}

function RadioOption({ value, label, checked, onChange }: RadioOptionProps) {
  return (
    <label className='flex items-center gap-2 cursor-pointer group'>
      <input
        type='radio'
        value={value}
        checked={checked}
        onChange={onChange}
        className='accent-primary h-3.5 w-3.5 cursor-pointer'
      />
      <span className={cn(
        'text-sm transition-colors',
        checked ? 'text-primary font-medium' : 'text-text-secondary group-hover:text-text-primary'
      )}>
        {label}
      </span>
    </label>
  )
}

export function LegalFilterPanel({
  filters,
  onFilterChange,
  onReset,
  activeFilterCount,
  className,
}: LegalFilterPanelProps) {
  return (
    <div className={cn('bg-background-primary rounded-xl border border-border-primary p-4', className)}>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <Filter className='h-4 w-4 text-text-tertiary' />
          <span className='font-semibold text-text-primary text-sm'>Bộ lọc</span>
          {activeFilterCount > 0 && (
            <span className='flex items-center justify-center h-4 w-4 rounded-full bg-primary text-white text-[10px] font-bold'>
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            className='flex items-center gap-1 text-xs text-error-primary hover:text-error-secondary transition-colors'
          >
            <X className='h-3 w-3' />
            Bỏ chọn
          </button>
        )}
      </div>

      <div className='space-y-0'>
        <FilterSection title='Lĩnh vực pháp luật'>
          {LEGAL_FIELDS.map((field) => (
            <RadioOption
              key={field.value}
              value={field.value}
              label={field.label}
              checked={filters.field === field.value}
              onChange={() => onFilterChange('field', field.value)}
            />
          ))}
        </FilterSection>

        <FilterSection title='Trạng thái'>
          {DOCUMENT_STATUSES.map((s) => (
            <RadioOption
              key={s.value}
              value={s.value}
              label={s.label}
              checked={filters.status === s.value}
              onChange={() => onFilterChange('status', s.value)}
            />
          ))}
        </FilterSection>

        <FilterSection title='Hình thức văn bản'>
          {DOCUMENT_TYPES.map((type) => (
            <RadioOption
              key={type.value}
              value={type.value}
              label={type.label}
              checked={filters.documentType === type.value}
              onChange={() => onFilterChange('documentType', type.value)}
            />
          ))}
        </FilterSection>

        <FilterSection title='Cơ quan ban hành'>
          {ISSUING_AGENCIES.map((agency) => (
            <RadioOption
              key={agency.value}
              value={agency.value}
              label={agency.label}
              checked={filters.issuingAgency === agency.value}
              onChange={() => onFilterChange('issuingAgency', agency.value)}
            />
          ))}
        </FilterSection>

        <FilterSection title='Thời gian ban hành' defaultOpen={false}>
          <div className='space-y-2'>
            <div>
              <label className='text-xs text-text-tertiary mb-1 block'>Từ ngày</label>
              <input
                type='date'
                value={filters.fromDate}
                onChange={(e) => onFilterChange('fromDate', e.target.value)}
                className='w-full h-9 px-3 rounded-lg border border-border-secondary bg-background-primary text-text-primary text-sm focus:outline-none focus:border-info-primary transition-colors'
              />
            </div>
            <div>
              <label className='text-xs text-text-tertiary mb-1 block'>Đến ngày</label>
              <input
                type='date'
                value={filters.toDate}
                onChange={(e) => onFilterChange('toDate', e.target.value)}
                className='w-full h-9 px-3 rounded-lg border border-border-secondary bg-background-primary text-text-primary text-sm focus:outline-none focus:border-info-primary transition-colors'
              />
            </div>
          </div>
        </FilterSection>
      </div>
    </div>
  )
}
