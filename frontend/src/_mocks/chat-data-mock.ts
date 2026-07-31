import { type Lawyer } from '@/models/types/case.types'

// Interfaces
export interface Attachment {
  id: string
  name: string
  type: 'image' | 'file'
  url?: string
  size?: string
}

export interface Citation {
  official_code?: string
  article_no?: string
  clause_no?: string
  quoted_text?: string
}

export interface Message {
  id: string
  sender: 'user' | 'ai'
  content: string
  timestamp: string
  attachments?: Attachment[]
  lawyers?: Lawyer[]
  // --- AI BE ---
  mode?: string | null          // lookup | deep_reasoning_pending | deep_reasoning | ...
  citations?: Citation[]
  domain?: string | null        // lĩnh vực (case_frame.main_domain) → map luật sư
  // true khi AI mời xác nhận phân tích sâu → hiện nút "Phân tích sâu" ở bubble này
  deepPending?: boolean
  // true khi đây là kết luận deep reasoning → hiện 2 nút (tải phân tích / gợi ý luật sư)
  showPostActions?: boolean
  // true khi AI đang trong quá trình suy luận/chờ phản hồi
  isLoading?: boolean
}

export interface ChatSession {
  id: string
  title: string
  date: string
  messages: Message[]
  // session_id do AI BE cấp (giữ ngữ cảnh hội thoại nhiều lượt)
  aiSessionId?: string | null
}


