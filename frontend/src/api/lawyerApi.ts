import config from '@/core/configs/env'
import { getAccessTokenFromLS } from '@/core/shared/storage'
import { type Lawyer } from '@/models/types/case.types'

// Map domain slug của AI (case_frame.main_domain) → tên specialty trong DB Node BE.
const DOMAIN_TO_SPECIALTY: Record<string, string> = {
  doanh_nghiep: 'Doanh nghiệp',
  dau_tu: 'Đầu tư - Đấu thầu',
  thuong_mai: 'Thương mại',
  tai_chinh: 'Tài chính - Ngân hàng',
  thue: 'Thuế - Phí - Lệ phí',
  chung_khoan: 'Chứng khoán',
  bao_hiem: 'Bảo hiểm',
  lao_dong: 'Lao động',
  dat_dai: 'Đất đai - Nhà ở',
  xay_dung: 'Xây dựng - Đô thị',
  tai_nguyen_moi_truong: 'Tài nguyên - Môi trường',
  nong_nghiep: 'Nông nghiệp',
  giao_thong_van_tai: 'Giao thông vận tải',
  nang_luong: 'Năng lượng',
  hinh_su: 'Hình sự',
  dan_su: 'Dân sự',
  hon_nhan: 'Hôn nhân - Gia đình',
  hon_nhan_gia_dinh: 'Hôn nhân - Gia đình',
  chinh_sach_xa_hoi: 'Chính sách xã hội',
  y_te: 'Y tế - Dược',
  giao_duc: 'Giáo dục - Đào tạo',
  van_hoa: 'Văn hóa - Thể thao - Du lịch',
  hanh_chinh: 'Hành chính - Bộ máy NN',
  can_bo_cong_chuc: 'Cán bộ - Công chức - Viên chức',
  to_tung: 'Tố tụng - Thi hành án',
  an_ninh_quoc_phong: 'An ninh - Quốc phòng',
  khoa_hoc_cong_nghe: 'Khoa học - Công nghệ - CNTT',
  cong_nghiep: 'Công nghiệp - Sản xuất',
  dan_toc_ton_giao: 'Dân tộc - Tôn giáo',
  ngoai_giao: 'Ngoại giao - Điều ước quốc tế',
  thanh_tra: 'Thanh tra - Khiếu nại - PCTN',
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

const mapLawyer = (item: LawyerListItem, fallbackSpecialty?: string): Lawyer => ({
  id: item.id,
  name: item.fullName,
  avatar: item.avatar || '',
  specialty: item.specializations?.join(', ') || fallbackSpecialty || 'Tư vấn pháp luật',
  rating: item.averageRating,
  experienceYears: item.experienceYears,
  pricePerHour: item.pricePerHour,
  bio: item.bio
})

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
  // Node BE returns { data: { items, pagination } }; keep nested fallback for older wrappers.
  const items: LawyerListItem[] = body?.data?.items ?? body?.data?.data?.items ?? body?.items ?? []
  return items.map((item) => mapLawyer(item, specialty))
}

export async function fetchRecommendedLawyers(specialties: string[], limit = 5): Promise<Lawyer[]> {
  const verifiedTags = [
    ...new Set(
      specialties
        .map((item) => domainToSpecialty(item) || item.trim())
        .filter(Boolean)
    )
  ].slice(0, 10)
  if (!verifiedTags.length) return []
  const params = new URLSearchParams({
    specialties: verifiedTags.join(','),
    limit: String(Math.min(Math.max(limit, 1), 10))
  })
  const token = getAccessTokenFromLS()
  const response = await fetch(`${config.baseUrl}/lawyers/recommendations?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  if (!response.ok) throw new Error(`Lấy gợi ý luật sư lỗi (${response.status})`)
  const body = await response.json()
  const items: LawyerListItem[] = body?.data?.items ?? body?.data?.data?.items ?? body?.items ?? []
  return items.map((item) => mapLawyer(item))
}
