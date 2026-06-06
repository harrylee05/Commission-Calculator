export function calcProduct(p) {
  const contractValue = parseFloat(p.contractValue) || 0
  const cashCollected = parseFloat(p.cashCollected) || 0
  const commissionRate = (parseFloat(p.commissionPercent) || 0) / 100
  const numPayments = parseInt(p.numPayments) || 0
  const productPrice = parseFloat(p.productPrice) || 0

  const totalCommission = contractValue * commissionRate
  const cashCommission = cashCollected * commissionRate
  const futureCommission = totalCommission - cashCommission
  const remaining = contractValue - cashCollected
  const paymentAmount = numPayments > 0 ? remaining / numPayments : 0

  return {
    totalCommission,
    cashCommission,
    futureCommission,
    remaining,
    paymentAmount,
    contractValue,
    cashCollected,
    commissionRate,
    numPayments,
    productPrice,
  }
}

export function calcDashboard(products) {
  return products.reduce(
    (acc, p) => {
      const c = calcProduct(p)
      acc.totalContractValue += c.contractValue
      acc.totalCashCollected += c.cashCollected
      acc.totalCommission += c.totalCommission
      acc.cashCommission += c.cashCommission
      acc.futureCommission += c.futureCommission
      return acc
    },
    { totalContractValue: 0, totalCashCollected: 0, totalCommission: 0, cashCommission: 0, futureCommission: 0 }
  )
}

export function fmt(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value || 0)
}

export function fmtPct(value) {
  return `${parseFloat(value || 0).toFixed(1)}%`
}
