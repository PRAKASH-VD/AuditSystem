import { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Panel } from '../../components/Panel.jsx'
import { SectionHeader } from '../../components/SectionHeader.jsx'
import { StatusPill } from '../../components/StatusPill.jsx'
import { ErrorState } from '../../components/ErrorState.jsx'
import { listUploadJobs, getUploadJob, listRejectedRows } from '../../services/api.js'

export default function JobsHistory() {
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyStatus, setHistoryStatus] = useState('')
  const [historyUser, setHistoryUser] = useState('')
  const [historyFrom, setHistoryFrom] = useState(null)
  const [historyTo, setHistoryTo] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const [selectedRejectedRows, setSelectedRejectedRows] = useState([])
  const historyLimit = 10

  const historyPages = useMemo(
    () => Math.max(1, Math.ceil(historyTotal / historyLimit)),
    [historyTotal, historyLimit]
  )

  const loadHistory = async (page = 1) => {
    try {
      const params = { page, limit: historyLimit }
      if (historyStatus) params.status = historyStatus
      if (historyUser) params.uploadedBy = historyUser
      if (historyFrom) params.dateFrom = historyFrom.toISOString()
      if (historyTo) params.dateTo = historyTo.toISOString()
      const data = await listUploadJobs(params)
      setHistory(data.items || [])
      setHistoryPage(data.page || page)
      setHistoryTotal(data.total || 0)
      setError('')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load upload history')
    }
  }

  useEffect(() => {
    loadHistory(1)
  }, [])

  useEffect(() => {
    const hasProcessing = history.some((job) => job.status === 'processing')
    if (!hasProcessing) return undefined
    const interval = setInterval(() => loadHistory(historyPage), 3000)
    return () => clearInterval(interval)
  }, [history, historyPage])

  const selectJob = async (id) => {
    try {
      const [job, rejected] = await Promise.all([
        getUploadJob(id),
        listRejectedRows(id, { page: 1, limit: 20 })
      ])
      setSelectedJob(job)
      setSelectedRejectedRows(rejected.items || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load job details')
    }
  }

  const historyColumns = useMemo(
    () => [
      {
        header: 'File',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => selectJob(row.original._id)}
            className="text-xs font-semibold text-(--accent-2) underline"
          >
            {row.original.filename}
          </button>
        )
      },
      {
        header: 'Status',
        cell: ({ row }) => (
          <StatusPill
            text={row.original.status}
            tone={
              row.original.status === 'completed'
                ? 'success'
                : row.original.status === 'failed'
                ? 'danger'
                : 'warning'
            }
          />
        )
      },
      {
        header: 'Progress',
        cell: ({ row }) => {
          const total = row.original.stats?.total || 0
          const processed = row.original.stats?.processed || 0
          const percent = total > 0 ? Math.round((processed / total) * 100) : 0
          return (
            <div className="w-36">
              <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
                <div className="h-full bg-(--accent) transition-all" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-1 text-xs text-(--muted)">
                {processed}/{total} ({percent}%)
              </p>
            </div>
          )
        }
      },
      {
        header: 'Created',
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleString()
      }
    ],
    []
  )

  const historyTable = useReactTable({
    data: history,
    columns: historyColumns,
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Jobs History"
        subtitle="Track upload processing with live status refresh"
      />

      {error ? <ErrorState message={error} /> : null}

      <Panel title="Filters">
        <div className="grid gap-3 md:grid-cols-4">
          <select
            className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
            value={historyStatus}
            onChange={(event) => setHistoryStatus(event.target.value)}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
            placeholder="Uploaded By (User ID)"
            value={historyUser}
            onChange={(event) => setHistoryUser(event.target.value)}
          />
          <DatePicker
            selected={historyFrom}
            onChange={setHistoryFrom}
            placeholderText="From"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
          />
          <DatePicker
            selected={historyTo}
            onChange={setHistoryTo}
            placeholderText="To"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => loadHistory(1)}
            className="md:col-span-4 rounded-full bg-(--accent-2) px-4 py-2 text-xs font-semibold text-white"
          >
            Apply Filters
          </button>
        </div>
      </Panel>

      <Panel title="Upload Jobs">
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 text-xs uppercase tracking-widest text-(--muted)">
              {historyTable.getHeaderGroups().map((headerGroup) => (
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
              {historyTable.getRowModel().rows.map((row) => (
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
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            disabled={historyPage <= 1}
            onClick={() => loadHistory(historyPage - 1)}
            className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-xs text-(--muted)">Page {historyPage} of {historyPages}</span>
          <button
            type="button"
            disabled={historyPage >= historyPages}
            onClick={() => loadHistory(historyPage + 1)}
            className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </Panel>

      {selectedJob ? (
        <Panel title="Selected Job Detail">
          <p className="text-xs text-(--muted)">Job ID</p>
          <p className="text-sm font-semibold">{selectedJob._id}</p>
          <p className="mt-2 text-xs text-(--muted)">Status: {selectedJob.status}</p>
          <p className="text-xs text-(--muted)">Rejected Rows: {selectedRejectedRows.length}</p>
          {selectedRejectedRows.length ? (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              {selectedRejectedRows.map((item) => (
                <p key={item._id}>Row {item.rowNumber}: {item.reason}</p>
              ))}
            </div>
          ) : null}
        </Panel>
      ) : null}
    </div>
  )
}
