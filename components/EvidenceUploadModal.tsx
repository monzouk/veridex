'use client';

import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, X, FileText, Hash } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface EvidenceUploadModalProps {
  organisationId: string;
  onSuccess?: () => void;
  controlsList?: Array<{ id: string; code: string; title: string }>;
  supersedingEvidenceId?: string;
  currentVersion?: number;
}

export default function EvidenceUploadModal({
  organisationId,
  onSuccess,
  controlsList = [],
  supersedingEvidenceId,
  currentVersion = 1,
}: EvidenceUploadModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedControlId, setSelectedControlId] = useState('');
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute SHA-256 via browser Web Crypto API
  async function computeSha256(selectedFile: File): Promise<string> {
    setIsHashing(true);
    const arrayBuffer = await selectedFile.arrayBuffer();
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    setIsHashing(false);
    return hashHex;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ''));
    }

    try {
      const hash = await computeSha256(selected);
      setComputedHash(hash);
    } catch {
      setErrorMessage('Could not calculate SHA-256 digest for selected file.');
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !computedHash) {
      setErrorMessage('Please select a file and await SHA-256 calculation.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMessage('Authentication required to upload evidence.');
      setIsUploading(false);
      return;
    }

    try {
      // 1. Upload to Supabase Storage private 'evidence' bucket
      // Storage path format: {organisation_id}/{timestamp}-{filename}
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${organisationId}/${Date.now()}-${safeFileName}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('evidence')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (storageError) {
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }

      // 2. Insert into 'evidence' table with SHA-256 and append-only version link
      const versionNumber = supersedingEvidenceId ? currentVersion + 1 : 1;

      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence')
        .insert({
          organisation_id: organisationId,
          title: title.trim(),
          description: description.trim() || null,
          file_path: storageData.path,
          file_size: file.size,
          mime_type: file.type || 'application/octet-stream',
          sha256_hash: computedHash,
          previous_evidence_id: supersedingEvidenceId || null,
          version: versionNumber,
          source: 'manual_upload',
          created_by: user.id,
        })
        .select('id')
        .single();

      if (evidenceError) {
        throw new Error(`Evidence ledger record failed: ${evidenceError.message}`);
      }

      // 3. Link to control if selected
      if (selectedControlId) {
        await supabase.from('control_evidence').insert({
          organisation_id: organisationId,
          control_id: selectedControlId,
          evidence_id: evidenceData.id,
          linked_by: user.id,
        });
      }

      setStatusMessage(`Evidence stored with SHA-256 digest and version v${versionNumber}.`);
      setFile(null);
      setTitle('');
      setDescription('');
      setComputedHash(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onSuccess) onSuccess();

      setTimeout(() => {
        setIsOpen(false);
        setStatusMessage(null);
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="button button-primary"
        onClick={() => setIsOpen(true)}
      >
        <UploadCloud size={16} aria-hidden="true" />
        <span>{supersedingEvidenceId ? 'Upload New Version' : 'Upload Evidence'}</span>
      </button>

      {isOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="upload-modal-title">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <p className="eyebrow">
                  <span className="eyebrow-line" aria-hidden="true" /> TAMPER-EVIDENT VAULT
                </p>
                <h3 id="upload-modal-title" className="modal-title">
                  {supersedingEvidenceId
                    ? `Upload Version ${currentVersion + 1} (Append-Only)`
                    : 'Intake Compliance Evidence'}
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="modal-form">
              {/* File Drop / Select Area */}
              <div className="file-drop-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="evidence-file-input"
                  className="file-hidden-input"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  required
                />
                <label htmlFor="evidence-file-input" className="file-drop-label">
                  <FileText size={28} className="text-amber" aria-hidden="true" />
                  <span className="drop-label-title">
                    {file ? file.name : 'Click to select audit file or drag artifact here'}
                  </span>
                  <span className="drop-label-subtitle">
                    {file
                      ? `${(file.size / 1024).toFixed(1)} KB — ${file.type || 'octet-stream'}`
                      : 'Accepts PDF, JSON, logs, TAR.GZ, CSV, or screenshots (Max 50MB)'}
                  </span>
                </label>
              </div>

              {/* SHA-256 Digest Calculation Badge */}
              {isHashing && (
                <div className="hashing-badge" role="status">
                  <Loader2 size={14} className="animate-spin text-gold" aria-hidden="true" />
                  <span>Computing cryptographic SHA-256 hash...</span>
                </div>
              )}

              {computedHash && (
                <div className="hash-preview-box">
                  <div className="hash-label-row">
                    <Hash size={13} className="text-amber" aria-hidden="true" />
                    <span>Cryptographic Digest (SHA-256)</span>
                  </div>
                  <code className="hash-string font-mono">{computedHash}</code>
                </div>
              )}

              {/* Title & Description */}
              <div className="form-field">
                <label htmlFor="evidence-title-input" className="form-label">
                  Artifact Title
                </label>
                <input
                  id="evidence-title-input"
                  type="text"
                  className="input-field"
                  placeholder="e.g. AWS KMS Key Rotation Verification Export"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="evidence-desc-input" className="form-label">
                  Description / Verification Context
                </label>
                <textarea
                  id="evidence-desc-input"
                  className="textarea-field"
                  rows={2}
                  placeholder="Details regarding source, extraction date, or automated verification parameters..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              {/* Link to Control */}
              {controlsList.length > 0 && (
                <div className="form-field">
                  <label htmlFor="control-link-select" className="form-label">
                    Bind to Control (Optional)
                  </label>
                  <select
                    id="control-link-select"
                    className="select-field"
                    value={selectedControlId}
                    onChange={(e) => setSelectedControlId(e.target.value)}
                    disabled={isUploading}
                  >
                    <option value="">No immediate control link</option>
                    {controlsList.map((ctrl) => (
                      <option key={ctrl.id} value={ctrl.id}>
                        [{ctrl.code}] {ctrl.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {errorMessage && (
                <div className="form-error-banner" role="alert">
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {statusMessage && (
                <div className="form-success-banner" role="status">
                  <CheckCircle2 size={14} className="text-olive" aria-hidden="true" />
                  <span>{statusMessage}</span>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="button button-primary"
                  disabled={isUploading || isHashing || !file}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                      <span>Writing to Ledger...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={15} aria-hidden="true" />
                      <span>Commit to Evidence Vault</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
