import { isEqual } from 'lodash'
import { type NavigateFunction } from 'react-router-dom'

import { type LoginApiResponse } from '@/models/interface/auth.interface'

import { ROLE_ADMIN, ROLE_LAWYER } from '../configs/consts'
import { ROUTE } from '../constants/path'
import { setToken } from '../shared/storage'
import { useAuthStore } from '../store/features/auth/authStore'

const processLoginSuccess = (loginData: LoginApiResponse, navigate: NavigateFunction) => {
  const { accessToken, refreshToken, user } = loginData.data

  setToken(accessToken, refreshToken)

  useAuthStore.getState().loginSuccess(loginData.data)

  const targetRoute = isEqual(user.roleName, ROLE_ADMIN)
    ? `${ROUTE.ADMIN.ROOT}/${ROUTE.ADMIN.DASHBOARD}`
    : isEqual(user.roleName, ROLE_LAWYER)
      ? ROUTE.LAWYER.ROOT
      : ROUTE.HOME

  navigate(targetRoute)
}

export { processLoginSuccess }
