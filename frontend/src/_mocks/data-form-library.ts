import { type Template } from '@/models/types/form-library'

export const mockTemplates: Template[] = [
  {
    id: '1',
    title: 'Hợp đồng nhượng quyền thương mại',
    description: 'Biểu mẫu hợp đồng nhượng quyền thương mại chuẩn chỉnh, áp dụng cho các chuỗi nhượng quyền bán lẻ và dịch vụ.',
    category: 'Hợp đồng',
    usageCount: 1450,
    isNew: true,
    isVip: false,
    fileUrl: '/templates/hop_dong_nhuong_quyen.html',
    thumbnail: '/thumbnails/franchise_agreement.png',
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
    fileUrl: '/templates/dang_ky_doanh_nghiep.html',
    thumbnail: '/thumbnails/business_registration.png',
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
          { key: 'capital', label: 'Vốn đầu tư (VND)', type: 'text', defaultValue: '500000000', required: true }
        ]
      },
      {
        section: 'Thông tin hồ sơ',
        inputs: [
          { key: 'signDate', label: 'Ngày lập đề nghị', type: 'date', defaultValue: '2026-06-19', required: true },
          { key: 'signLocation', label: 'Địa điểm lập', type: 'text', defaultValue: 'Đà Nẵng', required: true }
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
    fileUrl: '/templates/hop_dong_thue_van_phong.html',
    thumbnail: '/thumbnails/office_lease.png',
    fields: [
      {
        section: 'Thông tin bên cho thuê (Bên A)',
        inputs: [
          { key: 'lessorName', label: 'Tên tổ chức/cá nhân', type: 'text', defaultValue: 'Công ty Quản lý Bất động sản OfficeLand', required: true },
          { key: 'lessorAddress', label: 'Địa chỉ', type: 'text', defaultValue: '456 Lê Lợi, Hải Châu, Đà Nẵng', required: true }
        ]
      },
      {
        section: 'Thông tin bên thuê (Bên B)',
        inputs: [
          { key: 'fullName', label: 'Họ và tên bên thuê', type: 'text', defaultValue: 'Nguyễn Văn B', required: true },
          { key: 'idNumber', label: 'Số CCCD/CMND', type: 'text', defaultValue: '012345678910', required: true },
          { key: 'permanentAddress', label: 'Địa chỉ thường trú', type: 'text', defaultValue: 'Hải Châu, Đà Nẵng', required: true }
        ]
      },
      {
        section: 'Thông tin hợp đồng',
        inputs: [
          { key: 'contractNumber', label: 'Số hợp đồng', type: 'text', defaultValue: '01/2026/HĐTVP', required: true },
          { key: 'signDate', label: 'Ngày ký', type: 'date', defaultValue: '2026-06-18', required: true },
          { key: 'signLocation', label: 'Địa điểm ký', type: 'text', defaultValue: 'Đà Nẵng', required: true }
        ]
      },
      {
        section: 'Thông tin thuê văn phòng',
        inputs: [
          { key: 'area', label: 'Diện tích thuê (m2)', type: 'text', defaultValue: '150', required: true },
          { key: 'price', label: 'Giá thuê hàng tháng (VND)', type: 'text', defaultValue: '30000000', required: true },
          { key: 'rentPeriod', label: 'Thời hạn thuê (Tháng)', type: 'text', defaultValue: '24', required: true }
        ]
      }
    ]
  },
  {
    id: '4',
    title: 'Đơn xin nghỉ phép',
    description: 'Đơn xin nghỉ phép chuẩn dành cho nhân viên văn phòng, cán bộ công chức theo đúng quy định hành chính.',
    category: 'Hành chính',
    usageCount: 520,
    isNew: true,
    isVip: false,
    fileUrl: '/templates/don_xin_nghi_phep.html',
    thumbnail: '/thumbnails/leave_request.png',
    fields: [
      {
        section: 'Thông tin nhân viên',
        inputs: [
          { key: 'fullName', label: 'Họ và tên người viết đơn', type: 'text', defaultValue: 'Nguyễn Văn C', required: true },
          { key: 'department', label: 'Bộ phận/Phòng ban', type: 'text', defaultValue: 'Hành chính - Nhân sự', required: true },
          { key: 'position', label: 'Chức vụ', type: 'text', defaultValue: 'Chuyên viên', required: true }
        ]
      },
      {
        section: 'Thông tin nghỉ phép',
        inputs: [
          { key: 'startDate', label: 'Nghỉ từ ngày', type: 'date', defaultValue: '2026-06-20', required: true },
          { key: 'endDate', label: 'Đến hết ngày', type: 'date', defaultValue: '2026-06-22', required: true },
          { key: 'reason', label: 'Lý do xin nghỉ', type: 'text', defaultValue: 'Giải quyết công việc gia đình', required: true }
        ]
      },
      {
        section: 'Thông tin đơn',
        inputs: [
          { key: 'signDate', label: 'Ngày viết đơn', type: 'date', defaultValue: '2026-06-19', required: true },
          { key: 'signLocation', label: 'Địa điểm viết', type: 'text', defaultValue: 'Đà Nẵng', required: true }
        ]
      }
    ]
  },
  {
    id: '5',
    title: 'Biên bản bàn giao tài sản',
    description: 'Mẫu biên bản ghi nhận việc bàn giao tài sản, trang thiết bị giữa các cá nhân, bộ phận trong doanh nghiệp.',
    category: 'Biên bản',
    usageCount: 680,
    isNew: false,
    isVip: false,
    fileUrl: '/templates/bien_ban_ban_giao.html',
    thumbnail: '/thumbnails/asset_handover.png',
    fields: [
      {
        section: 'Thông tin bàn giao',
        inputs: [
          { key: 'contractNumber', label: 'Số biên bản', type: 'text', defaultValue: '05/BBBG', required: true },
          { key: 'handoverDate', label: 'Ngày bàn giao', type: 'date', defaultValue: '2026-06-16', required: true },
          { key: 'handoverLocation', label: 'Địa điểm bàn giao', type: 'text', defaultValue: 'Văn phòng Công ty, Tầng 5, Tòa nhà A', required: true }
        ]
      },
      {
        section: 'Bên bàn giao (Bên A)',
        inputs: [
          { key: 'senderName', label: 'Họ và tên người giao', type: 'text', defaultValue: 'Trần Văn D', required: true },
          { key: 'senderPosition', label: 'Chức vụ bên giao', type: 'text', defaultValue: 'Trưởng bộ phận Kho', required: true }
        ]
      },
      {
        section: 'Bên nhận bàn giao (Bên B)',
        inputs: [
          { key: 'receiverName', label: 'Họ và tên người nhận', type: 'text', defaultValue: 'Phạm Thị E', required: true },
          { key: 'receiverPosition', label: 'Chức vụ bên nhận', type: 'text', defaultValue: 'Nhân viên mới', required: true }
        ]
      },
      {
        section: 'Thông tin tài sản',
        inputs: [
          { key: 'assetName', label: 'Tên tài sản bàn giao', type: 'text', defaultValue: 'Laptop Dell Latitude 5420 kèm sạc', required: true },
          { key: 'assetStatus', label: 'Tình trạng tài sản', type: 'text', defaultValue: 'Mới 95%, hoạt động bình thường', required: true }
        ]
      }
    ]
  }
]
