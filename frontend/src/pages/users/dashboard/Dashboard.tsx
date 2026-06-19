
import MainMenu from './components/main-menu'

export default function UserDashboard() {
  // const status = useRequestStore((status) => status.status)
  return (
    <div className='lg:p-6 flex-1 flex flex-col'>
      <MainMenu/>
    </div>
  )
}