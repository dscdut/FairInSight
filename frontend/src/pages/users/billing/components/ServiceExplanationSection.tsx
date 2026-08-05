import {
  FileText,
  HelpCircle,
  Layers,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck
} from 'lucide-react'

export default function ServiceExplanationSection() {
  const services = [
    {
      icon: FileText,
      title: 'Xuất Báo Cáo & Hồ Sơ Pháp Lý PDF',
      description:
        'Tải về toàn bộ diễn biến tư vấn, phân tích điều luật, đánh giá chứng cứ và đề xuất phương án giải quyết dưới dạng báo cáo PDF chỉn chu, chuyên nghiệp để lưu trữ hoặc nộp cơ quan có thẩm quyền.'
    },
    {
      icon: Sparkles,
      title: 'Tạo Biểu Mẫu Theo Vụ Việc',
      description:
        'Hệ thống AI tự động điền và tạo mẫu đơn khiếu nại, đơn khởi kiện, hợp đồng mẫu hoặc văn bản thỏa thuận được cá nhân hóa chính xác theo tình huống pháp lý của bạn.'
    },
    {
      icon: UserCheck,
      title: 'Kết Nối Luật Sư Chuyên Môn',
      description:
        'Khi vụ việc phức tạp vượt quá phạm vi tư vấn tự động, hệ thống hỗ trợ đóng gói hồ sơ và kết nối trực tiếp với đội ngũ luật sư phù hợp trong mạng lưới FairInsight.'
    },
    {
      icon: Layers,
      title: 'Chế Độ Trò Chuyện Thường & Phân Tích Chuyên Sâu',
      description:
        'Chế độ Thường hỗ trợ tra cứu nhanh điều khoản và giải đáp thắc mắc cơ bản. Chế độ Phân tích Chuyên sâu kích hoạt quy trình phân tích đa nhánh IRAC, đối chiếu án lệ và xây dựng chiến lược tranh tụng chuyên sâu.'
    },
    {
      icon: RefreshCw,
      title: 'Cấp Bù Credit Theo Ngày',
      description:
        'Mỗi ngày hệ thống tự động kiểm tra và bù thêm số lượng credit cơ bản tùy theo định mức gói cước của bạn, giúp bạn duy trì trải nghiệm tư vấn không bị gián đoạn.'
    },
    {
      icon: ShieldCheck,
      title: 'Bảo Mật Dữ Liệu & Phiên Trò Chuyện',
      description:
        'Toàn bộ lịch sử trao đổi, tài liệu đính kèm và số dư credit được mã hóa và bảo mật nghiêm ngặt. Không bao giờ chia sẻ thông tin vụ việc cho bên thứ ba.'
    }
  ]

  return (
    <section className='rounded-3xl border border-border-secondary bg-background-primary p-6 sm:p-8 shadow-sm space-y-6'>
      <div className='flex items-center gap-3 border-b border-border-secondary pb-4'>
        <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
          <HelpCircle className='h-5 w-5' />
        </div>
        <div>
          <h3 className='text-lg font-black text-main'>Giải Thích Chi Tiết Các Dịch Vụ & Quyền Lợi Được Cấp</h3>
          <p className='text-xs text-text-description'>Tìm hiểu chi tiết các tính năng cao cấp được tích hợp trong từng gói cước FairInsight.</p>
        </div>
      </div>

      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {services.map((item, idx) => {
          const Icon = item.icon
          return (
            <div key={idx} className='rounded-2xl border border-border-secondary/60 bg-background-secondary/40 p-5 space-y-2.5 transition-all hover:border-primary/40 hover:bg-background-secondary/70'>
              <div className='inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                <Icon className='h-4 w-4' />
              </div>
              <h4 className='text-sm font-bold text-main'>{item.title}</h4>
              <p className='text-xs leading-relaxed text-text-description'>{item.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
