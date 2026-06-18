import { useRequestStore } from '@/core/store/features/analyze-request/useRequestStore'

import AnalysisResponse from './components/analyze-response'
import LoadingResponse from './components/loading'
import MainMenu from './components/main-menu'

export default function UserDashboard() {
  const status = useRequestStore((status) => status.status)
  return (
    <div className='lg:p-6 flex-1 flex flex-col'>
      {status === "" && (
        <MainMenu/>
      )}
      {status === "loading" && (
        <LoadingResponse/>
      )}
      {status === "analyzed" && (
        <AnalysisResponse/>
      )}
    </div>
  )
}