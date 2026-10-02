'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, Settings, User, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  userEmail?: string;
  userRole?: string;
}

export default function UserMenu({
  userEmail = 'user@veridex.internal',
  userRole = 'Owner',
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U';

  // Close menu on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="User account menu"
      >
        <div className="user-avatar" aria-hidden="true">
          {initial}
        </div>
        <div className="user-summary">
          <span className="user-email-text">{userEmail}</span>
          <span className="user-role-badge">{userRole}</span>
        </div>
        <ChevronDown
          size={14}
          className={`menu-chevron ${isOpen ? 'open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="user-dropdown-menu" role="menu" aria-label="User options">
          <div className="dropdown-header">
            <span className="dropdown-header-email">{userEmail}</span>
            <span className="dropdown-header-role">Role: {userRole}</span>
          </div>

          <div className="dropdown-divider" role="separator" />

          <Link
            href="/app/settings"
            className="dropdown-item"
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <Settings size={15} aria-hidden="true" />
            <span>Workspace Settings</span>
          </Link>

          <div className="dropdown-divider" role="separator" />

          <a
            href="/auth/signout"
            className="dropdown-item dropdown-item-danger"
            role="menuitem"
          >
            <LogOut size={15} aria-hidden="true" />
            <span>Sign out</span>
          </a>
        </div>
      )}
    </div>
  );
}
