import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { requestRole } from '../../services/api.js'

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(6).required()
})

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showToast } = useToast()
  const [error, setError] = useState('')
  const [requestMode, setRequestMode] = useState(false)
  const [requestStatus, setRequestStatus] = useState('')
  const [message, setMessage] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: yupResolver(schema) })

  const onSubmit = async (values) => {
    try {
      setError('')
      await login(values)
      navigate('/app')
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed')
    }
  }

  const handleRequest = async () => {
    try {
      const email = watch('email')
      setRequestStatus('')
      await requestRole(
        {
          name: 'Guest',
          email: email || 'unknown@domain.com',
          requestedRole: 'analyst',
          message
        },
        'login'
      )
      setRequestStatus('Request sent. Admin will contact you.')
      showToast('Request sent to admin')
    } catch (err) {
      setRequestStatus(err?.response?.data?.message || 'Request failed')
      showToast('Request failed', 'error')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white/80 p-8 shadow-xl">
        <p className="text-xs uppercase tracking-widest text-(--muted)">Smart Reconcile</p>
        <h1 className="mt-3 text-2xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-sm text-(--muted)">Sign in to launch reconciliations.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-(--muted)">Email</label>
            <input
              {...register('email')}
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              placeholder="admin@example.com"
            />
            {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p> : null}
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-(--muted)">Password</label>
            <input
              type="password"
              {...register('password')}
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              placeholder="********"
            />
            {errors.password ? <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p> : null}
          </div>
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-(--ink) px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs text-(--muted)">
          <span>Need access?</span>
          <button
            type="button"
            onClick={() => setRequestMode((prev) => !prev)}
            className="font-semibold text-(--accent)"
          >
            Request Role
          </button>
        </div>

        {requestMode ? (
          <div className="mt-4 rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs">
            <p className="text-xs text-(--muted)">We will email an admin with your request.</p>
            <textarea
              className="mt-3 w-full rounded-2xl border border-black/10 px-3 py-2 text-xs"
              rows={3}
              placeholder="Add a short message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <button
              type="button"
              onClick={handleRequest}
              className="mt-3 w-full rounded-full bg-(--accent-2) px-3 py-2 text-xs font-semibold text-white"
            >
              Send Request
            </button>
            {requestStatus ? <p className="mt-2 text-xs text-(--muted)">{requestStatus}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
