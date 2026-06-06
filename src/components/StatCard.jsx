export default function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-2 ${
      accent
        ? 'bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-900/20'
        : 'bg-white border border-gray-100 shadow-sm'
    }`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold uppercase tracking-wider ${accent ? 'text-brand-200' : 'text-gray-400'}`}>
          {label}
        </span>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? 'bg-white/10' : 'bg-brand-50'}`}>
            {icon}
          </div>
        )}
      </div>
      <span className={`text-2xl font-bold leading-none ${accent ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </span>
      {sub && <span className={`text-xs ${accent ? 'text-brand-200' : 'text-gray-400'}`}>{sub}</span>}
    </div>
  )
}
