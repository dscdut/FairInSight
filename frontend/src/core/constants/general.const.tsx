import {
  BarChart3,
  Calendar,
  CreditCard,
  FileText,
  Home,
  Mail,
  MessageSquare,
  Network,
  PieChart,
  Scale,
  Settings,
  ShoppingCart,
  TrendingUp,
  Users,
  UserCheck,
  MessageCircle
} from 'lucide-react'

import { ROUTE } from '@/core/constants/path'
import { type TSidebarLinks } from '@/models/types/general.type'

export const adminSidebarLinks: TSidebarLinks[] = [
  {
    title: 'Trang chủ',
    titleKey: 'dashboard',
    icon: <BarChart3 className='w-5 h-5' />,
    path: ROUTE.ADMIN.DASHBOARD
  },
  {
    title: 'Văn bản pháp luật',
    titleKey: 'legal',
    icon: <Scale className='w-5 h-5' />,
    path: ROUTE.ADMIN.LEGAL_DOCUMENTS
  },
  {
    title: 'Tra cứu luật',
    titleKey: 'law_inspect',
    icon: <Network className='w-5 h-5' />,
    path: ROUTE.ADMIN.LAW_INSPECT
  },
  {
    title: 'Phân tích',
    titleKey: 'analytics',
    icon: <PieChart className='w-5 h-5' />,
    path: ROUTE.ADMIN.ANALYTICS.ROOT,
    children: [
      {
        title: 'Tổng quan',
        titleKey: 'overview',
        path: ROUTE.ADMIN.ANALYTICS.OVERVIEW
      },
      {
        title: 'Phân tích doanh thu',
        titleKey: 'sales',
        path: ROUTE.ADMIN.ANALYTICS.SALES
      },
      {
        title: 'Phân tích người dùng',
        titleKey: 'user_analytics',
        path: ROUTE.ADMIN.ANALYTICS.USERS
      },
      {
        title: 'Hiệu suất hệ thống',
        titleKey: 'performance',
        path: ROUTE.ADMIN.ANALYTICS.PERFORMANCE
      }
    ]
  },
  {
    title: 'Quản lý người dùng',
    titleKey: 'users',
    icon: <Users className='w-5 h-5' />,
    path: ROUTE.ADMIN.USERS,
    children: [
      {
        // title: 'Tất cả người dùng',
        // path: 'users/all'
        title: 'All Users',
        path: 'users'
      },
      {
        title: 'Đang hoạt động',
        path: 'users/active'
      },
      {
        title: 'Ngừng hoạt động',
        path: 'users/inactive'
      },
      {
        title: 'Vai trò',
        path: 'users/roles'
      },
      {
        title: 'Phân quyền',
        path: 'users/permissions'
      }
    ]
  },
  {
    title: 'Thương mại điện tử',
    icon: <ShoppingCart className='w-5 h-5' />,
    path: 'ecommerce',
    children: [
      {
        title: 'Đơn hàng',
        path: 'ecommerce/orders'
      },
      {
        title: 'Sản phẩm',
        path: 'ecommerce/products'
      },
      {
        title: 'Danh mục',
        path: 'ecommerce/categories'
      },
      {
        title: 'Kho hàng',
        path: 'ecommerce/inventory'
      },
      {
        title: 'Mã giảm giá',
        path: 'ecommerce/coupons'
      }
    ]
  },
  {
    title: 'Nội dung',
    icon: <FileText className='w-5 h-5' />,
    path: 'content',
    children: [
      {
        title: 'Bài viết',
        path: 'content/posts'
      },
      {
        title: 'Trang',
        path: 'content/pages'
      },
      {
        title: 'Thư viện media',
        path: 'content/media'
      },
      {
        title: 'Bình luận',
        path: 'content/comments'
      }
    ]
  },
  {
    title: 'Thanh toán',
    icon: <CreditCard className='w-5 h-5' />,
    path: 'payments',
    children: [
      {
        title: 'Giao dịch',
        path: 'payments/transactions'
      },
      {
        title: 'Phương thức thanh toán',
        path: 'payments/methods'
      },
      {
        title: 'Hoàn tiền',
        path: 'payments/refunds'
      },
      {
        title: 'Hóa đơn',
        path: 'payments/invoices'
      }
    ]
  },
  {
    title: 'Lịch',
    icon: <Calendar className='w-5 h-5' />,
    path: 'calendar'
  },
  {
    title: 'Tin nhắn',
    icon: <Mail className='w-5 h-5' />,
    path: 'messages',
    children: [
      {
        title: 'Hộp thư đến',
        path: 'messages/inbox'
      },
      {
        title: 'Đã gửi',
        path: 'messages/sent'
      },
      {
        title: 'Bản nháp',
        path: 'messages/drafts'
      },
      {
        title: 'Mẫu tin nhắn',
        path: 'messages/templates'
      }
    ]
  },
  {
    title: 'Báo cáo',
    icon: <TrendingUp className='w-5 h-5' />,
    path: 'reports',
    children: [
      {
        title: 'Báo cáo doanh thu',
        path: 'reports/sales'
      },
      {
        title: 'Báo cáo người dùng',
        path: 'reports/users'
      },
      {
        title: 'Báo cáo tài chính',
        path: 'reports/financial'
      },
      {
        title: 'Báo cáo hệ thống',
        path: 'reports/system'
      }
    ]
  },
  {
    title: 'Cài đặt',
    icon: <Settings className='w-5 h-5' />,
    path: 'settings',
    children: [
      {
        title: 'Chung',
        path: 'settings/general'
      },
      {
        title: 'Bảo mật',
        path: 'settings/security'
      },
      {
        title: 'Thông báo',
        path: 'settings/notifications'
      },
      {
        title: 'Tích hợp',
        path: 'settings/integrations'
      },
      {
        title: 'Sao lưu',
        path: 'settings/backup'
      }
    ]
  }
]

