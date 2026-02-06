export function FieldDiff({ label, uploaded, system, highlight }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${highlight ? 'border-amber-300 bg-amber-50' : 'border-black/10 bg-white'}`}>
      <p className="text-xs uppercase tracking-widest text-[color:var(--muted)]">{label}</p>
      <div className="mt-2 grid gap-2 text-sm">
        <p><span className="text-[color:var(--muted)]">Uploaded:</span> {uploaded ?? '-'}</p>
        <p><span className="text-[color:var(--muted)]">System:</span> {system ?? '-'}</p>
      </div>
    </div>
  )
}
