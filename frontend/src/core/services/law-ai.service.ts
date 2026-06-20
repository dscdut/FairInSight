// Service lấy danh sách văn bản pháp luật từ AI backend_reasoning (cổng 8000,
// data 392 luật đã crawl trên Supabase). Map response AI -> type `Law` mà FE đang
// dùng, nên LegalAnalysis chỉ cần đổi import (không sửa logic).
import aiClient from '@/core/services/ai-client'
import { type Law } from '@/models/types/law.type'

// shape 1 item AI trả (khớp DTO DocumentItem của backend_reasoning)
interface AiDocument {
  id: string
  official_code: string | null
  title: string
  doc_type: string | null
  issuer: string | null
  domains: string[]
  tier: string | null
  status: string | null
  issue_date: string | null
  effective_date: string | null
  expiry_date: string | null
  pdf_url: string | null
  source_url: string | null
  summary?: string | null
}

interface AiListResponse {
  items: AiDocument[]
  pagination: { page: number; size: number; total: number; total_pages: number }
}

// AI -> Law (FE). status AI ('active'/'unknown'...) -> 'ACTIVE'/'INACTIVE' cho FE.
function mapAiToLaw(d: AiDocument): Law {
  const active = !d.expiry_date && (d.status ?? '').toLowerCase() !== 'expired'
  const link = d.pdf_url || d.source_url || ''
  return {
    id: d.id,
    title: d.title,
    content: d.summary || '', // tóm tắt (nếu có) cho drawer; danh sách thường rỗng → xem PDF
    documentNumber: d.official_code || '',
    issuedDate: d.issue_date || '',
    effectiveDate: d.effective_date || '',
    sourceUrl: link, // dùng cho iframe xem PDF (Cloudinary / vbpl.vn)
    officialUrl: link || undefined, // dùng cho dòng "đường dẫn văn bản"
    status: active ? 'ACTIVE' : 'INACTIVE',
    userId: '',
    createdAt: d.issue_date || '',
    updatedAt: d.effective_date || '',
    authorName: d.issuer || 'Hệ thống',
    versions: []
  }
}

// ---- Luồng "thêm văn bản" (2 bước preview -> confirm) ----
// BE backend_reasoning đang làm song song. Giữ ĐÚNG tên field theo contract.
// preview: OCR + LLM trích metadata + tóm tắt sơ bộ + check trùng (CHƯA ghi KB).
// confirm: admin chốt -> nạp KB thật. force=true để bỏ qua cảnh báo trùng.

export interface PreviewLawFields {
  title: string
  official_code: string
  issue_date: string
  effective_date: string
  doc_type: string
  issuer: string
}

export interface DuplicateCandidate {
  id: string
  official_code: string
  title: string
  issuer: string
  score: number
}

export interface PreviewLawResponse {
  client_id: string
  cloudinary_url: string
  fields: PreviewLawFields
  summary: string
  duplicate: {
    verdict: 'unique' | 'different' | 'suspect'
    top_score: number
    candidates: DuplicateCandidate[]
  }
}

export interface ConfirmLawPayload {
  client_id: string
  fields: PreviewLawFields
  force: boolean
}

// Payload cập nhật metadata văn bản (admin sửa CHỮ, không xoá). Field optional để
// gửi đúng những gì admin đổi. Tên field theo contract BE (snake_case) như preview.
export interface UpdateLawPayload {
  title?: string
  official_code?: string
  issue_date?: string
  effective_date?: string
  summary?: string
}

export const lawAiApi = {
  // POST /api/v1/documents/preview (multipart: file, client_id)
  // Không ghi gì vào KB ở bước này — chỉ trích xuất + check trùng.
  async previewLaw(file: File, clientId: string): Promise<PreviewLawResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('client_id', clientId)
    const res = (await aiClient.post('/documents/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000 // OCR + LLM có thể lâu
    })) as PreviewLawResponse
    return res
  },

  // POST /api/v1/documents/confirm (json) -> DocumentItem (nạp KB thật).
  // Confirm chạy FULL ingest (OCR fix + embed + quan hệ + tag qua LLM) — có thể tới
  // ~10 phút/văn bản. Mặc định aiClient timeout 30s nên PHẢI override, nếu không FE
  // bỏ cuộc giữa chừng và báo "không tạo được" dù BE vẫn đang nạp.
  async confirmLaw(payload: ConfirmLawPayload): Promise<Law> {
    const res = (await aiClient.post('/documents/confirm', payload, {
      timeout: 900000 // 15 phút — đủ biên cho văn bản dài + LLM chậm
    })) as AiDocument
    return mapAiToLaw(res)
  },

  async listLaws(params: {
    page?: number
    size?: number
    search?: string
    status?: string
    issuedDate?: string
  }) {
    // AI dùng query: page/size/search/status/domain. issuedDate FE chưa map (bỏ qua).
    const res = (await aiClient.get('/documents', {
      params: {
        page: params.page,
        size: params.size,
        search: params.search,
        status: params.status
      }
    })) as AiListResponse
    return {
      items: (res.items || []).map(mapAiToLaw),
      pagination: {
        page: res.pagination.page,
        size: res.pagination.size,
        total: res.pagination.total,
        totalPages: res.pagination.total_pages
      }
    }
  },

  // Lấy HẾT danh sách (chia trang size=100, nối lại). Dùng cho hybrid: hiện trang 1
  // server-side ngay, rồi ngầm gọi cái này tải hết → đổi trang/search/filter tức thì
  // (FE tự cắt, không gọi mạng). DB cloud Tokyo mạng chậm nên 1 lần chờ < nhiều lần chờ.
  async listAllLaws(): Promise<Law[]> {
    const SIZE = 100
    const first = (await aiClient.get('/documents', {
      params: { page: 1, size: SIZE },
      timeout: 120000 // mạng cloud có thể lâu, cho biên rộng
    })) as AiListResponse
    const totalPages = first.pagination.total_pages || 1
    const all: AiDocument[] = [...(first.items || [])]
    // tải các trang còn lại tuần tự (tránh ép cloud quá nhiều request đồng thời).
    for (let p = 2; p <= totalPages; p++) {
      const res = (await aiClient.get('/documents', {
        params: { page: p, size: SIZE },
        timeout: 120000
      })) as AiListResponse
      all.push(...(res.items || []))
    }
    return all.map(mapAiToLaw)
  },

  async getLawById(id: string) {
    const res = (await aiClient.get(`/documents/${id}`)) as AiDocument
    return mapAiToLaw(res)
  },

  // PATCH /api/v1/documents/{id} — cập nhật metadata văn bản (admin sửa chữ).
  // LƯU Ý: BE backend_reasoning HIỆN CHƯA CÓ endpoint này (chỉ có GET/POST preview,
  // POST confirm). FE gọi sẵn theo convention REST; nơi gọi PHẢI bọc try/catch để
  // báo lỗi thân thiện nếu BE trả 404/405 (chưa bổ sung endpoint).
  async updateLaw(id: string, payload: UpdateLawPayload): Promise<Law> {
    const res = (await aiClient.patch(`/documents/${id}`, payload)) as AiDocument
    return mapAiToLaw(res)
  }
}
