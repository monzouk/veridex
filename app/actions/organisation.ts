'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface OrganisationResult {
  success: boolean;
  error?: string;
  organisation?: {
    id: string;
    name: string;
    slug: string;
    role: string;
  };
}

export async function getUserOrganisation() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: membership, error } = await supabase
      .from('memberships')
      .select(`
        role,
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
      id: org.id,
      name: org.name,
      slug: org.slug,
      role: membership.role,
    };
  } catch {
    return null;
  }
}

/**
 * Checks if the current user has only deactivated memberships.
 * Returns the name of the deactivated organisation, or null if active or never joined.
 */
export async function getDeactivatedOrgStatus(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_deactivated_org_name');
    if (error || !data) {
      return null;
    }
    return data as string;
  } catch {
    return null;
  }
}

export async function createOrganisationAction(
  name: string
): Promise<OrganisationResult> {
  const trimmed = (name || '').trim();
  if (trimmed.length < 2) {
    return { success: false, error: 'Organisation name must be at least 2 characters.' };
  }
  if (trimmed.length > 80) {
    return { success: false, error: 'Organisation name cannot exceed 80 characters.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required.' };
  }

  const cleanName = name.trim();
  const baseSlug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

  // Call the atomic postgres function create_organisation_with_owner
  const { data, error } = await supabase.rpc('create_organisation_with_owner', {
    org_name: cleanName,
    org_slug: slug,
  });

  if (error) {
    // Fallback to direct table insertion respecting RLS policies
    const { data: orgData, error: orgError } = await supabase
      .from('organisations')
      .insert({ name: cleanName, slug })
      .select('id, name, slug')
      .single();

    if (orgError) {
      return { success: false, error: orgError.message };
    }

    const { error: memberError } = await supabase.from('memberships').insert({
      organisation_id: orgData.id,
      user_id: user.id,
      role: 'owner',
    });

    if (memberError) {
      return { success: false, error: memberError.message };
    }

    revalidatePath('/app');
    return {
      success: true,
      organisation: {
        id: orgData.id,
        name: orgData.name,
        slug: orgData.slug,
        role: 'owner',
      },
    };
  }

  revalidatePath('/app');
  return {
    success: true,
    organisation: data,
  };
}
