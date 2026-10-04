import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AppSidebar from '@/components/AppSidebar';
import AppTopBar from '@/components/AppTopBar';
import AppBottomNav from '@/components/AppBottomNav';
import OnboardingModal from '@/components/OnboardingModal';
import DeactivatedAccessScreen from '@/components/DeactivatedAccessScreen';
import { getUserOrganisation, getDeactivatedOrgStatus } from '@/app/actions/organisation';

export const metadata = {
  title: 'Workspace | VERIDEX',
  description: 'Continuous compliance intelligence workspace.',
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/app');
  }

  // Fetch active organisation from database
  const org = await getUserOrganisation();

  // If user has no active organisation, check if they are deactivated
  if (!org) {
    const deactivatedOrgName = await getDeactivatedOrgStatus();
    if (deactivatedOrgName) {
      return (
        <div className="app-shell-root">
          <DeactivatedAccessScreen
            orgName={deactivatedOrgName}
            userEmail={user.email}
          />
        </div>
      );
    }
  }

  const orgName = org?.name || 'Veridex Workspace';
  const userRole = org?.role || 'Owner';
  const needsOnboarding = !org;

  return (
    <div className="app-shell-root">
      <AppSidebar orgName={orgName} userEmail={user.email} userRole={userRole} />

      <div className="app-shell-main-wrapper">
        <AppTopBar
          orgName={orgName}
          userEmail={user.email}
          userRole={userRole}
        />
        <main className="app-shell-content">
          {children}
        </main>
      </div>

      <AppBottomNav />

      {/* First-Run Onboarding Modal */}
      {needsOnboarding && <OnboardingModal userEmail={user.email || ''} />}
    </div>
  );
}
