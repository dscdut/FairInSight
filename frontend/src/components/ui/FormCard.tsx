import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'

import { Badge, Button, Card, CardContent, CardFooter } from '@/components/ui'
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

  const cardClasses = cn(
    'h-full border border-border-primary bg-background-primary transition-all duration-300 hover:shadow-lg hover:scale-[1.02]',
    viewMode === 'list' && 'flex flex-col gap-4'
  )

  const contentClasses = cn('flex flex-col gap-4', viewMode === 'list' && 'flex-1')

  return (
    <motion.div variants={cardVariant} initial='hidden' animate='visible'>
      <Card className={cardClasses}>
        <CardContent className={contentClasses}>
          <div className='flex flex-col gap-4'>
            <div className='flex flex-wrap gap-2'>
              {template.isVip && (
                <Badge variant='secondary' className='bg-warning-primary/10 text-warning-primary'>
                  VIP
                </Badge>
              )}
              {template.isNew && (
                <Badge variant='destructive' className='bg-error-primary/10 text-error-primary'>
                  Mới
                </Badge>
              )}
            </div>

            <div className='space-y-3'>
              <h3 className='text-lg font-semibold text-text-main line-clamp-2'>{template.title}</h3>
              <p className='text-sm text-text-secondary line-clamp-2'>{template.description}</p>
            </div>

            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <span className='inline-flex items-center rounded-full bg-background-secondary px-3 py-1 text-xs font-medium text-text-secondary'>
                {template.category}
              </span>

              <div className='inline-flex items-center gap-2 text-xs text-text-secondary'>
                <FileText size={14} />
                <span>{template.usageCount.toLocaleString('vi-VN')} người dùng</span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className='flex flex-col gap-2 p-6 pt-0 sm:flex-row'>
          <Button variant='outline' size='sm' className='w-full sm:w-auto'>
            Xem trước
          </Button>
          <Button variant='default' size='sm' className='w-full sm:w-auto'>
            Sử dụng biểu mẫu
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
