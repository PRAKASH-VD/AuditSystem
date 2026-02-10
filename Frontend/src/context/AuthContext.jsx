import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fetchMe, loginRequest, logoutRequest } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(false)
  const [loading, setLoading] = useState(true)

  const login = async (payload) => {
    await loginRequest(payload)
    const me = await fetchMe()
    setUser(me)
    setToken(true)
    return { message: 'Authenticated' }
  }

  const logout = async () => {
    try {
      await logoutRequest()
    } catch {
      // best-effort local cleanup
    }
    setToken(false)
    setUser(null)
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const me = await fetchMe()
        if (!active) return
        setUser(me)
        setToken(true)
      } catch {
        if (!active) return
        setUser(null)
        setToken(false)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const value = useMemo(() => ({ user, token, login, logout, loading }), [user, token, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
