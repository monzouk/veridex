'use client';

import { PlusCircle } from 'lucide-react';

export default function AddControlButton() {
  return (
    <button
      type="button"
      className="button button-primary"
      onClick={() => {}}
    >
      <PlusCircle size={16} aria-hidden="true" />
      <span>Add your first control</span>
    </button>
  );
}
