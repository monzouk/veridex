// =============================================================================
// VERIDEX ROLES AND PERMISSIONS MAP
// File: lib/roles.ts
// Adheres strictly to AGENTS.md:
// - Zero emojis, emoticons, or emote characters
// - Complete role hierarchy: Owner, Admin, Control Owner, CMS Executive, Executive, Auditor, Viewer
// - Pure client-and-server-safe definitions and permissions matrix
// =============================================================================

export type AppRole =
  | 'owner'
  | 'admin'
  | 'control_owner'
  | 'cms_executive'
  | 'executive'
  | 'auditor'
  | 'viewer';

export interface RoleMeta {
  role: AppRole;
  label: string;
  badgeClass: string;
  description: string;
  hierarchyRank: number; // Higher number = higher administrative authority
}

export const ROLES: Record<AppRole, RoleMeta> = {
  owner: {
    role: 'owner',
    label: 'Owner',
    badgeClass: 'badge-role-owner',
    description: 'Full administrative authority, billing governance, and organisation lifecycle management.',
    hierarchyRank: 100,
  },
  admin: {
    role: 'admin',
    label: 'Admin',
    badgeClass: 'badge-role-admin',
    description: 'Organisation administration, team invitations, and compliance program oversight.',
    hierarchyRank: 80,
  },
  control_owner: {
    role: 'control_owner',
    label: 'Control Owner',
    badgeClass: 'badge-role-co',
    description: 'Direct owner of compliance controls, task delegator, and evidence review authority.',
    hierarchyRank: 60,
  },
  cms_executive: {
    role: 'cms_executive',
    label: 'CMS Executive',
    badgeClass: 'badge-role-cms',
    description: 'Compliance management task execution and evidence submissions reporting to a Control Owner.',
    hierarchyRank: 40,
  },
  executive: {
    role: 'executive',
    label: 'Executive',
    badgeClass: 'badge-role-exec',
    description: 'Operational attestation and evidence uploads tied to assigned compliance tasks.',
    hierarchyRank: 40,
  },
  auditor: {
    role: 'auditor',
    label: 'Auditor',
    badgeClass: 'badge-role-auditor',
    description: 'Independent read-only audit inspection, evidence verification, and cryptographic chain validation.',
    hierarchyRank: 20,
  },
  viewer: {
    role: 'viewer',
    label: 'Viewer',
    badgeClass: 'badge-role-viewer',
    description: 'Read-only visibility across controls directory and organizational posture.',
    hierarchyRank: 10,
  },
};

/**
 * Returns list of roles that a caller with callerRole is permitted to invite.
 * - Owner: can invite admin, control_owner, cms_executive, executive, auditor, viewer.
 * - Admin: can invite control_owner, cms_executive, executive, auditor, viewer (CANNOT invite owner or admin).
 * - Others: cannot invite anyone.
 */
export function getAllowedInviteRoles(callerRole: AppRole): AppRole[] {
  if (callerRole === 'owner') {
    return ['admin', 'control_owner', 'cms_executive', 'executive', 'auditor', 'viewer'];
  }
  if (callerRole === 'admin') {
    return ['control_owner', 'cms_executive', 'executive', 'auditor', 'viewer'];
  }
  return [];
}

/**
 * Role permissions helper matrix
 */
export const PERMISSIONS = {
  canManageTeam: (role: AppRole): boolean => role === 'owner' || role === 'admin',
  canDeleteOrganisation: (role: AppRole): boolean => role === 'owner',
  canRemoveSampleData: (role: AppRole): boolean => role === 'owner',
  canManageControls: (role: AppRole): boolean => role === 'owner' || role === 'admin' || role === 'control_owner',
  canLinkEvidence: (role: AppRole): boolean => role === 'owner' || role === 'admin' || role === 'control_owner',
  canAssignTasks: (role: AppRole): boolean => role === 'owner' || role === 'admin' || role === 'control_owner',
  canUploadEvidence: (role: AppRole): boolean =>
    role === 'owner' ||
    role === 'admin' ||
    role === 'control_owner' ||
    role === 'cms_executive' ||
    role === 'executive',
  requiresTaskForUpload: (role: AppRole): boolean => role === 'cms_executive' || role === 'executive',
  canViewAuditLog: (role: AppRole): boolean => role === 'owner' || role === 'admin' || role === 'auditor',
  isReadOnly: (role: AppRole): boolean => role === 'auditor' || role === 'viewer',
};
