import { useQuery } from '@tanstack/react-query'

import { getMyBilling, listBillingPlans } from '@/api/billingApi'
import { useAuthStore } from '@/core/store/features/auth/authStore'

export const BILLING_PLANS_QUERY_KEY = ['billing', 'plans'] as const

export const useMyBilling = () => {
  const userId = useAuthStore((state) => state.user?.userId)
  return useQuery({
    queryKey: ['billing', 'me', userId],
    queryFn: getMyBilling,
    enabled: Boolean(userId),
    staleTime: 30_000,
    retry: false
  })
}

export const useBillingPlans = () => useQuery({
  queryKey: BILLING_PLANS_QUERY_KEY,
  queryFn: listBillingPlans,
  staleTime: 5 * 60_000,
  retry: false
})
