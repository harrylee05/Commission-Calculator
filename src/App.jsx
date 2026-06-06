import { DealProvider } from './context/DealContext'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <DealProvider>
      <DashboardPage />
    </DealProvider>
  )
}
