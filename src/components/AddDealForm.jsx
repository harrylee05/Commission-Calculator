import { useState } from 'react'
import { useDeals } from '../context/DealContext'
import { DEAL_TYPE_LABELS } from '../utils/deals'

const DEAL_TYPES = [
  {
    key: 'new',
    label: 'New Deal',
    icon: '🤝',
    desc: 'Fresh close — The Blueprint $5,000',
    color: 'border-blue-400 bg-blue-50 text-blue-700',
    selectedColor: 'border-blue-600 bg-blue-100 ring-2 ring-blue-400',
  },
  {
    key: 'renewal',
    label: 'Renewal',
    icon: '🔄',
    desc: 'Client re-signs — The Blueprint $5,000',
    color: 'border-purple-400 bg-purple-50 text-purple-700',
    selectedColor: 'border-purple-600 bg-purple-100 ring-2 ring-purple-400',
  },
  {
    key: 'upsell',
    label: 'Upsell',
    icon: '📈',
    desc: 'Additional offer on top of existing deal',
    color: 'border-orange-400 bg-orange-50 text-orange-700',
    selectedColor: 'border-orange-600 bg-orange-100 ring-2 ring-orange-400',
  },
  {
    key: 'payva',
    label: 'Payva (PIF)',
    icon: '⚡',
    desc: 'Financing — full commission earned now',
    color: 'border-green-400 bg-green-50 text-green-700',
    selectedColor: 'border-green-600 bg-green-100 ring-2 ring-green-400',
  },
]

function generateId() {
  return crypto.randomUUID()
}

