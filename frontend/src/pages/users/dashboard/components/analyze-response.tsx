import { ArrowLeft, FileText, Scale, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { MOCK_ANALYSIS_RESULT } from "@/_mocks/case.mock";
import { FadeUp } from "@/components/animated/animated-component";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { ROUTE } from "@/core/constants/path";
import { useRequestStore } from "@/core/store/features/analyze-request/useRequestStore";



export default function AnalysisResponse() {
  const setDefault = useRequestStore((state) => state.setDefault)
  const analysisData = MOCK_ANALYSIS_RESULT
  return (
    <div className="space-y-4 animate-in fade-in duration-500 slide-in-from-bottom-2">
      <FadeUp className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-h3 text-description dark:text-white">Báo cáo phân tích sơ bộ</h2>
            {/* <Badge className="bg-blue-50 text-info hover:bg-blue-50 font-semibold px-3 py-0.5 border border-blue-200 text-xs">
              Lĩnh vực: {analysisData.category}
            </Badge> */}
          </div>
          <p className="text-p text-text-description dark:text-white">Khởi tạo thành công • Dữ liệu mang tính chất tham khảo pháp lý.</p>
        </div>
        <Button variant="outline" size="sm" onClick={setDefault} className="text-btn-medium">
          <ArrowLeft/> Quay về trang chủ
        </Button>
      </FadeUp>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FadeUp delay={0.1} className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/60 shadow-sm bg-white rounded-2xl">
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
              <FileText className="w-6 h-6 text-info" />
              <CardTitle className="text-h5">Tóm tắt tình huống pháp lý</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-description leading-relaxed text-small p-4 rounded-xl border border-secondary">
                {analysisData.summary}
              </p>
            </CardContent>
          </Card>

          {/* Card điều luật gợi ý */}
          <Card className="border-secondary shadow-sm bg-white rounded-2xl">
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-4">
              <Scale className="w-6 h-6 text-success-primary" />
              <CardTitle className="text-h5 text-main">Cơ sở pháp lý cốt lõi liên quan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysisData.laws.map((law, i) => (
                <FadeUp key={law.id} delay={(i + 1) * 0.1} className="p-4 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all bg-white shadow-2xs">
                  <h4 className="font-semibold text-main text-small flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success-primary"></span>
                    {law.title}
                  </h4>
                  <p className="text-small text-text-description mt-2 leading-relaxed pl-3.5 border-l border-slate-200">
                    {law.description}
                  </p>
                </FadeUp>
              ))}
            </CardContent>
          </Card>
        </FadeUp>

        {/* Khối bên phải (Chiếm 1 phần): Luật sư chuyên trách phù hợp */}
        <FadeUp delay={0.2} className="space-y-6">
          <Card className="border-slate-200/60 shadow-sm bg-white rounded-2xl h-full">
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
              <UserCheck className="w-6 h-6 text-legal-500" />
              <CardTitle className="text-h5 text-main">Luật sư gợi ý riêng cho bạn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysisData.lawyers.map((lawyer) => (
                <div 
                  key={lawyer.id} 
                  className="flex items-center gap-4 p-4 border border-secondary rounded-xl hover:shadow-md hover:border-legal-500 transition-all bg-white cursor-pointer group"
                >
                  <img 
                    src={lawyer.avatar} 
                    alt={lawyer.name} 
                    className="w-12 h-12 rounded-full bg-secondary border border-secondary group-hover:scale-105 transition-transform" 
                  />
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm text-main group-hover:text-legal-500 transition-colors">
                      {lawyer.name}
                    </h4>
                    <p className="text-xs text-text-description font-medium">{lawyer.specialty}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeUp>
      </div>
      <p className="text-center p-2 text-small text-text-description dark:text-slate-400">AI phân tích dựa trên ngữ cảnh bạn đưa ra. Nếu muốn có câu trả lời chính xác nhất, vui lòng cung cấp thêm thông tin 
        <Link to={ROUTE.USER.TEMPLATE} className="text-info text-p text-underline italic">
            {" "}tại đây
        </Link>
      </p>
    </div>
  )
}
