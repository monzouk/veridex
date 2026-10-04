-- =============================================================================
-- VERIDEX ENTERPRISE COMPLIANCE INTELLIGENCE
-- Migration 002b: Deactivated Membership Status, Invite Immutability & Security Hardening
-- File: supabase/migrations/002b_deactivated_status.sql
-- All changes wrapped in a single transaction (BEGIN ... COMMIT)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Allow authenticated users to view their own membership row (active or deactivated)
-- -----------------------------------------------------------------------------
drop policy if exists "Users can view their own membership" on public.memberships;
create policy "Users can view their own membership"
on public.memberships for select
to authenticated
using (
  user_id = auth.uid()
);

-- -----------------------------------------------------------------------------
-- 2. Security-definer function returning org name for caller's own inactive membership
-- -----------------------------------------------------------------------------
create or replace function public.get_deactivated_org_name()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_name text;
  v_has_active boolean;
begin
  -- If not signed in, return null
  if auth.uid() is null then
    return null;
  end if;

  -- If caller has any active membership, return null
  select exists(
    select 1 from public.memberships
    where user_id = auth.uid() and is_active = true
  ) into v_has_active;

  if v_has_active then
    return null;
  end if;

  select o.name into v_org_name
  from public.memberships m
  join public.organisations o on o.id = m.organisation_id
  where m.user_id = auth.uid()
    and m.is_active = false
  order by m.created_at desc
  limit 1;

  return v_org_name;
end;
$$;

-- Restrict execution permissions
revoke all on function public.get_deactivated_org_name() from public, anon;
grant execute on function public.get_deactivated_org_name() to authenticated;

-- -----------------------------------------------------------------------------
-- 3. Invariant refinement: Allow cascade delete of organisation without last-owner block
-- -----------------------------------------------------------------------------
create or replace function public.check_last_owner_constraint()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_count int;
begin
  -- If the organisation itself is being deleted, allow cascade delete
  if TG_OP = 'DELETE' and not exists (select 1 from public.organisations where id = OLD.organisation_id) then
    return OLD;
  end if;

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

-- -----------------------------------------------------------------------------
-- 4. Invite Immutability & Validation Trigger (BEFORE INSERT OR UPDATE)
-- Rules enforced:
-- - On INSERT: status must be 'pending', expires_at must be <= 7 days ahead and in future
-- - After creation: role, organisation_id, email, reports_to, token_hash, expires_at, invited_by NEVER change
-- - status can only move 'pending' -> 'revoked' by Owner or Admin of that organisation
-- - status can only become 'accepted' inside accept_invite()
-- -----------------------------------------------------------------------------
create or replace function public.validate_invite_mutation()
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

  -- =========================================================================
  -- INSERT RULES
  -- =========================================================================
  if TG_OP = 'INSERT' then
    if v_actor_id is null then
      raise exception 'Authentication required to create invitations.';
    end if;

    -- Enforce status must be 'pending' on creation
    if NEW.status != 'pending' then
      raise exception 'New invitations must have status pending.';
    end if;

    -- Enforce expires_at must be no more than 7 days ahead (with 5-minute clock tolerance)
    if NEW.expires_at > (now() + interval '7 days' + interval '5 minutes') then
      raise exception 'Invitation expiry cannot be more than 7 days in the future.';
    end if;

    if NEW.expires_at <= now() then
      raise exception 'Invitation expiry must be in the future.';
    end if;

    -- Actor must be an active Owner or Admin of the organisation
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

    -- Reports-to validation: CMS Executive and Executive must report to an active Control Owner
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
  end if;

  -- =========================================================================
  -- UPDATE RULES (IMMUTABILITY & STRICT TRANSITIONS)
  -- =========================================================================
  if TG_OP = 'UPDATE' then
    -- Immutable fields: role, organisation_id, email, reports_to, token_hash, expires_at, invited_by
    if NEW.role != OLD.role then
      raise exception 'role on an invitation is immutable and cannot be changed.';
    end if;

    if NEW.organisation_id != OLD.organisation_id then
      raise exception 'organisation_id on an invitation is immutable and cannot be changed.';
    end if;

    if NEW.email is distinct from OLD.email then
      raise exception 'email on an invitation is immutable and cannot be changed.';
    end if;

    if NEW.reports_to is distinct from OLD.reports_to then
      raise exception 'reports_to on an invitation is immutable and cannot be changed.';
    end if;

    if NEW.token_hash != OLD.token_hash then
      raise exception 'token_hash on an invitation is immutable and cannot be changed.';
    end if;

    if NEW.expires_at != OLD.expires_at then
      raise exception 'expires_at on an invitation is immutable and cannot be changed.';
    end if;

    if NEW.invited_by != OLD.invited_by then
      raise exception 'invited_by on an invitation is immutable and cannot be changed.';
    end if;

    -- Status transitions
    -- (a) 'accepted' can ONLY be set inside accept_invite()
    if NEW.status = 'accepted' then
      if current_setting('veridex.accepting_invite', true) != 'true' then
        raise exception 'Invitations can only become accepted inside accept_invite().';
      end if;
      if OLD.status != 'pending' then
        raise exception 'Only pending invitations can be accepted.';
      end if;
      return NEW;
    end if;

    -- (b) 'expired' transition
    if NEW.status = 'expired' then
      if OLD.status != 'pending' then
        raise exception 'Only pending invitations can be marked expired.';
      end if;
      return NEW;
    end if;

    -- (c) 'revoked' transition can ONLY be executed by an active Owner or Admin of that organisation
    if NEW.status = 'revoked' then
      if OLD.status != 'pending' then
        raise exception 'Only pending invitations can be revoked.';
      end if;

      if v_actor_id is null then
        raise exception 'Authentication required to revoke invitations.';
      end if;

      select role into v_actor_role
      from public.memberships
      where organisation_id = OLD.organisation_id
        and user_id = v_actor_id
        and is_active = true
      limit 1;

      if v_actor_role not in ('owner', 'admin') then
        raise exception 'Only Owners and Admins can revoke invitations.';
      end if;

      return NEW;
    end if;

    -- Any other status change is invalid
    if NEW.status != OLD.status then
      raise exception 'Invalid invite status transition from % to %.', OLD.status, NEW.status;
    end if;

    return NEW;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_validate_invite_creation on public.invites;
