import { useCallback, useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useDropzone } from 'react-dropzone'
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useSearchParams } from 'react-router-dom'
import { Panel } from '../../components/Panel.jsx'
import { SectionHeader } from '../../components/SectionHeader.jsx'
import { StatusPill } from '../../components/StatusPill.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { ErrorState } from '../../components/ErrorState.jsx'
import { uploadPreview, submitUpload, getUploadJob, directUpload, listUploadJobs } from '../../services/api.js'

const initialMapping = {
  transactionId: '',
  amount: '',
  referenceNumber: '',
  date: ''
}

const STORAGE_KEY = 'mappingSets'

export default function Uploads() {
  const [preview, setPreview] = useState(null)
  const [jobId, setJobId] = useState('')
  const [mapping, setMapping] = useState(initialMapping)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mappingName, setMappingName] = useState('')
  const [savedMappings, setSavedMappings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  })
  const [quickFile, setQuickFile] = useState(null)
  const [history, setHistory] = useState([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyStatus, setHistoryStatus] = useState('')
  const [historyUser, setHistoryUser] = useState('')
  const [historyFrom, setHistoryFrom] = useState(null)
  const [historyTo, setHistoryTo] = useState(null)
  const historyLimit = 10
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedJob, setSelectedJob] = useState(null)

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
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load upload history')
    }
  }

  useEffect(() => {
    loadHistory(1)
  }, [])

  useEffect(() => {
    const jobIdParam = searchParams.get('jobId')
    if (!jobIdParam) {
      setSelectedJob(null)
      return
    }
    getUploadJob(jobIdParam)
      .then((job) => setSelectedJob(job))
      .catch(() => setSelectedJob(null))
  }, [searchParams])

  useEffect(() => {
    const hasProcessing = history.some((job) => job.status === 'processing')
    if (!hasProcessing) return undefined
    const interval = setInterval(() => loadHistory(historyPage), 3000)
    return () => clearInterval(interval)
  }, [history, historyPage])

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const data = await uploadPreview(file)
      setPreview(data.preview)
      setJobId(data.jobId)
      setMapping((prev) => ({
        ...prev,
        transactionId: data.preview.headers[0] || '',
        amount: data.preview.headers[1] || '',
        referenceNumber: data.preview.headers[2] || '',
        date: data.preview.headers[3] || ''
      }))
      setStatus(null)
      loadHistory(1)
    } catch (err) {
      setError(err?.response?.data?.message || 'Preview failed')
    } finally {
      setLoading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
    noClick: true
  })

  const validateMapping = useMemo(() => {
    const values = Object.values(mapping)
    if (values.some((value) => !value)) {
      return 'Please map all required fields.'
    }
    const unique = new Set(values)
    if (unique.size !== values.length) {
      return 'Each field must map to a unique column.'
    }
    return ''
  }, [mapping])

  const mappingTypeErrors = useMemo(() => {
    if (!preview || !preview.rows || preview.rows.length === 0) return []
    const sample = preview.rows.slice(0, 10)
    const amountOk = sample.some((row) => {
      const value = row[mapping.amount]
      if (value === null || value === undefined) return false
      if (typeof value === 'number') return !Number.isNaN(value)
      if (typeof value === 'string') return value.trim() !== '' && !Number.isNaN(Number(value))
      return false
    })
    const dateOk = sample.some((row) => {
      const value = row[mapping.date]
      if (!value) return false
      const parsed = new Date(value)
      return !Number.isNaN(parsed.getTime())
    })
    const transactionOk = sample.some((row) => String(row[mapping.transactionId] || '').trim() !== '')

    const errors = []
    if (!transactionOk) errors.push('Transaction ID column must contain values.')
    if (!amountOk) errors.push('Amount column must contain numeric values.')
    if (!dateOk) errors.push('Date column must contain valid dates.')
    return errors
  }, [preview, mapping])

  const mappingReady = !validateMapping && mappingTypeErrors.length === 0

  const handleSubmit = async () => {
    if (!jobId) return
    if (validateMapping) {
      setError(validateMapping)
      return
    }
    if (mappingTypeErrors.length) {
      setError(mappingTypeErrors.join(' '))
      return
    }
    setLoading(true)
    setError('')
    try {
      await submitUpload(jobId, mapping)
      setStatus('processing')
      const interval = setInterval(async () => {
        const latest = await getUploadJob(jobId)
        setStatus(latest.status)
        if (latest.status === 'completed' || latest.status === 'failed') {
          clearInterval(interval)
        }
      }, 2000)
    } catch (err) {
      setError(err?.response?.data?.message || 'Submit failed')
    } finally {
      setLoading(false)
    }
  }

  const saveMappingSet = () => {
    if (!mappingName.trim()) {
      setError('Provide a mapping name to save.')
      return
    }
    const next = savedMappings.filter((item) => item.name !== mappingName.trim())
    const updated = [...next, { name: mappingName.trim(), mapping }]
    setSavedMappings(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const loadMappingSet = (name) => {
    const found = savedMappings.find((item) => item.name === name)
    if (found) {
      setMapping(found.mapping)
    }
  }

  const handleDirectUpload = async () => {
    if (!quickFile) {
      setError('Select a file for direct upload.')
      return
    }
    if (!mappingReady) {
      setError('Please map all required fields using Preview before Direct Upload.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await directUpload(quickFile, mapping)
      setJobId(res.jobId)
      setStatus('processing')
      loadHistory(1)
    } catch (err) {
      setError(err?.response?.data?.message || 'Direct upload failed')
    } finally {
      setLoading(false)
    }
  }

  const mappingOptions = preview?.headers || []

  const historyColumns = useMemo(
    () => [
      { header: 'File', accessorKey: 'filename' },
      {
        header: 'Reused From',
        cell: ({ row }) =>
          row.original.reusedFrom ? (
            <button
              type="button"
              onClick={() => setSearchParams({ jobId: row.original.reusedFrom })}
              className="text-xs font-semibold text-[color:var(--accent-2)] underline"
            >
              {row.original.reusedFrom}
            </button>
          ) : (
            <span className="text-xs text-[color:var(--muted)]">—</span>
          )
      },
      {
        header: 'Reuse',
        cell: ({ row }) =>
          row.original.reusedResults ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              Reused
            </span>
          ) : (
            <span className="text-xs text-[color:var(--muted)]">—</span>
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
        header: 'Created',
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleString()
      },
      {
        header: 'Progress',
        cell: ({ row }) =>
          `${row.original.stats?.processed || 0} / ${row.original.stats?.total || 0}`
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
        title="Upload Center"
        subtitle="Drop a file, map columns, and launch reconciliation"
        action={<button className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-xs font-semibold text-white">New Upload</button>}
      />

      <Panel title="Upload A New File">
        <div
          {...getRootProps()}
          className={`rounded-3xl border border-dashed border-black/20 p-10 text-center transition ${
            isDragActive ? 'bg-black/10' : 'bg-black/5'
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-sm font-semibold">Drag & drop CSV or Excel here</p>
          <p className="mt-2 text-xs text-[color:var(--muted)]">Up to 50,000 rows. Preview + map before submitting.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={open}
              className="rounded-full bg-[color:var(--accent)] px-5 py-2 text-xs font-semibold text-white"
            >
              Select File
            </button>
            <a
              href="/templates/transactions_template.csv"
              download
              className="rounded-full border border-black/10 px-5 py-2 text-xs font-semibold"
            >
              Download Template
            </a>
          </div>
        </div>
      </Panel>

      {loading ? <LoadingState label="Working on your file..." /> : null}
      {error ? <ErrorState message={error} /> : null}

      {preview ? (
        <Panel title="Preview & Column Mapping">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="overflow-auto rounded-2xl border border-black/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/5 text-[color:var(--muted)]">
                  <tr>
                    {preview.headers.map((header) => (
                      <th key={header} className="px-3 py-2">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, index) => (
                    <tr key={index} className="border-t border-black/5">
                      {preview.headers.map((header) => (
                        <td key={header} className="px-3 py-2">{String(row[header] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              {Object.keys(mapping).map((key) => (
                <label key={key} className="block text-xs font-semibold uppercase tracking-widest text-[color:var(--muted)]">
                  {key}
                  <select
                    className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
                    value={mapping[key]}
                    onChange={(event) => setMapping({ ...mapping, [key]: event.target.value })}
                  >
                    <option value="">Select column</option>
                    {mappingOptions.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </label>
              ))}

              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <p className="text-xs uppercase tracking-widest text-[color:var(--muted)]">Save Mapping Set</p>
                <input
                  className="mt-3 w-full rounded-2xl border border-black/10 px-3 py-2 text-sm"
                  placeholder="Mapping name"
                  value={mappingName}
                  onChange={(event) => setMappingName(event.target.value)}
                />
                <button
                  type="button"
                  onClick={saveMappingSet}
                  className="mt-3 w-full rounded-full border border-black/10 px-4 py-2 text-xs font-semibold"
                >
                  Save Mapping
                </button>
                {savedMappings.length ? (
                  <select
                    className="mt-3 w-full rounded-2xl border border-black/10 px-3 py-2 text-sm"
                    onChange={(event) => loadMappingSet(event.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Load saved mapping</option>
                    {savedMappings.map((item) => (
                      <option key={item.name} value={item.name}>{item.name}</option>
                    ))}
                  </select>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                className="w-full rounded-full bg-[color:var(--accent-2)] px-4 py-2 text-xs font-semibold text-white"
              >
                Submit & Reconcile
              </button>

              {validateMapping ? <p className="text-xs text-rose-600">{validateMapping}</p> : null}
              {mappingTypeErrors.length ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {mappingTypeErrors.map((msg) => (
                    <p key={msg}>{msg}</p>
                  ))}
                </div>
              ) : null}
              {status ? <StatusPill text={status} tone={status === 'completed' ? 'success' : 'warning'} /> : null}
            </div>
          </div>
        </Panel>
      ) : null}

      {mappingReady ? (
        <Panel title="Direct Upload (No Preview)">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="file"
              onChange={(event) => setQuickFile(event.target.files?.[0] || null)}
              className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleDirectUpload}
              className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-xs font-semibold text-white"
            >
              Direct Upload
            </button>
          </div>
          <p className="mt-2 text-xs text-[color:var(--muted)]">Uses the current mapping selection.</p>
        </Panel>
      ) : null}

      <Panel title="Upload History Filters">
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
            className="md:col-span-4 rounded-full bg-[color:var(--accent-2)] px-4 py-2 text-xs font-semibold text-white"
          >
            Apply Filters
          </button>
        </div>
      </Panel>

      <Panel title="Upload Job History">
        {selectedJob ? (
          <div className="mb-4 rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs">
            <p className="text-[color:var(--muted)]">Selected Job</p>
            <p className="mt-1 font-semibold">{selectedJob._id}</p>
            <p className="text-[color:var(--muted)]">Status: {selectedJob.status}</p>
            {selectedJob.reusedFrom ? (
              <p className="text-[color:var(--muted)]">Reused From: {selectedJob.reusedFrom}</p>
            ) : null}
          </div>
        ) : null}
        {history.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No upload jobs found.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/5 text-xs uppercase tracking-widest text-[color:var(--muted)]">
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
        )}
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            disabled={historyPage <= 1}
            onClick={() => loadHistory(historyPage - 1)}
            className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-xs text-[color:var(--muted)]">Page {historyPage} of {historyPages}</span>
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
    </div>
  )
}
