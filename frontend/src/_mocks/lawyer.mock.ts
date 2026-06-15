import { type Lawyer } from '@/models/types/case.types'

export const MOCK_LAWYERS_BY_CATEGORY: Record<string, Lawyer[]> = {
  'Hôn nhân và gia đình': [
    {
      id: 'lyr-hngd-1',
      name: 'Lê Thị Lan',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lan',
      specialty: 'Hôn nhân & Gia đình (Tranh chấp tài sản, giành quyền nuôi con)'
    },
    {
      id: 'lyr-hngd-2',
      name: 'Trần Minh Hoàng',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hoang',
      specialty: 'Tư vấn ly hôn & thỏa thuận phân chia tài sản'
    }
  ],
  'Đất đai': [
    {
      id: 'lyr-dd-1',
      name: 'Nguyễn Văn Luật',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer1',
      specialty: 'Tranh chấp Đất đai, Giải phóng mặt bằng & Đền bù giải tỏa'
    },
    {
      id: 'lyr-dd-2',
      name: 'Phạm Thanh Hải',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hai',
      specialty: 'Thủ tục cấp sổ đỏ & chuyển đổi mục đích sử dụng đất đai'
    }
  ],
  'Hình sự': [
    {
      id: 'lyr-hs-1',
      name: 'Phạm Văn Tiến',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Huy',
      specialty: 'Bào chữa hình sự các vụ án Kinh tế, Chức vụ & Dân sự'
    },
    {
      id: 'lyr-hs-2',
      name: 'Phạm Như Quỳnh',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mai',
      specialty: 'Tham gia tố tụng bào chữa & bảo vệ quyền lợi hợp pháp'
    },
    {
      id: 'lyr-hs-3',
      name: 'Phạm Như Quỳnh',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mai',
      specialty: 'Tham gia tố tụng bào chữa & bảo vệ quyền lợi hợp pháp'
    },
    {
      id: 'lyr-hs-4',
      name: 'Phạm Như Quỳnh',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mai',
      specialty: 'Tham gia tố tụng bào chữa & bảo vệ quyền lợi hợp pháp'
    }
  ],
  'Dân sự': [
    {
      id: 'lyr-ds-1',
      name: 'Lê Thị Pháp',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer2',
      specialty: 'Tư vấn Thừa kế, Hợp đồng Dân sự & Đòi bồi thường thiệt hại'
    },
    {
      id: 'lyr-ds-2',
      name: 'Đỗ Văn Sơn',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Son',
      specialty: 'Đại diện ủy quyền giải quyết các vụ việc tranh chấp dân sự'
    }
  ],
  'Lao động': [
    {
      id: 'lyr-ld-1',
      name: 'Nguyễn Thị Thu',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thu',
      specialty: 'Tranh chấp lao động, sa thải trái luật & chế độ bảo hiểm, trợ cấp'
    },
    {
      id: 'lyr-ld-2',
      name: 'Hoàng Văn Nam',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nam',
      specialty: 'Tư vấn soạn thảo hợp đồng lao động & nội quy doanh nghiệp'
    }
  ],
  'Doanh nghiệp': [
    {
      id: 'lyr-dn-1',
      name: 'Ngô Quốc Doanh',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Doanh',
      specialty: 'Tư vấn thành lập doanh nghiệp, M&A & Tranh chấp thương mại doanh nghiệp'
    },
    {
      id: 'lyr-dn-2',
      name: 'Trịnh Đình Kiên',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kien',
      specialty: 'Pháp chế doanh nghiệp thường xuyên & Soạn thảo hợp đồng thương mại'
    }
  ],
  'Tôi không chắc lĩnh vực': [
    {
      id: 'lyr-chung-1',
      name: 'Nguyễn Văn Luật',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer1',
      specialty: 'Tư vấn pháp lý đa lĩnh vực & định hướng thủ tục tranh tụng'
    },
    {
      id: 'lyr-chung-2',
      name: 'Lê Thị Pháp',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer2',
      specialty: 'Đại diện ủy quyền giải quyết các thủ tục hành chính, dân sự'
    }
  ]
}