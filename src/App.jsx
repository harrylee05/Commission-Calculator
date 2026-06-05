import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import CalculatorPage from './pages/CalculatorPage'

function AppContent() {
  const { user } = useAuth()
  return user ? <CalculatorPage /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
