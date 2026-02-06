import { createContext, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = (message, tone = 'success') => {
    setToast({ message, tone })
    setTimeout(() => setToast(null), 3000)
  }

  const value = useMemo(() => ({ toast, showToast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div className="fixed bottom-6 right-6 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm shadow-xl">
          <span className={toast.tone === 'error' ? 'text-rose-600' : 'text-emerald-600'}>{toast.message}</span>
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
