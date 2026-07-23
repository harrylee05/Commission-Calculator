import { useState, useRef } from 'react'
import { useDeals } from '../context/DealContext'
import { calcDashboard, getIncomingPayments, fmt, COMMISSION_RATE } from '../utils/deals'
import AddDealForm from '../components/AddDealForm'
import DealCard from '../components/DealCard'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const GOAL_KEY = 'mmt_commission_goal'
const DEFAULT_GOAL = 10000

function loadGoal() {
  try {
    const v = localStorage.getItem(GOAL_KEY)
    return v ? parseFloat(v) : DEFAULT_GOAL
  } catch { return DEFAULT_GOAL }
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })
}

function formatDateFull(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.round((new Date(dateStr) - new Date()) / 86400000)
}

function DueBadge({ dueDate, received }) {
  if (received) return <span className="text-xs text-emerald-400 font-semibold">✓ Received</span>
  const days = daysUntil(dueDate)
  if (days === null) return null
  if (days < 0)  return <span className="text-xs font-bold text-red-400">Overdue {Math.abs(days)}d</span>
  if (days === 0) return <span className="text-xs font-bold text-amber-400">Due today</span>
  if (days <= 7)  return <span className="text-xs font-bold text-amber-400">Due in {days}d</span>
  return <span className="text-xs text-gray-500">{formatDate(dueDate)}</span>
}

