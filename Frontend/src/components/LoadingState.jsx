export function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="rounded-3xl border border-dashed border-black/10 bg-white/70 p-6 text-sm text-[color:var(--muted)]">
      {label}
    </div>
  )
}
