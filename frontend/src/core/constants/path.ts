export const ROUTE = {
  HOME: '/',
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    VERIFY_ACCOUNT_EMAIL: '/verify-account-email',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password'
  },
  PROFILE: {
    ROOT: '/profile',
    EDIT: '/profile/edit'
  },
  USER: {
    ROOT: '/',
    BLOG: '/blog',
    CHAT_AI: '/chat-ai',
    TEMPLATE: '/template',
    LEGAL: '/legal',
    FIND_LAWYER: '/find-lawyer',
    REPORT: '/report',
    INFO: '/users',
    SETTING: '/setting',
    PROFILE: '/profile',
    EDIT: '/profile/edit'

  },
  FORM_LIBRARY: '/form-library',
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: 'dashboard',
    USERS: 'users',
    LEGAL_DOCUMENTS: 'legal-documents',
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
