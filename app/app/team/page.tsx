// =============================================================================
// VERIDEX TEAM & ACCESS GOVERNANCE DASHBOARD
// File: app/app/team/page.tsx
// Strictly adheres to AGENTS.md:
// - Zero emojis, emoticons, or emote characters
// - Line icons only (Lucide React)
// - Brand tokens (Void, Ink, Graphite, Line, Cream, Stone, Amber, Gold, Olive)
// - Show "Expired" whenever expires_at has passed
// - One-time secret link creation (server-generated, display once)
// =============================================================================

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  Users,
  Shield,
  KeyRound,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  Ban,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ROLES, AppRole } from '@/lib/roles';
import { getActiveMembershipContext } from '@/lib/roles-server';
import InviteMemberModal from '@/components/InviteMemberModal';
import TeamMemberActions from '@/components/TeamMemberActions';
import RevokeInviteButton from '@/components/RevokeInviteButton';

export const metadata: Metadata = {
  title: 'Team Governance | VERIDEX',
  description: 'Cryptographic role governance, reporting hierarchies, and team memberships.',
};

export default async function TeamPage() {
  const context = await getActiveMembershipContext();

  if (!context) {
    redirect('/login?redirectTo=/app/team');
  }

  const { organisation, membership, user } = context;
  const callerRole = membership.role;
  const canManageTeam = callerRole === 'owner' || callerRole === 'admin';

  const supabase = await createClient();

  // 1. Fetch all memberships in the organisation
  const { data: rawMembers } = await supabase
    .from('memberships')
    .select(`
      id,
      user_id,
      role,
      is_active,
      reports_to,
      created_at
    `)
    .eq('organisation_id', organisation.id)
    .order('created_at', { ascending: true });

  const members = rawMembers || [];

  // 2. Fetch invitations in the organisation (for email resolution and pending list)
  const { data: rawInvites } = await supabase
    .from('invites')
    .select(`
      id,
      email,
      role,
      reports_to,
      expires_at,
      status,
      created_at,
      accepted_by,
      accepted_at
    `)
    .eq('organisation_id', organisation.id)
    .order('created_at', { ascending: false });

  const invites = rawInvites || [];

  // Map accepted invites by user_id to resolve emails for team display
  const userEmailMap = new Map<string, string>();
  // Current user's email is always known
  userEmailMap.set(user.id, user.email);

  for (const inv of invites) {
    if (inv.accepted_by && inv.email) {
      userEmailMap.set(inv.accepted_by, inv.email);
    }
  }

  // Build Control Owners lookup for reports_to display and modal options
  const controlOwnersList: Array<{ id: string; userEmail: string }> = [];
  const memberDisplayMap = new Map<string, string>();

  for (const m of members) {
    const email = userEmailMap.get(m.user_id) || `member-${m.user_id.slice(0, 8)}`;
    memberDisplayMap.set(m.id, email);
    if (m.role === 'control_owner' && m.is_active) {
      controlOwnersList.push({ id: m.id, userEmail: email });
    }
  }

  // Metrics
  const activeMembersCount = members.filter((m) => m.is_active).length;
  const deactivatedCount = members.filter((m) => !m.is_active).length;

  const now = Date.now();
  const pendingInvitesCount = invites.filter(
    (inv) => inv.status === 'pending' && new Date(inv.expires_at).getTime() >= now
  ).length;

  return (
    <div className="overview-page-container">
      {/* Page Header */}
      <div className="page-header-block">
        <div className="page-header-text">
          <p className="eyebrow">
            <span className="eyebrow-line" aria-hidden="true" /> ACCESS GOVERNANCE
          </p>
          <h1 className="page-headline">Team & Roles</h1>
          <p className="page-description">
            Role hierarchy, cryptographic reporting lines, and one-time invitation credentials for {organisation.name}.
          </p>
        </div>

        {canManageTeam && (
          <div className="page-quick-actions">
            <InviteMemberModal
              callerRole={callerRole}
              controlOwners={controlOwnersList}
            />
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <section className="overview-metrics-grid" aria-label="Team metrics summary">
        <div className="metric-overview-card">
          <div className="metric-card-top">
            <span className="metric-card-title">ACTIVE MEMBERS</span>
            <Users size={18} className="text-amber" aria-hidden="true" />
          </div>
          <div className="metric-card-value-row">
            <span className="metric-card-num tabular-nums">{activeMembersCount}</span>
            <span className="metric-pill pill-verified">OPERATIONAL</span>
          </div>
          <p className="metric-card-detail">
            {activeMembersCount} team member{activeMembersCount === 1 ? '' : 's'} with verified active permissions.
            {deactivatedCount > 0 && ` (${deactivatedCount} deactivated)`}
          </p>
        </div>

        <div className="metric-overview-card">
          <div className="metric-card-top">
            <span className="metric-card-title">CONTROL OWNERS</span>
            <Shield size={18} className="text-olive" aria-hidden="true" />
          </div>
          <div className="metric-card-value-row">
            <span className="metric-card-num tabular-nums">{controlOwnersList.length}</span>
            <span className="metric-pill pill-neutral">REVIEWERS</span>
          </div>
          <p className="metric-card-detail">
            Responsible for reviewing and cryptographically linking evidence uploaded by Executives.
          </p>
        </div>

        <div className="metric-overview-card">
          <div className="metric-card-top">
            <span className="metric-card-title">PENDING INVITATIONS</span>
            <KeyRound size={18} className="text-gold" aria-hidden="true" />
          </div>
          <div className="metric-card-value-row">
            <span className="metric-card-num tabular-nums">{pendingInvitesCount}</span>
            <span className={`metric-pill ${pendingInvitesCount > 0 ? 'pill-aging' : 'pill-neutral'}`}>
              {pendingInvitesCount > 0 ? 'AWAITING ACCEPTANCE' : 'IDLE'}
            </span>
          </div>
          <p className="metric-card-detail">
            Single-use cryptographic links active and awaiting member sign-in.
          </p>
        </div>
      </section>

      {/* Active Team Members Table */}
      <section className="team-table-section" aria-label="Team members list">
        <div className="team-section-header">
          <div>
            <h2 className="team-section-title">Members Directory</h2>
            <p className="team-section-subtitle">
              Current team members bound to this organisation and their assigned authorization tier.
            </p>
          </div>
        </div>

        <div className="team-table-wrapper">
          <table className="team-table">
            <thead>
              <tr>
                <th scope="col">Member</th>
                <th scope="col">Role</th>
                <th scope="col">Reports To</th>
                <th scope="col">Status</th>
                <th scope="col">Joined</th>
                {canManageTeam && <th scope="col" className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={canManageTeam ? 6 : 5} className="table-empty-row">
                    No members found.
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const roleMeta = ROLES[m.role as AppRole] || ROLES.viewer;
                  const email = userEmailMap.get(m.user_id) || `User ${m.user_id.slice(0, 8)}...`;
                  const isCurrent = m.user_id === user.id;
                  const reportsToDisplay = m.reports_to ? memberDisplayMap.get(m.reports_to) || 'Control Owner' : null;

                  return (
                    <tr key={m.id} className={!m.is_active ? 'row-deactivated' : ''}>
                      <td>
                        <div className="member-name-cell">
                          <div className="member-avatar" aria-hidden="true">
                            {email.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="member-email font-mono">
                              {email}
                              {isCurrent && <span className="current-user-tag">(You)</span>}
                            </span>
                            <span className="member-id-sub text-xs text-stone font-mono block">
                              UUID: {m.user_id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${roleMeta.badgeClass}`}>
                          {roleMeta.label}
                        </span>
                      </td>
                      <td>
                        {reportsToDisplay ? (
                          <span className="reports-to-tag">
                            <ArrowRight size={12} className="text-amber" aria-hidden="true" />
                            <span className="font-mono text-xs">{reportsToDisplay}</span>
                          </span>
                        ) : (
                          <span className="text-stone text-xs">—</span>
                        )}
                      </td>
                      <td>
                        {m.is_active ? (
                          <span className="status-pill status-pill-active">
                            <UserCheck size={12} aria-hidden="true" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="status-pill status-pill-inactive">
                            <UserX size={12} aria-hidden="true" />
                            <span>Deactivated</span>
                          </span>
                        )}
                      </td>
                      <td className="text-stone font-mono text-xs">
                        {new Date(m.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      {canManageTeam && (
                        <td className="text-right">
                          <TeamMemberActions
                            callerRole={callerRole}
                            membershipId={m.id}
                            targetRole={m.role as AppRole}
                            isActive={m.is_active}
                            isCurrentUser={isCurrent}
                            controlOwners={controlOwnersList}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invitations Ledger Table (Visible to Owners and Admins) */}
      {canManageTeam && (
        <section className="team-table-section mt-8" aria-label="Invitations registry">
          <div className="team-section-header">
            <div>
              <h2 className="team-section-title">Invitation Ledger</h2>
              <p className="team-section-subtitle">
                Cryptographic single-use invitations. Status is marked Expired automatically when expires_at has passed.
              </p>
            </div>
          </div>

          <div className="team-table-wrapper">
            <table className="team-table">
              <thead>
                <tr>
                  <th scope="col">Recipient</th>
                  <th scope="col">Invited Role</th>
                  <th scope="col">Reports To</th>
                  <th scope="col">Expires At</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {invites.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty-row">
                      No invitations issued yet.
                    </td>
                  </tr>
                ) : (
                  invites.map((inv) => {
                    const roleMeta = ROLES[inv.role as AppRole] || ROLES.viewer;
                    const expiresDate = new Date(inv.expires_at);
                    const isPastExpiry = expiresDate.getTime() < now;

                    // Exact rule: Show "Expired" whenever expires_at has passed
                    let displayStatus = inv.status;
                    let statusClass = 'pill-neutral';

                    if (inv.status === 'accepted') {
                      displayStatus = 'Accepted';
                      statusClass = 'pill-verified';
                    } else if (inv.status === 'revoked') {
                      displayStatus = 'Revoked';
                      statusClass = 'pill-neutral';
                    } else if (isPastExpiry || inv.status === 'expired') {
                      displayStatus = 'Expired';
                      statusClass = 'pill-stale';
                    } else {
                      displayStatus = 'Pending';
                      statusClass = 'pill-aging';
                    }

                    const canRevoke = inv.status === 'pending' && !isPastExpiry;
                    const reportsToDisplay = inv.reports_to
                      ? memberDisplayMap.get(inv.reports_to) || 'Control Owner'
                      : null;

                    return (
                      <tr key={inv.id}>
                        <td>
                          {inv.email ? (
                            <span className="font-mono text-sm text-cream">{inv.email}</span>
                          ) : (
                            <span className="text-stone text-xs italic">Open link (Any authenticated recipient)</span>
                          )}
                        </td>
                        <td>
                          <span className={`role-badge ${roleMeta.badgeClass}`}>
                            {roleMeta.label}
                          </span>
                        </td>
                        <td>
                          {reportsToDisplay ? (
                            <span className="reports-to-tag">
                              <ArrowRight size={12} className="text-amber" aria-hidden="true" />
                              <span className="font-mono text-xs">{reportsToDisplay}</span>
                            </span>
                          ) : (
                            <span className="text-stone text-xs">—</span>
                          )}
                        </td>
                        <td className="text-stone font-mono text-xs">
                          <div className="flex items-center gap-1">
                            <Clock size={12} className="text-stone" aria-hidden="true" />
                            <span>
                              {expiresDate.toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`metric-pill ${statusClass} uppercase font-mono text-xs`}>
                            {displayStatus === 'Accepted' && <CheckCircle2 size={11} className="mr-1 inline" aria-hidden="true" />}
                            {displayStatus === 'Revoked' && <Ban size={11} className="mr-1 inline" aria-hidden="true" />}
                            <span>{displayStatus}</span>
                          </span>
                        </td>
                        <td className="text-right">
                          {canRevoke ? (
                            <RevokeInviteButton inviteId={inv.id} />
                          ) : (
                            <span className="text-stone text-xs font-mono">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
