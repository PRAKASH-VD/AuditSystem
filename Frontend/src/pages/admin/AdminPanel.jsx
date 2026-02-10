import { useEffect, useState } from 'react'
import { Panel } from '../../components/Panel.jsx'
import { SectionHeader } from '../../components/SectionHeader.jsx'
import { ErrorState } from '../../components/ErrorState.jsx'
import { getUploadMonitoring, listRules, updatePartialTolerance } from '../../services/api.js'
import { useToast } from '../../context/ToastContext.jsx'

export default function AdminPanel() {
  const { showToast } = useToast()
  const [monitoring, setMonitoring] = useState(null)
  const [rules, setRules] = useState([])
  const [tolerancePercent, setTolerancePercent] = useState('2')
  const [error, setError] = useState('')

  const loadAll = async () => {
    try {
      const [monitorData, ruleData] = await Promise.all([getUploadMonitoring(), listRules()])
      setMonitoring(monitorData)
      setRules(ruleData || [])
      const partialRule = (ruleData || []).find((rule) => rule.type === 'partial')
      if (partialRule?.config?.amountVariancePercent !== undefined) {
        setTolerancePercent(String(Number(partialRule.config.amountVariancePercent) * 100))
      }
      setError('')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load admin data')
    }
  }

  useEffect(() => {
    const boot = setTimeout(() => {
      loadAll()
    }, 0)
    const interval = setInterval(loadAll, 5000)
    return () => {
      clearTimeout(boot)
      clearInterval(interval)
    }
  }, [])

  const saveTolerance = async () => {
    const value = Number(tolerancePercent)
    if (Number.isNaN(value) || value < 0 || value > 100) {
      showToast('Tolerance must be between 0 and 100', 'error')
      return
    }
    try {
      await updatePartialTolerance(value / 100)
      showToast('Partial tolerance updated', 'success')
      await loadAll()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update tolerance', 'error')
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Admin Panel"
        subtitle="Admin-only controls for monitoring and matching behavior"
      />

      {error ? <ErrorState message={error} /> : null}

      <Panel title="Job Monitoring">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
            <p className="text-xs text-(--muted)">Draft</p>
            <p className="text-lg font-semibold">{monitoring?.status?.draft || 0}</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
            <p className="text-xs text-(--muted)">Processing</p>
            <p className="text-lg font-semibold">{monitoring?.status?.processing || 0}</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
            <p className="text-xs text-(--muted)">Completed</p>
            <p className="text-lg font-semibold">{monitoring?.status?.completed || 0}</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white px-4 py-3">
            <p className="text-xs text-(--muted)">Failed</p>
            <p className="text-lg font-semibold">{monitoring?.status?.failed || 0}</p>
          </div>
        </div>
      </Panel>

      <Panel title="Partial Match Tolerance">
        <div className="grid gap-3 md:grid-cols-[200px_auto]">
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={tolerancePercent}
            onChange={(event) => setTolerancePercent(event.target.value)}
            className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
          />
          <button
            type="button"
            onClick={saveTolerance}
            className="rounded-full bg-(--accent-2) px-4 py-2 text-xs font-semibold text-white"
          >
            Save Tolerance %
          </button>
        </div>
      </Panel>

      <Panel title="Active Rules">
        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule._id} className="rounded-2xl border border-black/10 bg-white px-4 py-3">
              <p className="text-sm font-semibold">{rule.name}</p>
              <p className="text-xs text-(--muted)">
                {rule.type} | Priority {rule.priority} | {rule.active ? 'Active' : 'Disabled'}
              </p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
