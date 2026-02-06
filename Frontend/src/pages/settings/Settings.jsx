import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Panel } from '../../components/Panel.jsx'
import { SectionHeader } from '../../components/SectionHeader.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { changePassword } from '../../services/api.js'

const schema = yup.object({
  currentPassword: yup.string().min(6).required(),
  newPassword: yup.string().min(8).required(),
  confirm: yup.string().oneOf([yup.ref('newPassword')], 'Passwords must match').required()
})

export default function Settings() {
  const { showToast } = useToast()
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: yupResolver(schema) })

  const onSubmit = async (values) => {
    try {
      setError('')
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      })
      reset()
      showToast('Password changed')
    } catch (err) {
      setError(err?.response?.data?.message || 'Change failed')
      showToast('Change failed', 'error')
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeader title="Settings" subtitle="Manage your account" />

      <Panel title="Change Password">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-[color:var(--muted)]">Current Password</label>
            <input
              type="password"
              {...register('currentPassword')}
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              placeholder="********"
            />
            {errors.currentPassword ? <p className="mt-1 text-xs text-rose-600">{errors.currentPassword.message}</p> : null}
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-[color:var(--muted)]">New Password</label>
            <input
              type="password"
              {...register('newPassword')}
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              placeholder="********"
            />
            {errors.newPassword ? <p className="mt-1 text-xs text-rose-600">{errors.newPassword.message}</p> : null}
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-[color:var(--muted)]">Confirm Password</label>
            <input
              type="password"
              {...register('confirm')}
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              placeholder="********"
            />
            {errors.confirm ? <p className="mt-1 text-xs text-rose-600">{errors.confirm.message}</p> : null}
          </div>
          {error ? <p className="md:col-span-2 text-xs text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="md:col-span-2 rounded-full bg-[color:var(--accent-2)] px-4 py-3 text-xs font-semibold text-white"
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </Panel>
    </div>
  )
}
