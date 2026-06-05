export const COMMISSION_RATE = 0.10  // 10% base rate

export function calculateTotals(lineItems, cashCollected, installments, installmentAmount) {
  const subtotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.price) || 0
    return sum + qty * price
  }, 0)

  const cash = parseFloat(cashCollected) || 0
  const numInstallments = parseInt(installments) || 0
  const instAmt = parseFloat(installmentAmount) || 0
  const futureRevenue = numInstallments * instAmt
  const totalRevenue = cash + futureRevenue

  const commissionBase = subtotal
  const commission = commissionBase * COMMISSION_RATE

  const cashCommission = Math.min(cash, subtotal) * COMMISSION_RATE
  const futureCommission = Math.min(futureRevenue, Math.max(0, subtotal - cash)) * COMMISSION_RATE

  return {
    subtotal,
    cash,
    futureRevenue,
    totalRevenue,
    commission,
    cashCommission,
    futureCommission,
    numInstallments,
    instAmt,
    balance: subtotal - totalRevenue,
  }
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
}
