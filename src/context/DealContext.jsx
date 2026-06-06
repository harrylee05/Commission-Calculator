import { createContext, useContext, useState, useEffect } from 'react'

const DealContext = createContext(null)

const STORAGE_KEY = 'tjr_deals'

export function DealProvider({ children }) {
  const [deals, setDeals] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deals))
  }, [deals])

  function addDeal(deal) {
    setDeals((prev) => [deal, ...prev])
  }

  function updateDeal(id, updates) {
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    )
  }

  function deleteDeal(id) {
    setDeals((prev) => prev.filter((d) => d.id !== id))
  }

  function markPaymentReceived(dealId, paymentId) {
    const today = new Date().toISOString().split('T')[0]
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== dealId) return d
        return {
          ...d,
          backendPayments: d.backendPayments.map((p) =>
            p.id === paymentId
              ? { ...p, received: true, receivedDate: today }
              : p
          ),
        }
      })
    )
  }

  return (
    <DealContext.Provider
      value={{ deals, addDeal, updateDeal, deleteDeal, markPaymentReceived }}
    >
      {children}
    </DealContext.Provider>
  )
}

export function useDeals() {
  const ctx = useContext(DealContext)
  if (!ctx) throw new Error('useDeals must be used within DealProvider')
  return ctx
}
