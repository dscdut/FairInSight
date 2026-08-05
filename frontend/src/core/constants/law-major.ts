export const LAW_MAJORS = {
  ALL: 'Tất cả',
  CIVIL: 'Dân sự',
  CRIMINAL: 'Hình sự',
  LAND: 'Đất đai - Nhà ở',
  CONTRACT: 'Hợp đồng',
  LABOR: 'Lao động',
  BUSINESS: 'Doanh nghiệp',
  FAMILY: 'Hôn nhân - Gia đình',
  ADMINISTRATIVE: 'Hành chính - Bộ máy NN',
  TAX: 'Thuế - Phí - Lệ phí',
  IP: 'Khoa học - Công nghệ - CNTT',
  CIVIL_INHERITANCE: 'Dân sự & Thừa kế',
  LAND_PROPERTY: 'Đất đai - Nhà ở',
  BUSINESS_COMMERCE: 'Thương mại',
  FAMILY_LONG: 'Hôn nhân - Gia đình',
  UNKNOWN: 'Tôi không chắc lĩnh vực'
} as const

export const FIND_LAWYER_CATEGORIES = [
  LAW_MAJORS.ALL,
  'Doanh nghiệp',
  'Đầu tư - Đấu thầu',
  'Thương mại',
  'Tài chính - Ngân hàng',
  'Thuế - Phí - Lệ phí',
  'Chứng khoán',
  'Bảo hiểm',
  'Đất đai - Nhà ở',
  'Xây dựng - Đô thị',
  'Tài nguyên - Môi trường',
  'Nông nghiệp',
  'Giao thông vận tải',
  'Năng lượng',
  'Dân sự',
  'Hôn nhân - Gia đình',
  'Lao động',
  'Chính sách xã hội',
  'Y tế - Dược',
  'Giáo dục - Đào tạo',
  'Văn hóa - Thể thao - Du lịch',
  'Hành chính - Bộ máy NN',
  'Cán bộ - Công chức - Viên chức',
  'Hình sự',
  'Tố tụng - Thi hành án',
  'An ninh - Quốc phòng',
  'Khoa học - Công nghệ - CNTT',
  'Công nghiệp - Sản xuất',
  'Dân tộc - Tôn giáo',
  'Ngoại giao - Điều ước quốc tế',
  'Thanh tra - Khiếu nại - PCTN'
] as const

export const REQUEST_FORM_CATEGORIES = [
  LAW_MAJORS.CIVIL,
  LAW_MAJORS.CRIMINAL,
  LAW_MAJORS.LAND,
  LAW_MAJORS.CONTRACT,
  LAW_MAJORS.LABOR,
  LAW_MAJORS.BUSINESS,
  LAW_MAJORS.FAMILY,
  LAW_MAJORS.ADMINISTRATIVE,
  LAW_MAJORS.TAX
] as const

export const CHAT_STARTER_CATEGORIES = [
  LAW_MAJORS.FAMILY_LONG,
  LAW_MAJORS.LAND,
  LAW_MAJORS.CRIMINAL,
  LAW_MAJORS.CIVIL,
  LAW_MAJORS.LABOR,
  LAW_MAJORS.BUSINESS,
  LAW_MAJORS.UNKNOWN
] as const
