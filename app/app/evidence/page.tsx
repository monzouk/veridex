import EmptyStateCard from '@/components/EmptyStateCard';
import EvidenceUploadModal from '@/components/EvidenceUploadModal';
import { FileCheck2, Hash, ShieldCheck } from 'lucide-react';
import { getUserOrganisation } from '@/app/actions/organisation';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Evidence | VERIDEX',
  description: 'Tamper-evident cryptographic evidence ledger.',
};

export default async function EvidencePage() {
  const org = await getUserOrganisation();
  interface EvidenceRecord {
    id: string;
    title: string;
    description: string | null;
    sha256_hash: string;
    version: number;
    file_size: number;
    mime_type: string;
    source: string;
    created_at: string;
  }
  let evidenceList: EvidenceRecord[] = [];

  if (org) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from('evidence')
        .select('id, title, description, sha256_hash, version, file_size, mime_type, source, created_at')
        .eq('organisation_id', org.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) evidenceList = data;
    } catch {
      // Graceful fallback if tables are not yet migrated
    }
  }

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

        {org && (
          <div className="page-quick-actions">
            <EvidenceUploadModal organisationId={org.id} />
          </div>
        )}
      </div>

      <div className="subpage-content-area">
        {evidenceList.length === 0 ? (
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
          >
            {org && <EvidenceUploadModal organisationId={org.id} />}
          </EmptyStateCard>
        ) : (
          <div className="evidence-table-container">
            <div className="table-header-info">
              <span className="info-title">{evidenceList.length} Verified Evidence Artifacts</span>
              <span className="info-sub">Cryptographically linked ledger entries</span>
            </div>

            <div className="responsive-table-wrapper">
              <table className="evidence-table" aria-label="Evidence Ledger">
                <thead>
                  <tr>
                    <th scope="col">Artifact</th>
                    <th scope="col">SHA-256 Hash</th>
                    <th scope="col">Version</th>
                    <th scope="col">Size</th>
                    <th scope="col">Intake Date</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {evidenceList.map((item) => (
                    <tr key={item.id} className="evidence-row">
                      <td className="evidence-cell-title">
                        <div className="evidence-title-block">
                          <span className="evidence-title-text">{item.title}</span>
                          <span className="evidence-mime-type font-mono">{item.mime_type}</span>
                        </div>
                      </td>
                      <td className="evidence-cell-hash">
                        <div className="hash-display-pill" title={item.sha256_hash}>
                          <Hash size={12} className="text-amber" aria-hidden="true" />
                          <span className="font-mono">{item.sha256_hash.substring(0, 16)}...</span>
                        </div>
                      </td>
                      <td className="evidence-cell-version">
                        <span className="version-chip font-mono">v{item.version}</span>
                      </td>
                      <td className="evidence-cell-size tabular-nums">
                        {(item.file_size / 1024).toFixed(1)} KB
                      </td>
                      <td className="evidence-cell-date tabular-nums">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="evidence-cell-action">
                        {org && (
                          <EvidenceUploadModal
                            organisationId={org.id}
                            supersedingEvidenceId={item.id}
                            currentVersion={item.version}
                          />
                        )}
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
