import config from '@/core/configs/env'
import { getAccessTokenFromLS } from '@/core/shared/storage'
import { type Lawyer } from '@/models/types/case.types'

// Map domain slug của AI (case_frame.main_domain) → tên specialty trong DB Node BE.
const DOMAIN_TO_SPECIALTY: Record<string, string> = {
  lao_dong: 'Lao động',
  dat_dai: 'Đất đai',
  hinh_su: 'Hình sự',
  dan_su: 'Dân sự',
  hon_nhan: 'Hôn nhân',
  hon_nhan_gia_dinh: 'Hôn nhân',
  doanh_nghiep: 'Doanh nghiệp',
}

export function domainToSpecialty(domain?: string | null): string | undefined {
  if (!domain) return undefined
  const key = domain.toLowerCase().trim()
  return DOMAIN_TO_SPECIALTY[key]
}

interface LawyerListItem {
  id: string
  fullName: string
  avatar: string | null
  specializations: string[]
  city?: string
  averageRating?: number
  experienceYears?: number
  pricePerHour?: number
  bio?: string
}

/**
 * Lấy danh sách luật sư THẬT từ Node BE (GET /api/v1/lawyers, public).
 * Lọc theo specialization nếu map được domain; map về type card Lawyer.
 */
export async function fetchLawyers(domain?: string | null, sortByRating?: boolean): Promise<Lawyer[]> {
  const specialty = domainToSpecialty(domain)
  const params = new URLSearchParams({ page: '1', size: '20' })
  if (specialty) params.set('specialization', specialty)
  if (sortByRating) params.set('sortByRating', 'true')

  const token = getAccessTokenFromLS()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${config.baseUrl}/lawyers?${params.toString()}`, { headers })
  if (!res.ok) throw new Error(`Lấy luật sư lỗi (${res.status})`)

  const body = await res.json()
  // Node BE bọc: { data: { items, pagination } } (axios-client tự bóc .data, nhưng
  // ở đây dùng fetch nên tự lấy). Phòng cả 2 dạng.
  const items: LawyerListItem[] = body?.data?.items ?? body?.items ?? []
  return items.map((it) => ({
    id: it.id,
    name: it.fullName,
    avatar: it.avatar || '',
    specialty: it.specializations?.join(', ') || specialty || 'Tư vấn pháp luật',
    rating: it.averageRating,
    experienceYears: it.experienceYears,
    pricePerHour: it.pricePerHour,
    bio: it.bio
  }))
}
