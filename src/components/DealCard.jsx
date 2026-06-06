import { useState } from 'react'
import { useDeals } from '../context/DealContext'
import { calcDeal, fmt, fmtPct, DEAL_TYPE_LABELS, DEAL_TYPE_COLORS } from '../utils/deals'

const COLOR_MAP = {
  blue: {
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-blue-200',
  },
  purple: {
    badge: 'bg-purple-100 text-purple-700',
    border: 'border-purple-200',
  },
  orange: {
    badge: 'bg-orange-100 text-orange-700',
    border: 'border-orange-200',
  },
  green: {
    badge: 'bg-green-100 text-green-700',
    border: 'border-green-200',
  },
}

function formatDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DealCard({ deal }) {
  const { deleteDeal, markPaymentReceived } = useDeals()
  const [showControls, setShowControls] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const calc = calcDeal(deal)
  const color = DEAL_TYPE_COLORS[deal.type] || 'blue'
  const colors = COLOR_MAP[color]

  const numPayments = deal.backendPayments?.length || 0
  const paymentAmount = numPayments > 0 ? deal.backendPayments[0].amount : 0

  function handleDelete() {
    if (confirmDelete) {
      deleteDeal(deal.id)
    } else {
      setConfirmDelete(true)
    }
  }

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative group transition-shadow hover:shadow-md"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => { setShowControls(false); setConfirmDelete(false) }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors.badge}`}>
            {DEAL_TYPE_LABELS[deal.type]}
          </span>
          <span className="text-xs text-gray-400">{formatDate(deal.createdAt)}</span>
        </div>
        {/* Edit / Delete — reveal on hover */}
        <div className={`flex items-center gap-1 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-red-600 font-medium">Delete?</span>
              <button
                onClick={handleDelete}
                className="px-2 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete deal"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Client name */}
      <div className="font-bold text-gray-900 text-lg leading-tight mb-1">{deal.clientName}</div>

      {/* Contract & rate */}
      <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
        <span className="font-semibold text-gray-700">{fmt(deal.contractValue)}</span>
        <span>·</span>
        <span>{fmtPct(deal.commissionRate)} commission</span>
      </div>

      {/* Payment structure summary */}
      {deal.type !== 'payva' && (
        <div className="text-sm text-gray-500 mb-4">
          {fmt(deal.upfront)} upfront
          {numPayments > 0 && (
            <span> + {numPayments} × {fmt(paymentAmount)}</span>
          )}
        </div>
      )}

      {/* Commission split bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium text-emerald-600">Earned {fmt(calc.earnedCommission)}</span>
          {calc.pendingCommission > 0 && (
            <span className="font-medium text-amber-500">Pending {fmt(calc.pendingCommission)}</span>
          )}
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex">
          {calc.totalCommission > 0 && (
            <>
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(calc.earnedCommission / calc.totalCommission) * 100}%` }}
              />
              {calc.pendingCommission > 0 && (
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${(calc.pendingCommission / calc.totalCommission) * 100}%` }}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Backend payments */}
      {deal.type !== 'payva' && deal.backendPayments && deal.backendPayments.length > 0 && (
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Backend payments</div>
          {deal.backendPayments.map((payment, idx) => (
            <div key={payment.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">#{idx + 1}</span>
                <span className="font-medium text-gray-700">{fmt(payment.amount)}</span>
                {payment.received ? (
                  <span className="text-xs text-emerald-600 font-medium">
                    ✓ Received {payment.receivedDate || ''}
                  </span>
                ) : (
                  <span className="text-xs text-amber-500 font-medium">Pending</span>
                )}
              </div>
              {!payment.received && (
                <button
                  onClick={() => markPaymentReceived(deal.id, payment.id)}
                  className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-lg hover:bg-emerald-100 transition-colors font-medium border border-emerald-200"
                >
                  Mark received
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payva note */}
      {deal.type === 'payva' && (
        <div className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
          Full commission earned — client repays Payva directly
        </div>
      )}

      {/* Notes */}
      {deal.notes && (
        <div className="mt-3 text-xs text-gray-500 italic border-t border-gray-100 pt-2">
          {deal.notes}
        </div>
      )}
    </div>
  )
}
