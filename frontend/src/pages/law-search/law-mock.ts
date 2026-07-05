import { type Law } from '@/models/types/law.type'

export const MOCK_LAWS: Law[] = [
  {
    id: 'mock-1',
    title: 'Nghị định số 258/2026/NĐ-CP Quy định chi tiết một số điều về cơ chế, chính sách phát huy nguồn lực nhằm nâng cao hiệu quả hội nhập quốc tế theo Nghị quyết số 250/2025/QH15 của Quốc hội',
    content: 'Căn cứ Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam; Quốc hội ban hành Nghị quyết số 250/2025/QH15 về cơ chế, chính sách phát huy nguồn lực nhằm nâng cao hiệu quả hội nhập quốc tế. Nghị định này quy định về các biện pháp phát triển hạ tầng, xúc tiến đầu tư và thương mại, cùng cơ chế phối hợp liên ngành...',
    documentNumber: '258/2026/NĐ-CP',
    issuedDate: '2026-06-30',
    effectiveDate: '2026-07-01',
    status: 'ACTIVE',
    userId: 'user-1',
    createdAt: '2026-06-30T00:00:00Z',
    updatedAt: '2026-06-30T00:00:00Z',
    authorName: 'Chính phủ',
    sourceUrl: 'https://pdf.example.com/258-2026',
    officialUrl: 'https://official.example.com/258-2026',
    versions: [
      {
        id: 'mock-v1',
        lawId: 'mock-1',
        version: '1.0.0',
        title: 'Nghị định số 258/2026/NĐ-CP (Bản thảo sơ khởi)',
        content: 'Nội dung dự thảo ban đầu về cơ chế kích thích nguồn lực và khuyến khích mở rộng hoạt động tài chính quốc tế...',
        documentNumber: '258/2026/NĐ-CP',
        issuedDate: '2026-05-15',
        effectiveDate: '2026-06-01',
        sourceUrl: 'https://pdf.example.com/258-2026-draft',
        officialUrl: '',
        changeNote: 'Dự thảo lần 1 lấy ý kiến rộng rãi các bộ ngành',
        userId: 'user-1',
        authorName: 'Bộ Tư pháp',
        createdAt: '2026-05-15T00:00:00Z'
      }
    ]
  },
  {
    id: 'mock-2',
    title: 'Nghị định số 250/2026/NĐ-CP Quy định chi tiết về kỹ thuật trình bày văn bản hợp nhất',
    content: 'Nghị định này quy định chi tiết về nguyên tắc, kỹ thuật trình bày, quy trình thực hiện hợp nhất văn bản quy phạm pháp luật nhằm bảo đảm tính chính xác, kịp thời và thống nhất. Theo đó, các cơ quan ban hành có trách nhiệm thu thập thông tin và cập nhật các điều khoản sửa đổi bổ sung...',
    documentNumber: '250/2026/NĐ-CP',
    issuedDate: '2026-06-25',
    effectiveDate: '2026-07-01',
    status: 'ACTIVE',
    userId: 'user-1',
    createdAt: '2026-06-25T00:00:00Z',
    updatedAt: '2026-06-25T00:00:00Z',
    authorName: 'Chính phủ',
    sourceUrl: 'https://pdf.example.com/250-2026',
    versions: []
  },
  {
    id: 'mock-3',
    title: 'Nghị định số 262/2026/NĐ-CP Quy định về hoạt động báo chí của cơ quan báo chí nước ngoài, cơ quan đại diện nước ngoài, tổ chức nước ngoài tại Việt Nam',
    content: 'Căn cứ Luật Báo chí ngày 05 tháng 4 năm 2016; Căn cứ Luật Tiếp cận thông tin ngày 06 tháng 4 năm 2016; Chính phủ ban hành Nghị định quy định chi tiết hoạt động báo chí, thủ tục cấp phép văn phòng đại diện, tiêu chuẩn của phóng viên thường trú nước ngoài hoạt động tại lãnh thổ Việt Nam...',
    documentNumber: '262/2026/NĐ-CP',
    issuedDate: '2026-06-20',
    effectiveDate: '2026-07-01',
    status: 'ACTIVE',
    userId: 'user-1',
    createdAt: '2026-06-20T00:00:00Z',
    updatedAt: '2026-06-20T00:00:00Z',
    authorName: 'Chính phủ',
    sourceUrl: 'https://pdf.example.com/262-2026',
    versions: []
  },
  {
    id: 'mock-4',
    title: 'Thông tư số 35/2026/TT-BCT Quy định đặc điểm kinh tế - kỹ thuật đối với hàng hóa thuộc Danh mục hàng hóa, dịch vụ bình ổn giá, Danh mục hàng hóa, dịch vụ thực hiện kê khai giá do Bộ Công Thương quản lý',
    content: 'Thông tư này hướng dẫn về đặc điểm kinh tế - kỹ thuật đối với hàng hóa thuộc diện bình ổn giá và kê khai giá để các tổ chức, cá nhân thực hiện đăng ký và theo dõi biến động thị trường. Danh mục áp dụng bao gồm nguyên nhiên vật liệu thiết yếu và sản phẩm công nghiệp thiết yếu phục vụ đời sống...',
    documentNumber: '35/2026/TT-BCT',
    issuedDate: '2026-06-15',
    effectiveDate: '2026-08-17',
    status: 'INACTIVE',
    userId: 'user-2',
    createdAt: '2026-06-15T00:00:00Z',
    updatedAt: '2026-06-15T00:00:00Z',
    authorName: 'Bộ Công Thương',
    sourceUrl: 'https://pdf.example.com/35-2026',
    versions: []
  },
  {
    id: 'mock-5',
    title: 'Thông tư số 30/2026/TT-NHNN Sửa đổi, bổ sung một số điều của Thông tư số 13/2025/TT-NHNN quy định về quản lý và tổ chức thực hiện nhiệm vụ khoa học và công nghệ cấp bộ của Ngân hàng Nhà nước Việt Nam',
    content: 'Ngân hàng Nhà nước ban hành thông tư sửa đổi các tiêu chuẩn đánh giá, xét duyệt đề tài nghiên cứu khoa học cấp bộ nhằm phục vụ tốt hơn sự phát triển của hệ thống ngân hàng. Sửa đổi chi tiết về thủ tục giải ngân và nghiệm thu đề tài...',
    documentNumber: '30/2026/TT-NHNN',
    issuedDate: '2026-06-10',
    effectiveDate: '2026-07-01',
    status: 'ACTIVE',
    userId: 'user-3',
    createdAt: '2026-06-10T00:00:00Z',
    updatedAt: '2026-06-10T00:00:00Z',
    authorName: 'Ngân hàng Nhà nước',
    sourceUrl: 'https://pdf.example.com/30-2026',
    versions: []
  }
]
