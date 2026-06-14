import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui'
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
    'h-full border border-border-primary bg-background-primary shadow-200 transition-all duration-300 hover:shadow-300 hover:scale-105',
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
              <h3 className='text-h5 font-semibold text-text-main line-clamp-2'>{template.title}</h3>
              <p className='text-p text-text-secondary line-clamp-2'>{template.description}</p>
            </div>

            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <span className='inline-flex items-center rounded-full bg-background-secondary px-3 py-1 text-small font-medium text-text-secondary'>
                {template.category}
              </span>

              <div className='inline-flex items-center gap-2 text-small text-text-secondary'>
                <FileText size={14} />
                <span>{template.usageCount.toLocaleString('vi-VN')} người dùng</span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className='flex flex-col gap-3 p-6 pt-0 sm:flex-row sm:items-center sm:justify-between'>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant='outline' size='sm' className='w-full sm:w-auto'>
                Xem trước
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-5xl bg-background-primary p-0 overflow-hidden rounded-3xl shadow-300'>
              <div className='grid gap-6 md:grid-cols-2'>
                <div className='min-h-96 rounded-3xl border border-border-secondary bg-background-secondary overflow-hidden shadow-200'>
                  {template.thumbnail ? (
                    <img src={template.thumbnail} alt={template.title} className='h-full w-full object-cover' />
                  ) : (
                    <div className='flex h-full items-center justify-center bg-background-secondary text-small text-text-description'>
                      Ảnh xem trước biểu mẫu
                    </div>
                  )}
                </div>

                <div className='space-y-6 p-6'>
                  <DialogHeader>
                    <DialogTitle className='text-h3 font-semibold text-text-main'>{template.title}</DialogTitle>
                  </DialogHeader>

                  <div className='space-y-5 rounded-3xl border border-border-secondary bg-background-tertiary p-5'>
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <span className='text-p font-semibold text-text-main'>Mô tả</span>
                      </div>
                      <p className='text-p text-text-secondary leading-7'>{template.description}</p>
                    </div>

                    <div className='space-y-3'>
                      <div className='flex items-center justify-between rounded-xl border border-border-secondary bg-background-primary p-4'>
                        <span className='text-p text-text-description'>Phân loại</span>
                        <span className='text-p font-semibold text-text-main'>{template.category}</span>
                      </div>
                      <div className='flex items-center justify-between rounded-xl border border-border-secondary bg-background-primary p-4'>
                        <span className='text-p text-text-description'>Số lượt sử dụng</span>
                        <span className='text-p font-semibold text-text-main'>
                          {template.usageCount.toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='grid gap-3 sm:grid-cols-2'>
                    <DialogClose asChild>
                      <Button variant='outline' className='w-full'>
                        Đóng
                      </Button>
                    </DialogClose>
                    <Button variant='default' className='w-full'>
                      Sử dụng biểu mẫu
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant='default' size='sm' className='w-full sm:w-auto'>
            Sử dụng biểu mẫu
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