function StatCard({ label, value, accentClass, icon, sub }) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
      <div className="text-xl mb-1">{icon}</div>
      <div className={`text-xl font-bold ${accentClass}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { deals, markPaymentReceived, exportDeals, importDeals } = useDeals()
  const importRef = useRef(null)
  const [importMsg, setImportMsg] = useState('')

  const now = new Date()
  const [view, setView] = useState('dashboard')
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())

  // Editable goal
  const [goal, setGoal] = useState(loadGoal)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalDraft, setGoalDraft] = useState('')

  function startEditGoal() {
    setGoalDraft(String(goal))
    setEditingGoal(true)
  }

  function saveGoal() {
    const v = parseFloat(goalDraft)
    if (!isNaN(v) && v > 0) {
      setGoal(v)
      localStorage.setItem(GOAL_KEY, String(v))
    }
    setEditingGoal(false)
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const count = await importDeals(file)
      setImportMsg(`✓ Imported ${count} deal${count !== 1 ? 's' : ''}`)
    } catch (err) {
      setImportMsg(`⚠ ${err.message}`)
    }
    e.target.value = ''
    setTimeout(() => setImportMsg(''), 4000)
  }

  const stats = calcDashboard(deals, month, year)

  const monthDeals = deals
    .filter(d => {
      const dt = new Date(d.createdAt)
      return dt.getMonth() === month && dt.getFullYear() === year
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const incoming = getIncomingPayments(deals, month, year)
  const incomingFromPrior = incoming.filter(p => {
    const dt = new Date(p.deal.createdAt)
    return !(dt.getMonth() === month && dt.getFullYear() === year)
  })

  const incomingTotal            = incomingFromPrior.reduce((s, p) => s + p.amount, 0)
  const incomingReceived         = incomingFromPrior.filter(p => p.received).reduce((s, p) => s + p.amount, 0)
  const incomingPending          = incomingFromPrior.filter(p => !p.received).reduce((s, p) => s + p.amount, 0)
  const incomingCommission       = incomingFromPrior.reduce((s, p) => s + p.amount * COMMISSION_RATE, 0)
  const incomingCommissionPending  = incomingFromPrior.filter(p => !p.received).reduce((s, p) => s + p.amount * COMMISSION_RATE, 0)
  const incomingCommissionReceived = incomingFromPrior.filter(p => p.received).reduce((s, p) => s + p.amount * COMMISSION_RATE, 0)

  const allIncomingTotal    = incoming.reduce((s, p) => s + p.amount, 0)
  const allIncomingReceived = incoming.filter(p => p.received).reduce((s, p) => s + p.amount, 0)
  const recurringsPct = allIncomingTotal > 0 ? Math.min((allIncomingReceived / allIncomingTotal) * 100, 100) : 0

  const commissionPct = Math.min((stats.commissionEarned / goal) * 100, 100)

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

  // ── Add Deal View ──────────────────────────────────────────────────────────
  if (view === 'add') {
    return (
      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-gray-950 font-bold text-sm">$</span>
              </div>
              <span className="text-xl font-bold text-white">Make Money Trading</span>
            </div>
            <button onClick={() => setView('dashboard')}
              className="text-sm text-gray-400 hover:text-white font-medium transition-colors">
              ← Back to dashboard
            </button>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-4 pt-6">
          <h1 className="text-2xl font-bold text-white mb-1">Add New Deal</h1>
          <p className="text-gray-500 text-sm mb-6">Fill in the details for your new deal.</p>
          <AddDealForm onSave={() => setView('dashboard')} />
        </div>
      </div>
    )
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10 relative">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-gray-950 font-bold text-sm">$</span>
            </div>
            <span className="text-xl font-bold text-white">Make Money Trading</span>
          </div>
          <div className="flex items-center gap-2">
            <input ref={importRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            <button
              onClick={() => importRef.current.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-xl bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </button>
            <button
              onClick={exportDeals}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-xl bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            <button onClick={() => setView('add')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-xl font-semibold text-sm transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Deal
            </button>
          </div>
          {importMsg && (
            <div className="absolute top-16 right-4 bg-gray-800 border border-gray-700 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-lg z-20">
              {importMsg}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Month picker */}
        <div className="flex items-center gap-3">
          <button onClick={prevMonth}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg text-gray-500 hover:bg-gray-800 hover:text-white transition-colors">
            ‹
          </button>
          <div className="text-center min-w-[160px]">
            <span className="text-lg font-bold text-white">{MONTHS[month]} {year}</span>
            {isCurrentMonth && <span className="ml-2 text-xs text-amber-500 font-semibold">Current</span>}
            {isFutureMonth  && <span className="ml-2 text-xs text-gray-600 font-medium">Future</span>}
          </div>
          <button onClick={nextMonth}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg text-gray-500 hover:bg-gray-800 hover:text-white transition-colors">
            ›
          </button>
        </div>

        {/* Monthly Goal Progress */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-lg">Monthly Goal</h2>
              {editingGoal ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    value={goalDraft}
                    onChange={e => setGoalDraft(e.target.value)}
                    onBlur={saveGoal}
                    onKeyDown={e => { if (e.key === 'Enter') saveGoal() }}
                    autoFocus
                    className="w-28 px-2 py-0.5 bg-gray-800 border border-amber-500 rounded-lg text-sm text-white focus:outline-none"
                  />
                </div>
              ) : (
                <button
                  onClick={startEditGoal}
                  className="flex items-center gap-1 text-sm text-amber-400 font-semibold hover:text-amber-300 transition-colors"
                >
                  {fmt(goal)}
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
            <span className="text-sm text-gray-600">{stats.dealCount} deal{stats.dealCount !== 1 ? 's' : ''} closed</span>
          </div>

          {/* Recurrings bar */}
          {allIncomingTotal > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-gray-400">Recurrings collected</span>
                <span className="text-gray-500">
                  {fmt(allIncomingReceived)} <span className="text-gray-700">of</span> {fmt(allIncomingTotal)}
                  {allIncomingTotal - allIncomingReceived > 0 && (
                    <span className="ml-1.5 text-amber-500 font-medium text-xs">· {fmt(allIncomingTotal - allIncomingReceived)} pending</span>
                  )}
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${recurringsPct}%`,
                    background: recurringsPct >= 100 ? '#10b981' : 'linear-gradient(to right, #10b981, #f59e0b)',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-600">{incoming.filter(p => p.received).length} of {incoming.length} received</span>
                <span className="text-xs text-gray-600">{recurringsPct.toFixed(0)}% collected</span>
              </div>
            </div>
          )}

          {/* Commission earned bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-gray-400">Commission earned</span>
              <span className="text-gray-500">{fmt(stats.commissionEarned)} <span className="text-gray-700">of</span> {fmt(goal)}</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${commissionPct}%` }} />
            </div>
            <div className="text-xs text-gray-600 mt-1 text-right">{commissionPct.toFixed(1)}% of goal</div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Cash Collected"     value={fmt(stats.cashCollected)}       accentClass="text-emerald-400" icon="💰" sub="This month's closes" />
          <StatCard label="Commission Earned"  value={fmt(stats.commissionEarned)}    accentClass="text-amber-400"   icon="✓"  sub="From cash in hand" />
          <StatCard label="Commission Pending" value={fmt(stats.commissionPending)}   accentClass="text-amber-400"   icon="⏳" sub="Awaiting payments" />
          <StatCard label="Contract Value"     value={fmt(stats.totalContractValue)}  accentClass="text-gray-300"    icon="📄" sub="Deals closed" />
        </div>

        {/* Incoming Payments */}
        {incomingFromPrior.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-white text-lg flex items-center gap-2">
                  Incoming Payments
                  <span className="text-sm font-normal text-gray-500">from prior deals</span>
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Backend payments due in {MONTHS[month]} — money you should be collecting
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-right">
                <div>
                  <p className="text-xs text-gray-500">Total due</p>
                  <p className="text-base font-bold text-gray-200">{fmt(incomingTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-500">Commission</p>
                  <p className="text-base font-bold text-emerald-400">{fmt(incomingCommission)}</p>
                </div>
              </div>
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Total due</p>
                <p className="font-bold text-gray-200">{fmt(incomingTotal)}</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                <p className="text-xs text-emerald-500 mb-0.5">Received</p>
                <p className="font-bold text-emerald-400">{fmt(incomingReceived)}</p>
                {incomingCommissionReceived > 0 && <p className="text-xs text-emerald-600">{fmt(incomingCommissionReceived)} comm.</p>}
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                <p className="text-xs text-amber-500 mb-0.5">Still pending</p>
                <p className="font-bold text-amber-400">{fmt(incomingPending)}</p>
                {incomingCommissionPending > 0 && <p className="text-xs text-amber-600">{fmt(incomingCommissionPending)} comm.</p>}
              </div>
            </div>

            {/* Payment rows */}
            <div className="space-y-2">
              {incomingFromPrior.map(p => {
                const commAmt = p.amount * COMMISSION_RATE
                const dealMonth = new Date(p.deal.createdAt)
                const dealMonthLabel = `${MONTHS[dealMonth.getMonth()].slice(0, 3)} ${dealMonth.getFullYear()}`

                return (
                  <div key={p.id}
                    className={`flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border transition-all ${
                      p.received
                        ? 'bg-gray-900 border-gray-800 opacity-60'
                        : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`text-lg font-bold shrink-0 ${p.received ? 'text-gray-600 line-through' : 'text-white'}`}>
                        {fmt(p.amount)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-200 text-sm truncate">{p.deal.clientName}</p>
                        <p className="text-xs text-gray-500">
                          Deal from <span className="font-medium">{dealMonthLabel}</span>
                          {p.deal.clientEmail && <> · <a href={`mailto:${p.deal.clientEmail}`} className="text-amber-500 hover:text-amber-400">{p.deal.clientEmail}</a></>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-500">Commission</p>
                        <p className={`text-sm font-bold ${p.received ? 'text-emerald-400' : 'text-amber-400'}`}>{fmt(commAmt)}</p>
                      </div>
                      <div className="text-right">
                        <DueBadge dueDate={p.dueDate} received={p.received} />
                        {!p.received && <p className="text-xs text-gray-600 mt-0.5">{formatDateFull(p.dueDate)}</p>}
                      </div>
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

        {/* Deals closed this month */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white text-lg">
              Deals closed in {MONTHS[month]}
              <span className="ml-2 text-sm font-normal text-gray-500">({monthDeals.length})</span>
            </h2>
          </div>

          {monthDeals.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl border border-dashed border-gray-800 p-12 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="font-semibold text-gray-400 mb-1">No deals closed in {MONTHS[month]}</div>
              <div className="text-sm text-gray-600 mb-4">
                {isFutureMonth ? 'Navigate back to log a deal' : 'Add your first deal for this month'}
              </div>
              {!isFutureMonth && (
                <button onClick={() => setView('add')}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-xl font-semibold text-sm transition-colors">
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
