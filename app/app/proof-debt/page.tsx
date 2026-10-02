import EmptyStateCard from '@/components/EmptyStateCard';
import { Scale, Calculator } from 'lucide-react';

export const metadata = {
  title: 'Proof Debt | VERIDEX',
  description: 'Quantify and burndown compliance debt into provable hours.',
};

export default function ProofDebtPage() {
  return (
    <div className="subpage-container">
      <div className="page-header-block">
        <div className="page-header-text">
          <p className="eyebrow">
            <span className="eyebrow-line" aria-hidden="true" /> COMPLIANCE INTELLIGENCE
          </p>
          <h1 className="page-headline">Proof Debt</h1>
          <p className="page-description">
            The quantifiable amount of work owed to make every control truly provable today.
          </p>
        </div>
      </div>

      <div className="subpage-content-area">
        <EmptyStateCard
          icon={Scale}
          eyebrow="QUANTIFIABLE RISK"
          title="Proof Debt calculation pending"
          description="Proof Debt converts compliance health into engineer-hours and risk-days. Once your controls and test rules are defined, the platform calculates total debt owed and projects an Audit Readiness Date."
          features={[
            'Effort hours weighted by criticality',
            'Interest multipliers for aging controls',
            'Projected Audit Readiness Date',
            'Transparent formula inspection',
          ]}
          actionLabel="Configure Controls to Begin"
          actionHref="/app/controls"
        />

        {/* Explain Formula Preview */}
        <div className="proof-debt-formula-preview">
          <div className="formula-header">
            <Calculator size={18} className="text-amber" aria-hidden="true" />
            <h3>Formula Specification</h3>
          </div>
          <div className="formula-box font-mono">
            <span>Proof Debt = Σ [ effort_hours × (1 - truth_score / 100) × criticality_weight × interest ]</span>
          </div>
          <p className="formula-note">
            Interest scales from 1.0 to 2.0 based on days unproven: <code>1 + (days_unproven / 90)</code>, multiplied by 1.5 in the 30-day window preceding a scheduled audit.
          </p>
        </div>
      </div>
    </div>
  );
}
