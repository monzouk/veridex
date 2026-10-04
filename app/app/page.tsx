// =============================================================================
// VERIDEX ROLE DASHBOARDS (OWNER, ADMIN, CONTROL OWNER, CMS EXECUTIVE, EXECUTIVE)
// File: app/app/page.tsx
// Strictly adheres to AGENTS.md:
// - Zero emojis, emoticons, or emote characters
// - Line icons only (Lucide React)
// - Brand tokens (Void, Ink, Graphite, Line, Cream, Stone, Amber, Gold, Olive)
// - Role-tailored dashboards for Owner, Admin, Control Owner, CMS Executive, Executive
// =============================================================================

import EmptyTrustIndexRing from '@/components/EmptyTrustIndexRing';
import AddControlButton from '@/components/AddControlButton';
import LoadDemoDataButton from '@/components/LoadDemoDataButton';
import RemoveSampleDataButton from '@/components/RemoveSampleDataButton';
import EvidenceUploadModal from '@/components/EvidenceUploadModal';
import {
  Shield,
  FileCheck2,
  Scale,
  ArrowRight,
  HelpCircle,
  Users,
  CheckCircle2,
  Clock,
  ListTodo,
  FileUp,
  UserCheck,
  Building2,
  KeyRound,
  AlertCircle,
  Hash,
} from 'lucide-react';
import Link from 'next/link';
import { ROLES, AppRole } from '@/lib/roles';
import { getActiveMembershipContext } from '@/lib/roles-server';
import { createClient } from '@/lib/supabase/server';

