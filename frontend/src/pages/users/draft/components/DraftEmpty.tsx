import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { ROUTE } from '@/core/constants/path'

interface DraftEmptyProps {
  searchQuery?: string
}

export default function DraftEmpty({ searchQuery }: DraftEmptyProps) {
  const navigate = useNavigate()

  const handleNavigateToTemplate = () => {
    navigate(ROUTE.USER.TEMPLATE)
  }

  const emptyVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 }
    }
  }

  return (
    <motion.div
      variants={emptyVariants}
      initial='hidden'
      animate='visible'
      className='flex flex-col items-center justify-center py-16 px-4'
    >
      <div className='bg-background-tertiary rounded-full p-6 mb-4'>
        <FileText size={48} className='text-text-secondary' aria-hidden='true' />
      </div>

      {searchQuery ? (
        <>
          <h3 className='text-h5 font-semibold text-text-primary mt-4'>Không tìm thấy bản nháp</h3>
          <p className='text-small text-text-description mt-2 text-center max-w-sm'>
            Không có bản nháp nào khớp với từ khóa &quot;{searchQuery}&quot;. Hãy thử tìm kiếm với từ khóa khác.
          </p>
        </>
      ) : (
        <>
          <h3 className='text-h5 font-semibold text-text-primary mt-4'>Chưa có bản nháp</h3>
          <p className='text-small text-text-description mt-2 text-center max-w-sm'>
            Bắt đầu tạo bản nháp mới bằng cách chọn một biểu mẫu từ thư viện và lưu lại khi bạn đang chỉnh sửa.
          </p>
          <Button onClick={handleNavigateToTemplate} className='mt-6' title='Đi tới thư viện biểu mẫu'>
            Đi tới Thư viện biểu mẫu
          </Button>
        </>
      )}
    </motion.div>
  )
}
