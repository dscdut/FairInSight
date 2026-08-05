import { useCallback, useEffect, useState } from 'react'

import { AxiosError } from 'axios'
import { AlertCircle, Crown, RefreshCcw, Sparkles, UserCheck } from 'lucide-react'

import {
  cancelMyBillingSubscription,
  changeMyBillingPlan,
  listMyAiUsage,
  listMyBillingLedger
} from '@/api/billingApi'
import { Button } from '@/components/ui'
import { useBillingPlans, useMyBilling } from '@/hooks/billing/use-billing'
import {
  type BillingAiUsageItem,
  type BillingLedgerItem,
  type BillingPlanCatalogItem
} from '@/models/ai-chat/contracts'

import ExplorePlansView from './components/ExplorePlansView'
import MyPlanView from './components/MyPlanView'

const mutationError = (error: unknown) => {
  if (error instanceof AxiosError && error.response?.status === 422) {
    return 'Gói này cần thanh toán. Cổng thanh toán thử nghiệm đang ở chế độ chờ kích hoạt trong môi trường hiện tại.'
  }
  if (error instanceof AxiosError && error.response?.status === 403) {
    return 'Tài khoản của bạn không được phép thực hiện thao tác này.'
  }
  return 'Không thể cập nhật gói lúc này. Vui lòng thử lại sau.'
}