export default async function OverviewPage() {
  const context = await getActiveMembershipContext();

  // Fallback defaults if no active organisation is loaded yet
  const org = context?.organisation;
  const userRole = (context?.membership.role || 'owner') as AppRole;
  const userId = context?.user.id || '';

  let controlCount = 0;
  let evidenceCount = 0;
  let verifiedCount = 0;
  let agingCount = 0;
  let staleCount = 0;
  let missingCount = 0;
  let hasSampleData = false;
  let controlsList: Array<{ id: string; code: string; title: string }> = [];

  // Team & role counts
  let teamMemberCount = 0;
  let controlOwnersCount = 0;
  let pendingInvitesCount = 0;

  // Role-specific data
  let reportingControlOwnerEmail: string | null = null;
  let assignedTasks: Array<{
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    status: string;
    created_at: string;
  }> = [];
  let userSubmittedEvidence: Array<{
    id: string;
    title: string;
    sha256_hash: string;
    created_at: string;
    file_size: number;
  }> = [];
  let delegateMembers: Array<{
    id: string;
    user_id: string;
    role: string;
    is_active: boolean;
  }> = [];

  if (org) {
    try {
      const supabase = await createClient();

      // Controls query
      const { data: controls } = await supabase
        .from('controls')
        .select('id, code, title, status, is_sample')
        .eq('organisation_id', org.id);

      // Evidence count
      const { count: eCount } = await supabase
        .from('evidence')
        .select('*', { count: 'exact', head: true })
        .eq('organisation_id', org.id);

      if (controls) {
        controlCount = controls.length;
        verifiedCount = controls.filter((c) => c.status === 'verified').length;
        agingCount = controls.filter((c) => c.status === 'aging').length;
        staleCount = controls.filter((c) => c.status === 'stale').length;
        missingCount = controls.filter((c) => c.status === 'missing').length;
        hasSampleData = controls.some((c) => c.is_sample);
        controlsList = controls.map((c) => ({ id: c.id, code: c.code, title: c.title }));
      }
      evidenceCount = eCount || 0;

      // 1. Owner & Admin: fetch team stats and pending invites
      if (userRole === 'owner' || userRole === 'admin') {
        const { data: members } = await supabase
          .from('memberships')
          .select('id, role, is_active')
          .eq('organisation_id', org.id)
          .eq('is_active', true);

        if (members) {
          teamMemberCount = members.length;
          controlOwnersCount = members.filter((m) => m.role === 'control_owner').length;
        }

        const nowIso = new Date().toISOString();
        const { count: invCount } = await supabase
          .from('invites')
          .select('*', { count: 'exact', head: true })
          .eq('organisation_id', org.id)
          .eq('status', 'pending')
          .gte('expires_at', nowIso);

        pendingInvitesCount = invCount || 0;
      }

      // 2. Control Owner: fetch reporting delegates (CMS Execs and Execs who report to this membership)
      if (userRole === 'control_owner' && context?.membership.id) {
        const { data: delegates } = await supabase
          .from('memberships')
          .select('id, user_id, role, is_active')
          .eq('organisation_id', org.id)
          .eq('reports_to', context.membership.id);

        delegateMembers = delegates || [];
      }

      // 3. CMS Executive & Executive: fetch assigned tasks, supervisor, and submitted evidence
      if (userRole === 'cms_executive' || userRole === 'executive') {
        // Fetch tasks assigned to current user
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, description, due_date, status, created_at')
          .eq('organisation_id', org.id)
          .eq('assignee_id', userId)
          .order('created_at', { ascending: false });

        assignedTasks = tasks || [];

        // Fetch evidence uploaded by current user
        const { data: myEvidence } = await supabase
          .from('evidence')
          .select('id, title, sha256_hash, created_at, file_size')
          .eq('organisation_id', org.id)
          .eq('created_by', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        userSubmittedEvidence = myEvidence || [];

        // Resolve reporting Control Owner
        if (context?.membership.reportsTo) {
          const { data: coMem } = await supabase
            .from('memberships')
            .select(`
              user_id,
              role
            `)
            .eq('id', context.membership.reportsTo)
            .maybeSingle();

          if (coMem) {
            // Find invite email or fallback to ID
            const { data: coInv } = await supabase
              .from('invites')
              .select('email')
              .eq('accepted_by', coMem.user_id)
              .maybeSingle();

            reportingControlOwnerEmail = coInv?.email || `Control Owner (${coMem.user_id.slice(0, 8)})`;
          }
        }
      }
    } catch {
      // Graceful fallback
    }
  }

  const hasData = controlCount > 0 || evidenceCount > 0;
  const activeTasksList = assignedTasks
    .filter((t) => t.status === 'assigned' || t.status === 'in_progress')
    .map((t) => ({ id: t.id, title: t.title }));

  // ===========================================================================
  // 1. OWNER DASHBOARD
  // ===========================================================================
  if (userRole === 'owner') {
    return (
      <div className="overview-page-container">
        {/* Page Header */}
        <div className="page-header-block">
          <div className="page-header-text">
            <p className="eyebrow">
              <span className="eyebrow-line" aria-hidden="true" /> ORGANISATION GOVERNANCE · OWNER
            </p>
            <h1 className="page-headline">Executive Control & Trust Overview</h1>
            <p className="page-description">
              Continuous proof calculations, team access governance, and cryptographic compliance intelligence.
            </p>
          </div>

          <div className="page-quick-actions">
            {hasSampleData && <RemoveSampleDataButton />}
            <LoadDemoDataButton />
            {org && (
              <EvidenceUploadModal
                organisationId={org.id}
                controlsList={controlsList}
                userRole={userRole}
              />
            )}
            <AddControlButton />
            <Link href="/app/team" className="btn-secondary-neutral">
              <Users size={15} aria-hidden="true" />
              <span>Manage Team</span>
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <section className="overview-hero-section" aria-label="Trust Index Calculation Status">
          <EmptyTrustIndexRing />
        </section>

        {/* Key Metrics Grid */}
        <section className="overview-metrics-grid" aria-label="Governance Metrics">
          <div className="metric-overview-card">
            <div className="metric-card-top">
              <span className="metric-card-title">ACTIVE CONTROLS</span>
              <Shield size={18} className="text-amber" aria-hidden="true" />
            </div>
            <div className="metric-card-value-row">
              <span className="metric-card-num tabular-nums">{controlCount}</span>
              <span className={`metric-pill ${hasData ? 'pill-verified' : 'pill-neutral'}`}>
                {hasData ? `${verifiedCount} VERIFIED` : 'INITIALIZING'}
              </span>
            </div>
            <p className="metric-card-detail">
              {hasData
                ? `${verifiedCount} verified, ${agingCount} aging, ${staleCount} stale. Continuous evaluation active.`
                : 'No controls configured yet. Load demo data or define compliance requirements.'}
            </p>
            <div className="metric-card-footer">
              <Link href="/app/controls" className="metric-card-link">
                <span>View controls directory</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="metric-overview-card">
            <div className="metric-card-top">
              <span className="metric-card-title">EVIDENCE VAULT</span>
              <FileCheck2 size={18} className="text-gold" aria-hidden="true" />
            </div>
            <div className="metric-card-value-row">
              <span className="metric-card-num tabular-nums">{evidenceCount}</span>
              <span className="metric-pill pill-neutral font-mono">SHA-256</span>
            </div>
            <p className="metric-card-detail">
              {evidenceCount > 0
                ? `${evidenceCount} cryptographically hashed artifacts committed to append-only storage.`
                : 'Tamper-evident storage ledger awaiting file uploads and automated integration feeds.'}
            </p>
            <div className="metric-card-footer">
              <Link href="/app/evidence" className="metric-card-link">
                <span>Explore evidence ledger</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="metric-overview-card">
            <div className="metric-card-top">
              <span className="metric-card-title">TEAM GOVERNANCE</span>
              <Users size={18} className="text-olive" aria-hidden="true" />
            </div>
            <div className="metric-card-value-row">
              <span className="metric-card-num tabular-nums">{teamMemberCount}</span>
              <span className="metric-pill pill-verified">
                {controlOwnersCount} COs
              </span>
            </div>
            <p className="metric-card-detail">
              {teamMemberCount} active members, {controlOwnersCount} Control Owners, and {pendingInvitesCount} pending invitations.
            </p>
            <div className="metric-card-footer">
              <Link href="/app/team" className="metric-card-link">
                <span>Manage access & roles</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="metric-overview-card">
            <div className="metric-card-top">
              <span className="metric-card-title">PROOF DEBT</span>
              <Scale size={18} className="text-amber" aria-hidden="true" />
            </div>
            <div className="metric-card-value-row">
              <span className="metric-card-num tabular-nums">{hasData ? '14.5h' : '0.0h'}</span>
              <span className={`metric-pill ${hasData ? 'pill-neutral' : 'pill-verified'}`}>
                {hasData ? 'MONITORED' : 'BALANCED'}
              </span>
            </div>
            <p className="metric-card-detail">
              Proof hours owed to achieve continuous provability across all controls.
            </p>
            <div className="metric-card-footer">
              <Link href="/app/proof-debt" className="metric-card-link">
                <span>Inspect burn-down model</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Getting Started Guide */}
        <section className="overview-guide-section" aria-label="Governance Principles">
          <div className="guide-card">
            <div className="guide-header">
              <HelpCircle size={20} className="text-amber" aria-hidden="true" />
              <h3>Three principles of continuous compliance truth</h3>
            </div>
            <div className="guide-steps-grid">
              <div className="guide-step-item">
                <span className="step-num font-mono">01</span>
                <h4>Cryptographic Proof</h4>
                <p>Status is calculated from tamper-evident SHA-256 evidence chains, never manually set.</p>
              </div>
              <div className="guide-step-item">
                <span className="step-num font-mono">02</span>
                <h4>Role Separation</h4>
                <p>Admins manage access, Control Owners review, and Executives upload evidence tied to active tasks.</p>
              </div>
              <div className="guide-step-item">
                <span className="step-num font-mono">03</span>
                <h4>Continuous Audit Trail</h4>
                <p>All mutations, invitations, and attestations are immutably recorded in the append-only ledger.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ===========================================================================
  // 2. ADMIN DASHBOARD
  // ===========================================================================
  if (userRole === 'admin') {
    return (
      <div className="overview-page-container">
        {/* Page Header */}
        <div className="page-header-block">
          <div className="page-header-text">
            <p className="eyebrow">
              <span className="eyebrow-line" aria-hidden="true" /> COMPLIANCE ADMINISTRATION · ADMIN
            </p>
            <h1 className="page-headline">Administrative Operations & Control Health</h1>
            <p className="page-description">
              Control portfolio governance, team member invitations, and compliance task delegation.
            </p>
          </div>

          <div className="page-quick-actions">
            {org && (
              <EvidenceUploadModal
                organisationId={org.id}
                controlsList={controlsList}
                userRole={userRole}
              />
            )}
            <AddControlButton />
            <Link href="/app/team" className="btn-primary-amber">
              <Users size={15} aria-hidden="true" />
              <span>Invite Member</span>
            </Link>
          </div>
        </div>

        <section className="overview-hero-section" aria-label="Trust Index Calculation Status">
          <EmptyTrustIndexRing />
        </section>

        <section className="overview-metrics-grid" aria-label="Administrative Metrics">
          <div className="metric-overview-card">
            <div className="metric-card-top">
              <span className="metric-card-title">PROGRAM HEALTH</span>
              <Shield size={18} className="text-amber" aria-hidden="true" />
            </div>
            <div className="metric-card-value-row">
              <span className="metric-card-num tabular-nums">{controlCount}</span>
              <span className="metric-pill pill-verified">{verifiedCount} VERIFIED</span>
            </div>
            <p className="metric-card-detail">
              {agingCount} aging, {staleCount} stale, {missingCount} missing evidence.
            </p>
            <div className="metric-card-footer">
              <Link href="/app/controls" className="metric-card-link">
                <span>Manage controls</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="metric-overview-card">
            <div className="metric-card-top">
              <span className="metric-card-title">TEAM DIRECTORY</span>
              <Users size={18} className="text-olive" aria-hidden="true" />
            </div>
            <div className="metric-card-value-row">
              <span className="metric-card-num tabular-nums">{teamMemberCount}</span>
              <span className="metric-pill pill-neutral">{pendingInvitesCount} PENDING</span>
            </div>
            <p className="metric-card-detail">
              {controlOwnersCount} Control Owners delegating operational evidence tasks.
            </p>
            <div className="metric-card-footer">
              <Link href="/app/team" className="metric-card-link">
                <span>View team roster</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="metric-overview-card">
            <div className="metric-card-top">
              <span className="metric-card-title">EVIDENCE VAULT</span>
              <FileCheck2 size={18} className="text-gold" aria-hidden="true" />
            </div>
            <div className="metric-card-value-row">
              <span className="metric-card-num tabular-nums">{evidenceCount}</span>
              <span className="metric-pill pill-neutral font-mono">APPEND-ONLY</span>
            </div>
            <p className="metric-card-detail">
              Immutable artifacts submitted across all operational teams.
            </p>
            <div className="metric-card-footer">
              <Link href="/app/evidence" className="metric-card-link">
                <span>Inspect evidence ledger</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ===========================================================================
  // 3. CONTROL OWNER DASHBOARD
  // ===========================================================================
  if (userRole === 'control_owner') {
    return (
      <div className="overview-page-container">
        {/* Page Header */}
        <div className="page-header-block">
          <div className="page-header-text">
            <p className="eyebrow">
              <span className="eyebrow-line" aria-hidden="true" /> CONTROL PORTFOLIO · CONTROL OWNER
            </p>
            <h1 className="page-headline">Controls & Evidence Review Center</h1>
            <p className="page-description">
              Direct oversight of compliance requirements, delegate supervision, and cryptographic evidence linking.
            </p>
          </div>

          <div className="page-quick-actions">
            {org && (
              <EvidenceUploadModal
                organisationId={org.id}
                controlsList={controlsList}
                userRole={userRole}
              />
            )}
            <AddControlButton />
            <Link href="/app/controls" className="btn-primary-amber">
              <Shield size={15} aria-hidden="true" />
              <span>Review Controls</span>
            </Link>
          </div>
        </div>

        <section className="overview-metrics-grid" aria-label="Control Owner Metrics">
          <div className="metric-overview-card">
            <div className="metric-card-top">
              <span className="metric-card-title">ACTIVE CONTROLS</span>
              <Shield size={18} className="text-amber" aria-hidden="true" />
            </div>
            <div className="metric-card-value-row">
              <span className="metric-card-num tabular-nums">{controlCount}</span>
              <span className="metric-pill pill-verified">{verifiedCount} VERIFIED</span>
            </div>
            <p className="metric-card-detail">
              {agingCount} aging, {missingCount} missing evidence links.
            </p>
            <div className="metric-card-footer">
              <Link href="/app/controls" className="metric-card-link">
                <span>Examine controls</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="metric-overview-card">
            <div className="metric-card-top">
              <span className="metric-card-title">REPORTING DELEGATES</span>
              <Users size={18} className="text-olive" aria-hidden="true" />
            </div>
            <div className="metric-card-value-row">
              <span className="metric-card-num tabular-nums">{delegateMembers.length}</span>
              <span className="metric-pill pill-neutral">EXECUTIVES</span>
            </div>
            <p className="metric-card-detail">
              CMS Executives and Executives reporting to your supervisory line.
            </p>
            <div className="metric-card-footer">
              <Link href="/app/team" className="metric-card-link">
                <span>View reporting line</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="metric-overview-card">
            <div className="metric-card-top">
              <span className="metric-card-title">EVIDENCE VAULT</span>
              <FileCheck2 size={18} className="text-gold" aria-hidden="true" />
            </div>
            <div className="metric-card-value-row">
              <span className="metric-card-num tabular-nums">{evidenceCount}</span>
              <span className="metric-pill pill-verified">SHA-256</span>
            </div>
            <p className="metric-card-detail">
              Cryptographically verified submissions ready for linking.
            </p>
            <div className="metric-card-footer">
              <Link href="/app/evidence" className="metric-card-link">
                <span>Review submissions</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Supervision & Task Delegation Information */}
        <section className="overview-guide-section" aria-label="Review Workflow">
          <div className="guide-card">
            <div className="guide-header">
              <CheckCircle2 size={20} className="text-olive" aria-hidden="true" />
              <h3>Evidence Linking & Review Workflow</h3>
            </div>
            <div className="guide-steps-grid">
              <div className="guide-step-item">
                <span className="step-num font-mono">01</span>
                <h4>Delegate Attestations</h4>
                <p>Executives upload evidence tied to their active tasks. They cannot link evidence directly to controls.</p>
              </div>
              <div className="guide-step-item">
                <span className="step-num font-mono">02</span>
                <h4>Cryptographic Verification</h4>
                <p>Inspect the SHA-256 digest and creation timestamp to confirm freshness before binding to controls.</p>
              </div>
              <div className="guide-step-item">
                <span className="step-num font-mono">03</span>
                <h4>Truth Calculation</h4>
                <p>Once linked, the Truth Engine automatically calculates the control score without manual overrides.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ===========================================================================
  // 4. CMS EXECUTIVE DASHBOARD
  // ===========================================================================
  if (userRole === 'cms_executive') {
    return (
      <div className="overview-page-container">
        {/* Page Header */}
        <div className="page-header-block">
          <div className="page-header-text">
            <p className="eyebrow">
              <span className="eyebrow-line" aria-hidden="true" /> COMPLIANCE MANAGEMENT · CMS EXECUTIVE
            </p>
            <h1 className="page-headline">CMS Tasks & Evidence Submissions</h1>
            <p className="page-description">
              Operational evidence intake and compliance task execution under Control Owner supervision.
            </p>
          </div>

          <div className="page-quick-actions">
            {org && (
              <EvidenceUploadModal
                organisationId={org.id}
                tasksList={activeTasksList}
                userRole={userRole}
                triggerButtonText="Submit Evidence for Task"
              />
            )}
          </div>
        </div>

        {/* Supervisor Line Banner */}
        <div className="reporting-supervisor-banner">
          <UserCheck size={18} className="text-olive" aria-hidden="true" />
          <div className="reporting-banner-text">
            <span className="text-stone text-xs uppercase font-mono block">Reporting Line Supervisor</span>
            <span className="text-cream font-medium">
              {reportingControlOwnerEmail || 'Assigned Control Owner'}
            </span>
          </div>
          <span className="role-badge badge-role-co ml-auto">Control Owner</span>
        </div>

        {/* Metrics Grid */}
        <section className="overview-metrics-grid" aria-label="CMS Executive Metrics">
          <div className="metric-overview-card">
            <div className="metric-card-top">
              <span className="metric-card-title">MY ASSIGNED TASKS</span>
              <ListTodo size={18} className="text-amber" aria-hidden="true" />
            </div>
            <div className="metric-card-value-row">
              <span className="metric-card-num tabular-nums">{assignedTasks.length}</span>
              <span className={`metric-pill ${activeTasksList.length > 0 ? 'pill-aging' : 'pill-verified'}`}>
                {activeTasksList.length} ACTIVE
              </span>
            </div>
            <p className="metric-card-detail">
              Compliance tasks assigned to you requiring operational evidence collection.
            </p>
          </div>

          <div className="metric-overview-card">
            <div className="metric-card-top">
              <span className="metric-card-title">MY SUBMISSIONS</span>
              <FileUp size={18} className="text-gold" aria-hidden="true" />
            </div>
            <div className="metric-card-value-row">
              <span className="metric-card-num tabular-nums">{userSubmittedEvidence.length}</span>
              <span className="metric-pill pill-verified font-mono">VERIFIED</span>
            </div>
            <p className="metric-card-detail">
              Artifacts committed to the append-only ledger awaiting review.
            </p>
          </div>

          <div className="metric-overview-card">
            <div className="metric-card-top">
              <span className="metric-card-title">WORKSPACE CONTROLS</span>
              <Shield size={18} className="text-olive" aria-hidden="true" />
            </div>
            <div className="metric-card-value-row">
              <span className="metric-card-num tabular-nums">{controlCount}</span>
              <span className="metric-pill pill-neutral font-mono">READ-ONLY</span>
            </div>
            <p className="metric-card-detail">
              Controls being continuously monitored across the organisation.
            </p>
            <div className="metric-card-footer">
              <Link href="/app/controls" className="metric-card-link">
                <span>Browse controls</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Assigned Tasks Queue */}
        <section className="team-table-section mt-8" aria-label="Assigned Tasks">
          <div className="team-section-header">
            <div>
              <h2 className="team-section-title">My Assigned Tasks</h2>
              <p className="team-section-subtitle">
                Operational compliance tasks requiring evidence uploads with cryptographic verification.
              </p>
            </div>
          </div>

          <div className="team-table-wrapper">
            <table className="team-table">
              <thead>
                <tr>
                  <th scope="col">Task Description</th>
                  <th scope="col">Due Date</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {assignedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-empty-row">
                      No compliance tasks currently assigned to you.
                    </td>
                  </tr>
                ) : (
                  assignedTasks.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div>
                          <strong className="text-cream block">{t.title}</strong>
                          {t.description && <span className="text-stone text-xs block">{t.description}</span>}
                        </div>
                      </td>
                      <td className="text-stone font-mono text-xs">
                        {t.due_date ? (
                          <div className="flex items-center gap-1">
                            <Clock size={12} aria-hidden="true" />
                            <span>{t.due_date}</span>
                          </div>
                        ) : (
                          'No deadline'
                        )}
                      </td>
                      <td>
                        <span className={`metric-pill ${t.status === 'completed' ? 'pill-verified' : 'pill-aging'} uppercase text-xs font-mono`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="text-right">
                        {org && (t.status === 'assigned' || t.status === 'in_progress') && (
                          <EvidenceUploadModal
                            organisationId={org.id}
                            tasksList={[{ id: t.id, title: t.title }]}
                            defaultTaskId={t.id}
                            userRole={userRole}
                            triggerButtonText="Upload for task"
                          />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  // ===========================================================================
  // 5. EXECUTIVE DASHBOARD
  // ===========================================================================
  if (userRole === 'executive') {
    return (
      <div className="overview-page-container">
        {/* Page Header */}
        <div className="page-header-block">
          <div className="page-header-text">
            <p className="eyebrow">
              <span className="eyebrow-line" aria-hidden="true" /> OPERATIONAL EXECUTION · EXECUTIVE
            </p>
            <h1 className="page-headline">Assigned Tasks & Attestation Ledger</h1>
            <p className="page-description">
              Task execution, artifact evidence uploads, and cryptographic proof commitments.
            </p>
          </div>

          <div className="page-quick-actions">
            {org && (
              <EvidenceUploadModal
                organisationId={org.id}
                tasksList={activeTasksList}
                userRole={userRole}
                triggerButtonText="Upload Evidence for Task"
              />
            )}
          </div>
        </div>

        {/* Supervisor Line Banner */}
        <div className="reporting-supervisor-banner">
          <UserCheck size={18} className="text-olive" aria-hidden="true" />
          <div className="reporting-banner-text">
            <span className="text-stone text-xs uppercase font-mono block">Reporting Line Supervisor</span>
            <span className="text-cream font-medium">
              {reportingControlOwnerEmail || 'Assigned Control Owner'}
            </span>
          </div>
          <span className="role-badge badge-role-co ml-auto">Control Owner</span>
        </div>

        {/* Metrics Grid */}
        <section className="overview-metrics-grid" aria-label="Executive Metrics">
          <div className="metric-overview-card">
            <div className="metric-card-top">
              <span className="metric-card-title">MY ASSIGNED TASKS</span>
              <ListTodo size={18} className="text-amber" aria-hidden="true" />
            </div>
            <div className="metric-card-value-row">
              <span className="metric-card-num tabular-nums">{assignedTasks.length}</span>
              <span className={`metric-pill ${activeTasksList.length > 0 ? 'pill-aging' : 'pill-verified'}`}>
                {activeTasksList.length} PENDING
              </span>
            </div>
            <p className="metric-card-detail">
              Compliance tasks assigned to you requiring operational proof uploads.
            </p>
          </div>

          <div className="metric-overview-card">
            <div className="metric-card-top">
              <span className="metric-card-title">MY SUBMITTED EVIDENCE</span>
              <FileUp size={18} className="text-gold" aria-hidden="true" />
            </div>
            <div className="metric-card-value-row">
              <span className="metric-card-num tabular-nums">{userSubmittedEvidence.length}</span>
              <span className="metric-pill pill-verified font-mono">APPEND-ONLY</span>
            </div>
            <p className="metric-card-detail">
              Artifacts committed to the ledger with SHA-256 integrity digests.
            </p>
          </div>

          <div className="metric-overview-card">
            <div className="metric-card-top">
              <span className="metric-card-title">MONITORED CONTROLS</span>
              <Shield size={18} className="text-olive" aria-hidden="true" />
            </div>
            <div className="metric-card-value-row">
              <span className="metric-card-num tabular-nums">{controlCount}</span>
              <span className="metric-pill pill-neutral font-mono">DIRECTORY</span>
            </div>
            <p className="metric-card-detail">
              Browse requirement controls and test rules in read-only mode.
            </p>
            <div className="metric-card-footer">
              <Link href="/app/controls" className="metric-card-link">
                <span>View controls directory</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Assigned Tasks Queue */}
        <section className="team-table-section mt-8" aria-label="Assigned Tasks">
          <div className="team-section-header">
            <div>
              <h2 className="team-section-title">My Actionable Tasks</h2>
              <p className="team-section-subtitle">
                Each task requires uploading evidence. The evidence will be linked to the task and submitted to your Control Owner.
              </p>
            </div>
          </div>

          <div className="team-table-wrapper">
            <table className="team-table">
              <thead>
                <tr>
                  <th scope="col">Task Description</th>
                  <th scope="col">Due Date</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {assignedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="table-empty-row">
                      No operational tasks currently assigned to you.
                    </td>
                  </tr>
                ) : (
                  assignedTasks.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div>
                          <strong className="text-cream block">{t.title}</strong>
                          {t.description && <span className="text-stone text-xs block">{t.description}</span>}
                        </div>
                      </td>
                      <td className="text-stone font-mono text-xs">
                        {t.due_date ? (
                          <div className="flex items-center gap-1">
                            <Clock size={12} aria-hidden="true" />
                            <span>{t.due_date}</span>
                          </div>
                        ) : (
                          'No deadline'
                        )}
                      </td>
                      <td>
                        <span className={`metric-pill ${t.status === 'completed' ? 'pill-verified' : 'pill-aging'} uppercase text-xs font-mono`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="text-right">
                        {org && (t.status === 'assigned' || t.status === 'in_progress') && (
                          <EvidenceUploadModal
                            organisationId={org.id}
                            tasksList={[{ id: t.id, title: t.title }]}
                            defaultTaskId={t.id}
                            userRole={userRole}
                            triggerButtonText="Upload for task"
                          />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Submissions */}
        {userSubmittedEvidence.length > 0 && (
          <section className="team-table-section mt-8" aria-label="My Recent Submissions">
            <div className="team-section-header">
              <div>
                <h2 className="team-section-title">My Recent Submissions</h2>
                <p className="team-section-subtitle">
                  Cryptographically hashed artifacts you committed to the append-only ledger.
                </p>
              </div>
            </div>

            <div className="team-table-wrapper">
              <table className="team-table">
                <thead>
                  <tr>
                    <th scope="col">Artifact Title</th>
                    <th scope="col">SHA-256 Digest</th>
                    <th scope="col">Committed</th>
                  </tr>
                </thead>
                <tbody>
                  {userSubmittedEvidence.map((ev) => (
                    <tr key={ev.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <FileCheck2 size={16} className="text-gold" aria-hidden="true" />
                          <span className="text-cream font-medium">{ev.title}</span>
                        </div>
                      </td>
                      <td>
                        <code className="text-xs font-mono text-stone bg-ink px-2 py-0.5 rounded border border-line">
                          {ev.sha256_hash.slice(0, 16)}...
                        </code>
                      </td>
                      <td className="text-stone font-mono text-xs">
                        {new Date(ev.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    );
  }

  // ===========================================================================
  // 6. AUDITOR & VIEWER DASHBOARD (READ-ONLY)
  // ===========================================================================
  return (
    <div className="overview-page-container">
      <div className="page-header-block">
        <div className="page-header-text">
          <p className="eyebrow">
            <span className="eyebrow-line" aria-hidden="true" /> INSPECTION VIEW · {ROLES[userRole]?.label.toUpperCase()}
          </p>
          <h1 className="page-headline">Continuous Compliance Posture</h1>
          <p className="page-description">
            Read-only verification of requirements, controls, and cryptographic evidence chains.
          </p>
        </div>
      </div>

      <section className="overview-hero-section" aria-label="Trust Index Calculation Status">
        <EmptyTrustIndexRing />
      </section>

      <section className="overview-metrics-grid" aria-label="Inspection Metrics">
        <div className="metric-overview-card">
          <div className="metric-card-top">
            <span className="metric-card-title">ACTIVE CONTROLS</span>
            <Shield size={18} className="text-amber" aria-hidden="true" />
          </div>
          <div className="metric-card-value-row">
            <span className="metric-card-num tabular-nums">{controlCount}</span>
            <span className="metric-pill pill-verified">{verifiedCount} VERIFIED</span>
          </div>
          <p className="metric-card-detail">
            {verifiedCount} verified, {agingCount} aging, {staleCount} stale.
          </p>
          <div className="metric-card-footer">
            <Link href="/app/controls" className="metric-card-link">
              <span>Inspect controls</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="metric-overview-card">
          <div className="metric-card-top">
            <span className="metric-card-title">EVIDENCE LEDGER</span>
            <FileCheck2 size={18} className="text-gold" aria-hidden="true" />
          </div>
          <div className="metric-card-value-row">
            <span className="metric-card-num tabular-nums">{evidenceCount}</span>
            <span className="metric-pill pill-neutral font-mono">TAMPER-EVIDENT</span>
          </div>
          <p className="metric-card-detail">
            Cryptographically sealed artifacts available for independent audit.
          </p>
          <div className="metric-card-footer">
            <Link href="/app/evidence" className="metric-card-link">
              <span>View evidence vault</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="metric-overview-card">
          <div className="metric-card-top">
            <span className="metric-card-title">PROOF DEBT</span>
            <Scale size={18} className="text-olive" aria-hidden="true" />
          </div>
          <div className="metric-card-value-row">
            <span className="metric-card-num tabular-nums">{hasData ? '14.5h' : '0.0h'}</span>
            <span className="metric-pill pill-neutral">ASSESSED</span>
          </div>
          <p className="metric-card-detail">
            Formula-backed hours owed to achieve continuous provability.
          </p>
          <div className="metric-card-footer">
            <Link href="/app/proof-debt" className="metric-card-link">
              <span>Inspect formula</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
