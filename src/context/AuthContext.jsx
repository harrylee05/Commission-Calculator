import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const DEMO_USERS = [
  { id: 1, email: 'alex@salesteam.com', password: 'demo123', name: 'Alex Johnson', role: 'Senior Sales Rep', avatar: 'AJ' },
  { id: 2, email: 'sam@salesteam.com', password: 'demo123', name: 'Sam Rivera', role: 'Sales Rep', avatar: 'SR' },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  function login(email, password) {
    const found = DEMO_USERS.find(u => u.email === email && u.password === password)
    if (found) {
      setUser(found)
      setError('')
      return true
    }
    setError('Invalid email or password.')
    return false
  }

  function logout() {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, error, setError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
