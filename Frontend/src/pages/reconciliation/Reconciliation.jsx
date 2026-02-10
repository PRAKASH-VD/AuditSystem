import { useEffect, useMemo, useState } from 'react'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Panel } from '../../components/Panel.jsx'
import { SectionHeader } from '../../components/SectionHeader.jsx'
import { StatusPill } from '../../components/StatusPill.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { ErrorState } from '../../components/ErrorState.jsx'
import { FieldDiff } from '../../components/FieldDiff.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { listReconciliations, manualReconcile, getReconciliationDetail, listRules, createRule, updateRule } from '../../services/api.js'

const statusTone = {
  exact: 'success',
  partial: 'warning',
  duplicate: 'danger',
  unmatched: 'neutral'
}

const fields = [
  { key: 'transactionId', label: 'Transaction ID' },
  { key: 'amount', label: 'Amount' },
  { key: 'referenceNumber', label: 'Reference Number' },
  { key: 'date', label: 'Date' }
]

export default function Reconciliation() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const canManualReview = user?.role === 'admin' || user?.role === 'analyst'
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [rules, setRules] = useState([])
  const [ruleDraft, setRuleDraft] = useState({
    name: '',
    type: 'exact',
    priority: 5,
    active: true,
    config: {}
  })
  const limit = 10

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  const tableColumns = useMemo(
    () => [
      {
        header: 'Result ID',
        accessorKey: '_id'
      },
      {
        header: 'Status',
        cell: ({ row }) => (
          <StatusPill text={row.original.status} tone={statusTone[row.original.status] || 'neutral'} />
        )
      }
    ],
    []
  )

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel()
  })

  const loadPage = (nextPage = 1) => {
    setLoading(true)
    const params = { page: nextPage, limit }
    if (filterStatus) params.status = filterStatus
    listReconciliations(params)
      .then((data) => {
        setRows(data.items || [])
        setTotal(data.total || 0)
        setPage(data.page || nextPage)
        const first = data.items?.[0]
        if (first) {
          setSelected(first)
          setStatus(first.status)
        }
      })
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load results'))
      .finally(() => setLoading(false))
  }

  const loadRules = () => {
    if (!isAdmin) return
    listRules()
      .then(setRules)
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load rules'))
  }

  useEffect(() => {
    loadPage(1)
  }, [filterStatus])

  useEffect(() => {
    loadRules()
  }, [isAdmin])

  useEffect(() => {
    if (!selected?._id) return
    getReconciliationDetail(selected._id)
      .then(setDetail)
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load detail'))
  }, [selected])

  const applyUpdate = async () => {
    if (!selected) return
    try {
      const updated = await manualReconcile(selected._id, {
        status: status || selected.status,
        notes: note || undefined
      })
      setRows((prev) => prev.map((item) => (item._id === updated._id ? updated : item)))
      setSelected(updated)
      setNote('')
    } catch (err) {
      setError(err?.response?.data?.message || 'Manual update failed')
    }
  }

  const createNewRule = async () => {
    try {
      await createRule(ruleDraft)
      setRuleDraft({ name: '', type: 'exact', priority: 5, active: true, config: {} })
      loadRules()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create rule')
    }
  }

  const toggleRule = async (rule) => {
    try {
      await updateRule(rule._id, { active: !rule.active })
      loadRules()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update rule')
    }
  }

  if (loading) return <LoadingState label="Loading reconciliation results..." />
  if (error) return <ErrorState message={error} />

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Reconciliation Review"
        subtitle="Compare uploads against system records and resolve mismatches"
        action={
          <div className="flex items-center gap-2">
            <select
              className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold"
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
            >
              <option value="">All</option>
              <option value="exact">Exact</option>
              <option value="partial">Partial</option>
              <option value="duplicate">Duplicate</option>
              <option value="unmatched">Unmatched</option>
            </select>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Match Results">
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
                  <tr
                    key={row.id}
                    className="border-t border-black/5 hover:bg-black/5 cursor-pointer"
                    onClick={() => {
                      setSelected(row.original)
                      setStatus(row.original.status)
                    }}
                  >
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

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => loadPage(page - 1)}
              className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-xs text-(--muted)">Page {page} of {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => loadPage(page + 1)}
              className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Side-by-Side Detail">
            {detail ? (
              <div className="space-y-3">
                {fields.map((field) => (
                  <FieldDiff
                    key={field.key}
                    label={field.label}
                    uploaded={detail.uploadedRecord?.[field.key]}
                    system={detail.systemRecord?.[field.key]}
                    highlight={detail.mismatches?.includes(field.key)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-(--muted)">Select a record to view detail.</p>
            )}
          </Panel>

          <Panel title="Manual Review">
            {!canManualReview ? (
              <p className="text-sm text-(--muted)">Viewer role has read-only reconciliation access.</p>
            ) : selected ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-black/10 bg-white p-4">
                  <p className="text-xs uppercase tracking-widest text-(--muted)">Result</p>
                  <p className="mt-2 text-sm font-semibold">{selected._id}</p>
                  <p className="text-xs text-(--muted)">Current: {selected.status}</p>
                </div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-(--muted)">
                  Update Status
                  <select
                    className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <option value="exact">exact</option>
                    <option value="partial">partial</option>
                    <option value="duplicate">duplicate</option>
                    <option value="unmatched">unmatched</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold uppercase tracking-widest text-(--muted)">
                  Notes
                  <textarea
                    className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={3}
                  />
                </label>
                <button
                  type="button"
                  onClick={applyUpdate}
                  className="w-full rounded-full bg-(--accent) px-4 py-2 text-xs font-semibold text-white"
                >
                  Apply Manual Correction
                </button>
              </div>
            ) : (
              <p className="text-sm text-(--muted)">Select a record to review.</p>
            )}
          </Panel>

          {isAdmin ? (
            <Panel title="Rules Management">
              <div className="space-y-4">
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    className="rounded-2xl border border-black/10 px-3 py-2 text-sm"
                    placeholder="Rule name"
                    value={ruleDraft.name}
                    onChange={(event) => setRuleDraft({ ...ruleDraft, name: event.target.value })}
                  />
                  <select
                    className="rounded-2xl border border-black/10 px-3 py-2 text-sm"
                    value={ruleDraft.type}
                    onChange={(event) => setRuleDraft({ ...ruleDraft, type: event.target.value })}
                  >
                    <option value="exact">exact</option>
                    <option value="partial">partial</option>
                    <option value="duplicate">duplicate</option>
                    <option value="unmatched">unmatched</option>
                  </select>
                  <input
                    type="number"
                    className="rounded-2xl border border-black/10 px-3 py-2 text-sm"
                    placeholder="Priority"
                    value={ruleDraft.priority}
                    onChange={(event) => setRuleDraft({ ...ruleDraft, priority: Number(event.target.value) })}
                  />
                  <button
                    type="button"
                    onClick={createNewRule}
                    className="rounded-full bg-(--accent-2) px-4 py-2 text-xs font-semibold text-white"
                  >
                    Add Rule
                  </button>
                </div>

                {rules.length === 0 ? (
                  <p className="text-sm text-(--muted)">No rules loaded.</p>
                ) : (
                  <div className="space-y-2">
                    {rules.map((rule) => (
                      <div key={rule._id} className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold">{rule.name}</p>
                          <p className="text-xs text-(--muted)">{rule.type} ? Priority {rule.priority}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleRule(rule)}
                          className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold"
                        >
                          {rule.active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  )
}
