import { createContext, useContext, useState, useEffect } from 'react'

const DealContext = createContext(null)

const STORAGE_KEY = 'mmt_deals'

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

  function exportDeals() {
    const json = JSON.stringify(deals, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `mmt-deals-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importDeals(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        try {
          const parsed = JSON.parse(e.target.result)
          if (!Array.isArray(parsed)) throw new Error('Invalid format')
          setDeals(parsed)
          resolve(parsed.length)
        } catch {
          reject(new Error('Could not read file — make sure it\'s a valid MMT export.'))
        }
      }
      reader.readAsText(file)
    })
  }

  return (
    <DealContext.Provider
      value={{ deals, addDeal, updateDeal, deleteDeal, markPaymentReceived, exportDeals, importDeals }}
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
