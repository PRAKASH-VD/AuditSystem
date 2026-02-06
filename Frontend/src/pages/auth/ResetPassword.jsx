import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { resetPassword } from '../../services/api.js'

const schema = yup.object({
  password: yup.string().min(8).required(),
  confirm: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required()
})

export default function ResetPassword() {
  const { showToast } = useToast()
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: yupResolver(schema) })

  const onSubmit = async (values) => {
    try {
      setError('')
      await resetPassword({ password: values.password })
      showToast('Password updated')
      logout()
      navigate('/login')
    } catch (err) {
      setError(err?.response?.data?.message || 'Reset failed')
    }
  }

  useEffect(() => {
    if (!token) {
      navigate('/login')
    }
  }, [token, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white/80 p-8 shadow-xl">
        <p className="text-xs uppercase tracking-widest text-(--muted)">Password Reset</p>
        <h1 className="mt-3 text-2xl font-semibold">Set a new password</h1>
        <p className="mt-2 text-sm text-(--muted)">
          You must reset your password before continuing.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-(--muted)">New Password</label>
            <input
              type="password"
              {...register('password')}
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              placeholder="********"
            />
            {errors.password ? <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p> : null}
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-(--muted)">Confirm Password</label>
            <input
              type="password"
              {...register('confirm')}
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              placeholder="********"
            />
            {errors.confirm ? <p className="mt-1 text-xs text-rose-600">{errors.confirm.message}</p> : null}
          </div>
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-(--ink) px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
