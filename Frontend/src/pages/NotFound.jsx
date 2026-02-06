export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <p className="mono text-xs uppercase tracking-widest text-[color:var(--muted)]">404</p>
        <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">The page you are looking for does not exist.</p>
      </div>
    </div>
  )
}
