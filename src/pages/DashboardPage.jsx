import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../context/ProductContext'
import { calcDashboard, fmt } from '../utils/commission'
import StatCard from '../components/StatCard'
import ProductCard from '../components/ProductCard'
import ProductForm from '../components/ProductForm'

const VIEWS = { dashboard: 'dashboard', add: 'add', edit: 'edit' }

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const { products, addProduct, updateProduct } = useProducts()
  const [view, setView] = useState(VIEWS.dashboard)
  const [editTarget, setEditTarget] = useState(null)

  const totals = calcDashboard(products)

  function handleSave(form) {
    if (editTarget) {
      updateProduct(editTarget.id, form)
    } else {
      addProduct(form)
    }
    setView(VIEWS.dashboard)
    setEditTarget(null)
  }

  function handleEdit(product) {
    setEditTarget(product)
    setView(VIEWS.edit)
  }

  function handleCancel() {
    setView(VIEWS.dashboard)
    setEditTarget(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl flex items-center justify-center shadow">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-none">CommissionPro</h1>
              <p className="text-xs text-gray-400 mt-0.5">Sales Commission Tracker</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {view === VIEWS.dashboard ? (
              <button
                onClick={() => setView(VIEWS.add)}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm shadow-brand-900/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </button>
            ) : (
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition font-medium"
              >
                ← Dashboard
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                {user.avatar}
              </div>
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
            </div>
            <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-700 transition font-medium">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ADD / EDIT VIEW */}
        {(view === VIEWS.add || view === VIEWS.edit) && (
          <div className="max-w-2xl mx-auto">
            <ProductForm
              initial={editTarget}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {view === VIEWS.dashboard && (
          <div className="space-y-8">
            {/* Page title */}
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {products.length === 0 ? 'No products yet — add your first deal.' : `${products.length} product${products.length !== 1 ? 's' : ''} tracked`}
                </p>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Commission"
                value={fmt(totals.totalCommission)}
                sub="Across all products"
                accent
                icon={
                  <svg className="w-4 h-4 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1" />
                  </svg>
                }
              />
              <StatCard
                label="Earned Now"
                value={fmt(totals.cashCommission)}
                sub="From cash collected"
                icon={
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Future Commission"
                value={fmt(totals.futureCommission)}
                sub="Pending installments"
                icon={
                  <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Total Contract Value"
                value={fmt(totals.totalContractValue)}
                sub={`${fmt(totals.totalCashCollected)} collected`}
                icon={
                  <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />
            </div>

            {/* Commission split bar */}
            {totals.totalCommission > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Commission Split</h3>
                  <span className="text-xs text-gray-400">Earned vs. Future</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-green-500 rounded-l-full transition-all duration-700"
                    style={{ width: `${(totals.cashCommission / totals.totalCommission) * 100}%` }}
                  />
                  <div
                    className="h-full bg-amber-400 rounded-r-full transition-all duration-700"
                    style={{ width: `${(totals.futureCommission / totals.totalCommission) * 100}%` }}
                  />
                </div>
                <div className="flex gap-5 mt-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    Earned: {fmt(totals.cashCommission)} ({Math.round((totals.cashCommission / totals.totalCommission) * 100)}%)
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    Future: {fmt(totals.futureCommission)} ({Math.round((totals.futureCommission / totals.totalCommission) * 100)}%)
                  </div>
                </div>
              </div>
            )}

            {/* Product grid */}
            {products.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-700 mb-1">No products yet</h3>
                <p className="text-sm text-gray-400 mb-5">Add your first product to start tracking commissions.</p>
                <button
                  onClick={() => setView(VIEWS.add)}
                  className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
                >
                  Add First Product
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Products</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {products.map(p => (
                    <ProductCard key={p.id} product={p} onEdit={handleEdit} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
