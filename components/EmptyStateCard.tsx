'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateCardProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  features?: string[];
  children?: React.ReactNode;
}

export default function EmptyStateCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref,
  features,
  children,
}: EmptyStateCardProps) {
  return (
    <div className="empty-state-card" role="region" aria-label={title}>
      <div className="empty-state-icon-box" aria-hidden="true">
        <Icon size={32} />
      </div>

      <div className="empty-state-body">
        <p className="eyebrow">
          <span className="eyebrow-line" aria-hidden="true" /> {eyebrow}
        </p>
        <h2 className="empty-state-title">{title}</h2>
        <p className="empty-state-description">{description}</p>

        {features && features.length > 0 && (
          <div className="empty-state-features">
            {features.map((feat) => (
              <span key={feat} className="feature-pill">
                {feat}
              </span>
            ))}
          </div>
        )}

        {actionHref && actionLabel && (
          <div className="empty-state-action-bar">
            <Link href={actionHref} className="button button-primary">
              {actionLabel}
            </Link>
          </div>
        )}

        {children && <div className="empty-state-action-bar">{children}</div>}
      </div>
    </div>
  );
}
