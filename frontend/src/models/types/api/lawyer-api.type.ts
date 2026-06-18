import { type LawyerDetailResponse } from "@/models/lawyer/lawyer.type"
import { type LawyerListResponse } from "@/models/lawyer/list-lawyer.type"

export type LawyerApi = {
  getLawyerLists: (params?: {
    page?: number
    pageSize?: number
    category?: string
    city?: string
    searchQuery?: string
    sortBy?: string
  }) => Promise<LawyerListResponse>
  getLawyerDetail: (id: string) => Promise<LawyerDetailResponse>
}