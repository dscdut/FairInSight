import axiosClient from '@/core/services/axios-client'
import {
  type CreateReportInput,
  type ReportItem,
  type ReportPage,
  type ReportStats,
  type ReportStatus
} from '@/models/types/report.type'

interface Envelope<T> {
  data: T
}

export const reportApi = {
  async createReport(input: CreateReportInput): Promise<ReportItem> {
    const res = await axiosClient.post<Envelope<ReportItem>, Envelope<ReportItem>>('/reports', input)
    return res.data
  },

  async listReports(params?: {
    page?: number
    size?: number
    status?: ReportStatus | 'ALL'
    type?: string
    category?: string
    search?: string
  }): Promise<ReportPage> {
    const cleanParams = {
      ...params,
      status: params?.status === 'ALL' ? undefined : params?.status
    }
    const res = await axiosClient.get<Envelope<ReportPage>, Envelope<ReportPage>>('/reports', { params: cleanParams })
    return res.data
  },

  async getReport(id: string): Promise<ReportItem> {
    const res = await axiosClient.get<Envelope<ReportItem>, Envelope<ReportItem>>(`/reports/${id}`)
    return res.data
  },

  async sendMessage(id: string, message: string): Promise<ReportItem> {
    const res = await axiosClient.post<Envelope<ReportItem>, Envelope<ReportItem>>(`/reports/${id}/messages`, { message })
    return res.data
  },

  async updateStatus(id: string, status: ReportStatus, message?: string): Promise<ReportItem> {
    const res = await axiosClient.patch<Envelope<ReportItem>, Envelope<ReportItem>>(`/reports/${id}/status`, {
      status,
      message
    })
    return res.data
  },

  async getStats(month?: string): Promise<ReportStats> {
    const res = await axiosClient.get<Envelope<ReportStats>, Envelope<ReportStats>>('/reports/stats', { params: { month } })
    return res.data
  }
}