export default function AddDealForm({ onSave }) {
  const { addDeal } = useDeals()

  const today = new Date().toISOString().split('T')[0]

  const [step, setStep] = useState(1)
  const [type, setType] = useState('new')
  const [clientName, setClientName] = useState('')
  const [contractValue, setContractValue] = useState(5000)
  const [dateSigned, setDateSigned] = useState(today)
  const [commissionRate, setCommissionRate] = useState(10)
  const [upfront, setUpfront] = useState('')
  const [numPayments, setNumPayments] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})

  const isPayva = type === 'payva'
  const isUpsell = type === 'upsell'

  function handleTypeChange(t) {
    setType(t)
    if (t !== 'upsell') setContractValue(5000)
    else setContractValue('')
  }

  function autoCalcPaymentAmount(upfrontVal, numVal, cvVal) {
    const cv = parseFloat(cvVal)
    const u = parseFloat(upfrontVal)
    const n = parseInt(numVal)
    if (!isNaN(cv) && !isNaN(u) && !isNaN(n) && n > 0) {
      const perPayment = (cv - u) / n
      if (perPayment >= 0) setPaymentAmount(perPayment.toFixed(2))
    }
  }

  function handleUpfrontChange(val) {
    setUpfront(val)
    autoCalcPaymentAmount(val, numPayments, contractValue)
  }

  function handleNumPaymentsChange(val) {
    setNumPayments(val)
    autoCalcPaymentAmount(upfront, val, contractValue)
  }

  function handleContractValueChange(val) {
    setContractValue(val)
    autoCalcPaymentAmount(upfront, numPayments, val)
  }

  const totalStructured = (() => {
    const u = parseFloat(upfront) || 0
    const n = parseInt(numPayments) || 0
    const p = parseFloat(paymentAmount) || 0
    return u + n * p
  })()

  const cv = parseFloat(contractValue) || 0
  const structureMatch = Math.abs(totalStructured - cv) < 1

  function validate() {
    const errs = {}
    if (!clientName.trim()) errs.clientName = 'Client name is required'
    if (!isPayva) {
      if (!structureMatch) {
        errs.structure = `Payment structure totals ${fmt(totalStructured)} but contract value is ${fmt(cv)}`
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function fmt(val) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
  }

  function handleSave() {
    if (!validate()) return

    const backendPayments = isPayva
      ? []
      : Array.from({ length: parseInt(numPayments) || 0 }, () => ({
          id: generateId(),
          amount: parseFloat(paymentAmount) || 0,
          received: false,
          receivedDate: null,
        }))

    const deal = {
      id: generateId(),
      type,
      clientName: clientName.trim(),
      contractValue: parseFloat(contractValue) || 5000,
      commissionRate,
      upfront: isPayva ? parseFloat(contractValue) || 5000 : parseFloat(upfront) || 0,
      backendPayments,
      notes: notes.trim(),
      createdAt: new Date(dateSigned).toISOString(),
    }

    addDeal(deal)
    onSave()
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step >= s
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`h-0.5 w-12 transition-colors ${
                  step > s ? 'bg-brand-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
        <span className="ml-3 text-sm text-gray-500">
          {step === 1 && 'Deal basics'}
          {step === 2 && 'Payment structure'}
          {step === 3 && 'Notes'}
        </span>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Deal type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {DEAL_TYPES.map((dt) => (
                <button
                  key={dt.key}
                  type="button"
                  onClick={() => handleTypeChange(dt.key)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    type === dt.key ? dt.selectedColor : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{dt.icon}</div>
                  <div className="font-semibold text-gray-900">{dt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{dt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Client name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.clientName ? 'border-red-400' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-brand-400 text-gray-900`}
            />
            {errors.clientName && (
              <p className="text-red-500 text-xs mt-1">{errors.clientName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Contract value
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={contractValue}
                  onChange={(e) => handleContractValueChange(e.target.value)}
                  className="w-full pl-7 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 text-gray-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Date signed
              </label>
              <input
                type="date"
                value={dateSigned}
                onChange={(e) => setDateSigned(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 text-gray-900"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Commission rate
              </label>
              <span className="text-lg font-bold text-brand-600">
                {commissionRate}%
              </span>
            </div>
            <input
              type="range"
              min={8}
              max={15}
              step={0.5}
              value={commissionRate}
              onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex gap-2 mt-2">
              {[8, 10, 12, 15].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCommissionRate(p)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    commissionRate === p
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!clientName.trim()) {
                setErrors({ clientName: 'Client name is required' })
                return
              }
              setErrors({})
              setStep(2)
            }}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-colors"
          >
            Next: Payment structure →
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-6">
          {isPayva ? (
            <div className="p-6 rounded-2xl bg-green-50 border-2 border-green-200 text-center">
              <div className="text-3xl mb-2">⚡</div>
              <div className="font-semibold text-green-800 text-lg">Full commission earned immediately</div>
              <div className="text-green-700 text-sm mt-1">
                Client repays Payva directly — you earn {commissionRate}% on {fmt(cv)} now.
              </div>
              <div className="mt-3 text-2xl font-bold text-green-700">
                {fmt(cv * commissionRate / 100)} commission
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Upfront / cash collected today ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={upfront}
                    onChange={(e) => handleUpfrontChange(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Number of backend payments
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={numPayments}
                    onChange={(e) => handleNumPaymentsChange(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Amount per payment ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="auto"
                      className="w-full pl-7 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Running total */}
              <div
                className={`p-4 rounded-xl border-2 text-sm font-medium ${
                  structureMatch
                    ? 'border-green-400 bg-green-50 text-green-700'
                    : 'border-red-400 bg-red-50 text-red-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>
                    {fmt(parseFloat(upfront) || 0)} upfront + ({numPayments || 0} × {fmt(parseFloat(paymentAmount) || 0)}) ={' '}
                    <strong>{fmt(totalStructured)}</strong>
                  </span>
                  <span>{structureMatch ? '✓' : `≠ ${fmt(cv)}`}</span>
                </div>
              </div>

              {errors.structure && (
                <p className="text-red-500 text-sm">{errors.structure}</p>
              )}
            </>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isPayva && !structureMatch) {
                  setErrors({ structure: `Payment structure totals ${fmt(totalStructured)} but contract value is ${fmt(cv)}` })
                  return
                }
                setErrors({})
                setStep(3)
              }}
              className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-colors"
            >
              Next: Notes →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this deal..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 text-gray-900 resize-none"
            />
          </div>

          {/* Summary */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm space-y-2">
            <div className="font-semibold text-gray-700 mb-2">Deal summary</div>
            <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium">{DEAL_TYPE_LABELS[type]}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Client</span><span className="font-medium">{clientName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Contract value</span><span className="font-medium">{fmt(cv)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Commission rate</span><span className="font-medium">{commissionRate}%</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Est. commission</span><span className="font-bold text-brand-600">{fmt(cv * commissionRate / 100)}</span></div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-colors"
            >
              Save Deal ✓
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
