import { useState } from 'react'
import { useDeals } from '../context/DealContext'
import { fmt } from '../utils/deals'

// ── helpers ──────────────────────────────────────────────────────────────────
function uuid() { return crypto.randomUUID() }

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function buildSchedule(upfront, contractValue, count, cadence, startDate) {
  const remaining = contractValue - upfront
  const amount = count > 0 ? +(remaining / count).toFixed(2) : 0
  const intervals = { monthly: 30, biweekly: 14 }
  const gap = intervals[cadence] ?? 30
  return Array.from({ length: count }, (_, i) => ({
    id: uuid(),
    amount,
    received: false,
    receivedDate: null,
    dueDate: addDays(startDate, gap * (i + 1)),
  }))
}

// ── Deal type selector ────────────────────────────────────────────────────────
const DEAL_TYPES = [
  { key: 'new',     label: 'New Deal',  icon: '🤝', desc: 'Fresh close',               primary: true  },
  { key: 'renewal', label: 'Renewal',   icon: '🔄', desc: 'Client re-signs',            primary: false },
  { key: 'upsell',  label: 'Upsell',    icon: '📈', desc: 'Add-on to existing deal',    primary: false },
]

// ── Payment method presets (New Deal only) ────────────────────────────────────
const PAYMENT_METHODS = [
  {
    key: 'cash',
    label: '$5,000 Cash',
    icon: '💵',
    desc: 'Paid in full today',
    badge: 'Full commission now',
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    key: 'payva',
    label: 'Payva / Financing',
    icon: '⚡',
    desc: 'Client finances — you get full commission now',
    badge: 'Full commission now',
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    key: 'split_2500',
    label: '50 / 50 Split',
    icon: '✂️',
    desc: 'Half today + half in 30 days',
    badge: 'Commission in 2 tranches',
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    key: 'split_2000_1500',
    label: '40 / 30 / 30 Split',
    icon: '🔀',
    desc: '40% today + two equal payments',
    badge: 'Commission in 3 tranches',
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    key: 'custom',
    label: 'Custom Split',
    icon: '🔧',
    desc: 'Set your own amounts and schedule',
    badge: 'Flexible',
    badgeColor: 'text-brand-700 bg-brand-50 border-brand-200',
  },
]

function CadenceButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
        active
          ? 'bg-brand-600 text-white border-brand-600'
          : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
      }`}
    >
      {label}
    </button>
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
        className={`w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent ${className}`}
      />
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────
export default function AddDealForm({ onSave }) {
  const { addDeal } = useDeals()
  const today = new Date().toISOString().split('T')[0]

  // Step state
  const [step, setStep] = useState(1)

  // Step 1 — client + deal type
  const [dealType, setDealType]       = useState('new')
  const [clientName, setClientName]   = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [dateSigned, setDateSigned]   = useState(today)
  const [contractValue, setContractValue] = useState('5000')
  const [commissionRate, setCommissionRate] = useState(10)

  // Step 2 — payment method (new deals)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [upfront, setUpfront]             = useState('')
  const [cadence, setCadence]             = useState('monthly') // monthly | biweekly | custom
  const [backendPayments, setBackendPayments] = useState([])    // [{ id, amount, dueDate }]

  // Step 3 — notes
  const [notes, setNotes]   = useState('')
  const [errors, setErrors] = useState({})

  const cv = parseFloat(contractValue) || 0
  const upfrontNum = parseFloat(upfront) || 0
  const backendTotal = backendPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const structureTotal = upfrontNum + backendTotal
  const structureOk = Math.abs(structureTotal - cv) < 0.01

  // ── Payment method selection ───────────────────────────────────────────────
  function applyMethod(method) {
    setPaymentMethod(method)
    const total = parseFloat(contractValue) || 5000
    const half  = +(total / 2).toFixed(2)
    const third = +(total / 3).toFixed(2)

    if (method === 'cash') {
      setUpfront(String(total))
      setBackendPayments([])
    } else if (method === 'payva') {
      setUpfront(String(total))
      setBackendPayments([])
    } else if (method === 'split_2500') {
      // Always 50/50 regardless of ticket price
      setUpfront(String(half))
      setBackendPayments([{ id: uuid(), amount: String(half), dueDate: addDays(dateSigned, 30), received: false, receivedDate: null }])
    } else if (method === 'split_2000_1500') {
      // ~40% upfront, two equal backend payments
      const upfrontAmt = +(total * 0.4).toFixed(2)
      const backAmt    = +((total - upfrontAmt) / 2).toFixed(2)
      setUpfront(String(upfrontAmt))
      setBackendPayments([
        { id: uuid(), amount: String(backAmt), dueDate: addDays(dateSigned, 30), received: false, receivedDate: null },
        { id: uuid(), amount: String(backAmt), dueDate: addDays(dateSigned, 60), received: false, receivedDate: null },
      ])
    } else if (method === 'custom') {
      setUpfront('')
      setBackendPayments([{ id: uuid(), amount: '', dueDate: addDays(dateSigned, 30), received: false, receivedDate: null }])
    }
  }

  // ── Custom split helpers ──────────────────────────────────────────────────
  function addPayment() {
    const lastDate = backendPayments.length > 0
      ? backendPayments[backendPayments.length - 1].dueDate
      : dateSigned
    const gap = cadence === 'biweekly' ? 14 : 30
    setBackendPayments(prev => [...prev, { id: uuid(), amount: '', dueDate: addDays(lastDate, gap), received: false, receivedDate: null }])
  }

  function updatePayment(id, field, val) {
    setBackendPayments(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p))
  }

  function removePayment(id) {
    setBackendPayments(prev => prev.filter(p => p.id !== id))
  }

  function autoSplitRemaining() {
    const remaining = cv - upfrontNum
    const n = backendPayments.length
    if (n === 0 || remaining <= 0) return
    const each = +(remaining / n).toFixed(2)
    setBackendPayments(prev => prev.map(p => ({ ...p, amount: String(each) })))
  }

  function applySchedule() {
    const gap = cadence === 'biweekly' ? 14 : 30
    setBackendPayments(prev => prev.map((p, i) => ({
      ...p,
      dueDate: addDays(dateSigned, gap * (i + 1)),
    })))
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validateStep1() {
    const errs = {}
    if (!clientName.trim()) errs.clientName = 'Client name is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateStep2() {
    const errs = {}
    const isPayva = paymentMethod === 'payva'
    const isCash  = paymentMethod === 'cash'

    if (dealType === 'new' && !paymentMethod) {
      errs.paymentMethod = 'Please select a payment method'
    }
    if (!isPayva && !isCash && !structureOk) {
      errs.structure = `Total is ${fmt(structureTotal)}, should be ${fmt(cv)}`
    }
    if (!isPayva && !isCash && backendPayments.some(p => !p.dueDate)) {
      errs.structure = 'All payments need a due date'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  function handleSave() {
    const isPayva = paymentMethod === 'payva'
    const isCash  = paymentMethod === 'cash'

    const deal = {
      id: uuid(),
      type: dealType,
      paymentMethod: dealType === 'new' ? paymentMethod : 'custom',
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      contractValue: cv,
      commissionRate,
      upfront: isPayva || isCash ? cv : upfrontNum,
      backendPayments: (isPayva || isCash)
        ? []
        : backendPayments.map(p => ({
            ...p,
            amount: parseFloat(p.amount) || 0,
          })),
      notes: notes.trim(),
      createdAt: new Date(dateSigned + 'T12:00:00').toISOString(),
    }

    addDeal(deal)
    onSave()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const isNewDeal = dealType === 'new'

  return (
    <div className="max-w-2xl mx-auto pb-16 px-4">

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8 pt-2">
        {['Client', 'Payment', 'Review'].map((label, i) => {
          const s = i + 1
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step > s ? 'bg-brand-600 text-white' :
                step === s ? 'bg-brand-600 text-white ring-4 ring-brand-100' :
                'bg-gray-100 text-gray-400'
              }`}>
                {step > s ? '✓' : s}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step >= s ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
              {s < 3 && <div className={`h-0.5 w-8 sm:w-16 rounded-full ${step > s ? 'bg-brand-600' : 'bg-gray-200'}`} />}
            </div>
          )
        })}
      </div>

      {/* ── STEP 1: Client + Deal Type ────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Deal Type</p>
            <div className="flex gap-3 flex-wrap">
              {/* New Deal — large primary button */}
              <button
                type="button"
                onClick={() => { setDealType('new'); setContractValue('5000') }}
                className={`flex-1 min-w-[180px] p-4 rounded-2xl border-2 text-left transition-all ${
                  dealType === 'new'
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">🤝</div>
                <div className="font-bold text-gray-900">New Deal</div>
                <div className="text-xs text-gray-500 mt-0.5">The Blueprint</div>
              </button>

              {/* Renewal + Upsell — smaller */}
              <div className="flex flex-col gap-3 min-w-[140px]">
                {[
                  { key: 'renewal', icon: '🔄', label: 'Renewal', cv: '5000' },
                  { key: 'upsell',  icon: '📈', label: 'Upsell',  cv: ''     },
                ].map(dt => (
                  <button
                    key={dt.key}
                    type="button"
                    onClick={() => { setDealType(dt.key); setContractValue(dt.cv) }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      dealType === dt.key
                        ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg">{dt.icon}</span>
                    <span className="font-semibold text-gray-800 text-sm">{dt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Client name + email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Client name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={e => { setClientName(e.target.value); setErrors({}) }}
                placeholder="Full name or company"
                className={`w-full px-4 py-2.5 border rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent ${
                  errors.clientName ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
              />
              {errors.clientName && <p className="text-red-500 text-xs mt-1">{errors.clientName}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Client email</label>
              <input
                type="email"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                placeholder="client@email.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Contract value (always shown) + Date signed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Final ticket price
                {dealType !== 'upsell' && parseFloat(contractValue) !== 5000 && contractValue !== '' && (
                  <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Custom price
                  </span>
                )}
              </label>
              <DollarInput value={contractValue} onChange={val => { setContractValue(val); setPaymentMethod('') }} />
              {dealType !== 'upsell' && (
                <p className="text-xs text-gray-400 mt-1.5">
                  Default $5,000 — adjust for risk pricing or negotiated deals
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date signed</label>
              <input
                type="date"
                value={dateSigned}
                onChange={e => setDateSigned(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Commission rate */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">Commission rate</label>
              <span className="text-xl font-bold text-brand-600">{commissionRate}%</span>
            </div>
            <input
              type="range" min={8} max={15} step={0.5}
              value={commissionRate}
              onChange={e => setCommissionRate(parseFloat(e.target.value))}
              className="w-full mb-2"
              style={{ background: `linear-gradient(to right, #2550ea ${((commissionRate - 8) / 7) * 100}%, #e5e7eb ${((commissionRate - 8) / 7) * 100}%)` }}
            />
            <div className="flex gap-2 mt-1">
              {[8, 10, 12, 15].map(p => (
                <button key={p} type="button" onClick={() => setCommissionRate(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${commissionRate === p ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'}`}>
                  {p}%
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => { if (validateStep1()) setStep(2) }}
            className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-sm transition-all"
          >
            Next: Payment Structure →
          </button>
        </div>
      )}

      {/* ── STEP 2: Payment Method ─────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">

          {/* Payment method picker — only for New Deal */}
          {isNewDeal && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">How is this deal being paid?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PAYMENT_METHODS.map(pm => (
                  <button
                    key={pm.key}
                    type="button"
                    onClick={() => applyMethod(pm.key)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      paymentMethod === pm.key
                        ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xl">{pm.icon}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pm.badgeColor}`}>{pm.badge}</span>
                    </div>
                    <div className="font-bold text-gray-900 text-sm">{pm.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{pm.desc}</div>
                  </button>
                ))}
              </div>
              {errors.paymentMethod && <p className="text-red-500 text-xs mt-2">{errors.paymentMethod}</p>}
            </div>
          )}

          {/* ── Cash in full ── */}
          {(paymentMethod === 'cash' || (!isNewDeal && dealType !== 'upsell')) && (
            <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-center">
              <div className="text-3xl mb-2">💵</div>
              <div className="font-bold text-emerald-800 text-lg">{fmt(cv)} received in full</div>
              <div className="text-emerald-700 text-sm mt-1">Full commission earned today</div>
              <div className="mt-3 text-2xl font-bold text-emerald-700">
                {fmt(cv * commissionRate / 100)} commission
              </div>
            </div>
          )}

          {/* ── Payva ── */}
          {paymentMethod === 'payva' && (
            <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-center">
              <div className="text-3xl mb-2">⚡</div>
              <div className="font-bold text-emerald-800 text-lg">Full commission earned immediately</div>
              <div className="text-emerald-700 text-sm mt-1">Client repays Payva directly — you get paid in full</div>
              <div className="mt-3 text-2xl font-bold text-emerald-700">
                {fmt(cv * commissionRate / 100)} commission
              </div>
            </div>
          )}

          {/* ── Split (preset or custom) ── */}
          {(paymentMethod === 'split_2500' || paymentMethod === 'split_2000_1500' || paymentMethod === 'custom' || dealType === 'upsell' || dealType === 'renewal') &&
           paymentMethod !== 'cash' && paymentMethod !== 'payva' && (
            <div className="space-y-4">
              {/* Upfront */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cash collected today</label>
                <DollarInput value={upfront} onChange={setUpfront} />
              </div>

              {/* Backend payments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Future payments</label>
                  {paymentMethod === 'custom' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Schedule:</span>
                      <CadenceButton label="Monthly" active={cadence === 'monthly'} onClick={() => setCadence('monthly')} />
                      <CadenceButton label="Bi-weekly" active={cadence === 'biweekly'} onClick={() => setCadence('biweekly')} />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {backendPayments.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-5 shrink-0">#{idx + 1}</span>
                      <div className="w-32 shrink-0">
                        <DollarInput value={p.amount} onChange={val => updatePayment(p.id, 'amount', val)} />
                      </div>
                      <input
                        type="date"
                        value={p.dueDate}
                        onChange={e => updatePayment(p.id, 'dueDate', e.target.value)}
                        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      />
                      {paymentMethod === 'custom' && (
                        <button type="button" onClick={() => removePayment(p.id)}
                          className="p-1.5 text-gray-300 hover:text-red-400 transition-colors shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {paymentMethod === 'custom' && (
                  <div className="flex gap-2 mt-3">
                    <button type="button" onClick={addPayment}
                      className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 px-3 py-1.5 bg-brand-50 rounded-lg transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Add payment
                    </button>
                    <button type="button" onClick={autoSplitRemaining}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5 bg-gray-100 rounded-lg transition-colors">
                      Auto-split remaining
                    </button>
                    <button type="button" onClick={applySchedule}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5 bg-gray-100 rounded-lg transition-colors">
                      Apply schedule
                    </button>
                  </div>
                )}
              </div>

              {/* Running total */}
              {(upfront || backendPayments.length > 0) && (
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm font-semibold ${
                  structureOk ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-red-50 border-red-300 text-red-700'
                }`}>
                  <span>
                    {fmt(upfrontNum)} + {backendPayments.length} payment{backendPayments.length !== 1 ? 's' : ''} = {fmt(structureTotal)}
                  </span>
                  <span>{structureOk ? `✓ Matches ${fmt(cv)}` : `≠ ${fmt(cv)}`}</span>
                </div>
              )}
              {errors.structure && <p className="text-red-500 text-xs">{errors.structure}</p>}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep(1)}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">
              ← Back
            </button>
            <button type="button" onClick={() => { if (validateStep2()) setStep(3) }}
              className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-sm transition-all">
              Review Deal →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Review + Notes ─────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Summary card */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-brand-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-brand-200 text-xs font-semibold uppercase tracking-wider">Deal Summary</p>
                  <p className="text-white font-bold text-lg mt-0.5">{clientName}</p>
                  {clientEmail && <p className="text-brand-200 text-xs mt-0.5">{clientEmail}</p>}
                </div>
                <div className="text-right">
                  <p className="text-brand-200 text-xs">Est. commission</p>
                  <p className="text-white font-bold text-2xl">{fmt(cv * commissionRate / 100)}</p>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm">
              {[
                ['Deal type', dealType === 'new' ? 'New Deal' : dealType === 'renewal' ? 'Renewal' : 'Upsell'],
                ['Payment method', PAYMENT_METHODS.find(p => p.key === paymentMethod)?.label ?? 'Custom'],
                ['Contract value', fmt(cv)],
                ['Commission rate', `${commissionRate}%`],
                ['Cash today', fmt(paymentMethod === 'payva' || paymentMethod === 'cash' ? cv : upfrontNum)],
                backendPayments.length > 0 && ['Future payments', `${backendPayments.length} × avg ${fmt(backendTotal / backendPayments.length)}`],
                ['Date signed', new Date(dateSigned + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. client referred by X, follow up in 30 days..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">
              ← Back
            </button>
            <button type="button" onClick={handleSave}
              className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-sm transition-all shadow-sm shadow-brand-900/20">
              Save Deal ✓
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
