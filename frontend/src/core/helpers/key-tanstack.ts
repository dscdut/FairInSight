export const MUTATION_KEYS = {
  register: 'register',
  login: 'login',
  updateProfile: 'updateProfile',
  forgotPassword: 'forgotPassword',
  verifyEmail: 'verifyEmail',
  resendCode: 'resendCode',
  resetPassword: 'resetPassword',
  deleteUser: 'deleteUser',
  banUser: 'banUser',
  unbanUser: 'unbanUser',
  updateUserRole: 'updateUserRole'
}

export const QUERY_KEYS = {
  userInfo: 'userInfo',
  users: 'users',
  usersStat: 'usersStat'
}

export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BANNED: 'banned'
}