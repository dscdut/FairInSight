type Template = {
  id: string
  title: string
  description: string
  category: string
  usageCount: number
  isNew: boolean
  isVip: boolean
  thumbnail?: string
}

export const mockTemplates: Template[] = [
  {
    id: '1',
    title: 'Hợp đồng thỏa thuận',
    description: 'Hợp đồng thoả thuận giá trị được hiểu là thống nhất ý chí trên cơ sở tự nguyện về việc xác nhận .',
    category: 'Hợp đồng',
    usageCount: 1200,
    isNew: true,
    isVip: true,
    thumbnail: '/contract.png'
  },
  {
    id: '2',
    title: 'Hợp đồng thỏa thuận',
    description: 'Tìm và chọn mẫu hợp đồng pháp lý để bắt đầu soạn thảo.',
    category: 'Hợp đồng',
    usageCount: 1200,
    isNew: false,
    isVip: false,
    thumbnail: '/contract.png'
  },
  {
    id: '3',
    title: 'Biểu mẫu hợp đồng',
    description: 'Tìm và chọn mẫu hợp đồng pháp lý để bắt đầu soạn thảo.',
    category: 'Hợp đồng',
    usageCount: 1200,
    isNew: true,
    isVip: true,
    thumbnail: '/contract.png'
  },
  {
    id: '4',
    title: 'Biểu mẫu hợp đồng',
    description: 'Tìm và chọn mẫu hợp đồng pháp lý để bắt đầu soạn thảo.',
    category: 'Hợp đồng',
    usageCount: 1200,
    isNew: false,
    isVip: true,
    thumbnail: '/contract.png'
  },
  {
    id: '5',
    title: 'Biểu mẫu hợp đồng',
    description: 'Tìm và chọn mẫu hợp đồng pháp lý để bắt đầu soạn thảo.',
    category: 'Hợp đồng',
    usageCount: 950,
    isNew: true,
    isVip: false,
    thumbnail: '/contract.png'
  },
  {
    id: '6',
    title: 'Biểu mẫu hợp đồng',
    description: 'Tìm và chọn mẫu hợp đồng pháp lý để bắt đầu soạn thảo.',
    category: 'Hợp đồng',
    usageCount: 1100,
    isNew: false,
    isVip: false,
    thumbnail: '/contract.png'
  },
  {
    id: '7',
    title: 'Biểu mẫu hợp đồng',
    description: 'Tìm và chọn mẫu hợp đồng pháp lý để bắt đầu soạn thảo.',
    category: 'Hợp đồng',
    usageCount: 850,
    isNew: false,
    isVip: true,
    thumbnail: '/contract.png'
  },
  {
    id: '8',
    title: 'Biểu mẫu hợp đồng',
    description: 'Tìm và chọn mẫu hợp đồng pháp lý để bắt đầu soạn thảo.',
    category: 'Hợp đồng',
    usageCount: 1350,
    isNew: true,
    isVip: true,
    thumbnail: '/contract.png'
  }
]
