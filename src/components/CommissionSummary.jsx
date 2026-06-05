import { formatCurrency, COMMISSION_RATE } from '../utils/commission'

function StatCard({ label, value, sub, accent, large }) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-1 ${accent
      ? 'bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-900/30'
      : 'bg-white border border-gray-100 shadow-sm'
    }`}>
      <span className={`text-xs font-semibold uppercase tracking-wider ${accent ? 'text-brand-200' : 'text-gray-400'}`}>
        {label}
      </span>
      <span className={`font-bold leading-none ${large ? 'text-3xl' : 'text-2xl'} ${accent ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </span>
      {sub && <span className={`text-xs mt-0.5 ${accent ? 'text-brand-200' : 'text-gray-400'}`}>{sub}</span>}
    </div>
  )
}

function BreakdownRow({ label, value, highlight, muted }) {
  return (
    <div className={`flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0 ${highlight ? 'font-semibold' : ''}`}>
      <span className={`text-sm ${muted ? 'text-gray-400' : highlight ? 'text-gray-900' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm ${highlight ? 'text-brand-700 font-bold' : muted ? 'text-gray-400' : 'text-gray-800'}`}>{value}</span>
    </div>
  )
}

export default function CommissionSummary({ totals }) {
  const { subtotal, cash, futureRevenue, totalRevenue, commission, numInstallments, instAmt, balance } = totals

  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Your Commission"
          value={formatCurrency(commission)}
          sub={`${(COMMISSION_RATE * 100).toFixed(0)}% of sale total`}
          accent
          large
        />
        <StatCard
          label="Sale Total"
          value={formatCurrency(subtotal)}
          sub="Sum of all line items"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Cash Collected"
          value={formatCurrency(cash)}
          sub="Upfront payment"
        />
        <StatCard
          label="Future Revenue"
          value={formatCurrency(futureRevenue)}
          sub={numInstallments > 0 ? `${numInstallments} × ${formatCurrency(instAmt)}` : 'No installments'}
        />
      </div>

      {/* Breakdown */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Breakdown</h3>
        <BreakdownRow label="Sale Subtotal" value={formatCurrency(subtotal)} />
        <BreakdownRow label="Cash Collected" value={formatCurrency(cash)} />
        {numInstallments > 0 && (
          <>
            <BreakdownRow
              label={`Installments (${numInstallments} × ${formatCurrency(instAmt)})`}
              value={formatCurrency(futureRevenue)}
            />
          </>
        )}
        <BreakdownRow label="Total Collected / Planned" value={formatCurrency(totalRevenue)} />
        <BreakdownRow
          label="Outstanding Balance"
          value={formatCurrency(Math.max(0, balance))}
          muted={balance <= 0}
        />
        <div className="mt-3 pt-3 border-t border-gray-200">
          <BreakdownRow
            label={`Commission (${(COMMISSION_RATE * 100).toFixed(0)}%)`}
            value={formatCurrency(commission)}
            highlight
          />
        </div>
      </div>

      {/* Tip */}
      {balance > 0.005 && (
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
          </svg>
          <p className="text-sm text-amber-700">
            <strong>{formatCurrency(balance)}</strong> remains uncollected. Add more installments to cover the balance.
          </p>
        </div>
      )}

      {balance <= 0 && subtotal > 0 && (
        <div className="flex gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-700">
            Sale is fully covered. Great work!
          </p>
        </div>
      )}
    </div>
  )
}
