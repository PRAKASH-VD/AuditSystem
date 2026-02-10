import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { token, loading, user } = useAuth()
  if (loading) {
    return null
  }
  if (!token) {
    return <Navigate to="/login" replace />
  }
  if (user?.mustResetPassword) {
    return <Navigate to="/reset-password" replace />
  }
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/app" replace />
  }
  return children
}
