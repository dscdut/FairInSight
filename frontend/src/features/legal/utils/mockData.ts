import type { LegalDocument, TocItem } from '../types'

export const MOCK_LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: '1',
    title: 'Luật Đất đai (Sửa đổi) 2024',
    code: '31/2024/QH15',
    summary: 'Căn cứ Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam; Quốc hội ban hành Luật Đất đai. Chương I: Quy định chung. Điều 1. Phạm vi điều chỉnh. Luật Đất đai 2024 quy định về chế độ sở hữu đất đai, quyền hạn và trách nhiệm của Nhà nước đại diện chủ sở hữu toàn dân về đất đai...',
    documentType: 'law',
    issuingAgency: 'Quốc hội',
    issueDate: '2024-01-18',
    effectiveDate: '2025-01-01',
    updatedDate: '2024-07-03',
    status: 'ACTIVE',
    categories: ['Dân sự', 'Tài nguyên', 'Bất động sản'],
    content: '',
    viewCount: 15420,
    isBookmarked: false,
  },
  {
    id: '2',
    title: 'Thông tư quy định về hồ sơ địa chính, Giấy chứng nhận quyền sử dụng đất',
    code: '10/2024/TT-BTNMT',
    summary: 'Hướng dẫn thi hành một số điều của luật đất đai 2024 về trình tự, thủ tục đăng ký đất đai, tài sản gắn liền với đất, cấp Giấy chứng nhận quyền sử dụng đất, quyền sở hữu nhà ở và tài sản khác gắn liền với đất lần đầu...',
    documentType: 'circular',
    issuingAgency: 'Bộ Tài nguyên và Môi trường',
    issueDate: '2024-02-15',
    effectiveDate: '2024-04-01',
    updatedDate: '2024-06-10',
    status: 'ACTIVE',
    categories: ['Hành chính', 'Sổ đỏ'],
    content: '',
    viewCount: 8230,
    isBookmarked: true,
  },
  {
    id: '3',
    title: 'Nghị định 258/2026/NĐ-CP Quy định chi tiết một số điều về cơ chế, chính sách phát huy nguồn lực nhằm nâng cao hiệu quả hội nhập quốc tế',
    code: '258/2026/NĐ-CP',
    summary: 'Quy định chi tiết một số điều về cơ chế, chính sách phát huy nguồn lực nhằm nâng cao hiệu quả hội nhập quốc tế theo Nghị quyết số 250/2025/QH15 của Quốc hội.',
    documentType: 'decree',
    issuingAgency: 'Chính phủ',
    issueDate: '2026-06-30',
    effectiveDate: '2026-07-01',
    updatedDate: '2026-07-03',
    status: 'ACTIVE',
    categories: ['Doanh nghiệp', 'Hội nhập'],
    content: '',
    viewCount: 3210,
    isBookmarked: false,
  },
  {
    id: '4',
    title: 'Luật Doanh nghiệp 2020',
    code: '59/2020/QH14',
    summary: 'Luật này quy định về việc thành lập, tổ chức quản lý, tổ chức lại, giải thể và hoạt động có liên quan của doanh nghiệp trong đó có công ty trách nhiệm hữu hạn, công ty cổ phần, công ty hợp danh và doanh nghiệp tư nhân.',
    documentType: 'law',
    issuingAgency: 'Quốc hội',
    issueDate: '2020-06-17',
    effectiveDate: '2021-01-01',
    updatedDate: '2022-09-01',
    status: 'ACTIVE',
    categories: ['Doanh nghiệp', 'Thương mại'],
    content: '',
    viewCount: 24500,
    isBookmarked: false,
  },
  {
    id: '5',
    title: 'Bộ luật Lao động 2019',
    code: '45/2019/QH14',
    summary: 'Bộ luật này quy định tiêu chuẩn lao động; quyền, nghĩa vụ, trách nhiệm của người lao động, người sử dụng lao động, tổ chức đại diện người lao động tại cơ sở, tổ chức đại diện người sử dụng lao động trong quan hệ lao động...',
    documentType: 'law',
    issuingAgency: 'Quốc hội',
    issueDate: '2019-11-20',
    effectiveDate: '2021-01-01',
    updatedDate: '2021-04-01',
    status: 'ACTIVE',
    categories: ['Lao động'],
    content: '',
    viewCount: 18900,
    isBookmarked: false,
  },
  {
    id: '6',
    title: 'Nghị định 10/2022/NĐ-CP quy định về lệ phí trước bạ',
    code: '10/2022/NĐ-CP',
    summary: 'Nghị định này quy định đối tượng chịu lệ phí trước bạ, đối tượng không chịu lệ phí trước bạ, người nộp lệ phí trước bạ, căn cứ tính lệ phí trước bạ, khai, nộp lệ phí trước bạ và miễn lệ phí trước bạ.',
    documentType: 'decree',
    issuingAgency: 'Chính phủ',
    issueDate: '2022-01-15',
    effectiveDate: '2022-03-01',
    updatedDate: '2023-08-01',
    status: 'ACTIVE',
    categories: ['Thuế', 'Tài chính'],
    content: '',
    viewCount: 6750,
    isBookmarked: false,
  },
  {
    id: '7',
    title: 'Luật Bảo vệ môi trường 2020',
    code: '72/2020/QH14',
    summary: 'Luật này quy định về hoạt động bảo vệ môi trường; quyền, nghĩa vụ và trách nhiệm của cơ quan, tổ chức, hộ gia đình, cá nhân trong hoạt động bảo vệ môi trường.',
    documentType: 'law',
    issuingAgency: 'Quốc hội',
    issueDate: '2020-11-17',
    effectiveDate: '2022-01-01',
    updatedDate: '2022-06-01',
    status: 'ACTIVE',
    categories: ['Môi trường'],
    content: '',
    viewCount: 11200,
    isBookmarked: false,
  },
  {
    id: '8',
    title: 'Thông tư 80/2021/TT-BTC hướng dẫn thi hành Luật Quản lý thuế',
    code: '80/2021/TT-BTC',
    summary: 'Thông tư này hướng dẫn thi hành một số điều của Luật Quản lý thuế ngày 13 tháng 6 năm 2019 và Nghị định số 126/2020/NĐ-CP ngày 19 tháng 10 năm 2020 của Chính phủ.',
    documentType: 'circular',
    issuingAgency: 'Bộ Tài chính',
    issueDate: '2021-09-29',
    effectiveDate: '2021-11-15',
    updatedDate: '2022-01-01',
    status: 'ACTIVE',
    categories: ['Thuế'],
    content: '',
    viewCount: 9100,
    isBookmarked: false,
  },
  {
    id: '9',
    title: 'Bộ luật Hình sự 2015 (sửa đổi, bổ sung 2017)',
    code: '100/2015/QH13',
    summary: 'Bộ luật Hình sự quy định về tội phạm và hình phạt. Chỉ người nào phạm một tội đã được Bộ luật Hình sự quy định mới phải chịu trách nhiệm hình sự.',
    documentType: 'law',
    issuingAgency: 'Quốc hội',
    issueDate: '2015-11-27',
    effectiveDate: '2018-01-01',
    updatedDate: '2019-05-01',
    status: 'ACTIVE',
    categories: ['Hình sự'],
    content: '',
    viewCount: 32100,
    isBookmarked: false,
  },
  {
    id: '10',
    title: 'Nghị định 123/2020/NĐ-CP quy định về hóa đơn, chứng từ',
    code: '123/2020/NĐ-CP',
    summary: 'Nghị định này quy định về hóa đơn khi bán hàng hóa, cung cấp dịch vụ; chứng từ khi thực hiện các thủ tục thuế; quản lý, sử dụng hóa đơn, chứng từ của cơ quan thuế.',
    documentType: 'decree',
    issuingAgency: 'Chính phủ',
    issueDate: '2020-10-19',
    effectiveDate: '2022-07-01',
    updatedDate: '2022-07-01',
    status: 'REPLACED',
    categories: ['Thuế', 'Kế toán'],
    content: '',
    viewCount: 7800,
    isBookmarked: false,
  },
  {
    id: '11',
    title: 'Luật Nhà ở 2023',
    code: '27/2023/QH15',
    summary: 'Luật này quy định về sở hữu nhà ở; phát triển, quản lý, sử dụng nhà ở; giao dịch về nhà ở; quản lý nhà nước về nhà ở tại Việt Nam.',
    documentType: 'law',
    issuingAgency: 'Quốc hội',
    issueDate: '2023-11-27',
    effectiveDate: '2025-01-01',
    updatedDate: '2024-01-10',
    status: 'ACTIVE',
    categories: ['Dân sự', 'Bất động sản'],
    content: '',
    viewCount: 19200,
    isBookmarked: false,
  },
  {
    id: '12',
    title: 'Nghị định 96/2022/NĐ-CP quy định chức năng, nhiệm vụ, quyền hạn của Bộ Tài chính',
    code: '96/2022/NĐ-CP',
    summary: 'Nghị định này quy định chức năng, nhiệm vụ, quyền hạn và cơ cấu tổ chức của Bộ Tài chính.',
    documentType: 'decree',
    issuingAgency: 'Chính phủ',
    issueDate: '2022-11-29',
    effectiveDate: '2022-11-29',
    updatedDate: '2023-02-01',
    status: 'ACTIVE',
    categories: ['Hành chính', 'Tài chính'],
    content: '',
    viewCount: 4300,
    isBookmarked: false,
  },
  {
    id: '13',
    title: 'Luật Kinh doanh bảo hiểm 2022',
    code: '08/2022/QH15',
    summary: 'Luật này quy định về tổ chức và hoạt động kinh doanh bảo hiểm; quyền và nghĩa vụ của tổ chức, cá nhân tham gia bảo hiểm; quản lý nhà nước về kinh doanh bảo hiểm.',
    documentType: 'law',
    issuingAgency: 'Quốc hội',
    issueDate: '2022-06-16',
    effectiveDate: '2023-01-01',
    updatedDate: '2023-04-01',
    status: 'ACTIVE',
    categories: ['Doanh nghiệp', 'Tài chính'],
    content: '',
    viewCount: 6100,
    isBookmarked: false,
  },
  {
    id: '14',
    title: 'Thông tư 06/2023/TT-NHNN hướng dẫn về hoạt động cho vay',
    code: '06/2023/TT-NHNN',
    summary: 'Thông tư này quy định về hoạt động cho vay của tổ chức tín dụng, chi nhánh ngân hàng nước ngoài đối với khách hàng.',
    documentType: 'circular',
    issuingAgency: 'Ngân hàng Nhà nước',
    issueDate: '2023-06-28',
    effectiveDate: '2023-09-01',
    updatedDate: '2023-09-15',
    status: 'ACTIVE',
    categories: ['Tài chính', 'Ngân hàng'],
    content: '',
    viewCount: 8900,
    isBookmarked: false,
  },
  {
    id: '15',
    title: 'Luật Phòng, chống rửa tiền 2022',
    code: '14/2022/QH15',
    summary: 'Luật này quy định về các biện pháp phòng ngừa, phát hiện, ngăn chặn, xử lý tổ chức, cá nhân có hành vi rửa tiền; trách nhiệm của cơ quan, tổ chức, cá nhân trong phòng, chống rửa tiền.',
    documentType: 'law',
    issuingAgency: 'Quốc hội',
    issueDate: '2022-11-15',
    effectiveDate: '2023-03-01',
    updatedDate: '2023-03-01',
    status: 'ACTIVE',
    categories: ['Tài chính', 'Hành chính'],
    content: '',
    viewCount: 5400,
    isBookmarked: false,
  },
  {
    id: '16',
    title: 'Nghị định 63/2019/NĐ-CP quy định xử phạt vi phạm hành chính trong lĩnh vực quản lý, sử dụng tài sản công',
    code: '63/2019/NĐ-CP',
    summary: 'Nghị định quy định về hành vi vi phạm hành chính, hình thức xử phạt, mức xử phạt, biện pháp khắc phục hậu quả trong lĩnh vực quản lý, sử dụng tài sản công.',
    documentType: 'decree',
    issuingAgency: 'Chính phủ',
    issueDate: '2019-07-15',
    effectiveDate: '2019-09-01',
    updatedDate: '2020-01-01',
    status: 'ACTIVE',
    categories: ['Hành chính', 'Tài chính'],
    content: '',
    viewCount: 3800,
    isBookmarked: false,
  },
  {
    id: '17',
    title: 'Luật Giao dịch điện tử 2023',
    code: '20/2023/QH15',
    summary: 'Luật này quy định về giao dịch điện tử trong hoạt động của cơ quan nhà nước; trong lĩnh vực dân sự, kinh doanh, thương mại và các lĩnh vực khác.',
    documentType: 'law',
    issuingAgency: 'Quốc hội',
    issueDate: '2023-06-22',
    effectiveDate: '2024-07-01',
    updatedDate: '2024-01-15',
    status: 'ACTIVE',
    categories: ['Dân sự', 'Công nghệ'],
    content: '',
    viewCount: 12600,
    isBookmarked: false,
  },
  {
    id: '18',
    title: 'Thông tư 23/2023/TT-BTC hướng dẫn chế độ quản lý, tính hao mòn tài sản cố định',
    code: '23/2023/TT-BTC',
    summary: 'Thông tư này hướng dẫn chế độ quản lý, tính hao mòn, khấu hao tài sản cố định tại các cơ quan, tổ chức, đơn vị và tài sản cố định do Nhà nước giao.',
    documentType: 'circular',
    issuingAgency: 'Bộ Tài chính',
    issueDate: '2023-04-25',
    effectiveDate: '2023-06-10',
    updatedDate: '2023-06-10',
    status: 'ACTIVE',
    categories: ['Kế toán', 'Tài chính'],
    content: '',
    viewCount: 2900,
    isBookmarked: false,
  },
  {
    id: '19',
    title: 'Nghị quyết 68/NQ-CP về một số chính sách hỗ trợ người lao động và người sử dụng lao động',
    code: '68/NQ-CP',
    summary: 'Nghị quyết ban hành một số chính sách hỗ trợ người lao động và người sử dụng lao động gặp khó khăn do đại dịch COVID-19.',
    documentType: 'resolution',
    issuingAgency: 'Chính phủ',
    issueDate: '2021-07-01',
    effectiveDate: '2021-07-01',
    updatedDate: '2021-12-31',
    status: 'EXPIRED',
    categories: ['Lao động'],
    content: '',
    viewCount: 21000,
    isBookmarked: false,
  },
  {
    id: '20',
    title: 'Luật An ninh mạng 2018',
    code: '24/2018/QH14',
    summary: 'Luật này quy định về hoạt động bảo vệ an ninh quốc gia và bảo đảm trật tự, an toàn xã hội trên không gian mạng; trách nhiệm của cơ quan, tổ chức, cá nhân có liên quan.',
    documentType: 'law',
    issuingAgency: 'Quốc hội',
    issueDate: '2018-06-12',
    effectiveDate: '2019-01-01',
    updatedDate: '2019-01-01',
    status: 'ACTIVE',
    categories: ['Hành chính', 'Công nghệ'],
    content: '',
    viewCount: 16700,
    isBookmarked: false,
  },
  {
    id: '21',
    title: 'Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân',
    code: '13/2023/NĐ-CP',
    summary: 'Nghị định này quy định về bảo vệ dữ liệu cá nhân; trách nhiệm bảo vệ dữ liệu cá nhân của cơ quan, tổ chức, cá nhân có liên quan đến hoạt động xử lý dữ liệu cá nhân.',
    documentType: 'decree',
    issuingAgency: 'Chính phủ',
    issueDate: '2023-04-17',
    effectiveDate: '2023-07-01',
    updatedDate: '2023-07-01',
    status: 'ACTIVE',
    categories: ['Hành chính', 'Công nghệ'],
    content: '',
    viewCount: 13400,
    isBookmarked: false,
  },
  {
    id: '22',
    title: 'Luật Cạnh tranh 2018',
    code: '23/2018/QH14',
    summary: 'Luật này quy định về hành vi hạn chế cạnh tranh, tập trung kinh tế gây tác động hoặc có khả năng gây tác động hạn chế cạnh tranh đến thị trường Việt Nam.',
    documentType: 'law',
    issuingAgency: 'Quốc hội',
    issueDate: '2018-06-12',
    effectiveDate: '2019-07-01',
    updatedDate: '2020-01-01',
    status: 'ACTIVE',
    categories: ['Doanh nghiệp', 'Thương mại'],
    content: '',
    viewCount: 7200,
    isBookmarked: false,
  },
  {
    id: '23',
    title: 'Thông tư 45/2021/TT-BTC hướng dẫn chế độ tài chính trong hoạt động đấu thầu',
    code: '45/2021/TT-BTC',
    summary: 'Thông tư này hướng dẫn về lập kế hoạch, quản lý và sử dụng kinh phí trong hoạt động đấu thầu và lựa chọn nhà thầu.',
    documentType: 'circular',
    issuingAgency: 'Bộ Tài chính',
    issueDate: '2021-06-18',
    effectiveDate: '2021-08-05',
    updatedDate: '2022-01-01',
    status: 'ACTIVE',
    categories: ['Tài chính', 'Hành chính'],
    content: '',
    viewCount: 3100,
    isBookmarked: false,
  },
  {
    id: '24',
    title: 'Luật Đấu thầu 2023',
    code: '22/2023/QH15',
    summary: 'Luật này quy định về quản lý nhà nước đối với hoạt động đấu thầu; quyền, nghĩa vụ và trách nhiệm của cơ quan, tổ chức, cá nhân trong hoạt động đấu thầu.',
    documentType: 'law',
    issuingAgency: 'Quốc hội',
    issueDate: '2023-06-22',
    effectiveDate: '2024-01-01',
    updatedDate: '2023-12-01',
    status: 'ACTIVE',
    categories: ['Hành chính', 'Tài chính'],
    content: '',
    viewCount: 9800,
    isBookmarked: false,
  },
  {
    id: '25',
    title: 'Nghị quyết 43/2022/QH15 về chính sách tài khóa, tiền tệ hỗ trợ phục hồi kinh tế',
    code: '43/2022/QH15',
    summary: 'Chính sách tài khóa, tiền tệ hỗ trợ Chương trình phục hồi và phát triển kinh tế - xã hội giai đoạn 2022-2023.',
    documentType: 'resolution',
    issuingAgency: 'Quốc hội',
    issueDate: '2022-01-11',
    effectiveDate: '2022-01-11',
    updatedDate: '2022-06-01',
    status: 'EXPIRED',
    categories: ['Tài chính', 'Kinh tế'],
    content: '',
    viewCount: 17500,
    isBookmarked: false,
  },
  {
    id: '26',
    title: 'Luật Điện lực 2004 (sửa đổi, bổ sung 2022)',
    code: '28/2004/QH11',
    summary: 'Luật Điện lực quy định hoạt động điện lực và sử dụng điện; quyền và nghĩa vụ của tổ chức, cá nhân hoạt động điện lực và sử dụng điện.',
    documentType: 'law',
    issuingAgency: 'Quốc hội',
    issueDate: '2004-12-03',
    effectiveDate: '2005-07-01',
    updatedDate: '2022-03-01',
    status: 'ACTIVE',
    categories: ['Môi trường', 'Kinh tế'],
    content: '',
    viewCount: 8100,
    isBookmarked: false,
  },
  {
    id: '27',
    title: 'Nghị định 71/2019/NĐ-CP quy định xử phạt vi phạm hành chính trong lĩnh vực hóa chất và vật liệu nổ công nghiệp',
    code: '71/2019/NĐ-CP',
    summary: 'Nghị định quy định về vi phạm hành chính, hình thức xử phạt, mức xử phạt, thẩm quyền lập biên bản và thẩm quyền xử phạt trong lĩnh vực hóa chất.',
    documentType: 'decree',
    issuingAgency: 'Chính phủ',
    issueDate: '2019-08-30',
    effectiveDate: '2019-10-15',
    updatedDate: '2020-01-01',
    status: 'ACTIVE',
    categories: ['Môi trường', 'Hành chính'],
    content: '',
    viewCount: 2700,
    isBookmarked: false,
  },
  {
    id: '28',
    title: 'Luật Bảo hiểm xã hội 2014 (sửa đổi 2024)',
    code: '58/2014/QH13',
    summary: 'Luật này quy định về chế độ, chính sách bảo hiểm xã hội; quyền và trách nhiệm của người lao động, người sử dụng lao động; tổ chức bảo hiểm xã hội.',
    documentType: 'law',
    issuingAgency: 'Quốc hội',
    issueDate: '2014-11-20',
    effectiveDate: '2016-01-01',
    updatedDate: '2024-06-01',
    status: 'ACTIVE',
    categories: ['Lao động'],
    content: '',
    viewCount: 27300,
    isBookmarked: false,
  },
  {
    id: '29',
    title: 'Thông tư 19/2021/TT-BYT hướng dẫn phòng và kiểm soát lây nhiễm SARS-CoV-2',
    code: '19/2021/TT-BYT',
    summary: 'Thông tư hướng dẫn phòng và kiểm soát lây nhiễm SARS-CoV-2 trong cơ sở khám bệnh, chữa bệnh.',
    documentType: 'circular',
    issuingAgency: 'Bộ Y tế',
    issueDate: '2021-11-16',
    effectiveDate: '2021-11-16',
    updatedDate: '2022-03-01',
    status: 'EXPIRED',
    categories: ['Hành chính', 'Y tế'],
    content: '',
    viewCount: 14200,
    isBookmarked: false,
  },
  {
    id: '30',
    title: 'Nghị định 132/2020/NĐ-CP quy định về quản lý thuế đối với doanh nghiệp có giao dịch liên kết',
    code: '132/2020/NĐ-CP',
    summary: 'Nghị định quy định nguyên tắc, phương pháp, trình tự, thủ tục xác định giá giao dịch liên kết; quyền, nghĩa vụ của người nộp thuế và cơ quan thuế.',
    documentType: 'decree',
    issuingAgency: 'Chính phủ',
    issueDate: '2020-11-05',
    effectiveDate: '2020-12-20',
    updatedDate: '2021-03-01',
    status: 'ACTIVE',
    categories: ['Thuế', 'Doanh nghiệp'],
    content: '',
    viewCount: 9500,
    isBookmarked: false,
  },
]

