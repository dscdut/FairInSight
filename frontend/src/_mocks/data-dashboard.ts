import { Calendar, FileText, FolderOpen, MessageSquare, PlusCircle, Scale } from "lucide-react";

import { ROUTE } from "@/core/constants/path";

export const DASHBOARD_DATA = [
  {
    label: 'Vụ việc đang xử lý',
    value: '02',
    icon: FolderOpen,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30'
  },
  {
    label: 'Yêu cầu tư vấn',
    value: '05',
    icon: MessageSquare,
    color: 'text-indigo-600 bg-legal-50 dark:bg-indigo-950/30'
  },
  {
    label: 'Tài liệu lưu trữ',
    value: '12',
    icon: FileText,
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
  },
  {
    label: 'Lịch hẹn sắp tới',
    value: '01',
    icon: Calendar,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30'
  }
]

export const DASHBOARD_SERVICES = [
  {
    title: 'Hỏi Luật sư AI',
    desc: 'Tra đổi trực tuyến với Trợ lý Luật sư AI thông minh để giải đáp các thắc mắc pháp lý tức thì.',
    icon: MessageSquare,
    link: ROUTE.USER.CHAT_AI,
    actionText: 'Trò chuyện ngay'
  },
  {
    title: 'Tạo yêu cầu tư vấn',
    desc: 'Gửi yêu cầu chi tiết đến đội ngũ luật sư chuyên nghiệp để được tư vấn chuyên sâu.',
    icon: PlusCircle,
    link: '#',
    actionText: 'Tạo yêu cầu'
  },
  {
    title: 'Quản lý tài liệu',
    desc: 'Tải lên, tổ chức và lưu trữ các hợp đồng, văn bản pháp lý một cách an toàn nhất.',
    icon: FileText,
    link: ROUTE.USER.TEMPLATE,
    actionText: 'Xem thư viện'
  },
  {
    title: 'Tra cứu luật',
    desc: 'Tìm kiếm nhanh các quy định pháp luật, nghị định, thông tư mới nhất.',
    icon: Scale,
    link: ROUTE.PROFILE.ROOT,
    actionText: 'Tìm kiếm ngay'
  }
]

export const DASHBOARD_ACTIVITY = [
  {
    title: 'Tạo yêu cầu tư vấn thành công',
    time: '10 phút trước',
    desc: 'Yêu cầu tư vấn về Hợp đồng dịch vụ của bạn đã được gửi.',
    current: true
  },
  {
    title: 'AI phân tích tài liệu hoàn tất',
    time: '2 giờ trước',
    desc: 'Hợp đồng lao động mẫu đã được phân tích rủi ro pháp lý.',
    current: false
  },
  {
    title: 'Cập nhật tài khoản thành công',
    time: '1 ngày trước',
    desc: 'Thông tin hồ sơ cá nhân của bạn đã được cập nhật.',
    current: false
  }
]