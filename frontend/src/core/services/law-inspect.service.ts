// Service tra cứu cấu trúc 1 văn bản (cây Điều/Khoản/Điểm) + quan hệ 2 chiều 1 unit.
// Gọi backend_reasoning (cổng 8000) qua aiClient. Read-only — phục vụ trang admin
// "Kiểm tra & Nối luật". Khớp DTO lookup.py của BE.
import aiClient from '@/core/services/ai-client'

// 1 đơn vị trong cây (khớp UnitNode). FE tự gập theo parent_id.
export interface UnitNode {
  id: string
  parent_id: string | null
  unit_type: string // article|clause|point|chapter|section
  unit_no: string | null // số La Mã Chương/Mục (I, II) hoặc số Điều/Khoản
  article_no: string | null
  clause_no: string | null
  point_label: string | null
  title: string | null
  content: string | null
  path_text: string | null
  order_index: number
  unit_status: string // active|amended|replaced|repealed|not_yet
}

export interface UnitTreeResponse {
  document_id: string
  official_code: string | null
  title: string
  units: UnitNode[]
}

// 1 quan hệ quanh unit (khớp RelationItem). label đã đảo chủ động/bị động sẵn từ BE.
export interface RelationItem {
  relation_id: string
  kind: 'amendment' | 'reference'
  direction: 'outgoing' | 'incoming'
  rel_type: string
  label: string
  resolved: boolean
  other_unit_id: string | null
  other_doc_id: string | null
  other_doc_title: string | null
  other_official_code: string | null
  other_article_no: string | null
  other_clause_no: string | null
  target_text: string | null // cạnh treo: đích chưa khớp
  evidence_text: string | null
  via_parent: boolean // quan hệ lấy từ Điều cha, không phải unit click
}

export interface UnitRelationsResponse {
  unit_id: string
  article_no: string | null
  outgoing: RelationItem[]
  incoming: RelationItem[]
}

export const lawInspectApi = {
  // GET /api/v1/documents/{id}/units — cây toàn văn bản (phẳng).
  async getUnits(docId: string): Promise<UnitTreeResponse> {
    return (await aiClient.get(`/documents/${docId}/units`, {
      timeout: 60000 // luật lớn (Bộ luật Hình sự ~4400 unit) + cloud Tokyo
    })) as UnitTreeResponse
  },

  // GET /api/v1/units/{id}/relations — quan hệ 2 chiều quanh 1 unit (gồm cạnh treo).
  async getRelations(unitId: string): Promise<UnitRelationsResponse> {
    return (await aiClient.get(`/units/${unitId}/relations`)) as UnitRelationsResponse
  }
}
