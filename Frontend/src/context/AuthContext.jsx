import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fetchMe, loginRequest, setAuthToken } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const login = async (payload) => {
    const data = await loginRequest(payload)
    setAuthToken(data.token)
    setToken(data.token)
    const me = await fetchMe()
    setUser(me)
    return data
  }

  const logout = () => {
    setAuthToken(null)
    setToken(null)
    setUser(null)
  }

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, [token])

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
