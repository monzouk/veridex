-- =============================================================================
-- VERIDEX ENTERPRISE COMPLIANCE INTELLIGENCE
-- Complete Database Schema, Row-Level Security, and Storage Setup
-- File: supabase/schema.sql
-- =============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- 1.1 Organisations (Tenants)
create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 1.2 Memberships (User to Organisation binding with 5 explicit roles)
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('owner', 'admin', 'control_owner', 'auditor', 'viewer')),
  created_at timestamptz default now() not null,
  constraint unique_user_org unique (organisation_id, user_id)
);

-- 1.3 Controls (Compliance requirements and operational controls)
create table if not exists public.controls (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete cascade not null,
  code text not null,
  title text not null,
  description text,
  category text not null,
  status text not null default 'missing' check (status in ('verified', 'aging', 'stale', 'missing', 'contradicted')),
  criticality text not null default 'medium' check (criticality in ('low', 'medium', 'high')),
  effort_hours numeric(6, 2) default 4.0 not null,
  test_rules jsonb default '{
    "required_evidence_types": [],
    "max_age_days": 90,
    "min_items": 1
  }'::jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint unique_org_control_code unique (organisation_id, code)
);

-- 1.4 Evidence (Tamper-evident, cryptographically hashed evidence vault)
create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete cascade not null,
  title text not null,
  description text,
  file_path text not null,
  file_size bigint not null default 0,
  mime_type text not null default 'application/octet-stream',
  sha256_hash text not null,
  previous_evidence_id uuid references public.evidence(id) on delete restrict,
  version integer default 1 not null,
  source text default 'manual_upload' not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now() not null
);

-- 1.5 Control-Evidence Junction (Many-to-many relationship)
create table if not exists public.control_evidence (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete cascade not null,
  control_id uuid references public.controls(id) on delete cascade not null,
  evidence_id uuid references public.evidence(id) on delete cascade not null,
  linked_by uuid references auth.users(id),
  linked_at timestamptz default now() not null,
  constraint unique_control_evidence unique (control_id, evidence_id)
);

-- =============================================================================
-- 2. INDEXES (Performance and Tenant Isolation)
-- =============================================================================

create index if not exists idx_memberships_user_org on public.memberships(user_id, organisation_id);
create index if not exists idx_controls_org_status on public.controls(organisation_id, status);
create index if not exists idx_controls_org_code on public.controls(organisation_id, code);
create index if not exists idx_evidence_org_hash on public.evidence(organisation_id, sha256_hash);
create index if not exists idx_evidence_prev_id on public.evidence(previous_evidence_id);
create index if not exists idx_control_evidence_org on public.control_evidence(organisation_id, control_id, evidence_id);

-- =============================================================================
-- 3. HELPER FUNCTIONS (Security Definer to prevent RLS recursion)
-- =============================================================================

-- Return list of organisation IDs the current authenticated user belongs to
create or replace function public.get_user_org_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select organisation_id from public.memberships where user_id = auth.uid();
$$;

-- Check if user is a member of an organisation
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where organisation_id = org_id and user_id = auth.uid()
  );
$$;

