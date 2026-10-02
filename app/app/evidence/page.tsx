import EmptyStateCard from '@/components/EmptyStateCard';
import { FileCheck2 } from 'lucide-react';

export const metadata = {
  title: 'Evidence | VERIDEX',
  description: 'Tamper-evident cryptographic evidence ledger.',
};

export default function EvidencePage() {
  return (
    <div className="subpage-container">
      <div className="page-header-block">
        <div className="page-header-text">
          <p className="eyebrow">
            <span className="eyebrow-line" aria-hidden="true" /> TAMPER-EVIDENT LEDGER
          </p>
          <h1 className="page-headline">Evidence</h1>
          <p className="page-description">
            Cryptographically hashed and immutable evidence vault. Append-only storage chain.
          </p>
        </div>
      </div>

      <div className="subpage-content-area">
        <EmptyStateCard
          icon={FileCheck2}
          eyebrow="IMMUTABLE PROOF"
          title="No evidence items registered"
          description="Every piece of evidence uploaded to VERIDEX receives a SHA-256 cryptographic digest and is stored in an append-only chain. When an item is updated, the previous hash is preserved to provide an unbroken audit trail."
          features={[
            'SHA-256 hash generation on upload',
            'Append-only cryptographic versioning',
            'Private encrypted storage vault',
            'Direct control requirement binding',
          ]}
          actionLabel="Upload First Evidence File"
          actionHref="/app/evidence?upload=true"
        />
      </div>
    </div>
  );
}
