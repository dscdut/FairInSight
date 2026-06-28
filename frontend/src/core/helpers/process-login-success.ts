import { isEqual } from 'lodash'
import { type NavigateFunction } from 'react-router-dom'

import { type LoginApiResponse } from '@/models/interface/auth.interface'

import { ROLE_ADMIN } from '../configs/consts'
import { ROUTE } from '../constants/path'
import { setToken } from '../shared/storage'
import { useAuthStore } from '../store/features/auth/authStore'

const processLoginSuccess = (loginData: LoginApiResponse, navigate: NavigateFunction) => {
  const { accessToken, refreshToken, user } = loginData.data

  setToken(accessToken, refreshToken)

  useAuthStore.getState().loginSuccess(loginData.data)

  // Persist minimal profile fields locally so UI can show them immediately after login
  try {
    const savedUser = {
      email: user.email,
      fullName: user.fullName
    }
    localStorage.setItem('savedProfile', JSON.stringify(savedUser))
  } catch (e) {
    // ignore storage errors
  }

  const targetRoute = isEqual(user.roleName, ROLE_ADMIN) ? `${ROUTE.ADMIN.ROOT}/${ROUTE.ADMIN.DASHBOARD}` : ROUTE.HOME

  navigate(targetRoute)
}

export { processLoginSuccess }