export const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: 'session-1',
    title: 'Tranh chấp ranh giới đất đai',
    date: '14/06/2026 10:30',
    messages: [
      {
        id: 'msg-1-1',
        sender: 'user',
        content: 'Chào trợ lý, tôi muốn tư vấn về ranh giới đất đai với nhà hàng xóm. Họ xây tường bao lấn sang đất tôi khoảng 10cm dựa theo mốc cắm cũ.',
        timestamp: '10:30',
        attachments: [
          {
            id: 'att-1',
            name: 'giay_chung_nhan_qsd_dat.pdf',
            type: 'file',
            size: '2.4 MB'
          }
        ]
      },
      {
        id: 'msg-1-2',
        sender: 'ai',
        content: `Chào bạn! Đây là vấn đề tranh chấp ranh giới đất đai thường gặp, điều chỉnh bởi Luật Đất đai và Bộ luật Dân sự. Dựa trên thông tin bạn cung cấp và hồ sơ đính kèm, Trợ lý AI đưa ra một số căn cứ pháp lý cốt lõi:

          1. Nguyên tắc xác định ranh giới
          Theo quy định tại **Điều 175 Bộ luật Dân sự 2015**:
          - Ranh giới giữa các bất động sản liền kề được xác định theo thỏa thuận hoặc theo quyết định của cơ quan nhà nước có thẩm quyền.
          - Người sử dụng đất chỉ được sử dụng đất trong phạm vi ranh giới của mình. Không ai được phép xây dựng vượt quá mốc ranh giới nếu không được sự đồng ý của chủ sở hữu đất bên cạnh.

          2. Thẩm quyền và trình tự giải quyết
          Dựa vào **Điều 202 và Điều 203 Luật Đất đai 2013** (đã được sửa đổi):
          - Hòa giải tại cơ sở: Nhà nước khuyến khích các bên tranh chấp tự hòa giải. Nếu không tự hòa giải được, bắt buộc phải nộp đơn yêu cầu hòa giải tại UBND cấp xã/phường nơi có đất tranh chấp. Thủ tục hòa giải tại UBND cấp xã là điều kiện bắt buộc để khởi kiện tại Tòa án.
          - Giải quyết tranh chấp:
            - Nếu đất đã có Sổ đỏ (Giấy chứng nhận QSDĐ): Thẩm quyền thuộc về Tòa án nhân dân quận/huyện nơi có đất tranh chấp.
            - Nếu đất chưa có Sổ đỏ: Bạn có thể chọn giải quyết tại UBND cấp có thẩm quyền hoặc khởi kiện tại Tòa án nhân dân.

          Khuyến nghị hành động tiếp theo cho bạn:
          1. Lập biên bản hiện trạng: Chụp hình ảnh tường bao hàng xóm đang xây lấn chiếm và mời đại diện tổ dân phố/thôn xóm đến chứng kiến.
          2. Gửi đơn đề nghị hòa giải: Gửi đơn lên Ủy ban nhân dân cấp xã/phường để yêu cầu hòa giải tranh chấp đất đai.`,
        timestamp: '10:32'
      }
    ]
  },
  {
    id: 'session-2',
    title: 'Phạt vi phạm hợp đồng dịch vụ',
    date: '13/06/2026 15:45',
    messages: [
      {
        id: 'msg-2-1',
        sender: 'user',
        content: 'Đối tác chậm thanh toán tiền dịch vụ phần mềm cho bên tôi quá 30 ngày. Trong hợp đồng có điều khoản phạt vi phạm nhưng tôi muốn hỏi mức tối đa được phạt là bao nhiêu theo luật?',
        timestamp: '15:45'
      },
      {
        id: 'msg-2-2',
        sender: 'ai',
        content: `Chào bạn! Vấn đề chậm thanh toán hợp đồng dịch vụ phần mềm giữa các doanh nghiệp được điều chỉnh bởi Luật Thương mại và Bộ luật Dân sự. 

        Mức phạt vi phạm tối đa:
        Theo quy định tại **Điều 301 Luật Thương mại 2005**:
        - Mức phạt vi phạm hợp đồng do các bên thỏa thuận trong hợp đồng, nhưng tổng mức phạt đối với các vi phạm không được vượt quá **8% giá trị phần nghĩa vụ hợp đồng bị vi phạm** (trừ trường hợp dịch vụ giám định).
        - Do đó, nếu hai bên đều là thương nhân và hợp đồng này phục vụ mục đích kinh doanh, bạn chỉ được áp dụng mức phạt tối đa là **8%** trên số tiền chậm thanh toán (phần nghĩa vụ bị vi phạm), ngay cả khi hai bên đã thỏa thuận một con số lớn hơn (ví dụ 10% hay 20% thì phần vượt quá 8% sẽ bị coi là vô hiệu).

        ### Quyền yêu cầu bồi thường thiệt hại và lãi chậm trả:
        Ngoài phạt vi phạm, bạn còn có quyền yêu cầu:
        1. Lãi chậm trả: Theo **Điều 306 Luật Thương mại 2005**, bạn có quyền yêu cầu thanh toán tiền lãi chậm trả tính theo lãi suất nợ quá hạn trung bình trên thị trường tại thời điểm thanh toán tương ứng với thời gian chậm trả (trừ trường hợp thỏa thuận khác).
        2. Bồi thường thiệt hại: Nếu việc chậm trả gây ra thiệt hại thực tế chứng minh được, bạn có quyền yêu cầu bồi thường theo **Điều 302 Luật Thương mại 2005**.

        Lưu ý: Quyền phạt vi phạm chỉ phát sinh khi trong hợp đồng có thỏa thuận cụ thể về việc phạt vi phạm. Ngược lại, quyền yêu cầu bồi thường thiệt hại và lãi chậm thanh toán phát sinh đương nhiên theo quy định của pháp luật mà không cần thỏa thuận trong hợp đồng.`,
        timestamp: '15:47'
      }
    ]
  }
]

export const DEFAULT_SESSION: ChatSession = {
  id: 'temp',
  title: 'Phiên trò chuyện tạm thời',
  date: '',
  messages: []
}