export const MOCK_DOCUMENT_DETAIL: LegalDocument = {
  id: '1',
  title: 'Luật Đất đai (Sửa đổi) 2024',
  code: '31/2024/QH15',
  summary: 'Luật Đất đai 2024 quy định về chế độ sở hữu đất đai, quyền hạn và trách nhiệm của Nhà nước đại diện chủ sở hữu toàn dân về đất đai.',
  documentType: 'law',
  issuingAgency: 'Quốc hội',
  issueDate: '2024-01-18',
  effectiveDate: '2025-01-01',
  updatedDate: '2024-07-03',
  status: 'ACTIVE',
  categories: ['Dân sự', 'Tài nguyên', 'Bất động sản'],
  content: `
<div class="legal-document">
  <div class="document-header-official">
    <div class="issuing-authority">
      <p><strong>QUỐC HỘI</strong></p>
      <p>__________</p>
    </div>
    <div class="national-header">
      <p><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></p>
      <p>Độc lập - Tự do - Hạnh phúc</p>
      <p>__________________________</p>
    </div>
  </div>
  <div class="document-number">
    <p>Số: 31/2024/QH15</p>
    <p><em>Hà Nội, ngày 18 tháng 01 năm 2024</em></p>
  </div>
  <div class="document-title-official">
    <h2>LUẬT</h2>
    <h3>ĐẤT ĐAI</h3>
  </div>
  <div id="chapter-1" class="chapter">
    <h3>Chương I</h3>
    <h4>NHỮNG QUY ĐỊNH CHUNG</h4>
    <div id="article-1" class="article">
      <h4>Điều 1. Phạm vi điều chỉnh</h4>
      <p>Luật này quy định về chế độ sở hữu đất đai, quyền hạn và trách nhiệm của Nhà nước đại diện chủ sở hữu toàn dân về đất đai và thống nhất quản lý về đất đai; quyền và nghĩa vụ của người sử dụng đất đối với đất đai thuộc lãnh thổ của nước Cộng hòa xã hội chủ nghĩa Việt Nam.</p>
    </div>
    <div id="article-2" class="article">
      <h4>Điều 2. Giải thích từ ngữ</h4>
      <p>Trong Luật này, các từ ngữ dưới đây được hiểu như sau:</p>
      <div id="clause-1" class="clause">
        <p><strong>1.</strong> Nhà nước đại diện chủ sở hữu là Nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam thực hiện quyền của chủ sở hữu đối với đất đai thông qua các cơ quan nhà nước có thẩm quyền.</p>
      </div>
      <div id="clause-2" class="clause">
        <p><strong>2.</strong> Quyền sử dụng đất là quyền của người sử dụng đất được thực hiện các quyền theo quy định của Luật này và quy định khác của pháp luật có liên quan.</p>
      </div>
      <div id="clause-3" class="clause">
        <p><strong>3.</strong> Thửa đất là phần diện tích đất được giới hạn bởi các ranh giới xác định trên thực địa hoặc được mô tả trên hồ sơ.</p>
      </div>
    </div>
    <div id="article-3" class="article">
      <h4>Điều 3. Nguyên tắc quản lý, sử dụng đất</h4>
      <div id="clause-3-1" class="clause">
        <p><strong>1.</strong> Đất đai thuộc sở hữu toàn dân do Nhà nước đại diện chủ sở hữu và thống nhất quản lý.</p>
      </div>
      <div id="clause-3-2" class="clause">
        <p><strong>2.</strong> Nhà nước thực hiện quyền đại diện chủ sở hữu thông qua quyết định quy hoạch sử dụng đất, kế hoạch sử dụng đất; thu hồi đất; cho phép chuyển mục đích sử dụng đất; quyết định giá đất; trao quyền sử dụng đất cho người sử dụng đất.</p>
      </div>
    </div>
  </div>
  <div id="chapter-2" class="chapter">
    <h3>Chương II</h3>
    <h4>QUYỀN VÀ NGHĨA VỤ CỦA NHÀ NƯỚC ĐỐI VỚI ĐẤT ĐAI</h4>
    <div id="article-4" class="article">
      <h4>Điều 4. Quyền của Nhà nước đại diện chủ sở hữu về đất đai</h4>
      <div id="clause-4-1" class="clause">
        <p><strong>1.</strong> Quyết định quy hoạch sử dụng đất, kế hoạch sử dụng đất.</p>
      </div>
      <div id="clause-4-2" class="clause">
        <p><strong>2.</strong> Quyết định mục đích sử dụng đất thông qua việc quyết định, xét duyệt quy hoạch sử dụng đất, kế hoạch sử dụng đất.</p>
      </div>
      <div id="clause-4-3" class="clause">
        <p><strong>3.</strong> Quy định về hạn mức giao đất và thời hạn sử dụng đất.</p>
      </div>
      <div id="clause-4-4" class="clause">
        <p><strong>4.</strong> Quyết định thu hồi đất, trưng dụng đất.</p>
      </div>
      <div id="clause-4-5" class="clause">
        <p><strong>5.</strong> Quyết định giá đất.</p>
      </div>
    </div>
    <div id="article-5" class="article">
      <h4>Điều 5. Nghĩa vụ của Nhà nước đối với người sử dụng đất</h4>
      <div id="clause-5-1" class="clause">
        <p><strong>1.</strong> Tổ chức thực hiện việc đo đạc, lập bản đồ địa chính, đăng ký, lập và quản lý hồ sơ địa chính, cấp Giấy chứng nhận quyền sử dụng đất, quyền sở hữu nhà ở và tài sản khác gắn liền với đất.</p>
      </div>
      <div id="clause-5-2" class="clause">
        <p><strong>2.</strong> Bảo đảm cho người sử dụng đất được hưởng đầy đủ các quyền lợi hợp pháp trên đất được giao, được thuê.</p>
      </div>
    </div>
  </div>
  <div id="chapter-3" class="chapter">
    <h3>Chương III</h3>
    <h4>QUY HOẠCH VÀ KẾ HOẠCH SỬ DỤNG ĐẤT</h4>
    <div id="article-6" class="article">
      <h4>Điều 6. Nguyên tắc quy hoạch, kế hoạch sử dụng đất</h4>
      <p>Quy hoạch, kế hoạch sử dụng đất phải đáp ứng các yêu cầu sau đây:</p>
      <div id="clause-6-1" class="clause">
        <p><strong>1.</strong> Phù hợp với chiến lược, quy hoạch tổng thể phát triển kinh tế - xã hội, quốc phòng, an ninh của từng vùng và cả nước.</p>
      </div>
      <div id="clause-6-2" class="clause">
        <p><strong>2.</strong> Được lập từ tổng thể đến chi tiết; quy hoạch sử dụng đất của cấp dưới phải phù hợp với quy hoạch sử dụng đất của cấp trên.</p>
      </div>
    </div>
  </div>
</div>
`,
  viewCount: 15420,
  isBookmarked: false,
}