-- Check if user has one of the specified roles in an organisation
create or replace function public.has_org_role(org_id uuid, allowed_roles text[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where organisation_id = org_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

-- Get user's role in an organisation
create or replace function public.get_user_org_role(org_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.memberships
  where organisation_id = org_id and user_id = auth.uid()
  limit 1;
$$;

-- Atomic First-Run Onboarding Function (Executed as authenticated user)
create or replace function public.create_organisation_with_owner(
  org_name text,
  org_slug text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_org_id uuid;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required to create an organisation.';
  end if;

  -- Create organisation
  insert into public.organisations (name, slug)
  values (org_name, org_slug)
  returning id into new_org_id;

  -- Assign user as Owner
  insert into public.memberships (organisation_id, user_id, role)
  values (new_org_id, v_user_id, 'owner');

  return jsonb_build_object(
    'id', new_org_id,
    'name', org_name,
    'slug', org_slug,
    'role', 'owner'
  );
end;
$$;

-- =============================================================================
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
alter table public.organisations enable row level security;
alter table public.memberships enable row level security;
alter table public.controls enable row level security;
alter table public.evidence enable row level security;
alter table public.control_evidence enable row level security;

-- 4.1 Organisations Policies
drop policy if exists "Members can view their own organisation" on public.organisations;
create policy "Members can view their own organisation"
on public.organisations for select
to authenticated
using (
  id in (select public.get_user_org_ids())
);

drop policy if exists "Authenticated users can insert an organisation" on public.organisations;
create policy "Authenticated users can insert an organisation"
on public.organisations for insert
to authenticated
with check (
  auth.uid() is not null
);

drop policy if exists "Owners and admins can update their organisation" on public.organisations;
create policy "Owners and admins can update their organisation"
on public.organisations for update
to authenticated
using (
  public.has_org_role(id, array['owner', 'admin'])
)
with check (
  public.has_org_role(id, array['owner', 'admin'])
);

drop policy if exists "Only owners can delete their organisation" on public.organisations;
create policy "Only owners can delete their organisation"
on public.organisations for delete
to authenticated
using (
  public.has_org_role(id, array['owner'])
);

-- 4.2 Memberships Policies
drop policy if exists "Members can view members of their organisation" on public.memberships;
create policy "Members can view members of their organisation"
on public.memberships for select
to authenticated
using (
  organisation_id in (select public.get_user_org_ids())
);

drop policy if exists "Users or owners can add memberships" on public.memberships;
create policy "Users or owners can add memberships"
on public.memberships for insert
to authenticated
with check (
  -- Self-assignment during initial onboarding OR invitation by owner/admin
  (user_id = auth.uid() and role = 'owner')
  or public.has_org_role(organisation_id, array['owner', 'admin'])
);

drop policy if exists "Owners and admins can update memberships" on public.memberships;
create policy "Owners and admins can update memberships"
on public.memberships for update
to authenticated
using (
  public.has_org_role(organisation_id, array['owner', 'admin'])
)
with check (
  public.has_org_role(organisation_id, array['owner', 'admin'])
);

drop policy if exists "Owners can remove members or users can leave" on public.memberships;
create policy "Owners can remove members or users can leave"
on public.memberships for delete
to authenticated
using (
  public.has_org_role(organisation_id, array['owner', 'admin'])
  or (user_id = auth.uid() and role != 'owner')
);

-- 4.3 Controls Policies
drop policy if exists "Members can view controls in their organisation" on public.controls;
create policy "Members can view controls in their organisation"
on public.controls for select
to authenticated
using (
  organisation_id in (select public.get_user_org_ids())
);

drop policy if exists "Control owners and admins can create controls" on public.controls;
create policy "Control owners and admins can create controls"
on public.controls for insert
to authenticated
with check (
  public.has_org_role(organisation_id, array['owner', 'admin', 'control_owner'])
);

drop policy if exists "Control owners and admins can update controls" on public.controls;
create policy "Control owners and admins can update controls"
on public.controls for update
to authenticated
using (
  public.has_org_role(organisation_id, array['owner', 'admin', 'control_owner'])
)
with check (
  public.has_org_role(organisation_id, array['owner', 'admin', 'control_owner'])
);

drop policy if exists "Admins and owners can delete controls" on public.controls;
create policy "Admins and owners can delete controls"
on public.controls for delete
to authenticated
using (
  public.has_org_role(organisation_id, array['owner', 'admin'])
);

-- 4.4 Evidence Policies (Append-Only Cryptographic Vault)
drop policy if exists "Members can view evidence in their organisation" on public.evidence;
create policy "Members can view evidence in their organisation"
on public.evidence for select
to authenticated
using (
  organisation_id in (select public.get_user_org_ids())
);

drop policy if exists "Control owners and admins can upload evidence" on public.evidence;
create policy "Control owners and admins can upload evidence"
on public.evidence for insert
to authenticated
with check (
  public.has_org_role(organisation_id, array['owner', 'admin', 'control_owner'])
);

-- Note: No UPDATE or DELETE policies are granted on evidence table.
-- Evidence is strictly append-only. New versions link to previous_evidence_id.

-- 4.5 Control-Evidence Junction Policies
drop policy if exists "Members can view control evidence links" on public.control_evidence;
create policy "Members can view control evidence links"
on public.control_evidence for select
to authenticated
using (
  organisation_id in (select public.get_user_org_ids())
);

drop policy if exists "Control owners and admins can link evidence" on public.control_evidence;
create policy "Control owners and admins can link evidence"
on public.control_evidence for insert
to authenticated
with check (
  public.has_org_role(organisation_id, array['owner', 'admin', 'control_owner'])
);

drop policy if exists "Control owners and admins can unlink evidence" on public.control_evidence;
create policy "Control owners and admins can unlink evidence"
on public.control_evidence for delete
to authenticated
using (
  public.has_org_role(organisation_id, array['owner', 'admin', 'control_owner'])
);

-- =============================================================================
-- 5. STORAGE BUCKET & STORAGE POLICIES
-- =============================================================================

-- Create private 'evidence' bucket if it does not exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence',
  'evidence',
  false,
  52428800, -- 50MB file size limit
  null       -- all mime types allowed (pdfs, logs, json, screenshots)
)
on conflict (id) do update set public = false;

-- Storage Policy 1: Members can download evidence files belonging to their organisation
-- Expected object path format: {organisation_id}/{filename}
drop policy if exists "Evidence bucket tenant select policy" on storage.objects;
create policy "Evidence bucket tenant select policy"
on storage.objects for select
to authenticated
using (
  bucket_id = 'evidence'
  and (storage.foldername(name))[1]::uuid in (select public.get_user_org_ids())
);

-- Storage Policy 2: Control owners, admins, and owners can upload evidence to their organisation path
drop policy if exists "Evidence bucket tenant insert policy" on storage.objects;
create policy "Evidence bucket tenant insert policy"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'evidence'
  and public.has_org_role((storage.foldername(name))[1]::uuid, array['owner', 'admin', 'control_owner'])
);

-- Note: Storage UPDATE and DELETE policies are deliberately omitted for the 'evidence' bucket
-- to guarantee tamper-evident, append-only file immutability.
