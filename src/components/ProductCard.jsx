import { calcProduct, fmt, fmtPct } from '../utils/commission'
import { useProducts } from '../context/ProductContext'

export default function ProductCard({ product, onEdit }) {
  const { deleteProduct } = useProducts()
  const c = calcProduct(product)

  const coveragePct = product.contractValue > 0
    ? Math.min(100, (c.cashCollected / c.contractValue) * 100)
    : 0

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-base">{product.name || 'Untitled Product'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {fmtPct(product.commissionPercent)} commission · Added {new Date(product.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
            <button
              onClick={() => onEdit(product)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition"
              title="Edit"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => deleteProduct(product.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
              title="Delete"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="p-5 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Contract Value</p>
          <p className="text-sm font-semibold text-gray-800">{fmt(c.contractValue)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Product Price</p>
          <p className="text-sm font-semibold text-gray-800">{fmt(c.productPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Cash Collected</p>
          <p className="text-sm font-semibold text-green-600">{fmt(c.cashCollected)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Payments</p>
          <p className="text-sm font-semibold text-gray-800">
            {c.numPayments > 0 ? `${c.numPayments} × ${fmt(c.paymentAmount)}` : '—'}
          </p>
        </div>
      </div>

      {/* Commission breakdown */}
      <div className="mx-5 mb-5 rounded-xl bg-brand-50 border border-brand-100 p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">Commission</span>
          <span className="text-base font-bold text-brand-700">{fmt(c.totalCommission)}</span>
        </div>
        <div className="flex justify-between text-xs text-brand-600 mb-3">
          <span>Earned now: {fmt(c.cashCommission)}</span>
          <span>Future: {fmt(c.futureCommission)}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-brand-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${coveragePct}%` }}
          />
        </div>
        <p className="text-xs text-brand-400 mt-1.5">{Math.round(coveragePct)}% collected upfront</p>
      </div>
    </div>
  )
}
