import { useQuery } from '@tanstack/react-query'

import { reportApi } from '@/core/services/report.service'
import { type ReportStatus } from '@/models/types/report.type'

export const REPORTS_QUERY_KEY = ['reports'] as const

export function useReports(params?: { page?: number; size?: number; status?: ReportStatus | 'ALL'; type?: string }) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, params],
    queryFn: () => reportApi.listReports(params)
  })
}

export function useReport(id?: string) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, id],
    queryFn: () => reportApi.getReport(id || ''),
    enabled: Boolean(id)
  })
}
