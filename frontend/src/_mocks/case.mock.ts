import { type AnalysisResponse } from "@/models/types/case.types";

export const MOCK_ANALYSIS_RESULT: AnalysisResponse = {
  category: "Hôn nhân & Gia đình",
  summary: "Tóm tắt chi tiết vụ việc tranh chấp tài sản chung sau ly hôn:\n\n" +
    "• Đối tượng tranh chấp: Thửa đất có diện tích 150m2 tại quận Liên Chiểu, TP. Đà Nẵng, được mua và cấp Giấy chứng nhận quyền sử dụng đất trong thời kỳ hôn nhân (năm 2018).\n" +
    "• Yêu cầu của người chồng (ông Nguyễn Văn A): Đề nghị phân chia thửa đất theo tỷ lệ 50:50. Người chồng lập luận rằng tài sản được hình thành trong thời kỳ hôn nhân nên thuộc sở hữu chung của hai vợ chồng.\n" +
    "• Lập luận của người vợ (bà Trần Thị B): Yêu cầu tòa án công nhận thửa đất trên là tài sản riêng của mình và không phân chia. Người vợ cho rằng toàn bộ số tiền mua đất là do cha mẹ đẻ của bà tặng cho riêng bằng tiền mặt tại thời điểm giao dịch.\n" +
    "• Vướng mắc cốt lõi: Giấy chứng nhận quyền sử dụng đất đang ghi nhận tên của cả hai vợ chồng. Đồng thời, tại thời điểm giao dịch, không có văn bản thỏa thuận tặng cho riêng có công chứng hoặc chứng thực từ cha mẹ vợ để làm căn cứ pháp lý rõ ràng.",
  laws: [
    {
      id: "law-1",
      title: "Điều 33 - Luật Hôn nhân và Gia đình 2014",
      description: "Quy định về tài sản chung của vợ chồng. Tài sản do vợ chồng tạo ra, thu nhập do lao động, hoạt động sản xuất, kinh doanh trong thời kỳ hôn nhân là tài sản chung."
    },
    {
      id: "law-2",
      title: "Điều 43 - Luật Hôn nhân và Gia đình 2014",
      description: "Tài sản riêng của vợ, chồng bao gồm tài sản mà mỗi người có trước khi kết hôn; tài sản được thừa kế riêng, được tặng cho riêng trong thời kỳ hôn nhân."
    }
  ],
  lawyers: [
    {
      id: "lawyer-1",
      name: "Luật sư Phạm Văn Tiến",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer1",
      specialty: "Chuyên gia Tranh chấp Dân sự & Hôn nhân"
    },
    {
      id: "lawyer-2",
      name: "Luật sư Phạm Như Quỳnh",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer2",
      specialty: "Thạc sĩ Luật - Tư vấn Gia đình"
    },
    {
      id: "lawyer-3",
      name: "Luật sư Nguyễn Thị Hồng Phúc",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer3",
      specialty: "Chuyên gia Luật Doanh nghiệp & Thương mại"
    },
    {
      id: "lawyer-4",
      name: "Luật sư Lương Duy Toàn",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer4",
      specialty: "Chuyên gia Tranh tụng Đất đai & Dân sự"
    }
  ]
};