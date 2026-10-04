'use client';

// =============================================================================
// VERIDEX TEAM MEMBER ROW ACTIONS
// File: components/TeamMemberActions.tsx
// Strictly adheres to AGENTS.md:
// - Zero emojis, emoticons, or emote characters
// - Role modification & deactivation/reactivation controls
// =============================================================================

import { useState } from 'react';
import { UserCheck, UserX, Shield, MoreHorizontal, Check, AlertCircle } from 'lucide-react';
import { AppRole, ROLES } from '@/lib/roles';
import { updateMemberRoleAction, toggleMemberActiveAction } from '@/app/actions/team';

interface TeamMemberActionsProps {
  callerRole: AppRole;
  membershipId: string;
  targetRole: AppRole;
  isActive: boolean;
  isCurrentUser: boolean;
  controlOwners: Array<{ id: string; userEmail: string }>;
}

export default function TeamMemberActions({
  callerRole,
  membershipId,
  targetRole,
  isActive,
  isCurrentUser,
  controlOwners,
}: TeamMemberActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [newRole, setNewRole] = useState<AppRole>(targetRole);
  const [newReportsTo, setNewReportsTo] = useState(controlOwners[0]?.id || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Can caller modify this target?
  // Owner can modify anyone except last owner checks enforced at DB.
  // Admin can modify only lower roles (control_owner, cms_exec, exec, auditor, viewer).
  const canModify =
    callerRole === 'owner' ||
    (callerRole === 'admin' && targetRole !== 'owner' && targetRole !== 'admin');

  if (!canModify) {
    return <span className="text-stone text-xs font-mono">Protected</span>;
  }

  async function handleToggleActive() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await toggleMemberActiveAction(membershipId, !isActive);
      if (!res.success) {
        setError(res.error || 'Action failed.');
      } else {
        setIsOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error modifying status.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveRole(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await updateMemberRoleAction(
        membershipId,
        newRole,
        newRole === 'cms_executive' || newRole === 'executive' ? newReportsTo : null
      );
      if (!res.success) {
        setError(res.error || 'Failed to update role.');
      } else {
        setIsEditingRole(false);
        setIsOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating role.');
    } finally {
      setIsLoading(false);
    }
  }

  const availableRoles: AppRole[] =
    callerRole === 'owner'
      ? ['admin', 'control_owner', 'cms_executive', 'executive', 'auditor', 'viewer']
      : ['control_owner', 'cms_executive', 'executive', 'auditor', 'viewer'];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn-icon-subtle"
        aria-label="Member actions"
      >
        <MoreHorizontal size={16} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="member-actions-menu" role="menu">
          {error && (
            <div className="menu-error-notice">
              <AlertCircle size={12} className="text-error" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {!isEditingRole ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditingRole(true)}
                className="menu-item-button"
                role="menuitem"
              >
                <Shield size={14} className="text-amber" aria-hidden="true" />
                <span>Change role</span>
              </button>

              <button
                type="button"
                onClick={handleToggleActive}
                disabled={isLoading || (isCurrentUser && targetRole === 'owner')}
                className={`menu-item-button ${isActive ? 'text-error' : 'text-olive'}`}
                role="menuitem"
              >
                {isActive ? (
                  <>
                    <UserX size={14} aria-hidden="true" />
                    <span>Deactivate access</span>
                  </>
                ) : (
                  <>
                    <UserCheck size={14} aria-hidden="true" />
                    <span>Reactivate access</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <form onSubmit={handleSaveRole} className="menu-role-edit-form">
              <label className="text-xs text-stone mb-1 block">Select new role:</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as AppRole)}
                className="form-select text-xs mb-2"
              >
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {ROLES[r]?.label}
                  </option>
                ))}
              </select>

              {(newRole === 'cms_executive' || newRole === 'executive') && (
                <div className="mb-2">
                  <label className="text-xs text-stone mb-1 block">Reports to:</label>
                  <select
                    value={newReportsTo}
                    onChange={(e) => setNewReportsTo(e.target.value)}
                    className="form-select text-xs"
                    required
                  >
                    {controlOwners.map((co) => (
                      <option key={co.id} value={co.id}>
                        {co.userEmail}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingRole(false)}
                  className="btn-xs-neutral"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-xs-primary"
                >
                  <Check size={12} aria-hidden="true" />
                  <span>Save</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
