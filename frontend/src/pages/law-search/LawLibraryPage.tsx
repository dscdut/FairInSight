import { FileSearch2, SlidersHorizontal, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/use-debounce'
import { LegalFilterPanel } from '@/features/legal/components/LegalFilterPanel'
import { LegalPagination } from '@/features/legal/components/LegalPagination'
import { LegalResultCard } from '@/features/legal/components/LegalResultCard'
import { LegalSearchBar } from '@/features/legal/components/LegalSearchBar'
import { LegalSkeleton } from '@/features/legal/components/LegalSkeleton'
import { LegalSortDropdown } from '@/features/legal/components/LegalSortDropdown'
import { useLegalDocuments } from '@/features/legal/hooks/useLegalDocuments'
import { useLegalFilters } from '@/features/legal/hooks/useLegalFilters'

export default function LawLibraryPage() {
  const { filters, updateFilter, resetFilters, activeFilterCount } = useLegalFilters()
  const [localSearch, setLocalSearch] = useState(filters.search)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)

  const debouncedSearch = useDebounce(localSearch, 400)

  const queryFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch]
  )

  const { data, isLoading, isFetching } = useLegalDocuments(queryFilters)

  const handleSearch = useCallback(() => {
    updateFilter('search', localSearch)
  }, [localSearch, updateFilter])

  return (
    <div className='min-h-screen bg-background-primary'>
      <div className='border-b border-border-primary bg-background-primary sticky top-0 z-30'>
        <div className='container py-4'>
          <div className='flex items-center gap-2 text-small text-text-tertiary mb-3'>
            <span>Trang chủ</span>
            <span>/</span>
            <span className='text-text-primary font-medium'>Tra cứu văn bản pháp luật</span>
          </div>
          <h1 className='text-h3 font-bold text-text-primary'>Tra cứu văn bản pháp luật</h1>
        </div>
      </div>

      <div className='container py-6'>
        <div className='flex gap-6'>
          <aside className='hidden lg:block w-64 xl:w-72 shrink-0'>
            <div className='sticky top-28'>
              <LegalFilterPanel
                filters={filters}
                onFilterChange={updateFilter}
                onReset={resetFilters}
                activeFilterCount={activeFilterCount}
              />
            </div>
          </aside>

          <div className='flex-1 min-w-0'>
            <LegalSearchBar
              value={localSearch}
              onChange={setLocalSearch}
              onSearch={handleSearch}
              resultCount={data?.total}
              isLoading={isLoading || isFetching}
              className='mb-4'
            />

            <div className='flex items-center justify-between mb-4 gap-3 flex-wrap'>
              <Button
                variant='outline'
                size='sm'
                className='lg:hidden'
                iconStart={<SlidersHorizontal className='h-4 w-4' />}
                onClick={() => setFilterPanelOpen(true)}
              >
                Bộ lọc
                {activeFilterCount > 0 && (
                  <span className='ml-1 flex items-center justify-center h-4 w-4 rounded-full bg-primary text-white text-[10px] font-bold'>
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {data && (
                <LegalSortDropdown
                  value={filters.sort}
                  onChange={(v) => updateFilter('sort', v)}
                  className='ml-auto'
                />
              )}
            </div>

            {filterPanelOpen && (
              <div className='fixed inset-0 z-50 lg:hidden'>
                <div className='absolute inset-0 bg-text-primary/50' onClick={() => setFilterPanelOpen(false)} />
                <div className='absolute left-0 top-0 bottom-0 w-80 bg-background-primary shadow-600 overflow-y-auto p-4'>
                  <div className='flex items-center justify-between mb-4'>
                    <span className='font-semibold text-text-primary'>Bộ lọc</span>
                    <button onClick={() => setFilterPanelOpen(false)}>
                      <X className='h-5 w-5 text-text-tertiary' />
                    </button>
                  </div>
                  <LegalFilterPanel
                    filters={filters}
                    onFilterChange={updateFilter}
                    onReset={resetFilters}
                    activeFilterCount={activeFilterCount}
                  />
                </div>
              </div>
            )}

            {isLoading ? (
              <LegalSkeleton count={5} />
            ) : !data?.data?.length ? (
              <div className='flex flex-col items-center justify-center py-24 text-center'>
                <FileSearch2 className='h-12 w-12 text-text-tertiary mb-4' />
                <h3 className='text-p font-semibold text-text-primary mb-2'>Không tìm thấy kết quả</h3>
                <p className='text-small text-text-tertiary mb-6 max-w-sm'>
                  Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc
                </p>
                <Button variant='outline' onClick={resetFilters}>
                  Xóa bộ lọc
                </Button>
              </div>
            ) : (
              <>
                <div className='space-y-3'>
                  {data.data.map((doc) => (
                    <LegalResultCard
                      key={doc.id}
                      document={doc}
                      searchKeyword={debouncedSearch}
                    />
                  ))}
                </div>
                <div className='mt-8'>
                  <LegalPagination
                    currentPage={filters.page}
                    totalPages={data.totalPages}
                    onPageChange={(page) => updateFilter('page', page)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
