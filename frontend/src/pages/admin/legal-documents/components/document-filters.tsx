import React from 'react'

import { Calendar, Search, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DocumentFiltersProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  statusFilter: string
  onStatusChange: (val: string) => void
  issuedDateFilter: string
  onIssuedDateChange: (val: string) => void
  onAddNewClick?: () => void
}

export const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  issuedDateFilter,
  onIssuedDateChange,
  onAddNewClick,
}) => {
  return (
    <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-background-primary p-6 rounded-t-2xl border-b border-border-secondary'>
      {/* Search & Filters */}
      <div className='flex flex-1 flex-col gap-3 sm:flex-row sm:items-center'>
        {/* Search Input */}
        <div className='relative w-full sm:max-w-xs'>
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder='Tìm tên văn bản, số hiệu...'
            className='pl-10 h-10 bg-background-secondary/30 border-border-secondary focus:bg-background-primary transition-all text-sm rounded-xl text-text-primary'
            icon={<Search className='w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2' />}
          />
        </div>

        {/* Status Filter */}
        <div className='w-full sm:max-w-[170px]'>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className='h-10 bg-background-secondary/30 border-border-secondary text-sm rounded-xl text-text-secondary focus:bg-background-primary'>
              <SelectValue placeholder='Trạng thái' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>Tất cả trạng thái</SelectItem>
              <SelectItem value='ACTIVE'>Còn hiệu lực</SelectItem>
              <SelectItem value='INACTIVE'>Hết hiệu lực</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Filter */}
        <div className='relative w-full sm:max-w-[200px] flex items-center'>
          <Calendar className='w-4 h-4 text-text-tertiary absolute left-3 pointer-events-none' />
          <input
            type='date'
            value={issuedDateFilter}
            onChange={(e) => onIssuedDateChange(e.target.value)}
            className='pl-10 pr-3 h-10 w-full bg-background-secondary/30 border border-border-secondary text-sm rounded-xl text-text-secondary focus:outline-none focus:ring-1 focus:ring-ring focus:bg-background-primary transition-all [&::-webkit-calendar-picker-indicator]:opacity-70 dark:[&::-webkit-calendar-picker-indicator]:invert'
            placeholder='Ngày ban hành'
          />
          {issuedDateFilter && (
            <button 
              onClick={() => onIssuedDateChange('')}
              className='absolute right-2 text-xs text-text-tertiary hover:text-text-primary px-1'
              title='Xóa chọn ngày'
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Action Add New */}
      {onAddNewClick && (
        <Button
          onClick={onAddNewClick}
          className='h-10 bg-primary text-white hover:opacity-90 px-5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-md active:scale-95'
        >
          <Plus className='w-4 h-4' />
          Thêm mới
        </Button>
      )}
    </div>
  )
}
