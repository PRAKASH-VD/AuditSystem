import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function GuestHome() {
  const { token } = useAuth()
  const primaryLink = token ? '/app' : '/login'
  const primaryLabel = token ? 'Open Dashboard' : 'Start Reconciliation'

  return (
    <div className="min-h-screen bg-[color:var(--bg)]">
      <section className="relative overflow-hidden px-6 py-16">
        <div className="absolute -top-24 right-10 h-64 w-64 rounded-full bg-orange-200/70 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-teal-200/70 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
                <span className="mono text-sm">SR</span>
              </div>
              <div>
                <p className="text-lg font-semibold">Smart Reconcile</p>
                <p className="text-sm text-[color:var(--muted)]">Audit System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NavLink to="/login" className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold">
                Sign In
              </NavLink>
              <NavLink to="/app" className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-white">
                Go to App
              </NavLink>
            </div>
          </nav>

          <div className="mt-16 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">Smart Reconciliation</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight lg:text-5xl">
                Monitor, reconcile, and audit transactions with total confidence.
              </h1>
              <p className="mt-6 text-base text-[color:var(--muted)]">
                Upload CSV or Excel files, map columns in seconds, and let the reconciliation engine flag exact,
                partial, duplicate, and unmatched records. Every action is logged in an immutable audit trail.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <NavLink to={primaryLink} className="rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white">
                  {primaryLabel}
                </NavLink>
                <NavLink to="/app" className="rounded-full border border-black/10 px-6 py-3 text-sm font-semibold">
                  View Dashboard
                </NavLink>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-xl">
              <p className="text-xs uppercase tracking-widest text-[color:var(--muted)]">Live Snapshot</p>
              <div className="mt-6 grid gap-4">
                {[
                  { label: 'Today?s Uploads', value: '12 files' },
                  { label: 'Records Processed', value: '48,920' },
                  { label: 'Accuracy', value: '94.1%' },
                  { label: 'Pending Reviews', value: '37' }
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3">
                    <p className="text-xs text-[color:var(--muted)]">{item.label}</p>
                    <p className="mt-2 text-xl font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-black/10 bg-white px-4 py-3">
                <p className="text-xs text-[color:var(--muted)]">Next scheduled audit</p>
                <p className="mt-2 text-sm font-semibold">Feb 7, 2026 ? 09:00 AM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          {[
            {
              title: 'Rule-driven matching',
              body: 'Configure exact, partial, and duplicate matching logic without redeployments.'
            },
            {
              title: 'Audit-grade timeline',
              body: 'Every action is tracked with actor, timestamp, and changes in a visual trail.'
            },
            {
              title: 'Ops-ready insights',
              body: 'Dashboards, filters, and exports keep analysts aligned in real time.'
            }
          ].map((card) => (
            <div key={card.title} className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <p className="mt-3 text-sm text-[color:var(--muted)]">{card.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
