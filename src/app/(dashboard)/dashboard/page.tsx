import DashboardHome from '@/components/dashboard/DashboardHome'

export default function DashboardPage() {
  return <DashboardHome formattedDate={new Date().toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} onNavigate={() => {}} onNavigateWithCreate={() => {}} onPrefetch={() => {}} />
}
