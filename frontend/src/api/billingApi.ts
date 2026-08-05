import axiosClient from '@/core/services/axios-client'
import {
  type BillingAccountSummary,
  type BillingAiUsagePage,
  type BillingLedgerPage,
  type BillingPlanCatalogItem
} from '@/models/ai-chat/contracts'

interface BillingEnvelope<T> {
  data: T
}

export async function listBillingPlans(): Promise<BillingPlanCatalogItem[]> {
  const response = await axiosClient.get<BillingEnvelope<BillingPlanCatalogItem[]>, BillingEnvelope<BillingPlanCatalogItem[]>>('/billing/plans')
  return response.data
}

export async function getMyBilling(): Promise<BillingAccountSummary> {
  const response = await axiosClient.get<BillingEnvelope<BillingAccountSummary>, BillingEnvelope<BillingAccountSummary>>('/billing/me')
  return response.data
}

export async function listMyBillingLedger(cursor?: string | null, size = 20): Promise<BillingLedgerPage> {
  const response = await axiosClient.get<BillingEnvelope<BillingLedgerPage>, BillingEnvelope<BillingLedgerPage>>(
    '/billing/ledger',
    { params: { ...(cursor ? { cursor } : {}), size } }
  )
  return response.data
}

export async function listMyAiUsage(cursor?: string | null, size = 20): Promise<BillingAiUsagePage> {
  const response = await axiosClient.get<BillingEnvelope<BillingAiUsagePage>, BillingEnvelope<BillingAiUsagePage>>(
    '/billing/usage',
    { params: { ...(cursor ? { cursor } : {}), size } }
  )
  return response.data
}

export async function changeMyBillingPlan(planCode: string): Promise<void> {
  await axiosClient.post('/billing/subscriptions/change', { planCode })
}

export async function cancelMyBillingSubscription(): Promise<void> {
  await axiosClient.post('/billing/subscriptions/cancel')
}

export function hasBillingEntitlement(
  billing: BillingAccountSummary | null,
  entitlement: string
): boolean | null {
  if (!billing) return null
  return billing.entitlements[entitlement] === true
}
