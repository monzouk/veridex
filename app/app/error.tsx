'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring if configured
    console.error('App workspace error:', error);
  }, [error]);

  return (
    <div className="subpage-container error-container" role="alert">
      <div className="error-card">
        <div className="error-icon-box" aria-hidden="true">
          <AlertCircle size={32} className="text-stale" />
        </div>

        <p className="eyebrow">
          <span className="eyebrow-line" aria-hidden="true" /> EXECUTION EXCEPTION
        </p>

        <h1 className="error-title">Workspace Data Error</h1>
        <p className="error-description">
          An unexpected issue interrupted workspace rendering. Your session and tenant data remain secure.
        </p>

        {error.digest && (
          <p className="error-digest font-mono">
            Error Digest: <span>{error.digest}</span>
          </p>
        )}

        <div className="error-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={() => reset()}
          >
            <RotateCcw size={15} aria-hidden="true" />
            <span>Retry Operation</span>
          </button>

          <Link href="/app" className="button button-outline">
            <Home size={15} aria-hidden="true" />
            <span>Return to Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
