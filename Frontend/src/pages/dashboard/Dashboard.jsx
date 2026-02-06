import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js'
import { StatCard } from '../../components/StatCard.jsx'
import { Panel } from '../../components/Panel.jsx'
import { SectionHeader } from '../../components/SectionHeader.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { ErrorState } from '../../components/ErrorState.jsx'
import { fetchDashboardSummary } from '../../services/api.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(null)
  const [dateTo, setDateTo] = useState(null)
  const [status, setStatus] = useState('')
  const [uploadedBy, setUploadedBy] = useState('')

  const loadSummary = (params) => {
    setLoading(true)
    fetchDashboardSummary(params)
      .then((res) => {
        setData(res)
        setError('')
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Failed to load dashboard')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadSummary()
  }, [])

  const applyFilters = () => {
    const params = {}
    if (dateFrom) params.dateFrom = dateFrom.toISOString()
    if (dateTo) params.dateTo = dateTo.toISOString()
    if (status) params.status = status
    if (uploadedBy) params.uploadedBy = uploadedBy
    loadSummary(params)
  }

  if (loading) return <LoadingState label="Loading dashboard..." />
  if (error) return <ErrorState message={error} />

  const summary = data?.summary || {}
  const statusChart = data?.charts?.statusChart || []
  const barChart = data?.charts?.barChart || []

  const doughnutData = {
    labels: statusChart.map((item) => item.label),
    datasets: [
      {
        data: statusChart.map((item) => item.value),
        backgroundColor: ['#0c8b8f', '#f97316', '#e11d48', '#facc15']
      }
    ]
  }

  const barData = {
    labels: barChart.map((item) => item.date),
    datasets: [
      {
        label: 'Records',
        data: barChart.map((item) => item.value),
        backgroundColor: '#0c8b8f'
      }
    ]
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Overview"
        subtitle="Latest reconciliation run summaries"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <DatePicker
              selected={dateFrom}
              onChange={setDateFrom}
              placeholderText="From"
              className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs"
            />
            <DatePicker
              selected={dateTo}
              onChange={setDateTo}
              placeholderText="To"
              className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs"
            />
            <select
              className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="draft">Draft</option>
            </select>
            <input
              className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs"
              placeholder="Uploaded By (User ID)"
              value={uploadedBy}
              onChange={(event) => setUploadedBy(event.target.value)}
            />
            <button
              onClick={applyFilters}
              className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold"
            >
              Apply
            </button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Records" value={summary.totalRecords || 0} />
        <StatCard label="Matched" value={summary.matched || 0} />
        <StatCard label="Unmatched" value={summary.unmatched || 0} />
        <StatCard label="Duplicates" value={summary.duplicate || 0} />
        <StatCard label="Accuracy" value={`${data?.accuracy || 0}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel title="Daily Upload Volume">
          <div className="h-64">
            <Bar data={barData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </Panel>

        <Panel title="Match Breakdown">
          <div className="h-64">
            <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
          </div>
        </Panel>
      </div>
    </div>
  )
}
