'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Shield,
  FileCheck2,
  Scale,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';

interface AppSidebarProps {
  orgName?: string;
  userEmail?: string;
  userRole?: string;
}

const NAV_ITEMS = [
  {
    name: 'Overview',
    href: '/app',
    icon: LayoutDashboard,
  },
  {
    name: 'Controls',
    href: '/app/controls',
    icon: Shield,
  },
  {
    name: 'Evidence',
    href: '/app/evidence',
    icon: FileCheck2,
  },
  {
    name: 'Proof Debt',
    href: '/app/proof-debt',
    icon: Scale,
  },
  {
    name: 'Team',
    href: '/app/team',
    icon: Users,
  },
  {
    name: 'Settings',
    href: '/app/settings',
    icon: Settings,
  },
];

export default function AppSidebar({ orgName = 'Default Organisation', userRole }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar" aria-label="Main sidebar navigation">
      <div className="sidebar-header">
        <Link href="/app" className="sidebar-logo-link" aria-label="Veridex app home">
          <AnimatedLogo className="sidebar-logo" width={140} height={32} />
        </Link>
        <div className="sidebar-org-badge" title={orgName}>
          <span className="org-indicator-dot" aria-hidden="true" />
          <span className="org-name-text">{orgName}</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Application sections">
        <ul className="sidebar-nav-list" role="list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/app'
                ? pathname === '/app'
                : pathname.startsWith(item.href);

            return (
              <li key={item.href} className="sidebar-nav-item">
                <Link
                  href={item.href}
                  className={`sidebar-nav-link ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} className="sidebar-nav-icon" aria-hidden="true" />
                  <span className="sidebar-nav-label">{item.name}</span>
                  {isActive && <span className="sidebar-active-indicator" aria-hidden="true" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-engine-status">
          <div className="status-row">
            <ShieldCheck size={14} className="text-olive" aria-hidden="true" />
            <span className="status-title">Truth Engine v1</span>
          </div>
          <span className="status-caption">Continuous Evidence Ledger</span>
        </div>
      </div>
    </aside>
  );
}
