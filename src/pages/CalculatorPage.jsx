import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import LineItemRow from '../components/LineItemRow'
import CommissionSummary from '../components/CommissionSummary'
import { calculateTotals, formatCurrency } from '../utils/commission'

let nextId = 1
function makeItem() {
  return { id: nextId++, name: '', quantity: '1', price: '' }
}

export default function CalculatorPage() {
  const { user, logout } = useAuth()
  const [lineItems, setLineItems] = useState([makeItem()])
  const [cashCollected, setCashCollected] = useState('')
  const [installments, setInstallments] = useState('')
  const [installmentAmount, setInstallmentAmount] = useState('')
  const [saleName, setSaleName] = useState('')

  const totals = useMemo(
    () => calculateTotals(lineItems, cashCollected, installments, installmentAmount),
    [lineItems, cashCollected, installments, installmentAmount]
  )

  function updateItem(id, field, value) {
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setLineItems(prev => [...prev, makeItem()])
  }

  function removeItem(id) {
    setLineItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev)
  }

  function handleReset() {
    nextId = 1
    setLineItems([makeItem()])
    setCashCollected('')
    setInstallments('')
    setInstallmentAmount('')
    setSaleName('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl flex items-center justify-center shadow">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-none">CommissionPro</h1>
              <p className="text-xs text-gray-400 mt-0.5">Sales Calculator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                {user.avatar}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 leading-none">{user.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Commission Calculator</h2>
            <p className="text-gray-500 mt-1 text-sm">Add your products, enter payment details, and see your commission instantly.</p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 px-4 py-2 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 transition font-medium shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: main form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Sale name */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sale Name / Reference</label>
              <input
                value={saleName}
                onChange={e => setSaleName(e.target.value)}
                placeholder="e.g. Acme Corp — Q3 Deal"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
              />
            </div>

            {/* Line items */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 pb-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">Products & Services</h3>
                <p className="text-xs text-gray-400 mt-0.5">Add each product or service as a line item.</p>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-12 gap-3 px-6 py-2.5 bg-gray-50 border-b border-gray-100">
                <div className="col-span-1" />
                <div className="col-span-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product / Service</div>
                <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Qty</div>
                <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit Price</div>
                <div className="col-span-1 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total</div>
                <div className="col-span-1" />
              </div>

              <div className="p-6 pt-3 space-y-2">
                {lineItems.map((item, index) => (
                  <LineItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    onChange={updateItem}
                    onRemove={removeItem}
                    isOnly={lineItems.length === 1}
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 pb-5 flex items-center justify-between">
                <button
                  onClick={addItem}
                  className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 px-3 py-2 rounded-xl hover:bg-brand-50 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add line item
                </button>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Subtotal</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(totals.subtotal)}</p>
                </div>
              </div>
            </div>

            {/* Payment details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-5">Payment Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Cash collected */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Cash Collected
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={cashCollected}
                      onChange={e => setCashCollected(e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Upfront payment received</p>
                </div>

                {/* Installments count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    # of Installments
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={installments}
                    onChange={e => setInstallments(e.target.value)}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Number of future payments</p>
                </div>

                {/* Installment amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Amount per Installment
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={installmentAmount}
                      onChange={e => setInstallmentAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Per payment amount</p>
                </div>
              </div>

              {/* Payment progress bar */}
              {totals.subtotal > 0 && (
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-500">Payment Coverage</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {Math.min(100, Math.round((totals.totalRevenue / totals.subtotal) * 100))}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (totals.totalRevenue / totals.subtotal) * 100)}%`,
                        background: totals.totalRevenue >= totals.subtotal
                          ? 'linear-gradient(to right, #22c55e, #16a34a)'
                          : 'linear-gradient(to right, #3b6ef5, #6090fa)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-gray-400">
                    <span>{formatCurrency(totals.totalRevenue)} collected</span>
                    <span>{formatCurrency(totals.subtotal)} total</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: summary panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900">Commission Summary</h3>
                {saleName && <p className="text-xs text-gray-400 mt-0.5 truncate">{saleName}</p>}
              </div>
              <CommissionSummary totals={totals} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
