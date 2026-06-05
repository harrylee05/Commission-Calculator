import { formatCurrency } from '../utils/commission'

const PRODUCT_SUGGESTIONS = [
  'Enterprise License',
  'Professional License',
  'Starter Package',
  'Add-on Module',
  'Support & Maintenance',
  'Training Package',
  'Implementation Services',
  'Custom Integration',
]

export default function LineItemRow({ item, index, onChange, onRemove, isOnly }) {
  const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)

  return (
    <div className="group grid grid-cols-12 gap-3 items-center p-3 rounded-xl bg-gray-50 hover:bg-brand-50 border border-transparent hover:border-brand-100 transition-all duration-200">
      {/* Row number */}
      <div className="col-span-1 text-center">
        <span className="text-xs font-medium text-gray-400 group-hover:text-brand-400 transition">{index + 1}</span>
      </div>

      {/* Product name */}
      <div className="col-span-5">
        <input
          list={`products-${index}`}
          value={item.name}
          onChange={e => onChange(item.id, 'name', e.target.value)}
          placeholder="Product / service name"
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
        />
        <datalist id={`products-${index}`}>
          {PRODUCT_SUGGESTIONS.map(s => <option key={s} value={s} />)}
        </datalist>
      </div>

      {/* Quantity */}
      <div className="col-span-2">
        <input
          type="number"
          min="1"
          step="1"
          value={item.quantity}
          onChange={e => onChange(item.id, 'quantity', e.target.value)}
          placeholder="Qty"
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition text-center"
        />
      </div>

      {/* Unit price */}
      <div className="col-span-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.price}
            onChange={e => onChange(item.id, 'price', e.target.value)}
            placeholder="0.00"
            className="w-full bg-white border border-gray-200 rounded-lg pl-6 pr-2 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Line total */}
      <div className="col-span-1 text-right">
        <span className={`text-sm font-semibold ${subtotal > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
          {subtotal > 0 ? formatCurrency(subtotal) : '—'}
        </span>
      </div>

      {/* Remove */}
      <div className="col-span-1 text-center">
        <button
          onClick={() => onRemove(item.id)}
          disabled={isOnly}
          className="opacity-0 group-hover:opacity-100 disabled:opacity-0 transition w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 mx-auto"
          title="Remove row"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
