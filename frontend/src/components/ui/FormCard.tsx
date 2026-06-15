import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { cn } from '@/core/lib/utils'
import { type Template, type ViewMode } from '@/models/types/form-library'

interface FormCardProps {
  template: Template
  viewMode: ViewMode
  index: number
}

export default function FormCard({ template, viewMode, index }: FormCardProps) {
  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: index * 0.05
      }
    }
  }

  // LIST VIEW LAYOUT
  if (viewMode === 'list') {
    return (
      <motion.div variants={cardVariant} initial='hidden' animate='visible'>
        <Card className='group border border-border-secondary bg-background-primary transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5 rounded-2xl overflow-hidden p-4 flex flex-col sm:flex-row sm:items-center gap-4 w-full'>
          {/* Left: Icon Squircle */}
          <div className='w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/15 shadow-sm transition-transform duration-300 group-hover:scale-105'>
            <FileText className='w-4 h-4' />
          </div>

          {/* Center: Info */}
          <div className='flex-1 min-w-0 flex flex-col gap-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='text-h5 font-bold text-main truncate transition-colors duration-200 group-hover:text-primary'>
                {template.title}
              </h3>
              
              <div className='flex gap-1 shrink-0'>
                {template.isVip && (
                  <Badge variant='secondary' className='bg-warning-primary/10 text-warning-primary border-0 rounded-full text-[10px] font-bold px-2 py-1 uppercase tracking-wider'>
                    VIP
                  </Badge>
                )}
                {template.isNew && (
                  <Badge variant='destructive' className='bg-error-primary/10 text-error-primary border-0 rounded-full text-[10px] font-bold px-2 py-1 uppercase tracking-wider animate-pulse'>
                    Mới
                  </Badge>
                )}
              </div>
            </div>

            <p className='text-small text-text-description line-clamp-1 leading-relaxed'>
              {template.description}
            </p>

            <div className='flex items-center gap-4 text-xs text-text-description font-medium mt-2'>
              <span className='inline-flex items-center rounded-xl bg-background-secondary px-2 py-1 font-semibold'>
                {template.category}
              </span>
              <span>•</span>
              <span>{template.usageCount.toLocaleString('vi-VN')} người dùng</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className='flex flex-row sm:flex-col gap-2 shrink-0 sm:w-[160px] w-full justify-end'>
            <Button
              variant='ghost'
              size='sm'
              className='w-full rounded-xl text-xs font-semibold text-main hover:bg-background-secondary hover:text-main transition-all h-8 cursor-pointer justify-center'
            >
              Xem trước
            </Button>
            <Button
              variant='default'
              size='sm'
              className='w-full rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary/90 hover:shadow-md active:scale-95 transition-all h-8 cursor-pointer justify-center'
            >
              Sử dụng
            </Button>
          </div>
        </Card>
      </motion.div>
    )
  }

  // GRID VIEW LAYOUT
  const cardClasses = cn(
    'group h-full border border-border-secondary bg-background-primary transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5 rounded-2xl overflow-hidden flex flex-col'
  )

  const contentClasses = cn(
    'flex flex-col gap-4 p-4'
  )

  const footerClasses = cn(
    'flex gap-2 p-4 pt-0 flex-col sm:flex-row mt-auto justify-end'
  )

  return (
    <motion.div variants={cardVariant} initial='hidden' animate='visible'>
      <Card className={cardClasses}>
        <CardContent className={contentClasses}>
          <div className='flex flex-col gap-4'>
            {/* Document Icon Squircle & Badges */}
            <div className='flex items-start justify-between gap-4'>
              <div className='w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/15 shadow-sm transition-transform duration-300 group-hover:scale-105'>
                <FileText className='w-4 h-4' />
              </div>
              
              <div className='flex flex-wrap gap-1 justify-end'>
                {template.isVip && (
                  <Badge variant='secondary' className='bg-warning-primary/10 text-warning-primary border-0 rounded-full text-[10px] font-bold px-2 py-1 uppercase tracking-wider'>
                    VIP
                  </Badge>
                )}
                {template.isNew && (
                  <Badge variant='destructive' className='bg-error-primary/10 text-error-primary border-0 rounded-full text-[10px] font-bold px-2 py-1 uppercase tracking-wider animate-pulse'>
                    Mới
                  </Badge>
                )}
              </div>
            </div>

            <div className='space-y-2 mt-2'>
              <h3 className='text-h5 font-bold text-main line-clamp-2 transition-colors duration-200 group-hover:text-primary'>
                {template.title}
              </h3>
              <p className='text-small text-text-description line-clamp-2 leading-relaxed min-h-[40px]'>
                {template.description}
              </p>
            </div>

            <div className='flex items-center justify-between border-t border-border-secondary/60 pt-4 mt-2'>
              <span className='inline-flex items-center rounded-xl bg-background-secondary px-2 py-1 text-xs font-semibold text-text-description'>
                {template.category}
              </span>

              <div className='inline-flex items-center gap-2 text-xs text-text-description font-medium'>
                <span>{template.usageCount.toLocaleString('vi-VN')} người dùng</span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className={footerClasses}>
          <Button
            variant='ghost'
            size='sm'
            className='w-full sm:w-auto rounded-xl text-xs font-semibold text-main hover:bg-background-secondary hover:text-main transition-all h-8 cursor-pointer'
          >
            Xem trước
          </Button>
          <Button
            variant='default'
            size='sm'
            className='w-full sm:w-auto rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary/90 hover:shadow-md active:scale-95 transition-all h-8 cursor-pointer'
          >
            Sử dụng
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
