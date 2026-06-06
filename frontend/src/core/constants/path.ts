export const ROUTE = {
  HOME: '/',
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    VERIFY_ACCOUNT_EMAIL: '/verify-account-email',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password'
  },
  BLOG: '/blog',
  PROFILE: {
    ROOT: '/profile',
    EDIT: 'edit'
  },
  USER: {
    ROOT: '/',
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
