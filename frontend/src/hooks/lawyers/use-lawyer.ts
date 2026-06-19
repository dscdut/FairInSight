import { useQuery } from '@tanstack/react-query'

import { getLawyerListMock, getLawyerDetailMock } from '@/_mocks/lawyer.mock'
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
      try {
        const res = await lawyerApi.getLawyerLists({
          page: currentPage,
          pageSize,
          category: filters.category === 'Tất cả' ? undefined : filters.category,
          city: filters.city === 'Tất cả' ? undefined : filters.city,
          searchQuery: filters.searchQuery || undefined,
          sortBy: filters.sortBy === 'default' ? undefined : filters.sortBy
        })

        const apiItems = res?.data?.items || []
        const mockResponse = getLawyerListMock(currentPage, pageSize, filters)
        const mockItems = mockResponse.data.items

        // 1. Enrich API records with fallback attributes from matching mock records
        const enrichedApiItems = apiItems.map((apiLawyer) => {
          const match = mockItems.find((m) => m.fullName.toLowerCase() === apiLawyer.fullName.toLowerCase())
          return {
            ...apiLawyer,
            avatar: apiLawyer.avatar || match?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer',
            bio: apiLawyer.bio || match?.bio || 'Chuyên gia tư vấn pháp lý.',
            careerHistory: apiLawyer.careerHistory || match?.careerHistory || 'Nhiều năm kinh nghiệm.'
          }
        })

        // 2. Append unique mock records (those whose names do not duplicate API records)
        const apiNames = new Set(enrichedApiItems.map((item) => item.fullName.toLowerCase()))
        const uniqueMockItems = mockItems.filter((item) => !apiNames.has(item.fullName.toLowerCase()))

        const combinedItems = [...enrichedApiItems, ...uniqueMockItems].slice(0, pageSize)
        const totalCount = (res?.data?.pagination?.total || 0) + uniqueMockItems.length

        return {
          data: {
            items: combinedItems,
            pagination: {
              page: currentPage,
              size: pageSize,
              total: totalCount,
              totalPages: Math.ceil(totalCount / pageSize)
            }
          }
        }
      } catch (err) {
        console.warn('API getLawyerLists failed, falling back to mock data:', err)
        return getLawyerListMock(currentPage, pageSize, filters)
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
      try {
        // Check if the ID is a mock ID, return mock data directly to avoid 400 Bad Request from API
        if (id.startsWith('lyr-')) {
          return getLawyerDetailMock(id)
        }

        const res = await lawyerApi.getLawyerDetail(id)
        if (!res || !res.data || !res.data.summary) {
          return getLawyerDetailMock(id)
        }

        const apiDetail = res.data.summary
        const mockDetail = getLawyerDetailMock(id).data.summary

        return {
          data: {
            items: res.data.items || [],
            summary: {
              ...apiDetail,
              // Merge properties from mockDetail if missing/empty in API
              role: apiDetail.role || mockDetail.role,
              careerHistory: apiDetail.careerHistory || mockDetail.careerHistory,
              consultingFee: apiDetail.consultingFee || mockDetail.consultingFee || 500000,
              experienceYears: apiDetail.experienceYears || mockDetail.experienceYears
            }
          }
        }
      } catch (err) {
        console.warn(`API getLawyerDetail failed for ID ${id}, falling back to mock data:`, err)
        return getLawyerDetailMock(id)
      }
    },
    enabled: !!id
  })
}
