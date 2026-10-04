'use client';

// =============================================================================
// VERIDEX REVOKE INVITE BUTTON
// File: components/RevokeInviteButton.tsx
// Strictly adheres to AGENTS.md:
// - Zero emojis, emoticons, or emote characters
// =============================================================================

import { useState } from 'react';
import { Ban, Loader2 } from 'lucide-react';
import { revokeInviteAction } from '@/app/actions/team';

interface RevokeInviteButtonProps {
  inviteId: string;
}

export default function RevokeInviteButton({ inviteId }: RevokeInviteButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    if (!confirm('Are you sure you want to revoke this invitation? The secret link will become unusable immediately.')) {
      return;
    }
    setLoading(true);
    try {
      await revokeInviteAction(inviteId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRevoke}
      disabled={loading}
      className="btn-revoke-action"
      aria-label="Revoke invitation"
    >
      {loading ? (
        <Loader2 size={13} className="animate-spin text-stone" aria-hidden="true" />
      ) : (
        <>
          <Ban size={13} className="text-error" aria-hidden="true" />
          <span>Revoke</span>
        </>
      )}
    </button>
  );
}
