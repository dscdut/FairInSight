import { type AxiosInstance } from 'axios'

import axiosClient from '@/core/services/axios-client'
import { type LawyerApi } from '@/models/types/api/lawyer-api.type'

const API_LAWYER_LISTS_URL = '/lawyers'
const API_LAWYER_DETAIL = '/lawyers/:id'

export const createLawyerService = ( client: AxiosInstance ) : LawyerApi => ({
  getLawyerLists: async (params?: {
    page?: number
    pageSize?: number
    category?: string
    city?: string
    searchQuery?: string
    sortBy?: string
  }) => {
    const res = await client.get(API_LAWYER_LISTS_URL, { params })
    return res
  },

  getLawyerDetail: async (id: string) => {
    try {
    const res = await client.get(API_LAWYER_DETAIL.replace(':id', id))
      return res.data
    } catch (error) {
      return Promise.reject(error)
    }
  }
})

export const lawyerApi = createLawyerService(axiosClient)