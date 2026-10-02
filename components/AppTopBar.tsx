import Link from 'next/link';
import { Building2 } from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';
import UserMenu from './UserMenu';

interface AppTopBarProps {
  orgName?: string;
  userEmail?: string;
  userRole?: string;
}

export default function AppTopBar({
  orgName = 'Default Organisation',
  userEmail = 'user@veridex.internal',
  userRole = 'Owner',
}: AppTopBarProps) {
  return (
    <header className="app-top-bar" aria-label="Application header">
      <div className="top-bar-left">
        {/* On mobile screens, show the compact logo here since sidebar is hidden */}
        <div className="top-bar-mobile-logo">
          <Link href="/app" aria-label="Veridex app home">
            <AnimatedLogo className="mobile-logo-img" width={110} height={26} />
          </Link>
        </div>

        <div className="top-bar-org-pill">
          <Building2 size={15} className="text-amber" aria-hidden="true" />
          <span className="org-name-label">{orgName}</span>
          <span className="env-pill">ACTIVE</span>
        </div>
      </div>

      <div className="top-bar-right">
        <UserMenu userEmail={userEmail} userRole={userRole} />
      </div>
    </header>
  );
}
