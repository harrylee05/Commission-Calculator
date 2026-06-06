import { AuthProvider, useAuth } from './context/AuthContext'
import { ProductProvider } from './context/ProductContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'

function AppContent() {
  const { user } = useAuth()
  return user ? <DashboardPage /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <AppContent />
      </ProductProvider>
    </AuthProvider>
  )
}
