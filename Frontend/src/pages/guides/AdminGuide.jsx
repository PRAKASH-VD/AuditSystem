import { NavLink } from 'react-router-dom'
import { SectionHeader } from '../../components/SectionHeader.jsx'
import { Panel } from '../../components/Panel.jsx'

export default function AdminGuide() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Admin Guide"
        subtitle="Full access to users, rules, and approvals."
        action={
          <NavLink to="/app/guides" className="text-xs font-semibold text-(--accent)">
            Back to Guides
          </NavLink>
        }
      />

      <Panel title="Step-by-Step">
        <ol className="list-decimal space-y-3 pl-5 text-sm">
          <li>Log in and reset your password if prompted.</li>
          <li>Run uploads and reconciliation the same as an Analyst.</li>
          <li>Open Users to create accounts and assign roles.</li>
          <li>Open Requests to approve or deny access requests.</li>
          <li>Review Reconciliation Rules and adjust thresholds.</li>
          <li>Monitor Upload History for reused results and failures.</li>
          <li>Audit Trail should be checked for all manual edits.</li>
        </ol>
      </Panel>

      <Panel title="Admin Checklist">
        <ul className="list-disc space-y-2 pl-5 text-sm text-(--muted)">
          <li>Ensure Redis + Mongo are healthy before heavy uploads.</li>
          <li>Verify mappings exist before enabling Direct Upload.</li>
          <li>Review pending admin requests daily.</li>
        </ul>
      </Panel>
    </div>
  )
}
