import { useState } from 'react'
import { useDeals } from '../context/DealContext'
import { fmt, COMMISSION_RATE, MMT_PRODUCTS } from '../utils/deals'

// ── helpers ───────────────────────────────────────────────────────────────────
function uuid() { return crypto.randomUUID() }

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ── Payment methods ───────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    key: '1pay',
    label: '1-Pay',
    desc: 'Full amount today',
    badge: 'Full commission earned now',
    badgeGreen: true,
  },
  {
    key: '2pay',
    label: '2-Pay',
    desc: '50% today, 50% in 30 days',
    badge: 'Commission in 2 tranches',
    badgeGreen: false,
  },
  {
    key: '3pay',
    label: '3-Pay',
    desc: 'Three equal monthly payments',
    badge: 'Commission in 3 tranches',
    badgeGreen: false,
  },
  {
    key: 'lifestyle',
    label: 'Lifestyle Financing',
    desc: 'Client finances — you earn full commission now',
    badge: 'Full commission earned now',
    badgeGreen: true,
  },
]

// ── Sub-components ────────────────────────────────────────────────────────────
function DarkInput({ value, onChange, type = 'text', placeholder = '', className = '', ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${className}`}
      {...rest}
    />
  )
}

function DollarInput({ value, onChange, placeholder = '0', className = '' }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-7 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent ${className}`}
      />
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────
export default function AddDealForm({ onSave }) {
  const { addDeal } = useDeals()
  const today = new Date().toISOString().split('T')[0]

  const [step, setStep] = useState(1)

  // Step 1
  const [dealType, setDealType]       = useState('new')
  const [clientName, setClientName]   = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [dateSigned, setDateSigned]   = useState(today)
  const [product, setProduct]         = useState('elite')   // 'elite' | 'private' | 'custom'
  const [customPrice, setCustomPrice] = useState('')

  // Step 2
  const [paymentMethod, setPaymentMethod] = useState('')
  const [backendPayments, setBackendPayments] = useState([])
  const [upfront, setUpfront] = useState('')

  // Step 3
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})

  const productPrice = product === 'elite' ? 9900
    : product === 'private' ? 16500
    : parseFloat(customPrice) || 0
  const cv = productPrice

  const backendTotal = backendPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const upfrontNum = parseFloat(upfront) || 0
  const structureTotal = upfrontNum + backendTotal
  const structureOk = Math.abs(structureTotal - cv) < 0.01

  const isPif = paymentMethod === '1pay' || paymentMethod === 'lifestyle'
  const is2Pay = paymentMethod === '2pay'
  const is3Pay = paymentMethod === '3pay'

  // ── Apply payment method ──────────────────────────────────────────────────
  function applyMethod(method) {
    setPaymentMethod(method)
    const total = cv || 0
    const half  = +(total / 2).toFixed(2)
    const third = +(total / 3).toFixed(2)

    if (method === '1pay' || method === 'lifestyle') {
      setUpfront(String(total))
      setBackendPayments([])
    } else if (method === '2pay') {
      setUpfront(String(half))
      setBackendPayments([
        { id: uuid(), amount: String(half), dueDate: addDays(dateSigned, 30), received: false, receivedDate: null },
      ])
    } else if (method === '3pay') {
      setUpfront(String(third))
      setBackendPayments([
        { id: uuid(), amount: String(third), dueDate: addDays(dateSigned, 30), received: false, receivedDate: null },
        { id: uuid(), amount: String(third), dueDate: addDays(dateSigned, 60), received: false, receivedDate: null },
      ])
    }
  }

  function updatePayment(id, field, val) {
    setBackendPayments(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p))
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validateStep1() {
    const errs = {}
    if (!clientName.trim()) errs.clientName = 'Client name is required'
    if (product === 'custom' && !customPrice) errs.customPrice = 'Enter a price'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateStep2() {
    const errs = {}
    if (!paymentMethod) errs.paymentMethod = 'Please select a payment method'
    if (!isPif && !structureOk) errs.structure = `Total is ${fmt(structureTotal)}, should be ${fmt(cv)}`
    if (!isPif && backendPayments.some(p => !p.dueDate)) errs.structure = 'All payments need a due date'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  function handleSave() {
    const deal = {
      id: uuid(),
      type: dealType,
      paymentMethod,
      product,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      contractValue: cv,
      commissionRate: COMMISSION_RATE * 100,
      upfront: isPif ? cv : upfrontNum,
      backendPayments: isPif
        ? []
        : backendPayments.map(p => ({ ...p, amount: parseFloat(p.amount) || 0 })),
      notes: notes.trim(),
      createdAt: new Date(dateSigned + 'T12:00:00').toISOString(),
    }
    addDeal(deal)
    onSave()
  }

  const METHOD_LABEL_MAP = {
    '1pay': '1-Pay',
    '2pay': '2-Pay',
    '3pay': '3-Pay',
    'lifestyle': 'Lifestyle Financing',
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto pb-16 px-4">

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8 pt-2">
        {['Client', 'Payment', 'Review'].map((label, i) => {
          const s = i + 1
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step > s ? 'bg-amber-500 text-gray-950' :
                step === s ? 'bg-amber-500 text-gray-950 ring-4 ring-amber-500/20' :
                'bg-gray-800 text-gray-500'
              }`}>
                {step > s ? '✓' : s}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step >= s ? 'text-white' : 'text-gray-600'}`}>{label}</span>
              {s < 3 && <div className={`h-0.5 w-8 sm:w-16 rounded-full ${step > s ? 'bg-amber-500' : 'bg-gray-800'}`} />}
            </div>
          )
        })}
      </div>

      {/* ── STEP 1 ─────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Deal Type */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Deal Type</p>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setDealType('new')}
                className={`flex-1 min-w-[180px] p-4 rounded-2xl border-2 text-left transition-all ${
                  dealType === 'new'
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-1">🤝</div>
                <div className="font-bold text-white">New Deal</div>
                <div className="text-xs text-gray-400 mt-0.5">Fresh close</div>
              </button>
              <div className="flex flex-col gap-3 min-w-[140px]">
                {[
                  { key: 'renewal', icon: '🔄', label: 'Renewal' },
                  { key: 'upsell',  icon: '📈', label: 'Upsell'  },
                ].map(dt => (
                  <button
                    key={dt.key}
                    type="button"
                    onClick={() => setDealType(dt.key)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      dealType === dt.key
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <span className="text-lg">{dt.icon}</span>
                    <span className="font-semibold text-white text-sm">{dt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Client info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                Client name <span className="text-red-400">*</span>
              </label>
              <DarkInput
                value={clientName}
                onChange={e => { setClientName(e.target.value); setErrors({}) }}
                placeholder="Full name or company"
                className={errors.clientName ? 'border-red-500' : ''}
              />
              {errors.clientName && <p className="text-red-400 text-xs mt-1">{errors.clientName}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Client email</label>
              <DarkInput
                type="email"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                placeholder="client@email.com"
              />
            </div>
          </div>

          {/* Date signed */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">Date signed</label>
            <DarkInput
              type="date"
              value={dateSigned}
              onChange={e => setDateSigned(e.target.value)}
            />
          </div>

          {/* Product selector */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Product</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* MMT Elite */}
              <button
                type="button"
                onClick={() => { setProduct('elite'); setPaymentMethod('') }}
                className={`p-4 rounded-2xl border-2 text-left transition-all col-span-1 ${
                  product === 'elite'
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="font-bold text-white text-sm">MMT Elite</div>
                <div className="text-amber-400 font-bold text-lg mt-1">$9,900</div>
                <div className="text-xs text-gray-500 mt-0.5">inc GST</div>
              </button>
              {/* MMT Private */}
              <button
                type="button"
                onClick={() => { setProduct('private'); setPaymentMethod('') }}
                className={`p-4 rounded-2xl border-2 text-left transition-all col-span-1 ${
                  product === 'private'
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="font-bold text-white text-sm">MMT Private</div>
                <div className="text-amber-400 font-bold text-lg mt-1">$16,500</div>
                <div className="text-xs text-gray-500 mt-0.5">inc GST</div>
              </button>
              {/* Custom */}
              <button
                type="button"
                onClick={() => { setProduct('custom'); setPaymentMethod('') }}
                className={`p-4 rounded-2xl border-2 text-left transition-all col-span-1 ${
                  product === 'custom'
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="font-bold text-white text-sm">Custom</div>
                <div className="text-gray-400 text-xs mt-1">Enter price below</div>
              </button>
            </div>
            {product === 'custom' && (
              <div className="mt-3">
                <DollarInput
                  value={customPrice}
                  onChange={val => { setCustomPrice(val); setPaymentMethod('') }}
                  placeholder="Enter contract value"
                  className={errors.customPrice ? 'border-red-500' : ''}
                />
                {errors.customPrice && <p className="text-red-400 text-xs mt-1">{errors.customPrice}</p>}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => { if (validateStep1()) setStep(2) }}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-xl font-bold text-sm transition-all"
          >
            Next: Payment Structure →
          </button>
        </div>
      )}

      {/* ── STEP 2 ─────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Method</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.key}
                  type="button"
                  onClick={() => applyMethod(pm.key)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    paymentMethod === pm.key
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-bold text-white">{pm.label}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                      pm.badgeGreen
                        ? 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30'
                        : 'text-amber-400 bg-amber-400/10 border-amber-500/30'
                    }`}>{pm.badge}</span>
                  </div>
                  <div className="text-xs text-gray-400">{pm.desc}</div>
                </button>
              ))}
            </div>
            {errors.paymentMethod && <p className="text-red-400 text-xs mt-2">{errors.paymentMethod}</p>}
          </div>

          {/* PIF confirmation */}
          {isPif && paymentMethod && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-center">
              <div className="font-bold text-emerald-400 text-lg">Full commission earned immediately</div>
              <div className="text-gray-400 text-sm mt-1">
                {paymentMethod === 'lifestyle'
                  ? 'Client finances through lender — you get paid in full'
                  : 'Full amount collected today'}
              </div>
              <div className="mt-3 text-2xl font-bold text-emerald-400">
                {fmt(cv * COMMISSION_RATE)} commission
              </div>
            </div>
          )}

          {/* 2-Pay / 3-Pay breakdown */}
          {(is2Pay || is3Pay) && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Cash collected today</label>
                <DollarInput value={upfront} onChange={val => setUpfront(val)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Future payments</label>
                <div className="space-y-2">
                  {backendPayments.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-5 shrink-0">#{idx + 1}</span>
                      <div className="w-32 shrink-0">
                        <DollarInput value={p.amount} onChange={val => updatePayment(p.id, 'amount', val)} />
                      </div>
                      <input
                        type="date"
                        value={p.dueDate}
                        onChange={e => updatePayment(p.id, 'dueDate', e.target.value)}
                        className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Running total */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-semibold ${
                structureOk
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                <span>
                  {fmt(upfrontNum)} + {backendPayments.length} payment{backendPayments.length !== 1 ? 's' : ''} = {fmt(structureTotal)}
                </span>
                <span>{structureOk ? `✓ Matches ${fmt(cv)}` : `≠ ${fmt(cv)}`}</span>
              </div>
              {errors.structure && <p className="text-red-400 text-xs">{errors.structure}</p>}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep(1)}
              className="flex-1 py-3 border border-gray-700 text-gray-400 rounded-xl font-bold text-sm hover:border-gray-600 transition-all">
              ← Back
            </button>
            <button type="button" onClick={() => { if (validateStep2()) setStep(3) }}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-xl font-bold text-sm transition-all">
              Review Deal →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 ─────────────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Summary card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 bg-amber-500/20 border-b border-amber-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Deal Summary</p>
                  <p className="text-white font-bold text-lg mt-0.5">{clientName}</p>
                  {clientEmail && <p className="text-gray-400 text-xs mt-0.5">{clientEmail}</p>}
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs">Est. commission</p>
                  <p className="text-amber-400 font-bold text-2xl">{fmt(cv * COMMISSION_RATE)}</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm">
              {[
                ['Deal type', dealType === 'new' ? 'New Deal' : dealType === 'renewal' ? 'Renewal' : 'Upsell'],
                ['Product', product === 'elite' ? 'MMT Elite' : product === 'private' ? 'MMT Private' : 'Custom'],
                ['Payment method', METHOD_LABEL_MAP[paymentMethod] ?? paymentMethod],
                ['Contract value', fmt(cv)],
                ['Commission rate', '10%'],
                ['Cash today', fmt(isPif ? cv : upfrontNum)],
                backendPayments.length > 0 && ['Future payments', `${backendPayments.length} × ${fmt(backendTotal / backendPayments.length)} avg`],
                ['Date signed', new Date(dateSigned + 'T12:00:00').toLocaleDateString('en-AU', { month: 'long', day: 'numeric', year: 'numeric' })],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-200">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5">
              Notes <span className="text-gray-600 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. client referred by X, follow up in 30 days..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)}
              className="flex-1 py-3 border border-gray-700 text-gray-400 rounded-xl font-bold text-sm hover:border-gray-600 transition-all">
              ← Back
            </button>
            <button type="button" onClick={handleSave}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-xl font-bold text-sm transition-all">
              Save Deal ✓
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
