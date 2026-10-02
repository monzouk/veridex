'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Shield,
  FileCheck2,
  Scale,
  Settings,
} from 'lucide-react';

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
    name: 'Settings',
    href: '/app/settings',
    icon: Settings,
  },
];

export default function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="app-bottom-nav" aria-label="Mobile navigation bar">
      <ul className="bottom-nav-list" role="list">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/app'
              ? pathname === '/app'
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="bottom-nav-item">
              <Link
                href={item.href}
                className={`bottom-nav-link ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={20} className="bottom-nav-icon" aria-hidden="true" />
                <span className="bottom-nav-label">{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
