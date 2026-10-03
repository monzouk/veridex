'use client';

import { useState, useEffect, useRef } from 'react';
import { Database, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { loadDemoDataAction, type DemoDataResult } from '@/app/actions/demo-data';

export default function LoadDemoDataButton() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<DemoDataResult | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  // Close dialog on Escape key
  useEffect(() => {
    if (!dialogOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) {
        setDialogOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogOpen, loading]);

  // Focus confirmation button when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
    }
  }, [dialogOpen]);

  async function handleConfirmAddSampleData() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await loadDemoDataAction();
      setStatus(res);
      setDialogOpen(false);
      // Refresh window context so newly seeded controls and evidence appear immediately
      window.location.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to seed sample data.';
      setStatus({ success: false, error: msg });
      setLoading(false);
    }
  }

  return (
    <div className="demo-data-btn-wrapper">
      <button
        type="button"
        className="button button-outline demo-data-button"
        onClick={() => setDialogOpen(true)}
        disabled={loading}
      >
        <Database size={16} className="text-amber" aria-hidden="true" />
        <span>Load data</span>
      </button>

      {/* Confirmation Dialog */}
      {dialogOpen && (
        <div
          className="confirm-dialog-backdrop"
          onClick={() => !loading && setDialogOpen(false)}
          role="presentation"
        >
          <div
            className="confirm-dialog-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-dialog-header">
              <div className="confirm-dialog-icon" aria-hidden="true">
                <Sparkles size={20} className="text-amber" />
              </div>
              <h3 id="confirm-dialog-title" className="confirm-dialog-title">
                Load Sample Data
              </h3>
            </div>

            <p id="confirm-dialog-desc" className="confirm-dialog-message">
              This adds sample controls and evidence so you can explore the product. You can remove them later.
            </p>

            <div className="confirm-dialog-actions">
              <button
                type="button"
                className="button button-quiet confirm-cancel-btn"
                onClick={() => setDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                className="button button-primary confirm-confirm-btn"
                onClick={handleConfirmAddSampleData}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                    <span>Adding sample data...</span>
                  </>
                ) : (
                  <span>Add sample data</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {status?.success && (
        <div className="demo-data-status status-success" role="status">
          <CheckCircle2 size={14} className="text-olive" aria-hidden="true" />
          <span>{status.message}</span>
        </div>
      )}

      {status && !status.success && (
        <div className="demo-data-status status-error" role="alert">
          <AlertCircle size={14} className="text-stale" aria-hidden="true" />
          <span>{status.error}</span>
        </div>
      )}
    </div>
  );
}
