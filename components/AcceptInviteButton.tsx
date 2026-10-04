'use client';

// =============================================================================
// VERIDEX ACCEPT INVITE BUTTON
// File: components/AcceptInviteButton.tsx
// Strictly adheres to AGENTS.md:
// - Zero emojis, emoticons, or emote characters
// =============================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { acceptInviteAction } from '@/app/actions/team';

interface AcceptInviteButtonProps {
  token: string;
  orgName: string;
}

export default function AcceptInviteButton({ token, orgName }: AcceptInviteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);
    try {
      const res = await acceptInviteAction(token);
      if (!res.success) {
        setError(res.error || 'Failed to accept invitation.');
      } else {
        router.push('/app');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {error && (
        <div className="form-error-banner mb-4" role="alert">
          <AlertCircle size={16} className="text-error" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleAccept}
        disabled={loading}
        className="btn-primary-amber w-full justify-center text-center py-3 text-base"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            <span>Joining {orgName}...</span>
          </>
        ) : (
          <>
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>Accept invitation & enter workspace</span>
          </>
        )}
      </button>
    </div>
  );
}
