import { NavLink } from 'react-router-dom'
import { SectionHeader } from '../../components/SectionHeader.jsx'
import { Panel } from '../../components/Panel.jsx'

export default function GuidesIndex() {
  const cards = [
    {
      title: 'Viewer Guide',
      desc: 'Read-only walkthrough for monitoring uploads, reconciliation, and audit trails.',
      to: '/app/guides/viewer'
    },
    {
      title: 'Analyst Guide',
      desc: 'Step-by-step flow for preview, mapping, upload, and reconciliation.',
      to: '/app/guides/analyst'
    },
    {
      title: 'Admin Guide',
      desc: 'Full access flow including user management, approvals, and rules.',
      to: '/app/guides/admin'
    }
  ]

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Role Guides"
        subtitle="Pick your role to see a step-by-step walkthrough."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <Panel key={card.to} title={card.title}>
            <p className="text-sm text-(--muted)">{card.desc}</p>
            <NavLink
              to={card.to}
              className="mt-4 inline-flex items-center rounded-full bg-(--accent) px-4 py-2 text-xs font-semibold text-white"
            >
              Open Guide
            </NavLink>
          </Panel>
        ))}
      </div>
    </div>
  )
}
