// Loại văn bản (doc_type) — nguồn chung cho badge danh sách, combobox form nạp/sửa.
// Khớp enum DocType ở backend_reasoning (src/schema/enums/document.py). Value = enum
// gửi/nhận với BE; label = nhãn tiếng Việt hiển thị. Thứ tự theo bậc hiệu lực.
export const DOC_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'constitution', label: 'Hiến pháp' },
  { value: 'code', label: 'Bộ luật' },
  { value: 'law', label: 'Luật' },
  { value: 'ordinance', label: 'Pháp lệnh' },
  { value: 'resolution', label: 'Nghị quyết' },
  { value: 'decree', label: 'Nghị định' },
  { value: 'decision', label: 'Quyết định' },
  { value: 'circular', label: 'Thông tư' },
  { value: 'joint_circular', label: 'Thông tư liên tịch' },
  { value: 'directive', label: 'Chỉ thị' },
  { value: 'plan', label: 'Kế hoạch' },
  { value: 'official_letter', label: 'Công văn' },
  { value: 'announcement', label: 'Thông báo' },
  { value: 'consolidated', label: 'Văn bản hợp nhất' },
  { value: 'other', label: 'Khác' },
]

// Tra nhanh value -> label tiếng Việt. Loại không rõ trả về undefined.
export const DOC_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  DOC_TYPE_OPTIONS.map((o) => [o.value, o.label])
)

// Chuẩn hóa doc_type về enum value. Preview/LLM trả NHÃN tiếng Việt ("Luật"), còn
// list/detail trả sẵn enum ("law"). Combobox cần value enum để hiển thị đúng — hàm này
// nhận cả 2 dạng. Không khớp (vd "Nghị quyết liên tịch" gộp resolution) trả '' để
// combobox về placeholder; BE vẫn map đúng qua _detect_type khi confirm.
const _LABEL_TO_VALUE: Record<string, string> = Object.fromEntries(
  DOC_TYPE_OPTIONS.map((o) => [o.label.toLowerCase(), o.value])
)
export function normalizeDocType(raw?: string | null): string {
  const s = (raw || '').trim()
  if (!s) return ''
  if (DOC_TYPE_LABELS[s]) return s // đã là enum value
  return _LABEL_TO_VALUE[s.toLowerCase()] || ''
}
