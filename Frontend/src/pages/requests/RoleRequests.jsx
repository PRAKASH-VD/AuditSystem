import { useEffect, useMemo, useState } from 'react'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Panel } from '../../components/Panel.jsx'
import { SectionHeader } from '../../components/SectionHeader.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { ErrorState } from '../../components/ErrorState.jsx'
import { listRoleRequests, updateRoleRequest } from '../../services/api.js'

export default function RoleRequests() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('')
  const [requestedRole, setRequestedRole] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const limit = 10

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  const load = async (nextPage = 1) => {
    setLoading(true)
    setError('')
    try {
      const params = { page: nextPage, limit }
      if (status) params.status = status
      if (requestedRole) params.requestedRole = requestedRole
      const data = await listRoleRequests(params)
      setItems(data.items || [])
      setTotal(data.total || 0)
      setPage(data.page || nextPage)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
  }, [status, requestedRole])

  const handleAction = async (id, newStatus) => {
    try {
      await updateRoleRequest(id, newStatus)
      load(page)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update request')
    }
  }

  const columns = useMemo(
    () => [
      {
        header: 'Requester',
        cell: ({ row }) => `${row.original.name} ? ${row.original.email}`
      },
      { header: 'Role', accessorKey: 'requestedRole' },
      { header: 'Status', accessorKey: 'status' },
      { header: 'Message', accessorKey: 'message' },
      {
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleAction(row.original._id, 'approved')}
              className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => handleAction(row.original._id, 'denied')}
              className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
            >
              Deny
            </button>
          </div>
        )
      }
    ],
    [items]
  )

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  if (loading) return <LoadingState label="Loading requests..." />
  if (error) return <ErrorState message={error} />

  return (
    <div className="space-y-8">
      <SectionHeader title="Role Requests" subtitle="Review access requests sent by users" />

      <Panel title="Filters">
        <div className="grid gap-3 md:grid-cols-3">
          <select
            className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
          </select>
          <select
            className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
            value={requestedRole}
            onChange={(event) => setRequestedRole(event.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="analyst">Analyst</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="button"
            onClick={() => load(1)}
            className="rounded-full bg-[color:var(--accent-2)] px-4 py-2 text-xs font-semibold text-white"
          >
            Refresh
          </button>
        </div>
      </Panel>

      <Panel title="Requests">
        {items.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No requests found.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/5 text-xs uppercase tracking-widest text-[color:var(--muted)]">
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
        )}

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-xs text-[color:var(--muted)]">Page {page} of {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => load(page + 1)}
            className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </Panel>
    </div>
  )
}
