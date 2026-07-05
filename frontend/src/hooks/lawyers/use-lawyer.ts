import { useQuery } from '@tanstack/react-query'

import { lawyerApi } from '@/core/services/lawyer.service'

export interface UseLawyerListFilters {
  category: string
  city: string
  searchQuery: string
  sortBy: 'default' | 'rating' | 'cases'
}

export const useLawyerList = (
  currentPage: number,
  pageSize: number,
  filters: UseLawyerListFilters
) => {
  return useQuery({
    queryKey: ['lawyers', currentPage, pageSize, filters],
    queryFn: async () => {
      const res = await lawyerApi.getLawyerLists({
        page: currentPage,
        pageSize,
        category: filters.category === 'Tất cả' ? undefined : filters.category,
        city: filters.city === 'Tất cả' ? undefined : filters.city,
        searchQuery: filters.searchQuery || undefined,
        sortBy: filters.sortBy === 'default' ? undefined : filters.sortBy
      })

      const apiItems = res?.data?.items || []
      const totalCount = res?.data?.pagination?.total || apiItems.length
      const totalPages = res?.data?.pagination?.totalPages || Math.ceil(totalCount / pageSize)

      return {
        data: {
          items: apiItems.map((it) => ({
            ...it,
            avatar: it.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + it.fullName
          })),
          pagination: {
            page: currentPage,
            size: pageSize,
            total: totalCount,
            totalPages
          }
        }
      }
    },
    placeholderData: (prev) => prev
  })
}

export const useLawyerDetail = (id?: string) => {
  return useQuery({
    queryKey: ['lawyerDetail', id],
    queryFn: async () => {
      if (!id) return null
      const res = await lawyerApi.getLawyerDetail(id) as any
      const innerData = res?.data?.data || res?.data || res
      return {
        data: {
          items: innerData?.items || [],
          summary: innerData?.summary || null
        }
      }
    },
    enabled: !!id
  })
}
