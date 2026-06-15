export type Template = {
  id: string
  title: string
  description: string
  category: string
  usageCount: number
  isNew: boolean
  isVip: boolean
  fields: {
    section: string
    inputs: {
      key: string
      label: string
      type: string
      placeholder?: string
      required?: boolean
      disabled?: boolean
      defaultValue?: string
    }[]
  }[]
}

export const mockTemplates: Template[] = [
  {
    id: '1',
    title: 'Hợp đồng nhượng quyền thương mại',
    description: 'Biểu mẫu hợp đồng nhượng quyền thương mại chuẩn chỉnh, áp dụng cho các chuỗi nhượng quyền bán lẻ và dịch vụ.',
    category: 'Hợp đồng',
    usageCount: 1450,
    isNew: true,
    isVip: false,
    fields: [
      {
        section: 'Thông tin cá nhân',
        inputs: [
          { key: 'fullName', label: 'Họ và Tên', type: 'text', defaultValue: 'Lê Văn B', required: true },
          { key: 'phone', label: 'Số điện thoại', type: 'text', defaultValue: '01234567', required: true },
          { key: 'dob', label: 'Ngày sinh', type: 'text', defaultValue: '01/01/2000', required: true },
          { key: 'idNumber', label: 'Số CCCD/CMND', type: 'text', defaultValue: '012345678910', required: true },
          { key: 'permanentAddress', label: 'Địa chỉ thường trú', type: 'text', defaultValue: 'Đà Nẵng, Việt Nam', required: true },
          { key: 'idIssueInfo', label: 'Ngày cấp, nơi cấp CCCD', type: 'text', defaultValue: '01/01/2019, UBND Huyện ABC, Đà Nẵng', required: true },
          { key: 'currentAddress', label: 'Địa chỉ hiện tại', type: 'text', defaultValue: 'Đà Nẵng, Việt Nam', required: true }
        ]
      },
      {
        section: 'Thông tin hợp đồng',
        inputs: [
          { key: 'contractNumber', label: 'Số hợp đồng', type: 'text', defaultValue: '12345678901112345', required: true },
          { key: 'signDate', label: 'Ngày ký', type: 'date', defaultValue: '2026-06-15', required: true },
          { key: 'signLocation', label: 'Địa điểm ký', type: 'text', defaultValue: 'ĐN, VN', required: true }
        ]
      },
      {
        section: 'Điều khoản tài chính',
        inputs: [
          { key: 'contractValue', label: 'Giá trị hợp đồng', type: 'text', defaultValue: '12345678901112345', required: true }
        ]
      }
    ]
  },
  {
    id: '2',
    title: 'Giấy đề nghị đăng ký doanh nghiệp tư nhân',
    description: 'Biểu mẫu CF401A-02 để đăng ký thành lập doanh nghiệp tư nhân theo quy định của Sở Kế hoạch và Đầu tư.',
    category: 'Doanh nghiệp',
    usageCount: 980,
    isNew: false,
    isVip: false,
    fields: [
      {
        section: 'Thông tin chủ doanh nghiệp',
        inputs: [
          { key: 'ownerName', label: 'Họ và tên chủ doanh nghiệp', type: 'text', defaultValue: 'Nguyễn Văn A', required: true },
          { key: 'ownerDob', label: 'Ngày sinh', type: 'date', defaultValue: '1990-05-15', required: true },
          { key: 'ownerGender', label: 'Giới tính', type: 'text', defaultValue: 'Nam', required: true },
          { key: 'ownerId', label: 'Số CMND/CCCD/Hộ chiếu', type: 'text', defaultValue: '048090001234', required: true }
        ]
      },
      {
        section: 'Thông tin doanh nghiệp',
        inputs: [
          { key: 'businessName', label: 'Tên doanh nghiệp viết bằng tiếng Việt', type: 'text', defaultValue: 'DOANH NGHIỆP TƯ NHÂN THƯƠNG MẠI A', required: true },
          { key: 'officeAddress', label: 'Địa chỉ trụ sở chính', type: 'text', defaultValue: '123 Nguyễn Hữu Thọ, Hải Châu, Đà Nẵng', required: true },
          { key: 'capital', label: 'Vốn đầu tư (VND)', type: 'text', defaultValue: '500,000,000', required: true }
        ]
      }
    ]
  },
  {
    id: '3',
    title: 'Hợp đồng thuê văn phòng',
    description: 'Mẫu hợp đồng thuê văn phòng làm việc dành cho các doanh nghiệp, quy định rõ ràng trách nhiệm bên thuê và bên cho thuê.',
    category: 'Hợp đồng',
    usageCount: 2100,
    isNew: false,
    isVip: true,
    fields: [
      {
        section: 'Thông tin bên cho thuê (Bên A)',
        inputs: [
          { key: 'lessorName', label: 'Tên tổ chức/cá nhân', type: 'text', defaultValue: 'Công ty Quản lý Bất động sản OfficeLand', required: true },
          { key: 'lessorAddress', label: 'Địa chỉ', type: 'text', defaultValue: '456 Lê Lợi, Hải Châu, Đà Nẵng', required: true }
        ]
      },
      {
        section: 'Thông tin thuê văn phòng',
        inputs: [
          { key: 'area', label: 'Diện tích thuê (m2)', type: 'text', defaultValue: '150', required: true },
          { key: 'price', label: 'Giá thuê hàng tháng (VND)', type: 'text', defaultValue: '30,000,000', required: true },
          { key: 'rentPeriod', label: 'Thời hạn thuê (Tháng)', type: 'text', defaultValue: '24', required: true }
        ]
      }
    ]
  }
]