export const LAND_LEGAL_CONTEXT = `Cảm ơn câu hỏi của bạn về ranh giới đất đai. Trợ lý AI đã ghi nhận yêu cầu và phân tích các dữ liệu có sẵn:

    Đánh giá pháp lý sơ bộ:
    1. Về ranh giới: Theo **Điều 175 Bộ luật Dân sự 2015**, việc cắm mốc hoặc xây tường bao phải đúng ranh giới được ghi nhận trong hồ sơ địa chính. Việc lấn sang 10cm vẫn được coi là hành vi lấn chiếm đất đai bất hợp pháp theo **Điều 12 Luật Đất đai 2013**.
    2. Biện pháp xử lý hành chính: Hành vi lấn, chiếm đất có thể bị xử phạt vi phạm hành chính theo **Nghị định 91/2019/NĐ-CP**, buộc khôi phục tình trạng ban đầu của đất trước khi vi phạm và trả lại đất đã lấn chiếm.

    Hướng giải quyết đề xuất:
    - Bước 1: Yêu cầu văn phòng đăng ký đất đai xuống đo đạc, trích đo hiện trạng cụ thể để làm căn cứ rõ ràng.
    - Bước 2: Tiến hành hòa giải cơ sở tại địa phương (UBND cấp xã/phường).
    - Bước 3: Gửi đơn khởi kiện lên Tòa án nhân dân cấp huyện nếu hòa giải không thành.`

export const CONTRACT_LEGAL_CONTEXT = `Dựa trên câu hỏi liên quan đến tranh chấp hợp đồng kinh tế và phạt vi phạm, Trợ lý AI phản hồi như sau:

    Phân tích điều khoản phạt vi phạm:
    - Tính pháp lý: Phạt vi phạm chỉ được áp dụng nếu trong hợp đồng gốc ký giữa 2 bên có thỏa thuận rõ ràng về việc này (**Điều 300 Luật Thương mại 2005**).
    - Mức trần giới hạn: Mức phạt tối đa đối với hợp đồng thương mại là **8%** giá trị nghĩa vụ bị vi phạm (**Điều 301 Luật Thương mại 2005**). Nếu các bên tự thỏa thuận mức cao hơn (ví dụ 12%), phần vượt quá 8% sẽ không có hiệu lực pháp luật.
    - Thời gian chậm trả: Bạn hoàn toàn có quyền tính thêm tiền lãi chậm thanh toán theo quy định tại **Điều 306 Luật Thương mại 2005** với mức lãi suất nợ quá hạn trung bình trên thị trường.`

export const LABOR_LEGAL_CONTEXT = `Về thắc mắc liên quan đến quan hệ lao động, tiền lương và chấm dứt hợp đồng lao động:

    Căn cứ pháp lý theo Bộ luật Lao động 2019:
    1. Đơn phương chấm dứt hợp đồng lao động trái pháp luật: Nếu người sử dụng lao động sa thải bạn không đúng căn cứ pháp lý quy định tại **Điều 36 Bộ luật Lao động 2019**, họ sẽ phải bồi thường ít nhất 02 tháng tiền lương theo hợp đồng lao động và nhận bạn trở lại làm việc (**Điều 41**).
    2. Thời hạn báo trước: Đối với hợp đồng không xác định thời hạn là 45 ngày, hợp đồng xác định thời hạn từ 12-36 tháng là 30 ngày.
    3. Tiền lương làm thêm giờ: Được tính theo **Điều 98**, làm thêm giờ ngày thường ít nhất bằng 150%, ngày nghỉ hằng tuần ít nhất bằng 200%, ngày lễ tết ít nhất bằng 300% đơn giá tiền lương.`

export const INIT_MESSAGE = `Chào bạn! Tôi là Trợ lý Pháp lý AI. Tôi đã nhận được câu hỏi phân tích của bạn. 

    Để đưa ra giải đáp pháp luật chính xác nhất, bạn vui lòng bổ sung thêm một số thông tin chi tiết:
    1. Đối tượng tranh chấp/sự việc: Sự việc xảy ra trong bối cảnh dân sự thông thường hay giao dịch thương mại giữa các doanh nghiệp?
    2. Tài liệu hiện có: Bạn có các hợp đồng, giấy tờ chứng nhận quyền lợi, văn bản thỏa thuận hay bằng chứng nào bằng văn bản liên quan không?
    3. Yêu cầu cụ thể: Kết quả mong muốn cuối cùng của bạn là đàm phán, hòa giải hay chuẩn bị hồ sơ khởi kiện ra cơ quan chức năng?

    Bạn có thể tải lên thêm các file tài liệu hoặc hình ảnh đính kèm để tôi có thêm cơ sở phân tích cụ thể hơn.`