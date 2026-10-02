import EmptyStateCard from '@/components/EmptyStateCard';
import { Shield } from 'lucide-react';
import AddControlButton from '@/components/AddControlButton';

export const metadata = {
  title: 'Controls | VERIDEX',
  description: 'Manage and monitor compliance controls.',
};

export default function ControlsPage() {
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
          <AddControlButton />
        </div>
      </div>

      <div className="subpage-content-area">
        <EmptyStateCard
          icon={Shield}
          eyebrow="CONTINUOUS GOVERNANCE"
          title="No compliance controls configured"
          description="Controls in VERIDEX are not checkboxes. Each control defines automated rules for evidence freshness, required artifacts, and proof calculations. Register your first control to establish your baseline."
          features={[
            'Freshness threshold monitoring',
            'Multi-source evidence linking',
            'Plain-language truth explanations',
            'Tamper-evident audit trail',
          ]}
          actionLabel="Create First Control"
          actionHref="/app/controls?create=true"
        />
      </div>
    </div>
  );
}
