import { type AnalysisResponse } from "@/models/types/case.types";

export const MOCK_ANALYSIS_RESULT: AnalysisResponse = {
  category: "Hôn nhân & Gia đình",
  summary: "Vụ việc liên quan đến tranh chấp tài sản chung sau ly hôn. Người chồng muốn chia đôi mảnh đất diện tích 150m2 hình thành trong thời kỳ hôn nhân, tuy nhiên người vợ cho rằng mảnh đất này được cha mẹ vợ tặng cho riêng.",
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
      name: "Luật sư Nguyễn Văn Luật",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer1",
      specialty: "Chuyên gia Tranh chấp Dân sự & Hôn nhân"
    },
    {
      id: "lawyer-2",
      name: "Luật sư Lê Thị Pháp",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer2",
      specialty: "Thạc sĩ Luật - Tư vấn Gia đình"
    }
  ]
};