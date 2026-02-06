import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { requestRole } from '../services/api.js'

export default function AppShell() {
  const { logout, user } = useAuth()
  const { showToast } = useToast()
  const [showModal, setShowModal] = useState(false)

  const navItems = [
    { label: 'Dashboard', to: '/app' },
    { label: 'Uploads', to: '/app/uploads' },
    { label: 'Reconciliation', to: '/app/reconciliation' },
    { label: 'Audit Trail', to: '/app/audit' },
    { label: 'Settings', to: '/app/settings' },
    ...(user?.role === 'admin'
      ? [
          { label: 'Users', to: '/app/users' },
          { label: 'Requests', to: '/app/requests' }
        ]
      : [])
  ]

  const handleRequestAdmin = async () => {
    if (!user) return
    try {
      await requestRole(
        {
          name: user.name || 'User',
          email: user.email || 'unknown@domain.com',
          requestedRole: 'admin',
          message: 'Requesting admin access from sidebar.'
        },
        'sidebar'
      )
      showToast('Admin request sent')
    } catch (err) {
      showToast('Request failed', 'error')
    } finally {
      setShowModal(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="relative overflow-hidden border-r border-black/10 bg-white/70 px-6 py-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div className="absolute -top-24 left-10 h-40 w-40 rounded-full bg-orange-200 blur-3xl" />
          <div className="absolute bottom-10 right-5 h-36 w-36 rounded-full bg-teal-200 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
                <span className="mono text-sm">SR</span>
              </div>
              <div>
                <p className="text-lg font-semibold">Smart Reconcile</p>
                <p className="text-sm text-(--muted)">Audit System</p>
              </div>
            </div>

            <nav className="mt-10 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive ? 'bg-(--ink) text-white' : 'hover:bg-black/5'
                    }`
                  }
                >
                  <span>{item.label}</span>
                  <span className="mono text-xs opacity-70">?</span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-12 rounded-3xl border border-black/10 bg-white p-4">
              <p className="text-xs uppercase tracking-widest text-(--muted)">Active Profile</p>
              <p className="mt-2 text-sm font-semibold">{user?.name || 'User'}</p>
              <p className="text-xs text-(--muted)">{user?.email || 'email@domain.com'}</p>
              <div className="mt-2 inline-flex items-center gap-2">
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
                  {user?.role || 'viewer'}
                </span>
              </div>
              <NavLink
                to="/app/settings"
                className="mt-3 block w-full rounded-xl border border-black/10 px-3 py-2 text-center text-xs font-semibold"
              >
                Change Password
              </NavLink>
              {user?.role !== 'admin' ? (
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-3 w-full rounded-xl border border-dashed border-black/20 px-3 py-2 text-xs font-semibold text-(--accent)"
                >
                  Request Admin
                </button>
              ) : null}
              <button
                onClick={logout}
                className="mt-4 w-full rounded-xl border border-black/10 px-3 py-2 text-xs font-semibold transition hover:bg-black/5"
              >
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        <main className="px-6 py-8 lg:px-10">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-(--muted)">Audit Command Center</p>
              <h1 className="mt-2 text-3xl font-semibold">Today's Reconciliation Pulse</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold">
                Feb 5, 2026
              </div>
              <NavLink to="/app/uploads" className="rounded-full bg-(--accent) px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-orange-200">
                Upload File
              </NavLink>
            </div>
          </header>

          <section className="mt-8">
            <Outlet />
          </section>
        </main>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Request Admin Access</h2>
            <p className="mt-2 text-sm text-(--muted)">
              This will send a request to the admin inbox. Continue?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestAdmin}
                className="rounded-full bg-(--accent) px-4 py-2 text-xs font-semibold text-white"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
