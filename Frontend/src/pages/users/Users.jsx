import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Panel } from '../../components/Panel.jsx'
import { SectionHeader } from '../../components/SectionHeader.jsx'
import { StatusPill } from '../../components/StatusPill.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { ErrorState } from '../../components/ErrorState.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { listUsers, createUser, updateUserRole } from '../../services/api.js'

const roleTone = {
  admin: 'success',
  analyst: 'warning',
  viewer: 'neutral'
}

export default function Users() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm()

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listUsers()
      setUsers(data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    } else {
      setLoading(false)
      setUsers([])
    }
  }, [isAdmin])

  const onSubmit = async (values) => {
    try {
      await createUser(values)
      reset()
      loadUsers()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create user')
    }
  }

  const handleRoleChange = async (id, role) => {
    try {
      await updateUserRole(id, role)
      loadUsers()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update role')
    }
  }

  const columns = useMemo(
    () => [
      { header: 'Name', accessorKey: 'name' },
      { header: 'Email', accessorKey: 'email' },
      {
        header: 'Role',
        cell: ({ row }) => <StatusPill text={row.original.role} tone={roleTone[row.original.role] || 'neutral'} />
      },
      {
        header: 'Change',
        cell: ({ row }) => (
          <select
            className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold"
            value={row.original.role}
            onChange={(event) => handleRoleChange(row.original._id, event.target.value)}
          >
            <option value="admin">admin</option>
            <option value="analyst">analyst</option>
            <option value="viewer">viewer</option>
          </select>
        )
      }
    ],
    [users]
  )

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  if (loading) return <LoadingState label="Loading users..." />
  if (!isAdmin) return <ErrorState message="Admins only. You do not have access." />
  if (error) return <ErrorState message={error} />

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Team & Roles"
        subtitle="Manage access and responsibilities"
        action={<button className="rounded-full bg-(--ink) px-4 py-2 text-xs font-semibold text-white">Invite User</button>}
      />

      <Panel title="Create User">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-4">
          <input
            {...register('name')}
            className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
            placeholder="Full name"
          />
          <input
            {...register('email')}
            className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
            placeholder="Email"
          />
          <input
            {...register('password')}
            type="password"
            className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
            placeholder="Password"
          />
          <select
            {...register('role')}
            className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
            defaultValue="analyst"
          >
            <option value="admin">admin</option>
            <option value="analyst">analyst</option>
            <option value="viewer">viewer</option>
          </select>
          <button
            type="submit"
            disabled={isSubmitting}
            className="md:col-span-4 rounded-full bg-(--accent-2) px-4 py-2 text-xs font-semibold text-white"
          >
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </Panel>

      <Panel title="Active Users">
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 text-xs uppercase tracking-widest text-(--muted)">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t border-black/5">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
