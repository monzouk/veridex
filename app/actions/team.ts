'use server';

// =============================================================================
// VERIDEX TEAM & INVITATION SERVER ACTIONS
// File: app/actions/team.ts
// Adheres strictly to AGENTS.md:
// - Zero emojis, emoticons, or emote characters
// - Cryptographically secure token generated with crypto.randomBytes(32) on server
// - One-time secret link shown once, only SHA-256 stored in DB
// - Strict role hierarchy enforcement and reports_to validation
// - Show "Expired" whenever expires_at has passed
// =============================================================================

import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { AppRole, getAllowedInviteRoles } from '@/lib/roles';
import { getActiveMembershipContext } from '@/lib/roles-server';

export interface CreateInviteInput {
  role: AppRole;
  email?: string;
  reportsTo?: string; // Membership ID of active Control Owner (required for CMS Exec & Exec)
  expiryDays?: number; // 1 to 7 days
}

export interface CreateInviteResult {
  success: boolean;
  error?: string;
  inviteLink?: string;
  token?: string;
  expiresAt?: string;
  role?: AppRole;
  email?: string;
}

/**
 * Creates a one-time invitation.
 * Token is generated via crypto.randomBytes(32) on the server.
 * Only the SHA-256 hash is persisted in public.invites.
 */
export async function createInviteAction(input: CreateInviteInput): Promise<CreateInviteResult> {
  try {
    const context = await getActiveMembershipContext();
    if (!context) {
      return { success: false, error: 'Authentication required.' };
    }

    const callerRole = context.membership.role;
    if (callerRole !== 'owner' && callerRole !== 'admin') {
      return { success: false, error: 'Permission denied: Only Owners and Admins can create invitations.' };
    }

    const allowedRoles = getAllowedInviteRoles(callerRole);
    if (!allowedRoles.includes(input.role)) {
      return {
        success: false,
        error: `Permission denied: ${callerRole} is not permitted to invite role ${input.role}.`,
      };
    }

    // CMS Executive & Executive must report to an active Control Owner
    let reportsToId: string | null = null;
    if (input.role === 'cms_executive' || input.role === 'executive') {
      if (!input.reportsTo) {
        return {
          success: false,
          error: `${input.role === 'cms_executive' ? 'CMS Executive' : 'Executive'} must report to an active Control Owner.`,
        };
      }
      reportsToId = input.reportsTo;
    }

    const supabase = await createClient();

    // Verify reports_to if provided
    if (reportsToId) {
      const { data: coMember, error: coErr } = await supabase
        .from('memberships')
        .select('id, role, is_active, organisation_id')
        .eq('id', reportsToId)
        .eq('organisation_id', context.organisation.id)
        .eq('role', 'control_owner')
        .eq('is_active', true)
        .maybeSingle();

      if (coErr || !coMember) {
        return {
          success: false,
          error: 'Specified reports_to is not an active Control Owner in this organisation.',
        };
      }
    }

    // Expiry: default 7 days, max 7 days (as enforced by DB trigger)
    const days = Math.min(Math.max(Number(input.expiryDays) || 7, 1), 7);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Generate cryptographic 32-byte secret token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const cleanEmail = input.email?.trim().toLowerCase() || null;

    const { data: inviteRow, error: insertError } = await supabase
      .from('invites')
      .insert({
        organisation_id: context.organisation.id,
        role: input.role,
        email: cleanEmail,
        reports_to: reportsToId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        created_by: context.user.id,
      })
      .select('id, expires_at, role, email')
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Determine base URL from headers or fallback
    const headerList = await headers();
    const host = headerList.get('host') || 'localhost:3000';
    const proto = headerList.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
    const baseUrl = `${proto}://${host}`;

    const inviteLink = `${baseUrl}/invite/${rawToken}`;

    revalidatePath('/app/team');

    return {
      success: true,
      inviteLink,
      token: rawToken,
      expiresAt: inviteRow.expires_at,
      role: inviteRow.role as AppRole,
      email: inviteRow.email || undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate invitation link.';
    return { success: false, error: message };
  }
}

/**
 * Revokes a pending invitation.
 */
export async function revokeInviteAction(inviteId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await getActiveMembershipContext();
    if (!context || (context.membership.role !== 'owner' && context.membership.role !== 'admin')) {
      return { success: false, error: 'Permission denied.' };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('invites')
      .update({ status: 'revoked' })
      .eq('id', inviteId)
      .eq('organisation_id', context.organisation.id)
      .eq('status', 'pending');

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/app/team');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to revoke invite.' };
  }
}

