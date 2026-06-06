import { useState, useEffect } from 'react'
import { calcProduct, fmt } from '../utils/commission'

const EMPTY = {
  name: '',
  productPrice: '',
  numPayments: '',
  cashCollected: '',
  contractValue: '',
  commissionPercent: '10',
}

export default function ProductForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY)

  useEffect(() => {
    if (initial) setForm(initial)
  }, [initial])

  const preview = calcProduct(form)
  const isEdit = !!initial?.id

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
  }

  const pct = parseFloat(form.commissionPercent) || 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Fill in the details below and save to the dashboard.</p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-6">

          {/* Product name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Product Name <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Enterprise License, Implementation Services"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
            />
          </div>

          {/* Row: Product price + Contract value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Price</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number" min="0" step="0.01"
                  value={form.productPrice}
                  onChange={e => set('productPrice', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Listed / retail price of the product</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contract Value</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number" min="0" step="0.01"
                  value={form.contractValue}
                  onChange={e => set('contractValue', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Total value of the signed contract</p>
            </div>
          </div>

          {/* Row: Cash collected + Number of payments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Initial Cash Collected</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number" min="0" step="0.01"
                  value={form.cashCollected}
                  onChange={e => set('cashCollected', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Upfront payment received today</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Payments</label>
              <input
                type="number" min="0" step="1"
                value={form.numPayments}
                onChange={e => set('numPayments', e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                {form.numPayments > 0 && form.contractValue > 0
                  ? `≈ ${fmt(preview.paymentAmount)} / payment`
                  : 'Future installment payments'}
              </p>
            </div>
          </div>

          {/* Commission % slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Commission Rate</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-brand-600">{pct.toFixed(1)}%</span>
              </div>
            </div>

            <div className="relative">
              <input
                type="range"
                min="0" max="50" step="0.5"
                value={form.commissionPercent}
                onChange={e => set('commissionPercent', e.target.value)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-brand-600"
                style={{
                  background: `linear-gradient(to right, #2550ea ${pct * 2}%, #e5e7eb ${pct * 2}%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Quick presets */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {[5, 8, 10, 12, 15, 20, 25].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set('commissionPercent', String(v))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    parseFloat(form.commissionPercent) === v
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-600'
                  }`}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>

          {/* Live preview */}
          {(preview.contractValue > 0 || preview.cashCollected > 0) && (
            <div className="bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider mb-3">Commission Preview</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-brand-400 mb-0.5">Total Commission</p>
                  <p className="text-lg font-bold text-brand-700">{fmt(preview.totalCommission)}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-400 mb-0.5">Earned Now</p>
                  <p className="text-lg font-bold text-green-600">{fmt(preview.cashCommission)}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-400 mb-0.5">Future</p>
                  <p className="text-lg font-bold text-amber-600">{fmt(preview.futureCommission)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          {onCancel && (
            <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 font-medium transition">
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="ml-auto flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-6 py-2.5 rounded-xl transition shadow-sm shadow-brand-900/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {isEdit ? 'Save Changes' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
