import { NavLink } from 'react-router-dom'
import { SectionHeader } from '../../components/SectionHeader.jsx'
import { Panel } from '../../components/Panel.jsx'

export default function ViewerGuide() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Viewer Guide"
        subtitle="Read-only users can monitor the system but cannot upload or edit."
        action={
          <NavLink to="/app/guides" className="text-xs font-semibold text-(--accent)">
            Back to Guides
          </NavLink>
        }
      />

      <Panel title="Step-by-Step">
        <ol className="list-decimal space-y-3 pl-5 text-sm">
          <li>Log in and reset your password if prompted.</li>
          <li>Open Dashboard to see totals, accuracy %, and charts.</li>
          <li>Go to Uploads to review upload history and job status.</li>
          <li>Open Reconciliation to see matched, unmatched, and duplicate records.</li>
          <li>Open Audit Trail to review record history and change timelines.</li>
          <li>Use filters to narrow data by status, date range, or uploader.</li>
        </ol>
      </Panel>

      <Panel title="What You Can and Cannot Do">
        <ul className="list-disc space-y-2 pl-5 text-sm text-(--muted)">
          <li>Can view all reconciliation results and audit logs.</li>
          <li>Cannot upload files or edit records.</li>
          <li>Cannot manage users or rules.</li>
        </ul>
      </Panel>
    </div>
  )
}
