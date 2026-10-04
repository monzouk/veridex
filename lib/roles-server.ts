// =============================================================================
// VERIDEX SERVER ROLES GUARDS
// File: lib/roles-server.ts
// Adheres strictly to AGENTS.md:
// - Zero emojis, emoticons, or emote characters
// - Server-only authorization guards and active membership resolution
// =============================================================================

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppRole } from './roles';

export interface ActiveMembershipContext {
  user: {
    id: string;
    email: string;
  };
  membership: {
    id: string;
    role: AppRole;
    isActive: boolean;
    reportsTo: string | null;
  };
  organisation: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Server guard: Retrieves current active membership context.
 * If user is not authenticated, returns null.
 * If user has no active organisation, returns null.
 */
export async function getActiveMembershipContext(): Promise<ActiveMembershipContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return null;
  }

  const { data: membership, error } = await supabase
    .from('memberships')
    .select(`
      id,
      role,
      is_active,
      reports_to,
      organisation_id,
      organisations (
        id,
        name,
        slug
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error || !membership || !membership.organisations) {
    return null;
  }

  const org = membership.organisations as unknown as {
    id: string;
    name: string;
    slug: string;
  };

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    membership: {
      id: membership.id,
      role: membership.role as AppRole,
      isActive: membership.is_active,
      reportsTo: membership.reports_to,
    },
    organisation: {
      id: org.id,
      name: org.name,
      slug: org.slug,
    },
  };
}

/**
 * Server guard: Enforces that the caller has one of the allowed roles.
 * Redirects if unauthorized.
 */
export async function requireRole(allowedRoles: AppRole[]): Promise<ActiveMembershipContext> {
  const context = await getActiveMembershipContext();

  if (!context) {
    redirect('/login?redirectTo=/app');
  }

  if (!allowedRoles.includes(context.membership.role)) {
    redirect('/app?error=insufficient_permissions');
  }

  return context;
}
