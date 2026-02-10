export function FieldDiff({ label, uploaded, system, highlight, variancePercent }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${highlight ? 'border-rose-300 bg-rose-50' : 'border-black/10 bg-white'}`}>
      <p className="text-xs uppercase tracking-widest text-[color:var(--muted)]">{label}</p>
      <div className="mt-2 grid gap-2 text-sm">
        <p><span className="text-[color:var(--muted)]">Uploaded:</span> {uploaded ?? '-'}</p>
        <p><span className="text-[color:var(--muted)]">System:</span> {system ?? '-'}</p>
        {typeof variancePercent === 'number' ? (
          <p><span className="text-[color:var(--muted)]">Variance:</span> {variancePercent.toFixed(2)}%</p>
        ) : null}
      </div>
    </div>
  )
}
