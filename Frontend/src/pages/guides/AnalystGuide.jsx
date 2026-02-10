import { NavLink } from 'react-router-dom'
import { SectionHeader } from '../../components/SectionHeader.jsx'
import { Panel } from '../../components/Panel.jsx'

export default function AnalystGuide() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Analyst Guide"
        subtitle="Upload files, map columns, run reconciliation, and fix mismatches."
        action={
          <NavLink to="/app/guides" className="text-xs font-semibold text-(--accent)">
            Back to Guides
          </NavLink>
        }
      />

      <Panel title="Step-by-Step">
        <ol className="list-decimal space-y-3 pl-5 text-sm">
          <li>Log in and reset your password if prompted.</li>
          <li>Go to Uploads and download the template (CSV/XLSX).</li>
          <li>Fill required fields: Transaction ID, Amount, Reference, Date.</li>
          <li>Upload the file and preview the first 20 rows.</li>
          <li>Map columns to system fields and save the mapping.</li>
          <li>Click Direct Upload to start processing.</li>
          <li>Wait for status to change to Completed in Upload History.</li>
          <li>Open Reconciliation and filter by your upload job.</li>
          <li>Open a record to see side-by-side comparison.</li>
          <li>Apply manual corrections when needed.</li>
        </ol>
      </Panel>

      <Panel title="Best Practices">
        <ul className="list-disc space-y-2 pl-5 text-sm text-(--muted)">
          <li>Always verify column mapping before direct upload.</li>
          <li>Use filters to focus on partial matches or duplicates.</li>
          <li>Check Audit Trail after edits to confirm logs.</li>
        </ul>
      </Panel>
    </div>
  )
}
