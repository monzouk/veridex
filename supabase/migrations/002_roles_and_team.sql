-- =============================================================================
-- VERIDEX ENTERPRISE COMPLIANCE INTELLIGENCE
-- Migration 002: Roles Hierarchy, Team Management, Invites, and Audit Log
-- File: supabase/migrations/002_roles_and_team.sql
-- All changes wrapped in a single transaction (BEGIN ... COMMIT)
-- =============================================================================

BEGIN;

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =============================================================================
-- 1. UPDATE MEMBERSHIPS TABLE
-- =============================================================================

-- 1.1 Expand check constraint on role to include all 7 roles:
-- owner, admin, control_owner, cms_executive, executive, auditor, viewer
-- (Superset of previous roles: owner, admin, control_owner, auditor, viewer)
alter table public.memberships drop constraint if exists memberships_role_check;
alter table public.memberships add constraint memberships_role_check
  check (role in ('owner', 'admin', 'control_owner', 'cms_executive', 'executive', 'auditor', 'viewer'));

-- 1.2 Soft deactivation / reactivation support (preserves audit history)
alter table public.memberships add column if not exists is_active boolean default true not null;

-- 1.3 Manager reporting line: CMS Executive and Executive each report to a Control Owner
alter table public.memberships add column if not exists reports_to uuid references public.memberships(id) on delete set null;

-- 1.4 Indexes for performance
create index if not exists idx_memberships_reports_to on public.memberships(reports_to);
create index if not exists idx_memberships_active on public.memberships(organisation_id, is_active);

-- =============================================================================
-- 2. CORE SECURITY-DEFINER TENANT & ROLE FUNCTIONS (ACTIVE MEMBERS ONLY)
-- Placed immediately after is_active column is added.
-- All existing and new policies that call these functions automatically exclude
-- deactivated members.
-- =============================================================================

-- Return list of organisation IDs the current authenticated user actively belongs to
create or replace function public.get_user_org_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select organisation_id from public.memberships
  where user_id = auth.uid() and is_active = true;
$$;

-- Check if user is an active member of an organisation
create or replace function public.is_org_member(org_id uuid)
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
      and is_active = true
  );
$$;

-- Check if user has one of the specified roles and is active in an organisation
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
      and is_active = true
      and role = any(allowed_roles)
  );
$$;

