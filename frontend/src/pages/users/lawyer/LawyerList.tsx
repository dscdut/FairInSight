import { useState, useCallback } from 'react'

import { Search, User } from 'lucide-react'

import { getLawyerListMock } from '@/_mocks/lawyer.mock'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FIND_LAWYER_CATEGORIES } from '@/core/constants/law-major'
import { VIETNAM_CITIES, type VietnamCity } from '@/core/constants/vietnam-city'
import { useLawyerList } from '@/hooks/lawyers/use-lawyer'
import { useDebounce } from '@/hooks/use-debounce'
import { type Lawyer } from '@/models/lawyer/list-lawyer.type'

import { LawyerCard } from './components/LawyerCard'
import { LawyerContactDialog } from './components/LawyerContactDialog'

// Hoist static arrays to prevent re-creation on every render
const CATEGORIES = FIND_LAWYER_CATEGORIES
const CITIES = ['Tất cả', ...VIETNAM_CITIES]

export default function LawyerList() {
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [selectedCategory, setSelectedCategory] = useState('Tất cả')
  const [selectedCity, setSelectedCity] = useState<VietnamCity | 'Tất cả'>('Tất cả')
  const [sortBy, setSortBy] = useState<'default' | 'rating' | 'cases'>('default')
  
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }, [])

  const handleSortChange = useCallback((val: string) => {
    setSortBy(val as 'default' | 'rating' | 'cases')
    setCurrentPage(1)
  }, [])

  const handleCityChange = useCallback((val: string) => {
    setSelectedCity(val as VietnamCity | 'Tất cả')
    setCurrentPage(1)
  }, [])

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
    setCurrentPage(1)
  }, [])

  const handleOpenContact = useCallback((lawyer: Lawyer, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedLawyer(lawyer)
    setIsContactModalOpen(true)
  }, [])

  const { data: listResponse } = useLawyerList(currentPage, pageSize, {
    category: selectedCategory,
    city: selectedCity,
    searchQuery: debouncedSearchQuery,
    sortBy
  })

  // Fallback to mock data for initial load before React Query finishes
  const displayData = listResponse || getLawyerListMock(currentPage, pageSize, {
    category: selectedCategory,
    city: selectedCity,
    searchQuery: debouncedSearchQuery,
    sortBy
  })

  const filteredLawyers = displayData.data.items
  const pagination = displayData.data.pagination

  return (
    <div className='p-4 w-full space-y-6 text-left'>
      {/* Header Section */}
      <div className='flex-col md:flex-row md:items-end gap-4 pb-4 space-y-4'>
        <div className='w-full pb-4 border-b border-border-primary'>
          <h1 className='text-h2 text-main mb-2 tracking-tight'>Danh bạ Luật sư</h1>
          <p className='text-text-description text-p'>Tìm kiếm chuyên gia pháp lý phù hợp với nhu cầu của bạn</p>
        </div>

        {/* Filter controls */}
        <div className='flex flex-wrap items-center gap-3'>
          {/* Search bar */}
          <div className='relative flex-1 md:w-128 min-w-[240px]'>
            <Input
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder='Tên luật sư, văn phòng...'
              className='w-full pl-9 pr-4 py-2 text-text-primary'
            />
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary' />
          </div>
          {/* Sorting Select */}
          <div className='relative min-w-[180px]'>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className='w-full h-11 border-border-secondary text-main rounded-full text-sm focus:outline-none focus:border-border-secondary'>
                <SelectValue placeholder="Sắp xếp: Mặc định" />
              </SelectTrigger>
              <SelectContent className='bg-background-primary border-border-secondary text-main'>
                <SelectGroup>
                  <SelectItem value="default">Sắp xếp: Mặc định</SelectItem>
                  <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                  <SelectItem value="cases">Vụ việc thành công</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Location Select */}
          <div className='relative min-w-[180px]'>
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger className='w-full h-11 border-border-secondary text-main rounded-full text-sm focus:border-border-secondary'>
                <SelectValue placeholder="Vị trí: Tất cả" />
              </SelectTrigger>
              <SelectContent className='bg-background-primary border-border-secondary text-main'>
                <SelectGroup>
                  <SelectItem value='Tất cả'>Vị trí: Tất cả</SelectItem>
                  {CITIES.filter(c => c !== 'Tất cả').map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Categories Filter pills */}
      <div className='w-full overflow-x-auto no-scrollbar pb-2'>
        <div className='flex items-center gap-2.5 min-w-max'>
          {CATEGORIES.map((category) => {
            const isSelected = category === selectedCategory
            return (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary border-primary text-white shadow-md shadow-primary/10'
                    : 'bg-background-primary border-border-secondary text-text-description hover:bg-background-secondary hover:text-text-primary'
                }`}
              >
                {category}
              </button>
            )
          })}
        </div>
      </div>

      {/* Online status label */}
      <p className='text-sm font-medium text-main'>
        Có <span className='font-semibold text-text-primary'>{filteredLawyers.length}</span> luật sư phù hợp
      </p>

      {/* Grid listing */}
      {filteredLawyers.length === 0 ? (
        <div className='w-full py-16 text-center'>
          <User className='w-12 h-12 mx-auto text-text-tertiary mb-3' />
          <h1 className='text-h3 text-text-tertiary'>Không tìm thấy luật sư</h1>
          <p className='text-small text-text-tertiary mt-1'>Vui lòng thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
        </div>
      ) : (
        <div className='space-y-8'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {filteredLawyers.map((lawyer) => {
              return (
                <LawyerCard
                  key={lawyer.id}
                  lawyer={lawyer}
                  onContact={handleOpenContact}
                />
              )
            })}
          </div>

          {/* Pagination component */}
          {pagination.totalPages && pagination.totalPages > 1 && (
            <div className='flex items-center justify-center gap-2 pt-6 border-t border-border-primary'>
              <Button
                variant='ghost'
                size='lg'
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className='h-9 text-xs rounded-full hover:bg-background-tertiary transition-colors cursor-pointer'
              >
                Trước
              </Button>
 
              {Array.from({ length: pagination.totalPages }, (_, index) => {
                const pageNum = index + 1
                const isActive = pageNum === currentPage
                return (
                  <Button
                    key={pageNum}
                    variant={isActive ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-9 w-9 text-lg rounded-full cursor-pointer ${
                      isActive
                        ? 'bg-background-secondary text-main font-bold'
                        : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
                    }`}
                  >
                    {pageNum}
                  </Button>
                )
              })}
 
              <Button
                variant='ghost'
                size='lg'
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.totalPages || 1))}
                disabled={currentPage === pagination.totalPages}
                className='h-9 text-xs rounded-full hover:bg-background-tertiary transition-colors cursor-pointer'
              >
                Sau
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Details & Contact Booking Dialog */}
      <LawyerContactDialog
        lawyer={selectedLawyer}
        isOpen={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
      />
    </div>
  )
}
