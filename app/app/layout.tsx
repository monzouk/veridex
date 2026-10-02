import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AppSidebar from '@/components/AppSidebar';
import AppTopBar from '@/components/AppTopBar';
import AppBottomNav from '@/components/AppBottomNav';

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

  // Derive organization name or default
  const orgName = user.user_metadata?.org_name || 'Veridex Workspace';
  const userRole = user.user_metadata?.role || 'Owner';

  return (
    <div className="app-shell-root">
      <AppSidebar orgName={orgName} userEmail={user.email} />

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
    </div>
  );
}