export const userSideBarLinks: TSidebarLinks[] = [
  {
    title: 'Trang chủ',
    titleKey: 'home',
    icon: <Home className='w-5 h-5' />,
    path: ROUTE.USER.ROOT
  },
  {
    title: 'Phân tích pháp luật',
    titleKey: 'chat_ai',
    icon: <MessageSquare className='w-5 h-5' />,
    path: ROUTE.USER.CHAT_AI
  },
  {
    title: 'Tin nhắn',
    titleKey: 'messages',
    icon: <MessageCircle className='w-5 h-5' />,
    path: ROUTE.USER.MESSAGES
  },
  {
    title: 'Kho biểu mẫu',
    titleKey: 'template',
    icon: <FileText className='w-5 h-5' />,
    path: ROUTE.USER.TEMPLATE
  },
  {
    title: 'Văn bản pháp luật',
    titleKey: 'legal',
    icon: <Scale className='w-5 h-5' />,
    path: ROUTE.USER.LEGAL
  },
  {
    title: 'Danh sách luật sư',
    titleKey: 'find_lawyer',
    icon: <UserCheck className='w-5 h-5' />,
    path: ROUTE.USER.LAWYER
  },
  {
    title: 'Yêu cầu tư vấn',
    titleKey: 'appointments',
    icon: <Calendar className='w-5 h-5' />,
    path: ROUTE.USER.APPOINTMENT
  },
  {
    title: 'Quản lý báo cáo',
    titleKey: 'report',
    icon: <BarChart3 className='w-5 h-5' />,
    path: ROUTE.USER.REPORT
  },
  {
    title: 'Quản lý người dùng',
    titleKey: 'users',
    icon: <Users className='w-5 h-5' />,
    path: ROUTE.USER.INFO
  },
  {
    title: 'Cài đặt',
    titleKey: 'setting',
    icon: <Settings className='w-5 h-5' />,
    path: ROUTE.PROFILE.ROOT
  }
]
