export function Panel({ title, children, action }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-[color:var(--muted)]">{title}</h3>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  )
}