drop trigger if exists trg_validate_invite_mutation on public.invites;
create trigger trg_validate_invite_mutation
  before insert or update on public.invites
  for each row
  execute function public.validate_invite_mutation();

-- Update RLS update policy on public.invites
drop policy if exists "Owners and admins can update invites" on public.invites;
create policy "Owners and admins can update invites"
on public.invites for update
to authenticated
using (
  public.has_org_role(organisation_id, array['owner', 'admin'])
)
with check (
  public.has_org_role(organisation_id, array['owner', 'admin'])
  and status in ('pending', 'revoked')
);

-- -----------------------------------------------------------------------------
-- 5. Narrow the trigger bypass in validate_membership_mutation()
-- Requires:
-- - NEW.user_id = auth.uid()
-- - An active, pending, unexpired invite for that exact organisation_id, role, and reports_to
-- -----------------------------------------------------------------------------
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

  -- Narrowed invite acceptance flow: ONLY when veridex.accepting_invite = 'true'
  if current_setting('veridex.accepting_invite', true) = 'true' then
    -- Must be the authenticated caller accepting for themselves
    if NEW.user_id != v_actor_id then
      raise exception 'Unauthorized: invite acceptance can only create a membership for the authenticated caller.';
    end if;

    -- Must correspond to an active, pending, unexpired invite matching org, role, and reports_to
    if not exists (
      select 1 from public.invites
      where organisation_id = NEW.organisation_id
        and role = NEW.role
        and reports_to is not distinct from NEW.reports_to
        and status = 'pending'
        and expires_at > now()
    ) then
      raise exception 'Unauthorized: no valid pending invitation found matching this organisation, role, and manager.';
    end if;

    -- Enforce reports_to validation on invite acceptance
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

-- -----------------------------------------------------------------------------
-- 6. Hardened accept_invite():
-- - Refuses if caller already has an ACTIVE membership in that organisation
-- - Captures v_has_membership := found IMMEDIATELY after SELECT
-- - Resets veridex.accepting_invite back to 'false' AFTER invite update and BEFORE audit_log
-- - Raises exception if v_new_membership_id is null after insert/update
-- -----------------------------------------------------------------------------
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
  v_existing_membership record;
  v_has_membership boolean;
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

  -- Check if caller already has a membership in this organisation
  select * into v_existing_membership
  from public.memberships
  where organisation_id = v_invite.organisation_id
    and user_id = v_user_id;

  -- CAPTURE FOUND IMMEDIATELY BEFORE ANY OTHER STATEMENT OR PERFORM
  v_has_membership := found;

  -- Refuse if caller already has an ACTIVE membership in that organisation
  if v_has_membership and v_existing_membership.is_active = true then
    raise exception 'You are already a member; ask an administrator to change your role.';
  end if;

  -- Set transaction-local flag so validate_membership_mutation permits membership insertion/update
  -- and validate_invite_mutation permits status = 'accepted'
  perform set_config('veridex.accepting_invite', 'true', true);

  if v_has_membership then
    -- Reactivate and update role/reports_to for previously deactivated member
    update public.memberships
    set role = v_invite.role,
        reports_to = v_invite.reports_to,
        is_active = true
    where id = v_existing_membership.id
    returning id into v_new_membership_id;
  else
    -- Insert brand new membership
    insert into public.memberships (organisation_id, user_id, role, reports_to, is_active)
    values (v_invite.organisation_id, v_user_id, v_invite.role, v_invite.reports_to, true)
    returning id into v_new_membership_id;
  end if;

  -- Explicitly verify membership was created or reactivated
  if v_new_membership_id is null then
    raise exception 'Failed to create or reactivate membership.';
  end if;

  -- Update invite state to accepted (while veridex.accepting_invite is still 'true')
  update public.invites
  set status = 'accepted',
      accepted_by = v_user_id,
      accepted_at = now(),
      updated_at = now()
  where id = v_invite.id;

  -- Reset transaction flag back to 'false' AFTER invite update and BEFORE audit_log insert
  perform set_config('veridex.accepting_invite', 'false', true);

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
    'role', v_invite.role,
    'membership_id', v_new_membership_id
  );
end;
$$;

COMMIT;
