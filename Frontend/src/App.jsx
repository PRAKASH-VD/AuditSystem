import { Routes, Route } from 'react-router-dom'
import AppShell from './layout/AppShell.jsx'
import Login from './pages/auth/Login.jsx'
import ResetPassword from './pages/auth/ResetPassword.jsx'
import Dashboard from './pages/dashboard/Dashboard.jsx'
import Uploads from './pages/uploads/Uploads.jsx'
import Reconciliation from './pages/reconciliation/Reconciliation.jsx'
import Audit from './pages/audit/Audit.jsx'
import Users from './pages/users/Users.jsx'
import Settings from './pages/settings/Settings.jsx'
import NotFound from './pages/NotFound.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import GuestHome from './pages/guest/GuestHome.jsx'
import RoleRequests from './pages/requests/RoleRequests.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GuestHome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="uploads" element={<Uploads />} />
        <Route path="reconciliation" element={<Reconciliation />} />
        <Route path="audit" element={<Audit />} />
        <Route path="users" element={<Users />} />
        <Route path="requests" element={<RoleRequests />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
