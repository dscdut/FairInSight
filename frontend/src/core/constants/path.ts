export const ROUTE = {
  HOME: '/',
  LAW_LIBRARY: '/law-library',
  LAW_DETAIL: '/law-library/:id',
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    VERIFY_ACCOUNT_EMAIL: '/verify-account-email',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    BANNED: '/banned'
  },
  PROFILE: {
    ROOT: '/profile',
    EDIT: '/profile/edit'
  },
  USER: {
    ROOT: '/',
    BLOG: '/blog',
    CHAT_AI: '/chat-ai',
    CHAT_AI_SESSION: '/chat-ai/:sessionId',
    TEMPLATE: '/template',
    DRAFT: '/draft',
    DRAFT_EDIT: '/drafts/:id/edit',
    LEGAL: '/legal',
    LAWYER: '/lawyers',
    LAWYER_DETAIL: '/lawyers/:id',
    REPORT: '/report',
    REPORTS: '/reports',
    REPORT_DETAIL: '/reports/:id',
    INFO: '/users',
    SETTING: '/setting',
    BILLING: '/billing',
    PROFILE: '/profile',
    EDIT: '/profile/edit',
    MESSAGES: '/messages',
    APPOINTMENT: '/appointment'
  },
  LAWYER: {
    ROOT: '/lawyer',
    DASHBOARD: 'dashboard',
    APPOINTMENT: 'appointments',
    MESSAGES: 'messages',
    REPORTS: 'reports',
    PROFILE: 'profile',
    SETTING: 'setting'
  },
  FORM_LIBRARY: '/form-library',
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: 'dashboard',
    CHAT_AI: 'chat-ai',
    CHAT_AI_SESSION: 'chat-ai/:sessionId',
    USERS: 'users',
    REPORTS: 'reports',
    LEGAL_DOCUMENTS: 'legal-documents',
    LAW_INSPECT: 'law-inspect',
    ANALYTICS: {
      ROOT: 'analytics',
      OVERVIEW: 'analytics/overview',
      SALES: 'analytics/sales',
      USERS: 'analytics/users',
      PERFORMANCE: 'analytics/performance'
    }
  },
  NOT_FOUND: '*'
}
