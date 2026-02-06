export function StatusPill({ text, tone = 'neutral' }) {
  const colors = {
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
    neutral: 'bg-slate-100 text-slate-700'
  }

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[tone]}`}>{text}</span>
}
