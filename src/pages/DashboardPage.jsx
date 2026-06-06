import { useState } from 'react'
import { useDeals } from '../context/DealContext'
import { calcDashboard, fmt, fmtPct } from '../utils/deals'
import AddDealForm from '../components/AddDealForm'
import DealCard from '../components/DealCard'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const CASH_GOAL = 50000
const COMMISSION_GOAL = 5000

export default function DashboardPage() {
  const { deals } = useDeals()
  const now = new Date()
  const [view, setView] = useState('dashboard') // 'dashboard' | 'add'
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())

  const stats = calcDashboard(deals, month, year)

  // Filter deals for current month
  const monthDeals = deals.filter((d) => {
    const dt = new Date(d.createdAt)
    return dt.getMonth() === month && dt.getFullYear() === year
  })

  const cashPct = Math.min((stats.cashCollected / CASH_GOAL) * 100, 100)
  const commissionPct = Math.min((stats.commissionEarned / COMMISSION_GOAL) * 100, 100)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    const today = new Date()
    if (year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth())) return
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  if (view === 'add') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-brand-600">$</span>
              <span className="text-xl font-bold text-gray-900">TJR Trades</span>
            </div>
            <button
              onClick={() => setView('dashboard')}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← Back to dashboard
            </button>
          </div>
        </header>
        <div className="max-w-3xl mx-auto">
          <div className="px-4 pt-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Add New Deal</h1>
            <p className="text-gray-500 text-sm mb-6">Fill in the details for your new deal.</p>
          </div>
          <AddDealForm onSave={() => setView('dashboard')} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">$</span>
            </div>
            <span className="text-xl font-bold text-gray-900">TJR Trades</span>
          </div>
          <button
            onClick={() => setView('add')}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Deal
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Month picker */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="text-lg font-bold text-gray-900 min-w-[160px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        {/* Goal progress card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-lg">Monthly Goal Progress</h2>
            <span className="text-sm text-gray-400">{stats.dealCount} deal{stats.dealCount !== 1 ? 's' : ''}</span>
          </div>

          {/* Cash collected progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-gray-700">Cash collected</span>
              <span className="text-gray-500">{fmt(stats.cashCollected)} of {fmt(CASH_GOAL)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${cashPct}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1 text-right">{cashPct.toFixed(1)}% of goal</div>
          </div>

          {/* Commission progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-gray-700">Commission earned</span>
              <span className="text-gray-500">{fmt(stats.commissionEarned)} of {fmt(COMMISSION_GOAL)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 rounded-full transition-all duration-500"
                style={{ width: `${commissionPct}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1 text-right">{commissionPct.toFixed(1)}% of goal</div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Cash Collected"
            value={fmt(stats.cashCollected)}
            accent="text-emerald-600"
            bg="bg-emerald-50"
            icon="💰"
          />
          <StatCard
            label="Commission Earned"
            value={fmt(stats.commissionEarned)}
            accent="text-brand-600"
            bg="bg-brand-50"
            icon="✓"
          />
          <StatCard
            label="Commission Pending"
            value={fmt(stats.commissionPending)}
            accent="text-amber-600"
            bg="bg-amber-50"
            icon="⏳"
          />
          <StatCard
            label="Contract Value"
            value={fmt(stats.totalContractValue)}
            accent="text-gray-700"
            bg="bg-gray-100"
            icon="📄"
          />
        </div>

        {/* Deal list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-lg">
              Deals this month
              <span className="ml-2 text-sm font-normal text-gray-400">({monthDeals.length})</span>
            </h2>
          </div>

          {monthDeals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="font-semibold text-gray-700 mb-1">No deals yet</div>
              <div className="text-sm text-gray-400 mb-4">Add your first deal for {MONTHS[month]} {year}</div>
              <button
                onClick={() => setView('add')}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                + Add Deal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monthDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, accent, bg, icon }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center text-sm mb-3`}>
        {icon}
      </div>
      <div className={`text-xl font-bold ${accent}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
    </div>
  )
}
