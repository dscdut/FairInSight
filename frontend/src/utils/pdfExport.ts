import html2pdf from 'html2pdf.js'
import { marked } from 'marked'

// Xuất bản phân tích pháp lý (markdown) ra file PDF tiếng Việt.
// Render markdown -> HTML có style -> html2pdf. Dùng font hệ thống (Times) cho
// dấu tiếng Việt chuẩn; chữ thật (chọn/copy được trong PDF).
export async function exportAnalysisPdf(markdown: string, opts?: { title?: string }) {
  const title = opts?.title || 'Bản phân tích pháp lý'
  const dateStr = new Date().toLocaleString('vi-VN')
  const bodyHtml = await marked.parse(markdown)

  const container = document.createElement('div')
  container.innerHTML = `
    <style>
      .pdf-root { font-family: 'Times New Roman', Times, serif; color: #1a1a1a; font-size: 13px; line-height: 1.6; }
      .pdf-root h1 { font-size: 18px; color: #00685f; text-align: center; margin: 0 0 4px; }
      .pdf-root .meta { text-align: center; font-size: 11px; color: #666; margin-bottom: 16px; }
      .pdf-root hr { border: none; border-top: 1px solid #ccc; margin: 10px 0 18px; }
      .pdf-root h2 { font-size: 15px; color: #00685f; margin: 16px 0 6px; }
      .pdf-root h3 { font-size: 13px; font-weight: bold; margin: 12px 0 4px; }
      .pdf-root strong { color: #111; }
      .pdf-root ul, .pdf-root ol { padding-left: 22px; margin: 6px 0; }
      .pdf-root li { margin: 3px 0; }
      .pdf-root p { margin: 6px 0; }
      .pdf-root table { border-collapse: collapse; width: 100%; margin: 8px 0; }
      .pdf-root th, .pdf-root td { border: 1px solid #bbb; padding: 5px 8px; text-align: left; }
      .pdf-root .footer { margin-top: 22px; padding-top: 10px; border-top: 1px solid #ccc; font-style: italic; font-size: 11px; color: #555; }
    </style>
    <div class="pdf-root">
      <h1>${title}</h1>
      <div class="meta">FairInSight · Trợ lý Pháp lý AI · ${dateStr}</div>
      <hr />
      ${bodyHtml}
      <div class="footer">
        Thông tin do AI cung cấp mang tính chất tham khảo dựa trên quy định pháp luật hiện hành,
        không thay thế cho việc tư vấn pháp lý trực tiếp cùng luật sư.
      </div>
    </div>
  `

  await html2pdf()
    .set({
      margin: [12, 12, 14, 12],
      filename: `phan-tich-phap-ly-${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(container)
    .save()
}
