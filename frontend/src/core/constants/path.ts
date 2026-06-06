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
    LEGAL_ANALYSIS: '/legal-analysis',
    REPORT: '/report',
    USER: '/user',
    SETTING: '/setting'
  },
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: 'dashboard',
    USERS: 'users',
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
