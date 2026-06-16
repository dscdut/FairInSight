import { type Template } from '@/models/types/form-library'

interface TemplatePreviewProps {
  template?: Template
  htmlContent?: string
  formValues?: Record<string, string>
  compiledHtml?: string
}

export default function TemplatePreview({ htmlContent, compiledHtml }: TemplatePreviewProps) {
  return (
    <div className='lg:col-span-7 bg-background-tertiary border border-border-secondary rounded-sm flex items-center justify-center lg:h-[calc(100vh-160px)] shadow-100 overflow-hidden relative'>
      {htmlContent && (
        <iframe
          srcDoc={compiledHtml}
          title="Template Preview"
          className='w-full h-full border-none bg-white rounded-lg shadow-400'
        />
      )
      // ) : (
      //   /* A4 Sheet Container Fallback */
      //   <div id='a4-fallback-sheet' className='bg-white text-text-primary w-full h-full aspect-[1/1.414] shadow-400 rounded-sm text-left font-serif text-sm leading-relaxed relative flex flex-col border border-border-primary overflow-y-auto'>
      //     {/* Stamp / Decorative header */}
      //     <div className='flex flex-col items-center justify-center border-b border-double border-border-secondary pb-4 mb-6 text-center font-sans'>
      //       <h1 className='text-small font-bold uppercase tracking-wide mb-0.5'>
      //         {template.title}
      //       </h1>
      //       <p className='text-sm uppercase font-semibold text-text-secondary tracking-widest'>HỆ THỐNG PHÁP LÝ CHUẨN MỰC</p>
      //     </div>

      //     {/* Template-specific rendered text */}
      //     {(template.id === '1' || template.id === 'd3b07384-d113-4c9f-a2e6-ebcd2a2f8c5b') && (
      //       <div className='space-y-4'>
      //         <div className='space-y-1.5'>
      //           <p className='font-bold uppercase'>BÊN NHƯỢNG QUYỀN (BÊN A):</p>
      //           <p className=''><span className='font-bold'>Công ty:</span> IKEA</p>
      //           <p className='pl-4'><span className='font-bold'>Địa chỉ trụ sở chính:</span> Älmhult, Thụy Điển</p>
      //         </div>

      //         <div className='space-y-1.5'>
      //           <p className='font-bold uppercase'>BÊN NHẬN QUYỀN (BÊN B):</p>
      //           <p className='pl-4'><span className='font-bold'>Họ và Tên:</span> {formValues.fullName || '.......................................'}</p>
      //           <p className='pl-4'><span className='font-bold'>Số điện thoại:</span> {formValues.phone || '.......................................'}</p>
      //           <p className='pl-4'><span className='font-bold'>Ngày sinh:</span> {formValues.dob || '.......................................'}</p>
      //           <p className='pl-4'><span className='font-bold'>Số CCCD:</span> {formValues.idNumber || '.......................................'}</p>
      //           <p className='pl-4'><span className='font-bold'>Ngày cấp, nơi cấp:</span> {formValues.idIssueInfo || '.......................................'}</p>
      //           <p className='pl-4'><span className='font-bold'>Địa chỉ thường trú:</span> {formValues.permanentAddress || '.......................................'}</p>
      //         </div>

      //         <p className='indent-6 text-justify'>
      //           Hai bên thống nhất ký kết Hợp đồng nhượng quyền thương mại số <span className='font-bold'>{formValues.contractNumber || '...........................'}</span> ký tại <span className='font-bold'>{formValues.signLocation || '.................'}</span> vào ngày <span className='font-bold'>{formValues.signDate ? new Date(formValues.signDate).toLocaleDateString('vi-VN') : '..../..../2026'}</span> với các điều khoản thỏa thuận chi tiết như sau:
      //         </p>

      //         <div className='space-y-2.5'>
      //           <p className='font-bold uppercase'>ĐIỀU 1: QUYỀN VÀ NGHĨA VỤ CỦA BÊN A</p>
      //           <p className='pl-4 text-justify'>
      //             1.1. Bên A cấp quyền cho Bên B sử dụng nhãn hiệu thương mại "IKEA", hệ thống nhận diện thương hiệu, cùng toàn bộ công thức và mô hình vận hành cửa hàng đồ nội thất nhượng quyền trên lãnh thổ Việt Nam.
      //           </p>
      //           <p className='pl-4 text-justify'>
      //             1.2. Bên A có trách nhiệm chuyển giao tài liệu vận hành chi tiết, tổ chức các lớp huấn luyện nghiệp vụ định kỳ cho đội ngũ quản lý và nhân viên của Bên B.
      //           </p>
      //         </div>

      //         <div className='space-y-2.5'>
      //           <p className='font-bold uppercase'>ĐIỀU 2: QUYỀN VÀ NGHĨA VỤ CỦA BÊN B</p>
      //           <p className='pl-4 text-justify'>
      //             2.1. Bên B cam kết đầu tư tài chính thiết lập mặt bằng theo đúng thiết kế tiêu chuẩn mà Bên A đưa ra.
      //           </p>
      //           <p className='pl-4 text-justify'>
      //             2.2. Thanh toán đầy đủ và đúng thời hạn phí nhượng quyền ban đầu cùng phí duy trì định kỳ theo thỏa thuận của Hợp đồng này. Tổng giá trị nhượng quyền thỏa thuận là: <span className='font-bold text-text-primary'>{formatNumberString(formValues.contractValue) || '...........................'}</span> VND.
      //           </p>
      //         </div>

      //         <div className='flex justify-between pt-10 text-center font-sans'>
      //           <div className='flex flex-col gap-1'>
      //             <span className='font-bold uppercase text-btn-tiny'>ĐẠI DIỆN BÊN A</span>
      //             <span className='text-btn-tiny text-text-secondary italic'>(Ký, ghi rõ họ tên)</span>
      //             <span className='font-bold mt-12 text-text-primary'>IKEA Inc.</span>
      //           </div>
      //           <div className='flex flex-col gap-1'>
      //             <span className='font-bold uppercase text-btn-tiny'>ĐẠI DIỆN BÊN B</span>
      //             <span className='text-btn-tiny text-text-secondary italic'>(Ký, ghi rõ họ tên)</span>
      //             <span className='font-bold mt-12 text-text-primary'>{formValues.fullName || '...........................'}</span>
      //           </div>
      //         </div>
      //       </div>
      //     )}

      //     {(template.id === '2' || template.id === 'cf401a02-d224-4f8e-a3f7-fbcd3a3f9c6c') && (
      //       <div className='space-y-4'>
      //         <div className='text-center font-sans space-y-1 mb-4'>
      //           <p className='font-bold text-btn-small'>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
      //           <p className='font-bold text-btn-tiny border-b border-border-secondary pb-2 w-fit mx-auto'>Độc lập - Tự do - Hạnh phúc</p>
      //         </div>

      //         <div className='space-y-1.5'>
      //           <p className='font-bold uppercase'>Kính gửi: Phòng Đăng ký kinh doanh tỉnh/thành phố Đà Nẵng</p>
      //         </div>

      //         <p className='indent-6 text-justify'>
      //           Tôi là: <span className='font-bold uppercase'>{formValues.ownerName || '.......................................'}</span>, sinh ngày <span className='font-bold'>{formValues.ownerDob ? new Date(formValues.ownerDob).toLocaleDateString('vi-VN') : '..../..../....'}</span>, giới tính: <span className='font-bold'>{formValues.ownerGender || '..............'}</span>, mang số CMND/CCCD/Hộ chiếu: <span className='font-bold'>{formValues.ownerId || '...........................'}</span>.
      //         </p>

      //         <p className='text-justify'>
      //           Đề nghị đăng ký doanh nghiệp tư nhân với các thông tin sau:
      //         </p>

      //         <div className='space-y-1.5 pl-4'>
      //           <p><span className='font-bold'>1. Tên doanh nghiệp:</span> {formValues.businessName || '..................................................................'}</p>
      //           <p><span className='font-bold'>2. Địa chỉ trụ sở:</span> {formValues.officeAddress || '..................................................................'}</p>
      //           <p><span className='font-bold'>3. Vốn đầu tư của chủ doanh nghiệp:</span> {formValues.capital ? `${formValues.capital}` : '...........................'} VND.</p>
      //         </div>

      //         <p className='indent-6 text-justify'>
      //           Tôi cam kết hoàn toàn chịu trách nhiệm trước pháp luật về tính hợp pháp, chính xác và trung thực của các nội dung đăng ký doanh nghiệp trên đây.
      //         </p>

      //         <div className='flex justify-end pt-10 text-center font-sans'>
      //           <div className='flex flex-col gap-1 pr-6'>
      //             <span className='italic text-btn-tiny text-text-secondary'>Đà Nẵng, ngày .... tháng .... năm 2026</span>
      //             <span className='font-bold uppercase text-btn-tiny mt-1'>CHỦ DOANH NGHIỆP</span>
      //             <span className='text-btn-tiny text-text-secondary italic'>(Ký, ghi rõ họ tên)</span>
      //             <span className='font-bold mt-12 text-text-primary'>{formValues.ownerName || '...........................'}</span>
      //           </div>
      //         </div>
      //       </div>
      //     )}

      //     {(template.id === '3' || template.id === 'e4c01b03-d335-4f9e-b4f8-abcd4a4f0d7d') && (
      //       <div className='space-y-4'>
      //         <div className='space-y-1.5'>
      //           <p className='font-bold uppercase'>BÊN CHO THUÊ (BÊN A):</p>
      //           <p className='pl-4'><span className='font-bold'>Tên:</span> {formValues.lessorName || '.......................................'}</p>
      //           <p className='pl-4'><span className='font-bold'>Địa chỉ:</span> {formValues.lessorAddress || '.......................................'}</p>
      //         </div>

      //         <div className='space-y-1.5'>
      //           <p className='font-bold uppercase'>THÔNG TIN VĂN PHÒNG THUÊ:</p>
      //           <p className='pl-4'><span className='font-bold'>Diện tích thuê:</span> {formValues.area || '.........'} m2</p>
      //           <p className='pl-4'><span className='font-bold'>Giá thuê hàng tháng:</span> {formValues.price ? `${formatNumberString(formValues.price)} VND` : '.......................'}</p>
      //           <p className='pl-4'><span className='font-bold'>Thời hạn thuê:</span> {formValues.rentPeriod || '.........'} tháng</p>
      //         </div>

      //         <p className='text-justify indent-6'>
      //           Bên A đồng ý cho Bên B thuê văn phòng tại địa chỉ trên với diện tích và giá cả thỏa thuận. Hai bên cam kết thực hiện đúng các quy định về đóng tiền đặt cọc và thanh toán tiền thuê đúng kỳ hạn.
      //         </p>
      //       </div>
      //     )}
      //   </div>
      // )
      }
    </div>
  )
}
