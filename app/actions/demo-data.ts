'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface DemoDataResult {
  success: boolean;
  message?: string;
  error?: string;
  counts?: {
    controls: number;
    evidence: number;
    links: number;
  };
}

export async function loadDemoDataAction(): Promise<DemoDataResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required.' };
  }

  // Find user's active organisation
  const { data: membership, error: memError } = await supabase
    .from('memberships')
    .select('organisation_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (memError || !membership) {
    return {
      success: false,
      error: 'Please create an organisation through onboarding before loading demo data.',
    };
  }

  const orgId = membership.organisation_id;

  // 30 Fictional Controls in mixed conditions
  const controlsData = [
    // Access Control (AC)
    { code: 'AC-01', title: 'Quarterly User Access Reviews', category: 'Access Control', status: 'verified', criticality: 'high', effort_hours: 6.0 },
    { code: 'AC-02', title: 'Privileged Access Justification & Time-bounding', category: 'Access Control', status: 'aging', criticality: 'high', effort_hours: 4.5 },
    { code: 'AC-03', title: 'Multi-Factor Authentication on Production Consoles', category: 'Access Control', status: 'verified', criticality: 'high', effort_hours: 3.0 },
    { code: 'AC-04', title: 'Automated Deprovisioning on Employment Termination', category: 'Access Control', status: 'verified', criticality: 'medium', effort_hours: 4.0 },
    { code: 'AC-05', title: 'SSH Public Key Rotation Policy', category: 'Access Control', status: 'stale', criticality: 'medium', effort_hours: 5.0 },
    { code: 'AC-06', title: 'Break-Glass Root Access Monitoring', category: 'Access Control', status: 'verified', criticality: 'high', effort_hours: 2.0 },

    // Data Protection & Privacy (DP)
    { code: 'DP-01', title: 'Customer Data Encryption at Rest (AES-256)', category: 'Data Protection', status: 'verified', criticality: 'high', effort_hours: 4.0 },
    { code: 'DP-02', title: 'PII Data Flow Mapping & Classification', category: 'Data Protection', status: 'aging', criticality: 'medium', effort_hours: 8.0 },
    { code: 'DP-03', title: 'Database Automated Daily Snapshots & Verification', category: 'Data Protection', status: 'verified', criticality: 'high', effort_hours: 3.5 },
    { code: 'DP-04', title: 'Data Retention & Automated Purge Jobs', category: 'Data Protection', status: 'stale', criticality: 'medium', effort_hours: 6.0 },
    { code: 'DP-05', title: 'Production Data Sanitization in Non-Prod Envs', category: 'Data Protection', status: 'verified', criticality: 'high', effort_hours: 5.0 },
    { code: 'DP-06', title: 'Customer Right to Be Forgotten Pipeline', category: 'Data Protection', status: 'missing', criticality: 'low', effort_hours: 7.0 },

    // Incident Response & Logging (IR)
    { code: 'IR-01', title: 'Centralized Immutable SIEM Audit Logging', category: 'Incident Response', status: 'verified', criticality: 'high', effort_hours: 5.0 },
    { code: 'IR-02', title: 'Annual Tabletop Security Drill Exercise', category: 'Incident Response', status: 'aging', criticality: 'medium', effort_hours: 8.0 },
    { code: 'IR-03', title: 'Critical Vulnerability SLA Remediation (<14d)', category: 'Incident Response', status: 'verified', criticality: 'high', effort_hours: 4.0 },
    { code: 'IR-04', title: '24/7 Security Operations Center Pager Rotation', category: 'Incident Response', status: 'verified', criticality: 'high', effort_hours: 2.0 },
    { code: 'IR-05', title: 'Intrusion Detection Alerting & Triage Runbook', category: 'Incident Response', status: 'stale', criticality: 'medium', effort_hours: 4.5 },
    { code: 'IR-06', title: 'Third-Party Incident Notification SLA', category: 'Incident Response', status: 'missing', criticality: 'medium', effort_hours: 3.0 },

    // Cryptography & Key Management (CR)
    { code: 'CR-01', title: 'TLS 1.3 Transport Encryption Enforcement', category: 'Cryptography', status: 'verified', criticality: 'high', effort_hours: 2.0 },
    { code: 'CR-02', title: 'Cloud KMS Key Rotation (Every 365 Days)', category: 'Cryptography', status: 'verified', criticality: 'high', effort_hours: 3.0 },
    { code: 'CR-03', title: 'Code Signing for Release Binaries & Containers', category: 'Cryptography', status: 'verified', criticality: 'high', effort_hours: 4.0 },
    { code: 'CR-04', title: 'Secrets Detection in Pull Request Pipelines', category: 'Cryptography', status: 'verified', criticality: 'medium', effort_hours: 2.5 },
    { code: 'CR-05', title: 'Hardware Security Module (HSM) Backup Keys', category: 'Cryptography', status: 'aging', criticality: 'high', effort_hours: 6.0 },
    { code: 'CR-06', title: 'Mutual TLS (mTLS) Service-to-Service Mesh', category: 'Cryptography', status: 'missing', criticality: 'medium', effort_hours: 8.0 },

    // Business Continuity & Resilience (BC)
    { code: 'BC-01', title: 'Bi-Annual Disaster Recovery Tabletop Simulation', category: 'Business Continuity', status: 'aging', criticality: 'high', effort_hours: 8.0 },
    { code: 'BC-02', title: 'Cold-Storage Backup Restoration Proof Test', category: 'Business Continuity', status: 'verified', criticality: 'high', effort_hours: 6.0 },
    { code: 'BC-03', title: 'Multi-Region Failover Latency Validation', category: 'Business Continuity', status: 'stale', criticality: 'medium', effort_hours: 7.0 },
    { code: 'BC-04', title: 'Critical Vendor SLA & Dependency Monitoring', category: 'Business Continuity', status: 'verified', criticality: 'medium', effort_hours: 3.5 },
    { code: 'BC-05', title: 'Quarterly Cloud Architecture Capacity Review', category: 'Business Continuity', status: 'verified', criticality: 'low', effort_hours: 3.0 },
    { code: 'BC-06', title: 'Executive Emergency Succession & Comms Protocol', category: 'Business Continuity', status: 'verified', criticality: 'low', effort_hours: 2.0 },
  ];

  // Insert or Upsert Controls
  const controlsToInsert = controlsData.map((ctrl) => ({
    organisation_id: orgId,
    code: ctrl.code,
    title: ctrl.title,
    description: `Continuous compliance control for ${ctrl.title} under ${ctrl.category}. Evaluated automatically via linked evidence streams.`,
    category: ctrl.category,
    status: ctrl.status,
    criticality: ctrl.criticality,
    effort_hours: ctrl.effort_hours,
    test_rules: {
      required_evidence_types: ['audit_log', 'configuration', 'attestation'],
      max_age_days: ctrl.status === 'stale' ? 30 : 90,
      min_items: 1,
    },
    created_by: user.id,
  }));

  const { data: insertedControls, error: ctrlError } = await supabase
    .from('controls')
    .upsert(controlsToInsert, { onConflict: 'organisation_id,code' })
    .select('id, code, status');

  if (ctrlError || !insertedControls) {
    return { success: false, error: `Failed to insert controls: ${ctrlError?.message}` };
  }

  // Generate 80 Fictional Evidence Items
  const evidenceTemplates = [
    { title: 'Okta Quarterly Access Review Log', mime: 'application/json', ext: 'json' },
    { title: 'AWS CloudTrail Root Access Audit Export', mime: 'application/gzip', ext: 'tar.gz' },
    { title: 'KMS Key Auto-Rotation State Report', mime: 'application/json', ext: 'json' },
    { title: 'PostgreSQL Point-in-time Recovery Validation', mime: 'text/plain', ext: 'log' },
    { title: 'Datadog SIEM Log Retention Policy Confirmation', mime: 'application/pdf', ext: 'pdf' },
    { title: 'GitHub Branch Protection & PR Approval Matrix', mime: 'application/json', ext: 'json' },
    { title: 'SOC 2 Type II External Attestation Appendix', mime: 'application/pdf', ext: 'pdf' },
    { title: 'Snyk Container Vulnerability Scan Report', mime: 'application/json', ext: 'json' },
    { title: 'GSuite 2FA User Enrollment Compliance Log', mime: 'text/csv', ext: 'csv' },
    { title: 'Terraform State Ingress Security Group Audit', mime: 'application/json', ext: 'json' },
  ];

  const evidenceToInsert = [];
  for (let i = 1; i <= 80; i++) {
    const tmpl = evidenceTemplates[(i - 1) % evidenceTemplates.length];
    // Generate deterministic realistic 64-char hex SHA-256
    const pseudoHash = Array.from({ length: 64 }, (_, idx) =>
      ((i * 17 + idx * 31 + 42) % 16).toString(16)
    ).join('');

    evidenceToInsert.push({
      organisation_id: orgId,
      title: `${tmpl.title} (Cycle ${Math.ceil(i / 10)}-Q${(i % 4) + 1})`,
      description: `Cryptographic proof artifact for compliance assessment run #${i}. Verified via source signature.`,
      file_path: `${orgId}/evidence-artifact-${i}.${tmpl.ext}`,
      file_size: 1024 * ((i * 13) % 400 + 45),
      mime_type: tmpl.mime,
      sha256_hash: pseudoHash,
      version: 1,
      source: i % 3 === 0 ? 'automated_pipeline' : 'manual_upload',
      created_by: user.id,
    });
  }

  const { data: insertedEvidence, error: evError } = await supabase
    .from('evidence')
    .insert(evidenceToInsert)
    .select('id');

  if (evError || !insertedEvidence) {
    return { success: false, error: `Failed to insert evidence: ${evError?.message}` };
  }

  // Link Evidence to Controls (control_evidence junction)
  const linksToInsert = [];
  for (let i = 0; i < insertedEvidence.length; i++) {
    // Distribute among the 30 controls (skip some controls to leave 'missing' controls without evidence)
    const targetControlIndex = i % (insertedControls.length - 3); // Leave last 3 controls with 0 evidence
    const control = insertedControls[targetControlIndex];
    if (control) {
      linksToInsert.push({
        organisation_id: orgId,
        control_id: control.id,
        evidence_id: insertedEvidence[i].id,
        linked_by: user.id,
      });
    }
  }

  // Insert links
  await supabase
    .from('control_evidence')
    .upsert(linksToInsert, { onConflict: 'control_id,evidence_id' });

  revalidatePath('/app');
  revalidatePath('/app/controls');
  revalidatePath('/app/evidence');
  revalidatePath('/app/proof-debt');

  return {
    success: true,
    message: `Successfully seeded ${insertedControls.length} controls, ${insertedEvidence.length} evidence artifacts, and ${linksToInsert.length} proof linkages.`,
    counts: {
      controls: insertedControls.length,
      evidence: insertedEvidence.length,
      links: linksToInsert.length,
    },
  };
}

/**
 * Purges sample/demo data using public.remove_sample_data(p_organisation_id).
 * Strictly restricted to organisation Owners.
 */
export async function removeSampleDataAction(): Promise<DemoDataResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required.' };
  }

  const { data: membership, error: memError } = await supabase
    .from('memberships')
    .select('organisation_id, role, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (memError || !membership) {
    return { success: false, error: 'Active membership not found.' };
  }

  if (membership.role !== 'owner') {
    return { success: false, error: 'Permission denied: Only Owners can remove sample data.' };
  }

  const { data, error } = await supabase.rpc('remove_sample_data', {
    p_organisation_id: membership.organisation_id,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/app');
  revalidatePath('/app/controls');
  revalidatePath('/app/evidence');
  revalidatePath('/app/proof-debt');

  return {
    success: true,
    message: data?.message || 'Sample data removed cleanly.',
  };
}
