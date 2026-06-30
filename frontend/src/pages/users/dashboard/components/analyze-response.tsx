import { ArrowLeft, UserCheck, FileDown, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { MOCK_ANALYSIS_RESULT } from "@/_mocks/case.mock";
import { FadeUp } from "@/components/animated/animated-component";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { ROUTE } from "@/core/constants/path";
import { useRequestStore } from "@/core/store/features/analyze-request/useRequestStore";



export default function AnalysisResponse() {
  const navigate = useNavigate()
  const setDefault = useRequestStore((state) => state.setDefault)
  const analysisData = MOCK_ANALYSIS_RESULT

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Báo cáo phân tích sơ bộ - ${analysisData.category}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 40px;
                color: #111827;
                line-height: 1.6;
              }
              .header {
                border-bottom: 2px solid #b81d24;
                padding-bottom: 12px;
                margin-bottom: 30px;
              }
              .title {
                font-size: 24px;
                font-weight: bold;
                color: #b81d24;
                margin: 0;
              }
              .subtitle {
                font-size: 12px;
                color: #6d717f;
                margin-top: 4px;
              }
              .section-title {
                font-size: 16px;
                font-weight: bold;
                margin-top: 24px;
                margin-bottom: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .summary-box {
                background-color: #f3f4f6;
                padding: 16px;
                border-radius: 8px;
                font-size: 14px;
                white-space: pre-line;
              }
              .law-item {
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid #e5e7ea;
              }
              .law-title {
                font-weight: bold;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .law-bullet {
                width: 6px;
                height: 6px;
                background-color: #43b75d;
                border-radius: 50%;
                display: inline-block;
              }
              .law-desc {
                font-size: 13px;
                color: #4d5461;
                margin-top: 6px;
                padding-left: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">Báo cáo phân tích sơ bộ</h1>
              <div class="subtitle">Lĩnh vực: ${analysisData.category} • Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}</div>
            </div>

            <div class="section-title">Tóm tắt tình huống pháp lý</div>
            <div class="summary-box">${analysisData.summary.replace(/\n/g, '<br/>')}</div>

            <div class="section-title" style="margin-top: 35px;">Cơ sở pháp lý cốt lõi liên quan</div>
            <div>
              ${analysisData.laws.map(law => `
                <div class="law-item">
                  <div class="law-title">
                    <span class="law-bullet"></span>
                    ${law.title}
                  </div>
                  <div class="law-desc">${law.description}</div>
                </div>
              `).join('')}
            </div>

            <script>
              window.onload = function() {
                window.print();
                window.close();
              };
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 slide-in-from-bottom-2">
      <FadeUp className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-primary pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-h3 text-text-main">Báo cáo phân tích sơ bộ</h2>
          </div>
          <p className="text-p text-text-description">Khởi tạo thành công • Dữ liệu mang tính chất tham khảo pháp lý.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrintPDF} 
            className="text-btn-small rounded-md flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="w-4 h-4" /> Xuất PDF
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => navigate(ROUTE.USER.CHAT_AI)} 
            className="text-btn-small rounded-md bg-gradient-to-r from-primary to-rose-500 text-white border-none flex items-center gap-1.5 cursor-pointer shadow-[0_4px_12px_rgba(184,29,36,0.15)]"
          >
            <MessageSquare className="w-4 h-4" /> Chat với AI
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={setDefault} 
            className="text-btn-small rounded-md flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Quay về trang chủ
          </Button>
        </div>
      </FadeUp>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FadeUp delay={0.1} className="lg:col-span-2 space-y-8">
          <div>
            <h5 className="flex items-center gap-2 text-h5 font-bold text-text-main">
              Tóm tắt tình huống pháp lý
            </h5>
            <div className="bg-background-secondary p-4 rounded-md mt-2">
              <p className="text-text-description leading-relaxed text-small whitespace-pre-line">
                {analysisData.summary}
              </p>
            </div>
          </div>

          {/* Card điều luật gợi ý */}
          <div>
            <div className="flex flex-row items-center gap-2 space-y-0">
              <h5 className="text-h5 text-text-main">Cơ sở pháp lý cốt lõi liên quan</h5>
            </div>
            <div className="space-y-4 mt-2">
              {analysisData.laws.map((law, i) => (
                <FadeUp key={law.id} delay={(i + 1) * 0.1} className="py-2 rounded-md">
                  <h4 className="font-semibold text-text-main text-small flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success-primary"></span>
                    {law.title}
                  </h4>
                  <p className="text-small text-text-description mt-2 leading-relaxed pl-3.5 border-l border-border-secondary">
                    {law.description}
                  </p>
                </FadeUp>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* Khối bên phải (Chiếm 1 phần): Luật sư chuyên trách phù hợp */}
        <FadeUp delay={0.2} className="space-y-6">
          <Card className="border-border-primary shadow-100 bg-background-secondary rounded-lg h-full">
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3 justify-between">
              <div className="flex flex-row items-center gap-2 space-y-0">
                <UserCheck className="w-6 h-6 text-primary" />
                <CardTitle className="text-h5 text-text-main">Luật sư gợi ý</CardTitle>
              </div>
              <Button
                className="text-sm text-primary font-medium cursor-pointer hover:text-primary/80 hover:underline hover:italic px-0"
                variant={"link"}
                size="sm"
                onClick={() => {}}
              >
                  Xem thêm
              </Button>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {analysisData.lawyers.map((lawyer) => (
                <div 
                  key={lawyer.id} 
                  className="flex items-center gap-4 p-4 border border-border-primary rounded-lg hover:shadow-200 hover:border-primary transition-all bg-background-primary cursor-pointer group"
                >
                  <img 
                    src={lawyer.avatar} 
                    alt={lawyer.name} 
                    className="w-12 h-12 rounded-full border border-border-secondary group-hover:scale-105 transition-transform shrink-0" 
                  />
                  <div className="space-y-0.5">
                    <h4 className="text-p-medium text-text-main group-hover:text-primary transition-colors">
                      {lawyer.name}
                    </h4>
                    <p className="text-xs text-text-secondary font-medium">{lawyer.specialty}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeUp>
      </div>
      <p className="text-center p-2 text-small text-text-description">AI phân tích dựa trên ngữ cảnh bạn đưa ra. Nếu muốn có câu trả lời chính xác nhất, vui lòng cung cấp thêm thông tin 
        <Link to={ROUTE.USER.TEMPLATE} className="text-info text-small underline italic">
            {" "}tại đây
        </Link>
      </p>
    </div>
  )
}
