export const COMMISSION_RATE = 0.10

export const DEAL_TYPE_LABELS = {
  new: 'New Deal',
  renewal: 'Renewal',
  upsell: 'Upsell',
}

export const DEAL_TYPE_COLORS = {
  new: 'amber',
  renewal: 'purple',
  upsell: 'orange',
}

export const MMT_PRODUCTS = [
  { key: 'elite',   label: 'MMT Elite',   price: 9900  },
  { key: 'private', label: 'MMT Private', price: 16500 },
  { key: 'custom',  label: 'Custom',      price: null  },
]

export function calcDeal(deal) {
  const rate = COMMISSION_RATE
  const contractValue = deal.contractValue

  // Lifestyle Financing or 1-Pay (pif) — full commission earned immediately
  if (deal.paymentMethod === 'lifestyle' || deal.paymentMethod === '1pay') {
    return {
      earnedCommission: contractValue * rate,
      pendingCommission: 0,
      totalCommission: contractValue * rate,
      totalCollected: contractValue,
      totalPending: 0,
      contractValue,
    }
  }

  const receivedBackend = (deal.backendPayments || [])
    .filter((p) => p.received)
    .reduce((sum, p) => sum + p.amount, 0)

  const unrecevedBackend = (deal.backendPayments || [])
    .filter((p) => !p.received)
    .reduce((sum, p) => sum + p.amount, 0)

  const totalCollected = (deal.upfront || 0) + receivedBackend
  const earnedCommission = totalCollected * rate
  const pendingCommission = unrecevedBackend * rate

  return {
    earnedCommission,
    pendingCommission,
    totalCommission: earnedCommission + pendingCommission,
    totalCollected,
    totalPending: unrecevedBackend,
    contractValue,
  }
}

// Returns backend payments from ANY deal whose dueDate falls in the given month/year
export function getIncomingPayments(deals, month, year) {
  const result = []
  for (const deal of deals) {
    for (const payment of deal.backendPayments || []) {
      if (!payment.dueDate) continue
      const d = new Date(payment.dueDate)
      if (d.getMonth() === month && d.getFullYear() === year) {
        result.push({ ...payment, deal })
      }
    }
  }
  return result.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
}

export function calcDashboard(deals, month, year) {
  const filtered = deals.filter((d) => {
    const dt = new Date(d.createdAt)
    return dt.getMonth() === month && dt.getFullYear() === year
  })

  let totalContractValue = 0
  let cashCollected = 0
  let commissionEarned = 0
  let commissionPending = 0

  for (const deal of filtered) {
    const c = calcDeal(deal)
    totalContractValue += c.contractValue
    cashCollected += c.totalCollected
    commissionEarned += c.earnedCommission
    commissionPending += c.pendingCommission
  }

  return {
    totalContractValue,
    cashCollected,
    commissionEarned,
    commissionPending,
    dealCount: filtered.length,
  }
}

const audFormatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function fmt(value) {
  return audFormatter.format(value)
}

export function fmtPct(value) {
  return `${Number(value).toFixed(1)}%`
}
