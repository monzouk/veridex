'use client';

// =============================================================================
// VERIDEX REMOVE SAMPLE DATA BUTTON
// File: components/RemoveSampleDataButton.tsx
// Strictly adheres to AGENTS.md:
// - Zero emojis, emoticons, or emote characters
// - Calls removeSampleDataAction -> public.remove_sample_data(orgId)
// =============================================================================

import { useState } from 'react';
import { Trash2, Loader2, AlertCircle, Check } from 'lucide-react';
import { removeSampleDataAction } from '@/app/actions/demo-data';

export default function RemoveSampleDataButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleRemove() {
    if (!confirm('Are you sure you want to remove all sample/demo controls and evidence? Real data will be preserved.')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await removeSampleDataAction();
      if (!res.success) {
        setError(res.error || 'Failed to remove sample data.');
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing sample data.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      {error && (
        <span className="text-xs text-error flex items-center gap-1">
          <AlertCircle size={12} aria-hidden="true" />
          <span>{error}</span>
        </span>
      )}
      {success && (
        <span className="text-xs text-olive flex items-center gap-1">
          <Check size={12} aria-hidden="true" />
          <span>Purged</span>
        </span>
      )}
      <button
        type="button"
        onClick={handleRemove}
        disabled={loading}
        className="button button-outline text-xs text-stone hover:text-error"
        title="Purge seeded demo controls and evidence"
      >
        {loading ? (
          <>
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
            <span>Purging sample data...</span>
          </>
        ) : (
          <>
            <Trash2 size={13} aria-hidden="true" />
            <span>Remove sample data</span>
          </>
        )}
      </button>
    </div>
  );
}