export default function Billing() {
  // Mặc định tab 1 là 'explore-plans' theo yêu cầu đảo ngược
  const [activeTab, setActiveTab] = useState<'explore-plans' | 'my-plan'>('explore-plans')
  const [plans, setPlans] = useState<BillingPlanCatalogItem[]>([])
  const [ledger, setLedger] = useState<BillingLedgerItem[]>([])
  const [usage, setUsage] = useState<BillingAiUsageItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [busyPlan, setBusyPlan] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const { data: account = null, refetch: refetchAccount } = useMyBilling()
  const { data: planCatalog = [], refetch: refetchPlans } = useBillingPlans()

  const load = useCallback(async () => {
    setState('loading')
    setNotice(null)
    try {
      const [accountResult, planResult, ledgerResult, usageResult] = await Promise.all([
        refetchAccount(),
        refetchPlans(),
        listMyBillingLedger(),
        listMyAiUsage()
      ])
      if (accountResult.error) throw accountResult.error
      if (planResult.error) throw planResult.error
      setPlans(planResult.data ?? [])
      setLedger(ledgerResult.items)
      setNextCursor(ledgerResult.nextCursor)
      setUsage(usageResult.items)
      setState('ready')
    } catch {
      setState('error')
    }
  }, [refetchAccount, refetchPlans])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (planCatalog.length) setPlans(planCatalog)
  }, [planCatalog])

  const changePlan = async (planCode: string) => {
    if (planCode === account?.plan.code || busyPlan) return
    setBusyPlan(planCode)
    setNotice(null)
    try {
      await changeMyBillingPlan(planCode)
      await load()
      setNotice(`Yêu cầu đổi sang gói ${planCode} đã được ghi nhận thành công.`)
    } catch (error) {
      setNotice(mutationError(error))
    } finally {
      setBusyPlan(null)
    }
  }

  const cancelSubscription = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy gia hạn gói cước vào cuối kỳ hiện tại?')) return
    setBusyPlan('cancel')
    setNotice(null)
    try {
      await cancelMyBillingSubscription()
      await load()
      setNotice('Hệ thống đã ghi nhận việc hủy gia hạn khi kết thúc kỳ cước hiện tại.')
    } catch (error) {
      setNotice(mutationError(error))
    } finally {
      setBusyPlan(null)
    }
  }

  const loadMoreLedger = async () => {
    if (!nextCursor) return
    try {
      const page = await listMyBillingLedger(nextCursor)
      setLedger((previous) => [...previous, ...page.items.filter((item) => !previous.some((old) => old.id === item.id))])
      setNextCursor(page.nextCursor)
    } catch (err) {
      console.error('Không tải được thêm lịch sử:', err)
    }
  }

  if (state === 'loading') {
    return (
      <div className='flex min-h-[500px] items-center justify-center p-8'>
        <div className='flex flex-col items-center gap-4 text-center'>
          <div className='h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent' />
          <p className='text-sm font-medium text-text-description animate-pulse'>Đang đối chiếu dữ liệu tài khoản & các gói cước...</p>
        </div>
      </div>
    )
  }

  if (state === 'error' || !account) {
    return (
      <div className='mx-auto max-w-xl p-8 text-center'>
        <div className='flex flex-col items-center justify-center gap-4 rounded-3xl border border-border-secondary bg-background-primary p-8 shadow-sm'>
          <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500'>
            <AlertCircle className='h-7 w-7' />
          </div>
          <h2 className='text-lg font-bold text-main'>Không thể kết nối dữ liệu gói cước</h2>
          <p className='text-sm text-text-description'>Hệ thống không thể tải thông tin tài khoản hoặc danh sách gói. Vui lòng kiểm tra lại kết nối mạng.</p>
          <Button variant='default' onClick={load} className='mt-2 gap-2 text-white'>
            <RefreshCcw className='h-4 w-4' /> Thử lại ngay
          </Button>
        </div>
      </div>
    )
  }

  return (
    <main className='mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8 w-full'>
      {/* Sticky Header Cố Định Không Bị Nhảy Vị Trí */}
      <header className='sticky top-0 z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pt-2 pb-4 bg-background-primary/95 backdrop-blur-md border-b border-border-secondary/60 space-y-3 transition-all'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-black tracking-tight text-main sm:text-3xl'>Quản Lý Gói Dịch Vụ & Cước Cụ</h1>
            <p className='text-xs sm:text-sm text-text-description mt-1'>
              Khám phá danh sách các gói dịch vụ FairInsight hoặc theo dõi tiến trình sử dụng gói cước cá nhân.
            </p>
          </div>

          {/* 2 Main Navigation Page Tabs (Thứ tự đảo ngược: Tab 1 Danh Sách Các Gói, Tab 2 Gói Của Tôi) */}
          <div className='inline-flex p-1 rounded-2xl bg-background-secondary border border-border-secondary shadow-2xs self-start sm:self-auto shrink-0'>
            <button
              onClick={() => setActiveTab('explore-plans')}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all ${
                activeTab === 'explore-plans'
                  ? 'bg-background-primary text-primary shadow-xs'
                  : 'text-text-description hover:text-main'
              }`}
            >
              <Crown className='h-4 w-4 text-amber-500' />
              Danh Sách Các Gói Cước
            </button>

            <button
              onClick={() => setActiveTab('my-plan')}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-extrabold rounded-xl transition-all ${
                activeTab === 'my-plan'
                  ? 'bg-background-primary text-primary shadow-xs'
                  : 'text-text-description hover:text-main'
              }`}
            >
              <UserCheck className='h-4 w-4' />
              Gói Của Tôi
            </button>
          </div>
        </div>

        {notice && (
          <div className='flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-3.5 text-xs sm:text-sm font-medium text-main shadow-sm animate-in fade-in slide-in-from-top-2'>
            <div className='flex items-center gap-2 text-primary'>
              <Sparkles className='h-4 w-4 shrink-0' />
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice(null)} className='text-xs font-semibold text-text-description hover:text-main'>Đóng</button>
          </div>
        )}
      </header>

      {/* RENDER VIEW THEO TAB ĐÃ CHỌN */}
      <div className='w-full'>
        {activeTab === 'explore-plans' ? (
          <ExplorePlansView
            plans={plans}
            currentPlanCode={account.plan.code}
            busyPlan={busyPlan}
            onSelectPlan={changePlan}
          />
        ) : (
          <MyPlanView
            account={account}
            ledger={ledger}
            usage={usage}
            nextCursor={nextCursor}
            busyPlan={busyPlan}
            onCancelSubscription={cancelSubscription}
            onLoadMoreLedger={loadMoreLedger}
            onSwitchToPlansTab={() => setActiveTab('explore-plans')}
          />
        )}
      </div>
    </main>
  )
}
