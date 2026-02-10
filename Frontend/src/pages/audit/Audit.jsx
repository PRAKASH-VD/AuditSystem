import { useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Panel } from '../../components/Panel.jsx'
import { SectionHeader } from '../../components/SectionHeader.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { ErrorState } from '../../components/ErrorState.jsx'
import { listAuditTimeline, listAuditLogsPaginated, exportAuditCsv } from '../../services/api.js'

export default function Audit() {
  const [recordType, setRecordType] = useState('ReconciliationResult')
  const [recordId, setRecordId] = useState('')
  const [timeline, setTimeline] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterRecordType, setFilterRecordType] = useState('')
  const [dateFrom, setDateFrom] = useState(null)
  const [dateTo, setDateTo] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  const loadTimeline = async () => {
    if (!recordId) return
    setLoading(true)
    setError('')
    try {
      const data = await listAuditTimeline(recordType, recordId)
      setTimeline(data.timeline || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load timeline')
    } finally {
      setLoading(false)
    }
  }

  const loadLogs = async (nextPage = 1) => {
    setLoading(true)
    setError('')
    try {
      const params = { page: nextPage, limit }
      if (filterRecordType) params.recordType = filterRecordType
      if (dateFrom) params.dateFrom = dateFrom.toISOString()
      if (dateTo) params.dateTo = dateTo.toISOString()
      const data = await listAuditLogsPaginated(params)
      setLogs(data.items || [])
      setTotal(data.total || 0)
      setPage(data.page || nextPage)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const params = {}
      if (filterRecordType) params.recordType = filterRecordType
      if (dateFrom) params.dateFrom = dateFrom.toISOString()
      if (dateTo) params.dateTo = dateTo.toISOString()
      const response = await exportAuditCsv(params)
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'audit_logs.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err?.response?.data?.message || 'Export failed')
    }
  }

  const columns = useMemo(
    () => [
      {
        header: 'Time',
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleString()
      },
      { header: 'Action', accessorKey: 'action' },
      { header: 'Type', accessorKey: 'recordType' },
      { header: 'Record ID', accessorKey: 'recordId' }
    ],
    []
  )

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  const summarizeChanges = (changes) => {
    if (!changes || typeof changes !== 'object') return 'No field changes captured.'
    const fields = Object.keys(changes)
    if (!fields.length) return 'No field changes captured.'
    return fields.join(', ')
  }

  const actorLabel = (item) => {
    if (!item?.actor) return 'System'
    if (typeof item.actor === 'string') return item.actor
    return item.actor?.name || item.actor?.email || String(item.actor?._id || 'Unknown')
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Audit Timeline"
        subtitle="Immutable trail of every action"
        action={
          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold"
              onClick={() => loadLogs(1)}
            >
              Refresh Logs
            </button>
            <button
              className="rounded-full bg-(--accent) px-4 py-2 text-xs font-semibold text-white"
              onClick={handleExport}
            >
              Export CSV
            </button>
          </div>
        }
      />

      <Panel title="Audit Log Filters">
        <div className="grid gap-3 md:grid-cols-4">
          <select
            className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
            value={filterRecordType}
            onChange={(event) => setFilterRecordType(event.target.value)}
          >
            <option value="">All Types</option>
            <option value="ReconciliationResult">ReconciliationResult</option>
            <option value="UploadedRecord">UploadedRecord</option>
          </select>
          <DatePicker
            selected={dateFrom}
            onChange={setDateFrom}
            placeholderText="From"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
          />
          <DatePicker
            selected={dateTo}
            onChange={setDateTo}
            placeholderText="To"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => loadLogs(1)}
            className="rounded-full bg-(--accent-2) px-4 py-2 text-xs font-semibold text-white"
          >
            Apply Filters
          </button>
        </div>
      </Panel>

      {loading ? <LoadingState label="Loading audit data..." /> : null}
      {error ? <ErrorState message={error} /> : null}

      <Panel title="Recent Audit Logs">
        {logs.length === 0 ? (
          <p className="text-sm text-(--muted)">No logs loaded yet. Click Refresh Logs.</p>
        ) : (
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
        )}
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => loadLogs(page - 1)}
            className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-xs text-(--muted)">Page {page} of {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => loadLogs(page + 1)}
            className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </Panel>

      <Panel title="Search Record">
        <div className="grid gap-4 md:grid-cols-[1fr_2fr_auto]">
          <select
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
            value={recordType}
            onChange={(event) => setRecordType(event.target.value)}
          >
            <option value="ReconciliationResult">ReconciliationResult</option>
            <option value="UploadedRecord">UploadedRecord</option>
          </select>
          <input
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
            placeholder="Record ID"
            value={recordId}
            onChange={(event) => setRecordId(event.target.value)}
          />
          <button
            type="button"
            onClick={loadTimeline}
            className="rounded-full bg-(--accent-2) px-4 py-2 text-xs font-semibold text-white"
          >
            Load
          </button>
        </div>
      </Panel>

      <Panel title="Record Timeline">
        <div className="space-y-4">
          {timeline.length === 0 ? (
            <p className="text-sm text-(--muted)">No timeline entries found.</p>
          ) : (
            timeline.map((item, index) => (
              <div key={item._id || index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-(--accent-2) text-xs font-bold text-white">
                    {String(item.action || 'A').slice(0, 1).toUpperCase()}
                  </div>
                  {index !== timeline.length - 1 ? <div className="h-full w-px bg-black/10" /> : null}
                </div>
                <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
                  <p className="text-xs text-(--muted)">{new Date(item.createdAt).toLocaleString()}</p>
                  <p className="text-sm font-semibold">{item.action}</p>
                  <p className="text-xs text-(--muted)">User: {actorLabel(item)}</p>
                  <p className="text-xs text-(--muted)">{item.recordType} - {item.recordId}</p>
                  <p className="mt-1 text-xs text-(--muted)">Changes: {summarizeChanges(item.changes)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  )
}
