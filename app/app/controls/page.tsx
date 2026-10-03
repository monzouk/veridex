import EmptyStateCard from '@/components/EmptyStateCard';
import { Shield, CheckCircle2, Clock, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import AddControlButton from '@/components/AddControlButton';
import LoadDemoDataButton from '@/components/LoadDemoDataButton';
import { getUserOrganisation } from '@/app/actions/organisation';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Controls | VERIDEX',
  description: 'Manage and monitor compliance controls.',
};

export default async function ControlsPage() {
  const org = await getUserOrganisation();
  interface ControlRecord {
    id: string;
    code: string;
    title: string;
    category: string;
    status: string;
    criticality: string;
    effort_hours: number;
    created_at: string;
  }
  let controlsList: ControlRecord[] = [];

  if (org) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from('controls')
        .select('id, code, title, category, status, criticality, effort_hours, created_at')
        .eq('organisation_id', org.id)
        .order('code', { ascending: true });

      if (data) controlsList = data;
    } catch {
      // Graceful fallback if tables are not yet migrated
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'verified':
        return <CheckCircle2 size={13} className="text-olive" aria-hidden="true" />;
      case 'aging':
        return <Clock size={13} className="text-amber" aria-hidden="true" />;
      case 'stale':
        return <AlertTriangle size={13} className="text-stale" aria-hidden="true" />;
      case 'missing':
        return <AlertCircle size={13} className="text-stone" aria-hidden="true" />;
      default:
        return <HelpCircle size={13} className="text-stone" aria-hidden="true" />;
    }
  }

  return (
    <div className="subpage-container">
      <div className="page-header-block">
        <div className="page-header-text">
          <p className="eyebrow">
            <span className="eyebrow-line" aria-hidden="true" /> CONTROL DIRECTORY
          </p>
          <h1 className="page-headline">Controls</h1>
          <p className="page-description">
            Continuous verification rules, freshness requirements, and truth state evaluations.
          </p>
        </div>

        <div className="page-quick-actions">
          <LoadDemoDataButton />
          <AddControlButton />
        </div>
      </div>

      <div className="subpage-content-area">
        {controlsList.length === 0 ? (
          <EmptyStateCard
            icon={Shield}
            eyebrow="CONTINUOUS GOVERNANCE"
            title="No compliance controls configured"
            description="Controls in VERIDEX are not checkboxes. Each control defines automated rules for evidence freshness, required artifacts, and proof calculations. Register your first control to establish your baseline, or seed fictional records with Load data."
            features={[
              'Freshness threshold monitoring',
              'Multi-source evidence linking',
              'Plain-language truth explanations',
              'Tamper-evident audit trail',
            ]}
          >
            <div className="empty-actions-row">
              <LoadDemoDataButton />
              <AddControlButton />
            </div>
          </EmptyStateCard>
        ) : (
          <div className="controls-table-container">
            <div className="table-header-info">
              <span className="info-title">{controlsList.length} Active Controls</span>
              <span className="info-sub">Continuous truth state calculation</span>
            </div>

            <div className="responsive-table-wrapper">
              <table className="controls-table" aria-label="Controls Directory">
                <thead>
                  <tr>
                    <th scope="col">Code</th>
                    <th scope="col">Title & Category</th>
                    <th scope="col">Truth State</th>
                    <th scope="col">Criticality</th>
                    <th scope="col">Effort</th>
                  </tr>
                </thead>
                <tbody>
                  {controlsList.map((ctrl) => (
                    <tr key={ctrl.id} className="control-row">
                      <td className="control-cell-code">
                        <span className="code-pill font-mono">{ctrl.code}</span>
                      </td>
                      <td className="control-cell-title">
                        <div className="title-block">
                          <span className="control-title-text">{ctrl.title}</span>
                          <span className="control-category-tag">{ctrl.category}</span>
                        </div>
                      </td>
                      <td className="control-cell-status">
                        <span className={`status-pill status-${ctrl.status}`}>
                          {getStatusIcon(ctrl.status)}
                          <span className="capitalize">{ctrl.status}</span>
                        </span>
                      </td>
                      <td className="control-cell-criticality">
                        <span className={`criticality-badge crit-${ctrl.criticality}`}>
                          {ctrl.criticality.toUpperCase()}
                        </span>
                      </td>
                      <td className="control-cell-effort tabular-nums font-mono">
                        {ctrl.effort_hours}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
