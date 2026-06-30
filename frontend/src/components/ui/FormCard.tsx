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
  onSelect?: (template: Template) => void
  onPreview?: (template: Template) => void
}

export default function FormCard({ template, viewMode, index, onSelect, onPreview }: FormCardProps) {
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
          {/* Left Thumbnail (List View) */}
          <div className='w-full sm:w-28 h-20 shrink-0 rounded-xl bg-background-secondary border border-border-secondary/60 overflow-hidden flex items-center justify-center relative group/thumbnail'>
            {template.thumbnail ? (
              <img 
                src={template.thumbnail} 
                alt={template.title} 
                className='w-full h-full object-cover transition-transform duration-500 group-hover/thumbnail:scale-105'
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center text-primary bg-primary/10'>
                <FileText className='w-6 h-6' />
              </div>
            )}
          </div>

          {/* Center: Info */}
          <div className='flex-1 min-w-0 flex flex-col gap-1.5'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='text-h5 font-bold text-main truncate transition-colors duration-200 group-hover:text-primary'>
                {template.title}
              </h3>
              
              <div className='flex gap-1 shrink-0'>
                {template.isVip && (
                  <Badge variant='secondary' className='bg-warning-primary/10 text-warning-primary border-0 rounded-full text-xs font-semibold px-2 py-1 uppercase tracking-wider'>
                    VIP
                  </Badge>
                )}
                {template.isNew && (
                  <Badge variant='destructive' className='bg-error-primary/10 text-error-primary border-0 rounded-full text-xs font-semibold px-2 py-1 uppercase tracking-wider animate-pulse'>
                    Mới
                  </Badge>
                )}
              </div>
            </div>

            <p className='text-sm text-text-description line-clamp-1 leading-relaxed'>
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
              onClick={() => onPreview?.(template)}
              className='w-full rounded-xl text-xs font-semibold text-main hover:bg-background-secondary hover:text-main transition-all h-8 cursor-pointer justify-center'
            >
              Xem trước
            </Button>
            <Button
              variant='default'
              size='sm'
              onClick={() => onSelect?.(template)}
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
        {/* Top Thumbnail Image Banner */}
        <div className='relative w-full aspect-[1.8] bg-background-secondary border-b border-border-secondary/60 overflow-hidden flex items-center justify-center group/thumbnail shrink-0'>
          {template.thumbnail ? (
            <img 
              src={template.thumbnail} 
              alt={template.title} 
              className='w-full h-full object-cover transition-transform duration-500 group-hover/thumbnail:scale-105'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center text-primary bg-primary/10'>
              <FileText className='w-8 h-8' />
            </div>
          )}
          
          {/* Badges positioned absolutely over thumbnail */}
          <div className='absolute top-3 right-3 flex flex-wrap gap-1 justify-end'>
            {template.isVip && (
              <Badge variant='secondary' className='text-warning-primary bg-background-primary/80 backdrop-blur-xs border-0 rounded-full text-xs font-semibold px-2.5 py-0.5 uppercase tracking-wider shadow-sm'>
                VIP
              </Badge>
            )}
            {template.isNew && (
              <Badge variant='destructive' className='bg-error-primary text-white border-0 rounded-full text-xs font-semibold px-2.5 py-0.5 uppercase tracking-wider animate-pulse shadow-sm'>
                Mới
              </Badge>
            )}
          </div>
        </div>

        <CardContent className={contentClasses}>
          <div className='flex flex-col gap-3'>
            <div className='space-y-1.5'>
              <h3 className='text-h5 font-bold text-main line-clamp-2 transition-colors duration-200 group-hover:text-primary leading-snug'>
                {template.title}
              </h3>
              <p className='text-sm text-text-description line-clamp-2 leading-relaxed min-h-[40px]'>
                {template.description}
              </p>
            </div>

            <div className='flex items-center justify-between border-t border-border-secondary/60 pt-3 mt-1'>
              <span className='inline-flex items-center rounded-xl bg-background-secondary px-2 py-0.5 text-xs font-semibold text-text-description'>
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
            onClick={() => onPreview?.(template)}
            className='w-full sm:w-auto rounded-xl text-xs font-semibold text-main hover:bg-background-secondary hover:text-main transition-all h-8 cursor-pointer'
          >
            Xem trước
          </Button>
          <Button
            variant='default'
            size='sm'
            onClick={() => onSelect?.(template)}
            className='w-full sm:w-auto rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary/90 hover:shadow-md active:scale-95 transition-all h-8 cursor-pointer'
          >
            Sử dụng
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
