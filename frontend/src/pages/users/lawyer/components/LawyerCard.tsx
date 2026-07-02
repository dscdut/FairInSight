import { memo } from 'react'

import { Star, MapPin, User, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getOptimizedImageUrl } from '@/core/helpers/image'
import { type Lawyer } from '@/models/lawyer/list-lawyer.type'


interface LawCardProps {
  lawyer: Lawyer
  onContact: (lawyer: Lawyer, e: React.MouseEvent) => void
  priority?: boolean
}

export const LawyerCard = memo(function LawyerCard({
  lawyer,
  onContact,
  priority
}: LawCardProps) {

  const navigate = useNavigate()
  return (
    <Card
      onClick={() => navigate(`/lawyers/${lawyer.id}`)}
      className='border-border-secondary w-full mx-auto shadow-400 hover:-translate-y-1 space-y-3 transition-all duration-300 rounded-sm px-4 py-6 flex flex-col items-center relative overflow-hidden group cursor-pointer h-full'
    >
      <div className='flex-1 space-y-2'>
        {/* Rating Badge */}
        <div className='absolute top-4 left-4 bg-warning-background text-warning-secondary px-2.5 py-0.5 rounded-full flex items-center gap-1 text-sm font-semibold border border-warning-primary'>
          <Star className='w-4 h-4 fill-current' />
          {lawyer.averageRating.toFixed(1)}
        </div>

        {/* Avatar */}
        <div className='w-40 h-40 rounded-full border-2 border-background-primary shadow-200 overflow-hidden mb-2 group-hover:scale-105 transition-transform shrink-0 mx-auto'>
          <img
            src={getOptimizedImageUrl(lawyer.avatar || lawyer.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer', 160)}
            alt={lawyer.fullName}
            className='w-full h-full object-cover'
            width={160}
            height={160}
            loading={priority ? 'eager' : 'lazy'}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...({ fetchPriority: priority ? 'high' : 'low' } as any)}
            decoding='async'
          />
        </div>

        {/* Info */}
        <div className='text-center w-full space-y-1'>
          <h3 className='text-h5 text-text-primary'>
            Luật sư <br/>
            <span className='font-bold'>
              {lawyer.fullName}
            </span>
          </h3>
          <div className='flex items-center justify-center gap-1 text-text-description text-xs'>
            <MapPin className='w-4 h-4 text-text-tertiary' />
            {lawyer.location}
          </div>
        </div>

        {/* Specialization tags */}
        <div className='flex flex-wrap justify-center gap-2 min-h-[24px] content-start mb-4'>
          {lawyer.specializations.slice(0, 2).map((spec) => (
            <Badge
              key={spec}
              variant={"secondary"}
              className='text-[10.5px] font-medium text-text-secondary border border-border-primary'
            >
              {spec}
            </Badge>
          ))}
        </div>
      </div>

        {/* Footer divider and buttons */}
        <div className='w-full flex items-center gap-2 pt-4 border-t border-border-primary mt-auto shrink-0'>
          <Button
            variant='default'
            size='default'
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/lawyers/${lawyer.id}`)
            }}
            className='flex-1 gap-2'
          >
            <User className='w-4 h-4'/>
            Hồ sơ
          </Button>
           <Button
            variant='ghost'
            size='default'
            onClick={(e) => {
              e.stopPropagation()
              onContact(lawyer, e)
            }}
            className='flex-1 gap-2 hover:text-tex-description hover:bg-background-secondary justify-center'
          >
            <MessageSquare className='w-4 h-4'/>
            Liên hệ
          </Button>
        </div>
        <div className='text-right w-full text-xs text-text-tertiary font-bold mt-1 shrink-0'>
            {lawyer.successfulCases} vụ việc
        </div>
    </Card>
  )
})
