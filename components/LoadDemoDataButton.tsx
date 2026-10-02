'use client';

import { useState } from 'react';
import { Database, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { loadDemoDataAction, type DemoDataResult } from '@/app/actions/demo-data';

export default function LoadDemoDataButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<DemoDataResult | null>(null);

  async function handleLoadDemoData() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await loadDemoDataAction();
      setStatus(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to seed demo data.';
      setStatus({ success: false, error: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="demo-data-btn-wrapper">
      <button
        type="button"
        className="button button-outline demo-data-button"
        onClick={handleLoadDemoData}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin text-amber" aria-hidden="true" />
            <span>Seeding 30 Controls & 80 Evidence...</span>
          </>
        ) : (
          <>
            <Database size={16} className="text-amber" aria-hidden="true" />
            <span>Load Demo Data</span>
          </>
        )}
      </button>

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
