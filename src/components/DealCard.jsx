import { useState } from 'react'
import { useDeals } from '../context/DealContext'
import { calcDeal, fmt, fmtPct, DEAL_TYPE_LABELS, DEAL_TYPE_COLORS } from '../utils/deals'

const BADGE = {
  blue:   'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  green:  'bg-green-100 text-green-700',
}

const METHOD_LABELS = {
  cash:           '💵 Cash',
  payva:          '⚡ Payva',
  split_2500:     '✂️ $2.5k Split',
  split_2000_1500:'🔀 $2k + 2×$1.5k',
  custom:         '🔧 Custom Split',
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = Math.round((new Date(dateStr) - new Date()) / 86400000)
  return diff
}

function DueDateChip({ dueDate }) {
  const days = daysUntil(dueDate)
  if (days === null) return null
  if (days < 0)  return <span className="text-xs text-red-500 font-semibold">Overdue {Math.abs(days)}d</span>
  if (days === 0) return <span className="text-xs text-orange-500 font-semibold">Due today</span>
  if (days <= 7)  return <span className="text-xs text-amber-600 font-semibold">Due in {days}d</span>
  return <span className="text-xs text-gray-400">{formatDate(dueDate)}</span>
}

export default function DealCard({ deal }) {
  const { deleteDeal, markPaymentReceived } = useDeals()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showPayments, setShowPayments] = useState(false)

  const calc = calcDeal(deal)
  const color = DEAL_TYPE_COLORS[deal.type] || 'blue'
  const badge = BADGE[color]

  const isPayva = deal.paymentMethod === 'payva'
  const isCash  = deal.paymentMethod === 'cash'
  const hasBackend = deal.backendPayments?.length > 0

  const pendingPayments  = (deal.backendPayments || []).filter(p => !p.received)
  const receivedPayments = (deal.backendPayments || []).filter(p => p.received)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Top accent bar */}
      <div className={`h-1 ${color === 'blue' ? 'bg-blue-400' : color === 'purple' ? 'bg-purple-400' : color === 'orange' ? 'bg-orange-400' : 'bg-green-400'}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badge}`}>
              {DEAL_TYPE_LABELS[deal.type]}
            </span>
            {deal.paymentMethod && (
              <span className="text-xs text-gray-400 font-medium">
                {METHOD_LABELS[deal.paymentMethod] ?? deal.paymentMethod}
              </span>
            )}
          </div>
          {/* Delete */}
          <div className="flex items-center gap-1 shrink-0">
            {confirmDelete ? (
              <>
                <span className="text-xs text-red-600 font-medium">Delete?</span>
                <button onClick={() => deleteDeal(deal.id)}
                  className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600">Yes</button>
                <button onClick={() => setConfirmDelete(false)}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200">No</button>
              </>
            ) : (
              <button onClick={() => setConfirmDelete(true)} title="Delete"
                className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Client */}
        <div className="font-bold text-gray-900 text-base leading-tight">{deal.clientName}</div>
        {deal.clientEmail && (
          <a href={`mailto:${deal.clientEmail}`}
            className="text-xs text-brand-500 hover:text-brand-700 transition-colors">
            {deal.clientEmail}
          </a>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 flex-wrap">
          <span>{fmt(deal.contractValue)}</span>
          <span>·</span>
          <span>{fmtPct(deal.commissionRate)} commission</span>
          <span>·</span>
          <span>{formatDate(deal.createdAt)}</span>
        </div>

        {/* Payment structure summary */}
        <div className="mt-3 text-xs text-gray-500">
          {isPayva
            ? <span className="text-green-600 font-medium">⚡ Payva — full commission earned</span>
            : isCash
            ? <span className="text-green-600 font-medium">💵 Cash in full — {fmt(deal.upfront)}</span>
            : (
              <span>
                {fmt(deal.upfront)} upfront
                {hasBackend && ` + ${pendingPayments.length} pending / ${receivedPayments.length} received`}
              </span>
            )
          }
        </div>

        {/* Commission split bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-emerald-600">Earned {fmt(calc.earnedCommission)}</span>
            {calc.pendingCommission > 0 && (
              <span className="font-semibold text-amber-500">Pending {fmt(calc.pendingCommission)}</span>
            )}
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex">
            {calc.totalCommission > 0 && (
              <>
                <div className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(calc.earnedCommission / calc.totalCommission) * 100}%` }} />
                {calc.pendingCommission > 0 && (
                  <div className="h-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${(calc.pendingCommission / calc.totalCommission) * 100}%` }} />
                )}
              </>
            )}
          </div>
        </div>

        {/* Backend payments */}
        {hasBackend && (
          <div className="mt-4 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => setShowPayments(p => !p)}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              <span>
                Payments — {pendingPayments.length} pending · {receivedPayments.length} received
              </span>
              <svg className={`w-3.5 h-3.5 transition-transform ${showPayments ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showPayments && (
              <div className="mt-2 space-y-2">
                {deal.backendPayments.map((p, idx) => (
                  <div key={p.id} className={`flex items-center justify-between p-2.5 rounded-xl text-sm ${
                    p.received ? 'bg-emerald-50' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-xs w-4">#{idx + 1}</span>
                      <span className="font-semibold text-gray-800">{fmt(p.amount)}</span>
                      {p.received
                        ? <span className="text-xs text-emerald-600 font-medium">✓ {p.receivedDate ? formatDate(p.receivedDate) : 'Received'}</span>
                        : <DueDateChip dueDate={p.dueDate} />
                      }
                    </div>
                    {!p.received && (
                      <button
                        onClick={() => markPaymentReceived(deal.id, p.id)}
                        className="text-xs font-semibold px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                      >
                        Mark received
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {deal.notes && (
          <p className="mt-3 text-xs text-gray-400 italic border-t border-gray-100 pt-2.5">
            {deal.notes}
          </p>
        )}
      </div>
    </div>
  )
}
