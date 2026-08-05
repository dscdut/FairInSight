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
  TrendingUp,
  Users,
  UserCheck,
  MessageCircle,
  User,
  Settings
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
    title: 'Phân tích pháp luật',
    icon: <MessageSquare className='w-5 h-5' />,
    path: `${ROUTE.ADMIN.ROOT}/${ROUTE.ADMIN.CHAT_AI}`
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
    title: 'Quản lý người dùng',
    titleKey: 'users',
    icon: <Users className='w-5 h-5' />,
    path: ROUTE.ADMIN.USERS,
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
    path: 'messages'
  },
  {
    title: 'Báo cáo',
    icon: <TrendingUp className='w-5 h-5' />,
    path: 'reports',
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
    title: 'Gói và credit',
    icon: <CreditCard className='w-5 h-5' />,
    path: ROUTE.USER.BILLING
  },
  {
    title: 'Trang cá nhân',
    titleKey: 'profile',
    icon: <User className='w-5 h-5' />,
    path: ROUTE.PROFILE.ROOT
  }
]

export const lawyerSideBarLinks: TSidebarLinks[] = [
  {
    title: 'Trang chủ',
    titleKey: 'home',
    icon: <Home className='w-5 h-5' />,
    path: `${ROUTE.LAWYER.ROOT}/${ROUTE.LAWYER.DASHBOARD}`
  },
  {
    title: 'Lịch hẹn tư vấn',
    titleKey: 'appointments',
    icon: <Calendar className='w-5 h-5' />,
    path: `${ROUTE.LAWYER.ROOT}/${ROUTE.LAWYER.APPOINTMENT}`
  },
  {
    title: 'Tin nhắn',
    titleKey: 'messages',
    icon: <MessageCircle className='w-5 h-5' />,
    path: `${ROUTE.LAWYER.ROOT}/${ROUTE.LAWYER.MESSAGES}`
  },
  {
    title: 'Hồ sơ chuyên môn',
    titleKey: 'profile',
    icon: <User className='w-5 h-5' />,
    path: `${ROUTE.LAWYER.ROOT}/${ROUTE.LAWYER.PROFILE}`
  },
  {
    title: 'Cài đặt',
    titleKey: 'setting',
    icon: <Settings className='w-5 h-5' />,
    path: `${ROUTE.LAWYER.ROOT}/${ROUTE.LAWYER.SETTING}`
  }
]
