export function StatCard({ label, value, trend }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-widest text-[color:var(--muted)]">{label}</p>
      <div className="mt-4 flex items-end justify-between">
        <p className="text-3xl font-semibold">{value}</p>
        {trend ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{trend}</span> : null}
      </div>
    </div>
  )
}
