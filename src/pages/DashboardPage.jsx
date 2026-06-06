import { useState } from 'react'
import { useDeals } from '../context/DealContext'
import { calcDashboard, getIncomingPayments, fmt, fmtPct } from '../utils/deals'
import AddDealForm from '../components/AddDealForm'
import DealCard from '../components/DealCard'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const CASH_GOAL = 50000
const COMMISSION_GOAL = 5000

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDateFull(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.round((new Date(dateStr) - new Date()) / 86400000)
}

function DueBadge({ dueDate, received }) {
  if (received) return <span className="text-xs text-emerald-600 font-semibold">✓ Received</span>
  const days = daysUntil(dueDate)
  if (days === null) return null
  if (days < 0)  return <span className="text-xs font-bold text-red-500">Overdue {Math.abs(days)}d</span>
  if (days === 0) return <span className="text-xs font-bold text-orange-500">Due today</span>
  if (days <= 7)  return <span className="text-xs font-bold text-amber-500">Due in {days}d</span>
  return <span className="text-xs text-gray-400">{formatDate(dueDate)}</span>
}

function StatCard({ label, value, accent, bg, icon, sub }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center text-sm mb-3`}>
        {icon}
      </div>
      <div className={`text-xl font-bold ${accent}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { deals, markPaymentReceived } = useDeals()
  const now = new Date()
  const [view, setView] = useState('dashboard')
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())

  const stats = calcDashboard(deals, month, year)

  const monthDeals = deals.filter(d => {
    const dt = new Date(d.createdAt)
    return dt.getMonth() === month && dt.getFullYear() === year
  })

  // Incoming payments due this month from ANY deal (may be from prior months)
  const incoming = getIncomingPayments(deals, month, year)
  // Only show incoming from deals NOT signed this month (to avoid double-showing)
  const incomingFromPrior = incoming.filter(p => {
    const dt = new Date(p.deal.createdAt)
    return !(dt.getMonth() === month && dt.getFullYear() === year)
  })

  const incomingTotal     = incomingFromPrior.reduce((s, p) => s + p.amount, 0)
  const incomingReceived  = incomingFromPrior.filter(p => p.received).reduce((s, p) => s + p.amount, 0)
  const incomingPending   = incomingFromPrior.filter(p => !p.received).reduce((s, p) => s + p.amount, 0)
  const incomingCommission = incomingFromPrior.reduce((s, p) => s + p.amount * (p.deal.commissionRate / 100), 0)
  const incomingCommissionPending = incomingFromPrior.filter(p => !p.received).reduce((s, p) => s + p.amount * (p.deal.commissionRate / 100), 0)
  const incomingCommissionReceived = incomingFromPrior.filter(p => p.received).reduce((s, p) => s + p.amount * (p.deal.commissionRate / 100), 0)

  const cashPct       = Math.min((stats.cashCollected / CASH_GOAL) * 100, 100)
  const commissionPct = Math.min((stats.commissionEarned / COMMISSION_GOAL) * 100, 100)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear()
  const isFutureMonth  = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth())

  // ── Add deal view ──────────────────────────────────────────────────────────
  if (view === 'add') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">$</span>
              </div>
              <span className="text-xl font-bold text-gray-900">TJR Trades</span>
            </div>
            <button onClick={() => setView('dashboard')}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
              ← Back to dashboard
            </button>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-4 pt-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Add New Deal</h1>
          <p className="text-gray-500 text-sm mb-6">Fill in the details for your new deal.</p>
          <AddDealForm onSave={() => setView('dashboard')} />
        </div>
      </div>
    )
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">$</span>
            </div>
            <span className="text-xl font-bold text-gray-900">TJR Trades</span>
          </div>
          <button onClick={() => setView('add')}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">
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
          <button onClick={prevMonth}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg text-gray-500 hover:bg-gray-200 transition-colors">
            ‹
          </button>
          <div className="text-center min-w-[160px]">
            <span className="text-lg font-bold text-gray-900">{MONTHS[month]} {year}</span>
            {isCurrentMonth && <span className="ml-2 text-xs text-brand-500 font-semibold">Current</span>}
            {isFutureMonth  && <span className="ml-2 text-xs text-gray-400 font-medium">Future</span>}
          </div>
          <button onClick={nextMonth}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg text-gray-500 hover:bg-gray-200 transition-colors">
            ›
          </button>
        </div>

        {/* Goal progress */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-lg">Monthly Goal Progress</h2>
            <span className="text-sm text-gray-400">{stats.dealCount} deal{stats.dealCount !== 1 ? 's' : ''} closed</span>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-gray-700">Cash collected</span>
              <span className="text-gray-500">{fmt(stats.cashCollected)} <span className="text-gray-300">of</span> {fmt(CASH_GOAL)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${cashPct}%` }} />
            </div>
            <div className="text-xs text-gray-400 mt-1 text-right">{cashPct.toFixed(1)}% of goal</div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-gray-700">Commission earned</span>
              <span className="text-gray-500">{fmt(stats.commissionEarned)} <span className="text-gray-300">of</span> {fmt(COMMISSION_GOAL)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full transition-all duration-500" style={{ width: `${commissionPct}%` }} />
            </div>
            <div className="text-xs text-gray-400 mt-1 text-right">{commissionPct.toFixed(1)}% of goal</div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Cash Collected"     value={fmt(stats.cashCollected)}    accent="text-emerald-600" bg="bg-emerald-50"  icon="💰" sub="This month's closes" />
          <StatCard label="Commission Earned"  value={fmt(stats.commissionEarned)} accent="text-brand-600"   bg="bg-brand-50"    icon="✓"  sub="From cash in hand" />
          <StatCard label="Commission Pending" value={fmt(stats.commissionPending)} accent="text-amber-600"   bg="bg-amber-50"    icon="⏳" sub="From this month's deals" />
          <StatCard label="Contract Value"     value={fmt(stats.totalContractValue)} accent="text-gray-700"  bg="bg-gray-100"    icon="📄" sub="Deals closed this month" />
        </div>

        {/* ── INCOMING PAYMENTS ─────────────────────────────────────────────── */}
        {incomingFromPrior.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  Incoming Payments
                  <span className="text-sm font-normal text-gray-400">from prior deals</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Backend payments due in {MONTHS[month]} — money you should be collecting this month
                </p>
              </div>
              {/* Mini totals */}
              <div className="hidden sm:flex items-center gap-4 text-right">
                <div>
                  <p className="text-xs text-gray-400">Total due</p>
                  <p className="text-base font-bold text-gray-800">{fmt(incomingTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-500">Commission</p>
                  <p className="text-base font-bold text-emerald-600">{fmt(incomingCommission)}</p>
                </div>
              </div>
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white border border-dashed border-gray-200 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-0.5">Total due</p>
                <p className="font-bold text-gray-800">{fmt(incomingTotal)}</p>
              </div>
              <div className="bg-emerald-50 border border-dashed border-emerald-200 rounded-xl p-3 text-center">
                <p className="text-xs text-emerald-500 mb-0.5">Received</p>
                <p className="font-bold text-emerald-700">{fmt(incomingReceived)}</p>
                {incomingCommissionReceived > 0 && <p className="text-xs text-emerald-400">{fmt(incomingCommissionReceived)} comm.</p>}
              </div>
              <div className="bg-amber-50 border border-dashed border-amber-200 rounded-xl p-3 text-center">
                <p className="text-xs text-amber-500 mb-0.5">Still pending</p>
                <p className="font-bold text-amber-700">{fmt(incomingPending)}</p>
                {incomingCommissionPending > 0 && <p className="text-xs text-amber-400">{fmt(incomingCommissionPending)} comm.</p>}
              </div>
            </div>

            {/* Payment rows */}
            <div className="space-y-2">
              {incomingFromPrior.map(p => {
                const rate = p.deal.commissionRate / 100
                const commAmt = p.amount * rate
                const dealMonth = new Date(p.deal.createdAt)
                const dealMonthLabel = `${MONTHS[dealMonth.getMonth()].slice(0, 3)} ${dealMonth.getFullYear()}`

                return (
                  <div key={p.id}
                    className={`flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border transition-all ${
                      p.received
                        ? 'bg-white border-gray-100 opacity-60'
                        : 'bg-white border-gray-100 hover:border-brand-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Amount */}
                      <div className={`text-lg font-bold shrink-0 ${p.received ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {fmt(p.amount)}
                      </div>

                      {/* Client + origin */}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{p.deal.clientName}</p>
                        <p className="text-xs text-gray-400">
                          Deal from <span className="font-medium">{dealMonthLabel}</span>
                          {p.deal.clientEmail && <> · <a href={`mailto:${p.deal.clientEmail}`} className="text-brand-400 hover:text-brand-600">{p.deal.clientEmail}</a></>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Commission on this payment */}
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400">Commission</p>
                        <p className={`text-sm font-bold ${p.received ? 'text-emerald-500' : 'text-amber-500'}`}>{fmt(commAmt)}</p>
                      </div>

                      {/* Due date + status */}
                      <div className="text-right">
                        <DueBadge dueDate={p.dueDate} received={p.received} />
                        {!p.received && <p className="text-xs text-gray-300 mt-0.5">{formatDateFull(p.dueDate)}</p>}
                      </div>

                      {/* Mark received */}
                      {!p.received && (
                        <button
                          onClick={() => markPaymentReceived(p.deal.id, p.id)}
                          className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors whitespace-nowrap"
                        >
                          Mark received
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── DEALS CLOSED THIS MONTH ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-lg">
              Deals closed in {MONTHS[month]}
              <span className="ml-2 text-sm font-normal text-gray-400">({monthDeals.length})</span>
            </h2>
          </div>

          {monthDeals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="font-semibold text-gray-700 mb-1">No deals closed in {MONTHS[month]}</div>
              <div className="text-sm text-gray-400 mb-4">
                {isFutureMonth ? 'Navigate back to log a deal' : 'Add your first deal for this month'}
              </div>
              {!isFutureMonth && (
                <button onClick={() => setView('add')}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold text-sm transition-colors">
                  + Add Deal
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monthDeals.map(deal => <DealCard key={deal.id} deal={deal} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