/**
 * Updates a member's role and reporting hierarchy.
 */
export async function updateMemberRoleAction(
  membershipId: string,
  newRole: AppRole,
  newReportsTo?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await getActiveMembershipContext();
    if (!context || (context.membership.role !== 'owner' && context.membership.role !== 'admin')) {
      return { success: false, error: 'Permission denied.' };
    }

    const callerRole = context.membership.role;
    const supabase = await createClient();

    // Check target membership
    const { data: targetMem, error: fetchErr } = await supabase
      .from('memberships')
      .select('id, role, user_id, is_active')
      .eq('id', membershipId)
      .eq('organisation_id', context.organisation.id)
      .single();

    if (fetchErr || !targetMem) {
      return { success: false, error: 'Target member not found in this organisation.' };
    }

    // Role hierarchy rules:
    // Admin cannot modify Owner or Admin
    if (callerRole === 'admin' && (targetMem.role === 'owner' || targetMem.role === 'admin')) {
      return { success: false, error: 'Admins cannot modify Owner or Admin memberships.' };
    }
    // Admin cannot promote to Owner or Admin
    if (callerRole === 'admin' && (newRole === 'owner' || newRole === 'admin')) {
      return { success: false, error: 'Admins cannot promote users to Owner or Admin.' };
    }

    const updatePayload: { role: AppRole; reports_to?: string | null } = {
      role: newRole,
    };

    if (newRole === 'cms_executive' || newRole === 'executive') {
      if (!newReportsTo) {
        return { success: false, error: 'CMS Executives and Executives must report to a Control Owner.' };
      }
      updatePayload.reports_to = newReportsTo;
    } else {
      updatePayload.reports_to = null;
    }

    const { error: updateErr } = await supabase
      .from('memberships')
      .update(updatePayload)
      .eq('id', membershipId)
      .eq('organisation_id', context.organisation.id);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    revalidatePath('/app/team');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update member role.' };
  }
}

/**
 * Toggles a member's active status (deactivate / reactivate).
 */
export async function toggleMemberActiveAction(
  membershipId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await getActiveMembershipContext();
    if (!context || (context.membership.role !== 'owner' && context.membership.role !== 'admin')) {
      return { success: false, error: 'Permission denied.' };
    }

    const callerRole = context.membership.role;
    const supabase = await createClient();

    const { data: targetMem, error: fetchErr } = await supabase
      .from('memberships')
      .select('id, role, user_id, is_active')
      .eq('id', membershipId)
      .eq('organisation_id', context.organisation.id)
      .single();

    if (fetchErr || !targetMem) {
      return { success: false, error: 'Member not found.' };
    }

    if (callerRole === 'admin' && (targetMem.role === 'owner' || targetMem.role === 'admin')) {
      return { success: false, error: 'Admins cannot deactivate Owners or Admins.' };
    }

    const { error: updateErr } = await supabase
      .from('memberships')
      .update({ is_active: isActive })
      .eq('id', membershipId)
      .eq('organisation_id', context.organisation.id);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    revalidatePath('/app/team');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to toggle member status.' };
  }
}

/**
 * Accepts an invitation using a raw secret token.
 * Calls public.accept_invite(token).
 */
export async function acceptInviteAction(token: string): Promise<{ success: boolean; error?: string; organisationName?: string }> {
  try {
    const cleanToken = (token || '').trim();
    if (!cleanToken) {
      return { success: false, error: 'Invitation token is missing.' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('accept_invite', { token: cleanToken });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data && data.success === false) {
      return { success: false, error: data.error || 'Failed to accept invitation.' };
    }

    revalidatePath('/app');
    return {
      success: true,
      organisationName: data?.organisation_name || 'Organisation',
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error accepting invitation.' };
  }
}