-- Get user's active role in an organisation
create or replace function public.get_user_org_role(org_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.memberships
  where organisation_id = org_id
    and user_id = auth.uid()
    and is_active = true
  limit 1;
$$;

-- =============================================================================
-- 3. TASKS TABLE (Workflow, Assignment and Evidence Submission)
-- Must precede Evidence task_id foreign key reference.
-- =============================================================================

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete cascade not null,
  control_id uuid references public.controls(id) on delete set null,
  title text not null,
  description text,
  assigned_by uuid references auth.users(id) on delete set null not null,
  assignee_id uuid references auth.users(id) on delete cascade not null,
  due_date date,
  status text not null default 'assigned' check (status in ('assigned', 'in_progress', 'review', 'completed', 'cancelled')),
  evidence_id uuid references public.evidence(id) on delete set null,
  is_sample boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_tasks_org_status on public.tasks(organisation_id, status);
create index if not exists idx_tasks_assignee on public.tasks(assignee_id, status);
create index if not exists idx_tasks_assigned_by on public.tasks(assigned_by, status);

-- =============================================================================
-- 4. SAMPLE DATA FLAGS & EVIDENCE TASK LINKING
-- =============================================================================

-- Flag seeded demo rows as sample data so only they are removed
alter table public.controls add column if not exists is_sample boolean default false not null;
alter table public.evidence add column if not exists is_sample boolean default false not null;
alter table public.control_evidence add column if not exists is_sample boolean default false not null;

-- Link evidence to specific assigned task for low-privilege uploads
alter table public.evidence add column if not exists task_id uuid references public.tasks(id) on delete set null;

create index if not exists idx_controls_is_sample on public.controls(organisation_id, is_sample);
create index if not exists idx_evidence_is_sample on public.evidence(organisation_id, is_sample);
create index if not exists idx_control_evidence_is_sample on public.control_evidence(organisation_id, is_sample);
create index if not exists idx_evidence_task_id on public.evidence(task_id);

-- =============================================================================
-- 5. INVITES TABLE (One-Time Token Hash, 7-Day Expiry)
-- =============================================================================

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete cascade not null,
  role text not null check (role in ('owner', 'admin', 'control_owner', 'cms_executive', 'executive', 'auditor', 'viewer')),
  reports_to uuid references public.memberships(id) on delete set null,
  email text,
  token_hash text not null unique,
  invited_by uuid references auth.users(id) on delete cascade not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_invites_org_status on public.invites(organisation_id, status);
create index if not exists idx_invites_token_hash on public.invites(token_hash);
create index if not exists idx_invites_email on public.invites(lower(email));

-- =============================================================================
-- 6. AUDIT LOG TABLE (Append-Only)
-- =============================================================================

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organisations(id) on delete cascade not null,
  actor_id uuid references auth.users(id) on delete set null default auth.uid(),
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_audit_log_org_created on public.audit_log(organisation_id, created_at desc);

-- =============================================================================
-- 7. HELPER FUNCTIONS & TOKEN HASHING
-- =============================================================================

-- Cryptographic helper to hash raw token with SHA-256
create or replace function public.veridex_hash_token(p_token text)
returns text
language plpgsql
immutable
as $$
begin
  begin
    return encode(extensions.digest(p_token::bytea, 'sha256'), 'hex');
  exception when undefined_function then
    return encode(public.digest(p_token::bytea, 'sha256'), 'hex');
  end;
end;
$$;

-- Security-definer invitation acceptance function with search_path = ''
create or replace function public.accept_invite(token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_user_email text;
  v_token_hash text;
  v_invite record;
  v_org_name text;
  v_new_membership_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required to accept an invitation.';
  end if;

  -- Fetch user email from auth.users
  select email into v_user_email
  from auth.users
  where id = v_user_id;

  -- Hash incoming token using SHA-256
  v_token_hash := public.veridex_hash_token(token);

  -- Retrieve invite row
  select * into v_invite
  from public.invites
  where token_hash = v_token_hash
  for update;

  if not found then
    raise exception 'Invalid invitation token.';
  end if;

  -- Verify invite is pending and not already used
  if v_invite.status = 'accepted' then
    raise exception 'This invitation has already been accepted.';
  end if;

  if v_invite.status = 'revoked' then
    raise exception 'This invitation has been revoked.';
  end if;

  if v_invite.status = 'expired' or now() > v_invite.expires_at then
    update public.invites
    set status = 'expired', updated_at = now()
    where id = v_invite.id;
    raise exception 'This invitation has expired.';
  end if;

  -- Email restriction verification (if set on the invitation)
  if v_invite.email is not null and length(trim(v_invite.email)) > 0 then
    if lower(trim(v_invite.email)) != lower(trim(coalesce(v_user_email, ''))) then
      raise exception 'This invitation was issued to %, but you are signed in as %.', v_invite.email, coalesce(v_user_email, 'unknown');
    end if;
  end if;

  -- Upsert membership row
  insert into public.memberships (organisation_id, user_id, role, reports_to, is_active)
  values (v_invite.organisation_id, v_user_id, v_invite.role, v_invite.reports_to, true)
  on conflict (organisation_id, user_id) do update
  set role = excluded.role,
      reports_to = excluded.reports_to,
      is_active = true
  returning id into v_new_membership_id;

  -- Update invite state to accepted
  update public.invites
  set status = 'accepted',
      accepted_by = v_user_id,
      accepted_at = now(),
      updated_at = now()
  where id = v_invite.id;

  -- Log action to append-only audit log
  insert into public.audit_log (
    organisation_id,
    actor_id,
    action,
    target_type,
    target_id,
    details
  ) values (
    v_invite.organisation_id,
    v_user_id,
    'accept_invite',
    'membership',
    v_new_membership_id::text,
    jsonb_build_object(
      'invite_id', v_invite.id,
      'role', v_invite.role,
      'reports_to', v_invite.reports_to,
      'accepted_by', v_user_id,
      'email', v_user_email
    )
  );

  select name into v_org_name
  from public.organisations
  where id = v_invite.organisation_id;

  return jsonb_build_object(
    'success', true,
    'organisation_id', v_invite.organisation_id,
    'organisation_name', v_org_name,
    'role', v_invite.role
  );
end;
$$;

-- Security-definer sample data removal function
create or replace function public.remove_sample_data(p_org_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_actor_role text;
  v_deleted_tasks int := 0;
  v_deleted_links int := 0;
  v_deleted_evidence int := 0;
  v_deleted_controls int := 0;
begin
  v_actor_id := auth.uid();
  if v_actor_id is null then
    raise exception 'Authentication required.';
  end if;

  select role into v_actor_role
  from public.memberships
  where organisation_id = p_org_id
    and user_id = v_actor_id
    and is_active = true
  limit 1;

  if v_actor_role not in ('owner', 'admin') then
    raise exception 'Only Owners and Admins can remove sample data.';
  end if;

  delete from public.tasks
  where organisation_id = p_org_id and is_sample = true;
  get diagnostics v_deleted_tasks = row_count;

  delete from public.control_evidence
  where organisation_id = p_org_id and is_sample = true;
  get diagnostics v_deleted_links = row_count;

  delete from public.evidence
  where organisation_id = p_org_id and is_sample = true;
  get diagnostics v_deleted_evidence = row_count;

  delete from public.controls
  where organisation_id = p_org_id and is_sample = true;
  get diagnostics v_deleted_controls = row_count;

  insert into public.audit_log (
    organisation_id,
    actor_id,
    action,
    target_type,
    target_id,
    details
  ) values (
    p_org_id,
    v_actor_id,
    'remove_sample_data',
    'organisation',
    p_org_id::text,
    jsonb_build_object(
      'controls_removed', v_deleted_controls,
      'evidence_removed', v_deleted_evidence,
      'links_removed', v_deleted_links,
      'tasks_removed', v_deleted_tasks
    )
  );

  return jsonb_build_object(
    'success', true,
    'controls_removed', v_deleted_controls,
    'evidence_removed', v_deleted_evidence,
    'links_removed', v_deleted_links,
    'tasks_removed', v_deleted_tasks
  );
end;
$$;

-- =============================================================================
-- 8. TRIGGERS: DATABASE-LEVEL INVARIANTS & SECURITY
-- =============================================================================

-- Invariant 1: An organisation must ALWAYS keep at least one active Owner.
create or replace function public.check_last_owner_constraint()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_count int;
begin
  if (TG_OP = 'DELETE' and OLD.role = 'owner' and OLD.is_active = true) or
     (TG_OP = 'UPDATE' and OLD.role = 'owner' and OLD.is_active = true and (NEW.role != 'owner' or NEW.is_active = false)) then
    select count(*) into v_owner_count
    from public.memberships
    where organisation_id = OLD.organisation_id
      and role = 'owner'
      and is_active = true
      and id != OLD.id;

    if v_owner_count < 1 then
      raise exception 'The organisation must always keep at least one active Owner. Cannot remove, demote, or deactivate the last Owner.';
    end if;
  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  else
    return NEW;
  end if;
end;
$$;

drop trigger if exists trg_prevent_last_owner_removal on public.memberships;
create trigger trg_prevent_last_owner_removal
  before update or delete on public.memberships
  for each row
  execute function public.check_last_owner_constraint();

-- Invariant 2: Membership mutation restrictions:
-- - Admins cannot create or change Owners or Admins.
-- - Only Owners can grant Admin or Owner roles.
-- - Control Owners cannot invite or modify memberships.
-- - CMS Executives and Executives MUST report to an active Control Owner in the same organisation.
-- - Allows initial onboarding self-insert ONLY on a brand-new organisation with 0 existing members.
create or replace function public.validate_membership_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_actor_role text;
  v_reports_to_role text;
  v_reports_to_org uuid;
begin
  v_actor_id := auth.uid();

  -- Allow system execution or background services without active auth context
  if v_actor_id is null then
    return NEW;
  end if;

  -- Allow initial onboarding self-insert: first user creating a brand-new organisation (0 existing members)
  if TG_OP = 'INSERT' and NEW.user_id = v_actor_id and NEW.role = 'owner' then
    if not exists (
      select 1 from public.memberships
      where organisation_id = NEW.organisation_id
    ) then
      return NEW;
    end if;
  end if;

  -- Look up actor role in this organisation
  select role into v_actor_role
  from public.memberships
  where organisation_id = NEW.organisation_id
    and user_id = v_actor_id
    and is_active = true
  limit 1;

  if v_actor_role is null then
    raise exception 'Unauthorized: actor is not an active member of this organisation.';
  end if;

  if v_actor_role not in ('owner', 'admin') then
    raise exception 'Unauthorized: % members cannot create or modify memberships.', v_actor_role;
  end if;

  if v_actor_role = 'admin' then
    if TG_OP = 'INSERT' then
      if NEW.role in ('owner', 'admin') then
        raise exception 'Admins cannot create Owners or Admins.';
      end if;
    elsif TG_OP = 'UPDATE' then
      if OLD.role in ('owner', 'admin') then
        raise exception 'Admins cannot modify Owners or Admins.';
      end if;
      if NEW.role in ('owner', 'admin') then
        raise exception 'Admins cannot promote members to Owner or Admin.';
      end if;
    end if;
  end if;

  -- Reports-to validation: CMS Executive and Executive must report to an active Control Owner
  if NEW.role in ('cms_executive', 'executive') then
    if NEW.reports_to is null then
      raise exception '% must report to a Control Owner.', NEW.role;
    end if;

    select role, organisation_id into v_reports_to_role, v_reports_to_org
    from public.memberships
    where id = NEW.reports_to and is_active = true;

    if v_reports_to_role is null or v_reports_to_org != NEW.organisation_id or v_reports_to_role != 'control_owner' then
      raise exception 'Invalid reports_to: must report to an active Control Owner in the same organisation.';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_validate_membership_mutation on public.memberships;
create trigger trg_validate_membership_mutation
  before insert or update on public.memberships
  for each row
  execute function public.validate_membership_mutation();

-- Invariant 3: Invite creation restrictions:
-- - Only Owners and Admins can create invitations.
-- - Admins cannot invite Owners or Admins.
-- - Control Owners cannot invite people.
-- - CMS Executive and Executive invitations must specify a valid Control Owner in reports_to.
create or replace function public.validate_invite_creation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_actor_role text;
  v_reports_to_role text;
  v_reports_to_org uuid;
begin
  v_actor_id := auth.uid();
  if v_actor_id is null then
    raise exception 'Authentication required to create invitations.';
  end if;

  select role into v_actor_role
  from public.memberships
  where organisation_id = NEW.organisation_id
    and user_id = v_actor_id
    and is_active = true
  limit 1;

  if v_actor_role is null then
    raise exception 'Actor is not an active member of this organisation.';
  end if;

  if v_actor_role not in ('owner', 'admin') then
    raise exception 'Only Owners and Admins can invite team members. Control Owners and others cannot invite.';
  end if;

  if v_actor_role = 'admin' and NEW.role in ('owner', 'admin') then
    raise exception 'Admins cannot invite Owners or Admins.';
  end if;

  if NEW.role in ('cms_executive', 'executive') then
    if NEW.reports_to is null then
      raise exception 'Invitations for % must specify a Control Owner in reports_to.', NEW.role;
    end if;

    select role, organisation_id into v_reports_to_role, v_reports_to_org
    from public.memberships
    where id = NEW.reports_to and is_active = true;

    if v_reports_to_role is null or v_reports_to_org != NEW.organisation_id or v_reports_to_role != 'control_owner' then
      raise exception 'Invalid reports_to: must reference an active Control Owner in the same organisation.';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_validate_invite_creation on public.invites;
create trigger trg_validate_invite_creation
  before insert on public.invites
  for each row
  execute function public.validate_invite_creation();

-- Invariant 4: Audit log integrity enforcement
create or replace function public.enforce_audit_log_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Enforce actor is the authenticated user if auth context exists
  if auth.uid() is not null then
    NEW.actor_id := auth.uid();
  end if;

  -- Enforce actor is an active member of target organisation
  if not public.is_org_member(NEW.organisation_id) then
    raise exception 'Cannot create audit log entry for an organisation you are not a member of.';
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_enforce_audit_log_integrity on public.audit_log;
create trigger trg_enforce_audit_log_integrity
  before insert on public.audit_log
  for each row
  execute function public.enforce_audit_log_integrity();

-- =============================================================================
-- 9. ROW-LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- 9.1 Invites Policies
alter table public.invites enable row level security;

drop policy if exists "Owners and admins can view invites in their organisation" on public.invites;
create policy "Owners and admins can view invites in their organisation"
on public.invites for select
to authenticated
using (
  public.has_org_role(organisation_id, array['owner', 'admin'])
);

drop policy if exists "Owners and admins can insert invites" on public.invites;
create policy "Owners and admins can insert invites"
on public.invites for insert
to authenticated
with check (
  public.has_org_role(organisation_id, array['owner', 'admin'])
  and (
    public.has_org_role(organisation_id, array['owner'])
    or (public.has_org_role(organisation_id, array['admin']) and role not in ('owner', 'admin'))
  )
);

drop policy if exists "Owners and admins can update invites" on public.invites;
create policy "Owners and admins can update invites"
on public.invites for update
to authenticated
using (
  public.has_org_role(organisation_id, array['owner', 'admin'])
)
with check (
  public.has_org_role(organisation_id, array['owner', 'admin'])
);

drop policy if exists "Owners and admins can delete invites" on public.invites;
create policy "Owners and admins can delete invites"
on public.invites for delete
to authenticated
using (
  public.has_org_role(organisation_id, array['owner', 'admin'])
);

-- 9.2 Audit Log Policies (Append-Only)
alter table public.audit_log enable row level security;

drop policy if exists "Members can view audit logs in their organisation" on public.audit_log;
create policy "Members can view audit logs in their organisation"
on public.audit_log for select
to authenticated
using (
  organisation_id in (select public.get_user_org_ids())
);

drop policy if exists "Members can insert audit logs in their organisation" on public.audit_log;
create policy "Members can insert audit logs in their organisation"
on public.audit_log for insert
to authenticated
with check (
  organisation_id in (select public.get_user_org_ids())
  and (actor_id = auth.uid() or actor_id is null)
);

-- Note: No UPDATE or DELETE policies on public.audit_log — strictly append-only ledger.

-- 9.3 Tasks Policies
alter table public.tasks enable row level security;

drop policy if exists "Members can view tasks in their organisation" on public.tasks;
create policy "Members can view tasks in their organisation"
on public.tasks for select
to authenticated
using (
  organisation_id in (select public.get_user_org_ids())
);

drop policy if exists "Managers and control owners can insert tasks" on public.tasks;
create policy "Managers and control owners can insert tasks"
on public.tasks for insert
to authenticated
with check (
  public.has_org_role(organisation_id, array['owner', 'admin', 'control_owner'])
);

drop policy if exists "Assignees and managers can update tasks" on public.tasks;
create policy "Assignees and managers can update tasks"
on public.tasks for update
to authenticated
using (
  organisation_id in (select public.get_user_org_ids())
  and (
    assignee_id = auth.uid()
    or assigned_by = auth.uid()
    or public.has_org_role(organisation_id, array['owner', 'admin'])
  )
)
with check (
  organisation_id in (select public.get_user_org_ids())
);

drop policy if exists "Managers can delete tasks" on public.tasks;
create policy "Managers can delete tasks"
on public.tasks for delete
to authenticated
using (
  public.has_org_role(organisation_id, array['owner', 'admin'])
  or assigned_by = auth.uid()
);

-- 9.4 Tightened Evidence & Storage Upload Policies
-- Drops both old schema.sql policy names and any previous migration policy names:
drop policy if exists "Control owners and admins can upload evidence" on public.evidence;
drop policy if exists "Authorized members can upload evidence" on public.evidence;

-- Evidence INSERT:
-- - Owners, Admins, and Control Owners can upload evidence anytime in their organisation.
-- - CMS Executives and Executives can upload evidence ONLY when it is tied to an active task assigned to them.
-- - Auditors and Viewers remain strictly read-only.
create policy "Authorized members can upload evidence"
on public.evidence for insert
to authenticated
with check (
  (
    public.has_org_role(organisation_id, array['owner', 'admin', 'control_owner'])
  )
  or
  (
    public.has_org_role(organisation_id, array['cms_executive', 'executive'])
    and task_id is not null
    and exists (
      select 1 from public.tasks
      where id = task_id
        and organisation_id = evidence.organisation_id
        and assignee_id = auth.uid()
        and status in ('assigned', 'in_progress', 'review')
    )
  )
);

-- 9.5 Tightened Control-Evidence Linking Policy:
-- Strictly limited to owner, admin, and control_owner.
-- CMS Executives and Executives CANNOT link evidence to controls.
drop policy if exists "Control owners and admins can link evidence" on public.control_evidence;
drop policy if exists "Authorized members can link evidence" on public.control_evidence;

create policy "Control owners and admins can link evidence"
on public.control_evidence for insert
to authenticated
with check (
  public.has_org_role(organisation_id, array['owner', 'admin', 'control_owner'])
);

-- 9.6 Storage Policy: Evidence Bucket Tenant Insert Policy
-- Drops existing storage insert policy
drop policy if exists "Evidence bucket tenant insert policy" on storage.objects;

-- Allows upload only into the user's organisation folder ({organisation_id}/{filename}):
-- - Owners, Admins, and Control Owners: upload allowed in their organisation folder.
-- - CMS Executives and Executives: upload allowed in their organisation folder ONLY if they have an active task assigned to them in that organisation.
-- - Nobody can EVER upload into another organisation's folder.
create policy "Evidence bucket tenant insert policy"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'evidence'
  and (
    public.has_org_role((storage.foldername(name))[1]::uuid, array['owner', 'admin', 'control_owner'])
    or
    (
      public.has_org_role((storage.foldername(name))[1]::uuid, array['cms_executive', 'executive'])
      and exists (
        select 1 from public.tasks
        where organisation_id = (storage.foldername(name))[1]::uuid
          and assignee_id = auth.uid()
          and status in ('assigned', 'in_progress', 'review')
      )
    )
  )
);

COMMIT;