export const MOCK_TOC: TocItem[] = [
  {
    id: 'chapter-1',
    label: 'Chương I',
    level: 'chapter',
    children: [
      {
        id: 'article-1',
        label: 'Điều 1',
        level: 'article',
        children: [],
      },
      {
        id: 'article-2',
        label: 'Điều 2',
        level: 'article',
        children: [
          { id: 'clause-1', label: 'Khoản 1', level: 'clause' },
          { id: 'clause-2', label: 'Khoản 2', level: 'clause' },
          { id: 'clause-3', label: 'Khoản 3', level: 'clause' },
        ],
      },
      {
        id: 'article-3',
        label: 'Điều 3',
        level: 'article',
        children: [
          { id: 'clause-3-1', label: 'Khoản 1', level: 'clause' },
          { id: 'clause-3-2', label: 'Khoản 2', level: 'clause' },
        ],
      },
    ],
  },
  {
    id: 'chapter-2',
    label: 'Chương II',
    level: 'chapter',
    children: [
      {
        id: 'article-4',
        label: 'Điều 4',
        level: 'article',
        children: [
          { id: 'clause-4-1', label: 'Khoản 1', level: 'clause' },
          { id: 'clause-4-2', label: 'Khoản 2', level: 'clause' },
          { id: 'clause-4-3', label: 'Khoản 3', level: 'clause' },
          { id: 'clause-4-4', label: 'Khoản 4', level: 'clause' },
          { id: 'clause-4-5', label: 'Khoản 5', level: 'clause' },
        ],
      },
      {
        id: 'article-5',
        label: 'Điều 5',
        level: 'article',
        children: [
          { id: 'clause-5-1', label: 'Khoản 1', level: 'clause' },
          { id: 'clause-5-2', label: 'Khoản 2', level: 'clause' },
        ],
      },
    ],
  },
  {
    id: 'chapter-3',
    label: 'Chương III',
    level: 'chapter',
    children: [
      {
        id: 'article-6',
        label: 'Điều 6',
        level: 'article',
        children: [
          { id: 'clause-6-1', label: 'Khoản 1', level: 'clause' },
          { id: 'clause-6-2', label: 'Khoản 2', level: 'clause' },
        ],
      },
    ],
  },
]
