// =============================================================================
// VERIDEX ROLES, PERMISSIONS, AND MULTI-ROLE TEAM AUTOMATED TEST SUITE
// File: scripts/test-roles-and-team.mjs
// Strictly adheres to AGENTS.md:
// - Zero emojis in logs, console outputs, or error messages
// - Zero service role keys used (only public anon key with real authenticated sessions)
// - All test organisations created by this suite use the prefix "QA-TEST-"
// - All test user accounts created by this suite use domain "@veridex.qa"
// - Cleanup utility runs automatically in DRY-RUN mode by default, listing all rows that would be deleted
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { cleanupQAData } from './cleanup-qa-data.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function logPass(testName, roleContext) {
  console.log(`[PASS] ${testName} (Acting as: ${roleContext})`);
}

function logFail(testName, roleContext, error) {
  console.error(`[FAIL] ${testName} (Acting as: ${roleContext})`);
  if (error) console.error('       Detail:', error.message || error);
  process.exitCode = 1;
}

function loadEnv() {
  const envPath = path.join(rootDir, '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local file not found');
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
  return env;
}

function createAnonClient(supabaseUrl, anonKey) {
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function runTestSuite() {
  console.log('=============================================================================');
  console.log('VERIDEX ROLES, PERMISSIONS, AND MULTI-ROLE TEAM AUTOMATED TEST SUITE');
  console.log('Starting multi-role provisioning and security test matrix...');
  console.log('=============================================================================\n');

  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const commonPassword = env.TEST_PASSWORD || 'Password123!@#Secure';

  const ts = Date.now();
  // All test user accounts strictly use domain @veridex.qa
  const ownerAEmail = `test.owner.a.${ts}@veridex.qa`;
  const adminEmail = `test.admin.${ts}@veridex.qa`;
  const coEmail = `test.co.${ts}@veridex.qa`;
  const cmsExecEmail = `test.cmsexec.${ts}@veridex.qa`;
  const execEmail = `test.exec.${ts}@veridex.qa`;
  const ownerBEmail = `test.owner.b.${ts}@veridex.qa`;

  let ownerAClient = null;
  let ownerBClient = null;
  let orgAId = null;
  let orgBId = null;
  const createdAccounts = [];

  try {
    // ---------------------------------------------------------------------------
    // STEP 0: Provision Multi-Role Test Accounts in Org A & Org B via Public Key
    // ---------------------------------------------------------------------------
    console.log('Step 0: Provisioning multi-role accounts in Org A & Org B via public key...');

    // 0.1 Provision Owner A
    ownerAClient = createAnonClient(supabaseUrl, anonKey);
    const { data: oaAuth, error: oaErr } = await ownerAClient.auth.signUp({
      email: ownerAEmail,
      password: commonPassword,
    });
    if (oaErr || !oaAuth.user) throw new Error(`Owner A sign-up failed: ${oaErr?.message}`);
    const ownerAId = oaAuth.user.id;
    createdAccounts.push({ email: ownerAEmail, id: ownerAId });

    // All test organisations strictly use prefix "QA-TEST-"
    const orgAName = `QA-TEST-Org-A-${ts}`;
    const orgASlug = `qa-test-org-a-${ts}`;
    const { data: orgAData, error: orgAErr } = await ownerAClient.rpc('create_organisation_with_owner', {
      org_name: orgAName,
      org_slug: orgASlug,
    });
    if (orgAErr) throw new Error(`Org A creation failed: ${orgAErr.message}`);
    orgAId = orgAData.id;

    const { data: ownerAMems, error: oamErr } = await ownerAClient
      .from('memberships')
      .select('id, organisation_id, role')
      .eq('user_id', ownerAId)
      .eq('organisation_id', orgAId)
      .single();
    if (oamErr) throw new Error(`Failed to fetch Owner A membership: ${oamErr.message}`);

    const ownerAMembershipId = ownerAMems.id;
    console.log(`- Owner A provisioned: ${ownerAEmail} in Org A (${orgAName}, ID: ${orgAId})`);

    // Helper to invite and accept an invite for a new user
    async function provisionMember(role, email, reportsToMembershipId = null) {
      const newClient = createAnonClient(supabaseUrl, anonKey);
      const { data: suData, error: suErr } = await newClient.auth.signUp({
        email,
        password: commonPassword,
      });
      if (suErr || !suData.user) throw new Error(`Sign up failed for ${email}: ${suErr?.message}`);
      createdAccounts.push({ email, id: suData.user.id });

      const rawToken = `tok_${role}_${ts}_${Math.random().toString(36).substring(2, 8)}`;
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const { error: invErr } = await ownerAClient.from('invites').insert({
        organisation_id: orgAId,
        role,
        reports_to: reportsToMembershipId,
        email,
        token_hash: tokenHash,
        invited_by: ownerAId,
      });
      if (invErr) throw new Error(`Owner A invite creation failed for ${role}: ${invErr.message}`);

      const { data: accData, error: accErr } = await newClient.rpc('accept_invite', { token: rawToken });
      if (accErr || !accData?.success) throw new Error(`Accept invite failed for ${email}: ${accErr?.message}`);

      const { data: memData, error: memErr } = await newClient
        .from('memberships')
        .select('id, role')
        .eq('user_id', suData.user.id)
        .eq('organisation_id', orgAId)
        .single();
      if (memErr) throw new Error(`Failed to fetch membership for ${email}: ${memErr.message}`);

      return { client: newClient, userId: suData.user.id, membershipId: memData.id, email };
    }

    // 0.2 Provision Admin A
    const adminA = await provisionMember('admin', adminEmail);
    console.log(`- Admin A provisioned: ${adminA.email}`);

    // 0.3 Provision Control Owner A
    const coA = await provisionMember('control_owner', coEmail);
    console.log(`- Control Owner A provisioned: ${coA.email}`);

    // 0.4 Provision CMS Executive A (reporting to Control Owner A)
    const cmsExecA = await provisionMember('cms_executive', cmsExecEmail, coA.membershipId);
    console.log(`- CMS Executive A provisioned: ${cmsExecA.email} (reports to CO: ${coA.membershipId})`);

    // 0.5 Provision Executive A (reporting to Control Owner A)
    const execA = await provisionMember('executive', execEmail, coA.membershipId);
    console.log(`- Executive A provisioned: ${execA.email} (reports to CO: ${coA.membershipId})`);

    // 0.6 Provision Owner B in a separate Organisation B with mandatory "QA-TEST-" prefix
    ownerBClient = createAnonClient(supabaseUrl, anonKey);
    const { data: obData, error: obErr } = await ownerBClient.auth.signUp({
      email: ownerBEmail,
      password: commonPassword,
    });
    if (obErr || !obData.user) throw new Error(`Sign up failed for Owner B: ${obErr?.message}`);
    const ownerBId = obData.user.id;
    createdAccounts.push({ email: ownerBEmail, id: ownerBId });

    const orgBName = `QA-TEST-Org-B-${ts}`;
    const orgBSlug = `qa-test-org-b-${ts}`;
    const { data: orgBData, error: orgBErr } = await ownerBClient.rpc('create_organisation_with_owner', {
      org_name: orgBName,
      org_slug: orgBSlug,
    });
    if (orgBErr) throw new Error(`Organisation B creation failed: ${orgBErr.message}`);
    orgBId = orgBData.id;
    console.log(`- Owner B provisioned: ${ownerBEmail} in Org B (${orgBName}, ID: ${orgBId})\n`);

    // ===========================================================================
    // TEST SUITE EXECUTION
    // ===========================================================================

    // ---------------------------------------------------------------------------
    // Test 1: Admin cannot create an Admin or Owner invite
    // Acting Role: Admin A
    // ---------------------------------------------------------------------------
    try {
      const rawTokenOwner = 'admin_attempt_owner_' + ts;
      const tokenHashOwner = crypto.createHash('sha256').update(rawTokenOwner).digest('hex');

      const { error: inviteOwnerErr } = await adminA.client.from('invites').insert({
        organisation_id: orgAId,
        role: 'owner',
        token_hash: tokenHashOwner,
        invited_by: adminA.userId,
      });

      const rawTokenAdmin = 'admin_attempt_admin_' + ts;
      const tokenHashAdmin = crypto.createHash('sha256').update(rawTokenAdmin).digest('hex');

      const { error: inviteAdminErr } = await adminA.client.from('invites').insert({
        organisation_id: orgAId,
        role: 'admin',
        token_hash: tokenHashAdmin,
        invited_by: adminA.userId,
      });

      if (
        inviteOwnerErr &&
        inviteOwnerErr.message.includes('Admins cannot invite Owners or Admins') &&
        inviteAdminErr &&
        inviteAdminErr.message.includes('Admins cannot invite Owners or Admins')
      ) {
        logPass('Test 1: Admin cannot create an Admin or Owner invite (Trigger blocks it)', 'Admin A');
      } else {
        throw new Error(`Admin was unexpectedly able to invite Owner or Admin! Errs: ${inviteOwnerErr?.message} / ${inviteAdminErr?.message}`);
      }
    } catch (err) {
      logFail('Test 1: Admin cannot create an Admin or Owner invite', 'Admin A', err);
    }

    // ---------------------------------------------------------------------------
    // Test 2: Control Owner cannot invite
    // Acting Role: Control Owner A
    // ---------------------------------------------------------------------------
    try {
      const rawToken = 'co_attempt_invite_' + ts;
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const { error: coInviteErr } = await coA.client.from('invites').insert({
        organisation_id: orgAId,
        role: 'viewer',
        token_hash: tokenHash,
        invited_by: coA.userId,
      });

      if (coInviteErr && coInviteErr.message.includes('Control Owners and others cannot invite')) {
        logPass('Test 2: Control Owner cannot invite (Trigger blocks non-admin/owners)', 'Control Owner A');
      } else {
        throw new Error(`Control Owner was able to create an invite! Result: ${coInviteErr?.message || 'Success'}`);
      }
    } catch (err) {
      logFail('Test 2: Control Owner cannot invite', 'Control Owner A', err);
    }

    // ---------------------------------------------------------------------------
    // Test 3: Invite for CMS Executive and Executive requires valid Control Owner in reports_to
    // Acting Role: Admin A
    // ---------------------------------------------------------------------------
    try {
      const rawToken = 'cms_exec_no_co_' + ts;
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const { error: noCoErr } = await adminA.client.from('invites').insert({
        organisation_id: orgAId,
        role: 'cms_executive',
        reports_to: null,
        token_hash: tokenHash,
        invited_by: adminA.userId,
      });

      const rawTokenBogusCo = 'cms_exec_bogus_co_' + ts;
      const tokenHashBogusCo = crypto.createHash('sha256').update(rawTokenBogusCo).digest('hex');

      const { error: bogusCoErr } = await adminA.client.from('invites').insert({
        organisation_id: orgAId,
        role: 'executive',
        reports_to: '00000000-0000-0000-0000-000000000099',
        token_hash: tokenHashBogusCo,
        invited_by: adminA.userId,
      });

      if (
        noCoErr && noCoErr.message.includes('must specify a Control Owner in reports_to') &&
        bogusCoErr && bogusCoErr.message.includes('must reference an active Control Owner in the same organisation')
      ) {
        logPass('Test 3: Invite for CMS Executive & Executive requires valid Control Owner in reports_to', 'Admin A');
      } else {
        throw new Error(`Invalid reports_to accepted! Errs: ${noCoErr?.message} / ${bogusCoErr?.message}`);
      }
    } catch (err) {
      logFail('Test 3: Invite requires valid Control Owner for executives', 'Admin A', err);
    }

    // ---------------------------------------------------------------------------
    // Test 4: User from Organisation A cannot see Organisation B's invites
    // Acting Roles: Owner A and Owner B
    // ---------------------------------------------------------------------------
    try {
      const rawTokenB = 'org_b_invite_' + ts;
      const tokenHashB = crypto.createHash('sha256').update(rawTokenB).digest('hex');
      await ownerBClient.from('invites').insert({
        organisation_id: orgBId,
        role: 'viewer',
        token_hash: tokenHashB,
        invited_by: ownerBId,
      });

      const { data: orgBInvitesSeenByOwnerA } = await ownerAClient.from('invites').select('*').eq('organisation_id', orgBId);
      const { data: orgAInvitesSeenByOwnerB } = await ownerBClient.from('invites').select('*').eq('organisation_id', orgAId);

      if (
        (!orgBInvitesSeenByOwnerA || orgBInvitesSeenByOwnerA.length === 0) &&
        (!orgAInvitesSeenByOwnerB || orgAInvitesSeenByOwnerB.length === 0)
      ) {
        logPass('Test 4: User from Org A cannot see Org B invites (and vice versa, RLS enforced)', 'Owner A / Owner B');
      } else {
        throw new Error(`Cross-org invites visible! Org B seen by A: ${orgBInvitesSeenByOwnerA?.length}, Org A seen by B: ${orgAInvitesSeenByOwnerB?.length}`);
      }
    } catch (err) {
      logFail('Test 4: User from Org A cannot see Org B invites', 'Owner A / Owner B', err);
    }

    // ---------------------------------------------------------------------------
    // Test 5: User cannot accept invite issued to a different email
    // Acting Role: Owner B
    // ---------------------------------------------------------------------------
    try {
      const rawToken = 'diff_email_token_' + ts;
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const restrictedEmail = `restricted.recipient.${ts}@veridex.qa`;

      const { error: invErr } = await ownerAClient.from('invites').insert({
        organisation_id: orgAId,
        role: 'viewer',
        email: restrictedEmail,
        token_hash: tokenHash,
        invited_by: ownerAId,
      });
      if (invErr) throw invErr;

      const { data: accData, error: accErr } = await ownerBClient.rpc('accept_invite', { token: rawToken });

      if (accErr && accErr.message.includes(`This invitation was issued to ${restrictedEmail}`)) {
        logPass('Test 5: User cannot accept invite issued to a different email (accept_invite rejects caller)', 'Owner B');
      } else {
        throw new Error(`Expected email restriction error, got: ${accErr?.message || 'Success'}`);
      }
    } catch (err) {
      logFail('Test 5: User cannot accept invite issued to different email', 'Owner B', err);
    }

    // ---------------------------------------------------------------------------
    // Test 6: Single-use token enforced (reused token fails)
    // Acting Role: New provisioned User
    // ---------------------------------------------------------------------------
    try {
      const singleUseEmail = `test.singleuse.${ts}@veridex.qa`;
      const singleUseClient = createAnonClient(supabaseUrl, anonKey);
      const { data: suAuth, error: suErr } = await singleUseClient.auth.signUp({
        email: singleUseEmail,
        password: commonPassword,
      });
      if (suErr || !suAuth.user) throw suErr;
      createdAccounts.push({ email: singleUseEmail, id: suAuth.user.id });

      const rawToken = 'single_use_token_' + ts;
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const { error: invErr } = await ownerAClient.from('invites').insert({
        organisation_id: orgAId,
        role: 'viewer',
        email: singleUseEmail,
        token_hash: tokenHash,
        invited_by: ownerAId,
      });
      if (invErr) throw invErr;

      const { data: acc1, error: err1 } = await singleUseClient.rpc('accept_invite', { token: rawToken });
      if (err1 || !acc1?.success) throw new Error(`First acceptance failed: ${err1?.message}`);

      const { data: acc2, error: err2 } = await singleUseClient.rpc('accept_invite', { token: rawToken });

      if (err2 && err2.message.includes('This invitation has already been accepted.')) {
        logPass('Test 6: Single-use token enforced (Second acceptance fails with "already been accepted")', 'Single-Use User');
      } else {
        throw new Error(`Second accept attempt did not fail as expected! Result: ${err2?.message || 'Success'}`);
      }
    } catch (err) {
      logFail('Test 6: Single-use token enforced', 'Single-Use User', err);
    }

    // ---------------------------------------------------------------------------
    // Test 7: Expired token rejected by accept_invite (Short-lived invite expires before acceptance)
    // Acting Role: New provisioned User
    // ---------------------------------------------------------------------------
    try {
      const expUserEmail = `test.expired.${ts}@veridex.qa`;
      const expUserClient = createAnonClient(supabaseUrl, anonKey);
      const { data: expAuth, error: expErr } = await expUserClient.auth.signUp({
        email: expUserEmail,
        password: commonPassword,
      });
      if (expErr || !expAuth.user) throw expErr;
      createdAccounts.push({ email: expUserEmail, id: expAuth.user.id });

      const rawToken = 'short_lived_token_' + ts;
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Create an invite with a short 2-second expiry
      const shortExpiry = new Date(Date.now() + 2000).toISOString();
      const { error: invErr } = await ownerAClient.from('invites').insert({
        organisation_id: orgAId,
        role: 'viewer',
        email: expUserEmail,
        token_hash: tokenHash,
        invited_by: ownerAId,
        expires_at: shortExpiry,
      });
      if (invErr) throw invErr;

      // Wait 3 seconds so the invite is strictly expired
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const { data: accData, error: err } = await expUserClient.rpc('accept_invite', { token: rawToken });

      if (err && err.message.includes('This invitation has expired.')) {
        logPass('Test 7: Expired token rejected by accept_invite (Short-lived invite expired after 2s)', 'Expired Test User');
      } else {
        throw new Error(`Expired token was accepted or failed unexpectedly! Result: ${err?.message || 'Success'}`);
      }
    } catch (err) {
      logFail('Test 7: Expired token rejected', 'Expired Test User', err);
    }

    // ---------------------------------------------------------------------------
    // Test 7b: Inserting an invite with a past expires_at is rejected by trigger
    // Acting Role: Admin A
    // ---------------------------------------------------------------------------
    try {
      const rawTokenPast = 'past_expiry_token_' + ts;
      const tokenHashPast = crypto.createHash('sha256').update(rawTokenPast).digest('hex');
      const pastExpiry = new Date(Date.now() - 3600000).toISOString();

      const { error: pastErr } = await adminA.client.from('invites').insert({
        organisation_id: orgAId,
        role: 'viewer',
        token_hash: tokenHashPast,
        invited_by: adminA.userId,
        expires_at: pastExpiry,
      });

      if (pastErr && pastErr.message.includes('Invitation expiry must be in the future.')) {
        logPass('Test 7b: Inserting an invite with a past expires_at is rejected by trigger', 'Admin A');
      } else {
        throw new Error(`Invite with past expires_at was inserted! Err: ${pastErr?.message}`);
      }
    } catch (err) {
      logFail('Test 7b: Past expires_at rejected', 'Admin A', err);
    }

    // ---------------------------------------------------------------------------
    // Test 8: Database trigger prevents removing the last Owner of an organisation
    // Acting Role: Owner B (sole Owner of Org B)
    // ---------------------------------------------------------------------------
    try {
      const { data: bMems } = await ownerBClient.from('memberships').select('id').eq('organisation_id', orgBId).single();
      const { error: deleteErr } = await ownerBClient.from('memberships').delete().eq('id', bMems.id);

      if (deleteErr && deleteErr.message.includes('Cannot remove, demote, or deactivate the last Owner')) {
        logPass('Test 8: Database trigger prevents removing the last Owner of an organisation', 'Owner B');
      } else {
        throw new Error(`Sole Owner was deleted! Result: ${deleteErr?.message || 'Success'}`);
      }
    } catch (err) {
      logFail('Test 8: Last owner cannot be removed', 'Owner B', err);
    }

    // ---------------------------------------------------------------------------
    // Test 9: Database trigger prevents demoting or deactivating the last Owner
    // Acting Role: Owner B (sole Owner of Org B)
    // ---------------------------------------------------------------------------
    try {
      const { data: bMems } = await ownerBClient.from('memberships').select('id').eq('organisation_id', orgBId).single();

      const { error: deactErr } = await ownerBClient.from('memberships').update({ is_active: false }).eq('id', bMems.id);
      const { error: demoteErr } = await ownerBClient.from('memberships').update({ role: 'admin' }).eq('id', bMems.id);

      if (
        deactErr && deactErr.message.includes('Cannot remove, demote, or deactivate the last Owner') &&
        demoteErr && demoteErr.message.includes('Cannot remove, demote, or deactivate the last Owner')
      ) {
        logPass('Test 9: Database trigger prevents demoting or deactivating the last Owner', 'Owner B');
      } else {
        throw new Error(`Last owner deactivation/demotion succeeded! Errs: ${deactErr?.message} / ${demoteErr?.message}`);
      }
    } catch (err) {
      logFail('Test 9: Last owner cannot be demoted or deactivated', 'Owner B', err);
    }

    // ---------------------------------------------------------------------------
    // Test 10: Cross-organisation data isolation (Controls, Evidence, Tasks)
    // Acting Role: Owner B
    // ---------------------------------------------------------------------------
    try {
      const { data: foreignControls } = await ownerBClient.from('controls').select('*').eq('organisation_id', orgAId);
      const { data: foreignEvidence } = await ownerBClient.from('evidence').select('*').eq('organisation_id', orgAId);
      const { data: foreignTasks } = await ownerBClient.from('tasks').select('*').eq('organisation_id', orgAId);

      const { error: insertCtrlErr } = await ownerBClient.from('controls').insert({
        organisation_id: orgAId,
        code: 'MAL-01',
        title: 'Malicious Control',
        category: 'Access Control',
      });

      if (
        (!foreignControls || foreignControls.length === 0) &&
        (!foreignEvidence || foreignEvidence.length === 0) &&
        (!foreignTasks || foreignTasks.length === 0) &&
        insertCtrlErr
      ) {
        logPass('Test 10: Cross-organisation data isolation (0 rows returned, mutations blocked by RLS)', 'Owner B');
      } else {
        throw new Error('Cross-organisation data isolation failed: foreign data accessible or mutable!');
      }
    } catch (err) {
      logFail('Test 10: Cross-organisation data isolation', 'Owner B', err);
    }

    // ---------------------------------------------------------------------------
    // Test 11: Executive cannot link evidence to controls
    // Acting Role: Executive A
    // ---------------------------------------------------------------------------
    try {
      const { error: linkErr } = await execA.client.from('control_evidence').insert({
        organisation_id: orgAId,
        control_id: '00000000-0000-0000-0000-000000000001',
        evidence_id: '00000000-0000-0000-0000-000000000002',
      });

      if (linkErr) {
        logPass('Test 11: Executive cannot link evidence to controls (Policy restricts to owner, admin, control_owner)', 'Executive A');
      } else {
        throw new Error('Executive was able to link evidence to control! RLS violation.');
      }
    } catch (err) {
      logFail('Test 11: Executive cannot link evidence to controls', 'Executive A', err);
    }

    // ---------------------------------------------------------------------------
    // Test 12: Executive evidence upload boundary (Requires active assigned task)
    // Acting Roles: Control Owner A and Executive A
    // ---------------------------------------------------------------------------
    let execTaskAId = null;
    try {
      // 1. Executive attempts to insert evidence without a task_id -> MUST FAIL
      const { error: noTaskErr } = await execA.client.from('evidence').insert({
        organisation_id: orgAId,
        title: 'Unsolicited Evidence File',
        file_path: `${orgAId}/unsolicited.pdf`,
        sha256_hash: '0000000000000000000000000000000000000000000000000000000000000000',
        task_id: null,
      });

      // 2. Control Owner A assigns a task to Executive A
      const { data: assignedTask, error: tErr } = await coA.client.from('tasks').insert({
        organisation_id: orgAId,
        title: 'Upload Q3 Access Review Attestation',
        assigned_by: coA.userId,
        assignee_id: execA.userId,
        status: 'assigned',
      }).select().single();
      if (tErr) throw tErr;
      execTaskAId = assignedTask.id;

      // 3. Executive inserts evidence referencing their assigned task -> MUST SUCCEED
      const { data: validEvidence, error: validEvErr } = await execA.client.from('evidence').insert({
        organisation_id: orgAId,
        title: 'Q3 Access Review Attestation Report',
        file_path: `${orgAId}/q3-access-attestation.pdf`,
        sha256_hash: crypto.createHash('sha256').update('attestation_proof').digest('hex'),
        task_id: assignedTask.id,
      }).select().single();

      if (noTaskErr && !validEvErr && validEvidence) {
        logPass('Test 12: Executive evidence upload boundary: rejected without task_id, accepted with assigned task', 'Executive A');
      } else {
        throw new Error(`Upload boundary failed! Without task err: ${noTaskErr?.message}, With task err: ${validEvErr?.message}`);
      }
    } catch (err) {
      logFail('Test 12: Executive evidence upload boundary', 'Executive A', err);
    }

    // ---------------------------------------------------------------------------
    // Test 13: Executive cannot upload evidence referencing another person's task_id
    // Acting Roles: Control Owner A, CMS Executive A, Executive A
    // ---------------------------------------------------------------------------
    try {
      // Control Owner A assigns a task specifically to CMS Executive A
      const { data: otherTask, error: otErr } = await coA.client.from('tasks').insert({
        organisation_id: orgAId,
        title: 'Task Assigned Specifically to CMS Executive',
        assigned_by: coA.userId,
        assignee_id: cmsExecA.userId,
        status: 'assigned',
      }).select().single();
      if (otErr) throw otErr;

      // Executive A attempts to upload evidence into public.evidence referencing CMS Executive A's task_id
      const { data: hijackData, error: hijackErr } = await execA.client.from('evidence').insert({
        organisation_id: orgAId,
        title: 'Evidence Referencing Another Assignee Task',
        file_path: `${orgAId}/unauthorized-task-ref.pdf`,
        sha256_hash: crypto.createHash('sha256').update('unauthorized_task_ref').digest('hex'),
        task_id: otherTask.id,
      }).select();

      if (hijackErr || !hijackData || hijackData.length === 0) {
        logPass(
          "Test 13: Executive cannot upload evidence referencing another person's task_id (RLS check t.assignee_id = auth.uid() enforced)",
          'Executive A'
        );
      } else {
        throw new Error("Executive was able to upload evidence referencing another person's task_id!");
      }
    } catch (err) {
      logFail("Test 13: Executive cannot upload evidence referencing another person's task", 'Executive A', err);
    }

    // ---------------------------------------------------------------------------
    // Test 14: Executive rejected when uploading into another organisation storage folder
    // Acting Role: Executive A
    // ---------------------------------------------------------------------------
    try {
      const dummyContent = new Uint8Array([84, 101, 115, 116]); // "Test"
      const foreignOrgPath = `${orgBId}/unauthorized-upload.txt`;

      const { data: uploadData, error: uploadErr } = await execA.client.storage
        .from('evidence')
        .upload(foreignOrgPath, dummyContent, { contentType: 'text/plain' });

      if (uploadErr || !uploadData) {
        logPass('Test 14: Executive rejected when uploading into another organisation folder (Storage RLS)', 'Executive A');
      } else {
        throw new Error('Executive uploaded into foreign organisation storage folder unexpectedly!');
      }
    } catch (err) {
      logFail('Test 14: Executive cross-org storage upload rejected', 'Executive A', err);
    }

    // ---------------------------------------------------------------------------
    // Test 15: Deactivated member gets 0 rows from controls, evidence, tasks, invites & storage
    // Acting Roles: Owner A (deactivates) and Executive A (verifies zero rows)
    // ---------------------------------------------------------------------------
    try {
      // Owner A deactivates Executive A
      const { error: deactErr } = await ownerAClient
        .from('memberships')
        .update({ is_active: false })
        .eq('id', execA.membershipId);
      if (deactErr) throw deactErr;

      // Deactivated Executive A queries tables
      const { data: dControls } = await execA.client.from('controls').select('*').eq('organisation_id', orgAId);
      const { data: dEvidence } = await execA.client.from('evidence').select('*').eq('organisation_id', orgAId);
      const { data: dTasks } = await execA.client.from('tasks').select('*').eq('organisation_id', orgAId);
      const { data: dInvites } = await execA.client.from('invites').select('*').eq('organisation_id', orgAId);

      // Deactivated Executive A attempts storage upload
      const dummyContent = new Uint8Array([68, 101, 97, 99, 116]); // "Deact"
      const { error: storeErr } = await execA.client.storage
        .from('evidence')
        .upload(`${orgAId}/deactivated-upload-attempt.txt`, dummyContent);

      if (
        (!dControls || dControls.length === 0) &&
        (!dEvidence || dEvidence.length === 0) &&
        (!dTasks || dTasks.length === 0) &&
        (!dInvites || dInvites.length === 0) &&
        storeErr
      ) {
        logPass('Test 15: Deactivated member gets 0 rows from controls, evidence, tasks, invites & rejected on storage', 'Executive A (Deactivated)');
      } else {
        throw new Error(`Deactivated member retained access! Controls: ${dControls?.length}, Evidence: ${dEvidence?.length}, Tasks: ${dTasks?.length}`);
      }
    } catch (err) {
      logFail('Test 15: Deactivated member isolation', 'Executive A', err);
    }

    // ---------------------------------------------------------------------------
    // Test 16: Deactivated member cannot update their own membership to reactivate themselves
    // Acting Role: Executive A (Deactivated)
    // ---------------------------------------------------------------------------
    try {
      const { error: selfReactivateErr, count } = await execA.client
        .from('memberships')
        .update({ is_active: true }, { count: 'exact' })
        .eq('id', execA.membershipId);

      // Verify membership in database is strictly still inactive
      const { data: checkInactive, error: fetchErr } = await ownerAClient
        .from('memberships')
        .select('is_active')
        .eq('id', execA.membershipId)
        .single();

      if (fetchErr) throw fetchErr;

      if (checkInactive.is_active === false && (selfReactivateErr || count === 0)) {
        logPass(
          'Test 16: Deactivated member cannot update their own membership to reactivate themselves (Enforced by RLS & triggers)',
          'Executive A (Deactivated)'
        );
      } else {
        throw new Error(`Self-reactivation was not blocked! is_active: ${checkInactive.is_active}, count: ${count}, err: ${selfReactivateErr?.message}`);
      }
    } catch (err) {
      logFail('Test 16: Deactivated member cannot self-reactivate', 'Executive A', err);
    }

    // ---------------------------------------------------------------------------
    // Test 17: get_deactivated_org_name() resolution
    // - Inactive member gets org name
    // - Active member gets null
    // - Unauthenticated caller MUST FAIL WITH PERMISSION DENIED (revoked from anon)
    // Acting Roles: Executive A (Inactive), Owner A (Active), Unauthenticated Client
    // ---------------------------------------------------------------------------
    try {
      // 1. Inactive member calls get_deactivated_org_name -> must return org name
      const { data: deactOrgName, error: dOrgErr } = await execA.client.rpc('get_deactivated_org_name');
      if (dOrgErr) throw dOrgErr;

      // 2. Active member calls get_deactivated_org_name -> must return null
      const { data: activeOrgName, error: aOrgErr } = await ownerAClient.rpc('get_deactivated_org_name');
      if (aOrgErr) throw aOrgErr;

      // 3. Unauthenticated client calls get_deactivated_org_name -> MUST FAIL WITH PERMISSION DENIED
      const unauthClient = createAnonClient(supabaseUrl, anonKey);
      const { data: unauthRes, error: unauthErr } = await unauthClient.rpc('get_deactivated_org_name');

      const isInactiveCorrect = deactOrgName === orgAName;
      const isActiveCorrect = activeOrgName === null;
      // Strictly verify that permission denied error is returned for anon
      const isUnauthPermissionDenied =
        Boolean(unauthErr) &&
        (unauthErr.code === '42501' ||
         unauthErr.message?.toLowerCase().includes('permission denied') ||
         unauthErr.message?.toLowerCase().includes('not allowed'));

      if (isInactiveCorrect && isActiveCorrect && isUnauthPermissionDenied && unauthRes === null) {
        logPass(
          'Test 17: get_deactivated_org_name() returns org name for inactive, null for active, and fails with permission denied for anon',
          'Executive A / Owner A / Unauthenticated'
        );
      } else {
        throw new Error(
          `Test 17 failed! Inactive: "${deactOrgName}" (expected "${orgAName}"), Active: "${activeOrgName}" (expected null), Unauthenticated err: "${unauthErr?.message}" (code: ${unauthErr?.code}), unauthRes: "${unauthRes}"`
        );
      }
    } catch (err) {
      logFail('Test 17: get_deactivated_org_name() resolution', 'Executive A / Owner A / Unauthenticated', err);
    }

    // ---------------------------------------------------------------------------
    // Test 18: Reactivating a member restores access to tasks and organization data
    // Acting Roles: Owner A (reactivates) and Executive A (verifies restored access)
    // ---------------------------------------------------------------------------
    try {
      // Owner A reactivates Executive A
      const { error: reactErr } = await ownerAClient
        .from('memberships')
        .update({ is_active: true })
        .eq('id', execA.membershipId);
      if (reactErr) throw reactErr;

      // Reactivated Executive A queries tasks
      const { data: restoredTasks, error: tQueryErr } = await execA.client
        .from('tasks')
        .select('*')
        .eq('organisation_id', orgAId);

      if (!tQueryErr && restoredTasks && restoredTasks.length > 0) {
        logPass('Test 18: Reactivating a member restores access to tasks and organization data', 'Executive A (Reactivated)');
      } else {
        throw new Error(`Reactivated member failed to regain access! Tasks returned: ${restoredTasks?.length}, Err: ${tQueryErr?.message}`);
      }
    } catch (err) {
      logFail('Test 18: Reactivating a member restores access', 'Executive A', err);
    }

    // ---------------------------------------------------------------------------
    // Test 19: Audit log append-only and identity spoofing prevention
    // Acting Role: Admin A
    // ---------------------------------------------------------------------------
    try {
      const fakeActorId = '00000000-0000-0000-0000-000000000002';
      const { data: auditRow, error: auditErr } = await adminA.client.from('audit_log').insert({
        organisation_id: orgAId,
        actor_id: fakeActorId,
        action: 'role_test_action',
        target_type: 'system',
        details: { role_tested: 'admin' },
      }).select().single();

      if (auditErr) throw auditErr;

      // Trigger trg_enforce_audit_log_integrity forces actor_id := auth.uid()
      if (auditRow.actor_id !== adminA.userId) {
        throw new Error(`Trigger failed to overwrite spoofed actor_id! Stored: ${auditRow.actor_id}`);
      }

      // Cross-org audit log attempt
      const { error: crossOrgErr } = await adminA.client.from('audit_log').insert({
        organisation_id: orgBId,
        action: 'cross_org_audit_tamper',
        target_type: 'org',
      });

      if (!crossOrgErr || !crossOrgErr.message.includes('Cannot create audit log entry for an organisation you are not a member of')) {
        throw new Error(`Cross-org audit entry succeeded unexpectedly! Err: ${crossOrgErr?.message}`);
      }

      // Append-only check: attempt delete
      await adminA.client.from('audit_log').delete().eq('id', auditRow.id);
      const { data: checkRow } = await adminA.client.from('audit_log').select('id').eq('id', auditRow.id);

      if (!checkRow || checkRow.length === 0) {
        throw new Error('Audit log row was deleted! Append-only policy violated.');
      }

      logPass('Test 19: Audit log integrity verified: actor spoofing overridden, cross-tenant log blocked, append-only guaranteed', 'Admin A');
    } catch (err) {
      logFail('Test 19: Audit log append-only and anti-spoofing integrity', 'Admin A', err);
    }

    // ---------------------------------------------------------------------------
    // Test 20: Sample data removal (remove_sample_data)
    // Acting Role: Owner A
    // ---------------------------------------------------------------------------
    try {
      const { data: sampleTask, error: sErr } = await ownerAClient.from('tasks').insert({
        organisation_id: orgAId,
        title: 'Sample Test Task To Purge',
        assigned_by: ownerAId,
        assignee_id: ownerAId,
        is_sample: true,
      }).select().single();
      if (sErr) throw sErr;

      const { data: realTask, error: rErr } = await ownerAClient.from('tasks').insert({
        organisation_id: orgAId,
        title: 'Real Task To Preserve',
        assigned_by: ownerAId,
        assignee_id: ownerAId,
        is_sample: false,
      }).select().single();
      if (rErr) throw rErr;

      const { data: removeRes, error: removeErr } = await ownerAClient.rpc('remove_sample_data', { p_org_id: orgAId });
      if (removeErr || !removeRes?.success) throw new Error(`remove_sample_data failed: ${removeErr?.message}`);

      const { data: checkSample } = await ownerAClient.from('tasks').select('id').eq('id', sampleTask.id);
      const { data: checkReal } = await ownerAClient.from('tasks').select('id').eq('id', realTask.id);

      await ownerAClient.from('tasks').delete().eq('id', realTask.id);

      if ((!checkSample || checkSample.length === 0) && checkReal && checkReal.length > 0) {
        logPass('Test 20: Sample data removal cleanly purges sample rows while preserving real data', 'Owner A');
      } else {
        throw new Error('Sample data removal failed: sample row was not deleted or real row was removed!');
      }
    } catch (err) {
      logFail('Test 20: Sample data removal', 'Owner A', err);
    }

    // ---------------------------------------------------------------------------
    // Test 21: Invite immutability: Admin cannot update role, reports_to, expires_at, email
    // Acting Role: Admin A
    // ---------------------------------------------------------------------------
    try {
      const rawTokenInv = 'admin_exec_mut_test_' + ts;
      const tokenHashInv = crypto.createHash('sha256').update(rawTokenInv).digest('hex');

      // Admin A creates an executive invite
      const { data: invRow, error: invErr } = await adminA.client.from('invites').insert({
        organisation_id: orgAId,
        role: 'executive',
        reports_to: coA.membershipId,
        token_hash: tokenHashInv,
        invited_by: adminA.userId,
        email: `test.mut.${ts}@veridex.qa`,
      }).select().single();
      if (invErr) throw invErr;

      // 1. Try to update role to 'owner' -> MUST FAIL
      const { error: roleErr } = await adminA.client.from('invites').update({ role: 'owner' }).eq('id', invRow.id);

      // 2. Try to update reports_to -> MUST FAIL
      const { error: repErr } = await adminA.client.from('invites').update({ reports_to: ownerAMembershipId }).eq('id', invRow.id);

      // 3. Try to update expires_at -> MUST FAIL
      const { error: expErr } = await adminA.client.from('invites').update({ expires_at: new Date(Date.now() + 86400000).toISOString() }).eq('id', invRow.id);

      // 4. Try to update email -> MUST FAIL
      const { error: mailErr } = await adminA.client.from('invites').update({ email: `tampered.${ts}@veridex.qa` }).eq('id', invRow.id);

      // 5. Update status to 'revoked' -> MUST SUCCEED (Admin/Owner can revoke)
      const { error: revErr } = await adminA.client.from('invites').update({ status: 'revoked' }).eq('id', invRow.id);

      if (
        roleErr && roleErr.message.includes('role on an invitation is immutable') &&
        repErr && repErr.message.includes('reports_to on an invitation is immutable') &&
        expErr && expErr.message.includes('expires_at on an invitation is immutable') &&
        mailErr && mailErr.message.includes('email on an invitation is immutable') &&
        !revErr
      ) {
        logPass('Test 21: Invite immutability: Admin cannot update role, reports_to, expires_at, email; can revoke', 'Admin A');
      } else {
        throw new Error(`Invite mutation check failed! Role err: ${roleErr?.message}, rep err: ${repErr?.message}, exp err: ${expErr?.message}, mail err: ${mailErr?.message}, rev err: ${revErr?.message}`);
      }
    } catch (err) {
      logFail('Test 21: Invite immutability', 'Admin A', err);
    }

    // ---------------------------------------------------------------------------
    // Test 22: Admin cannot insert an invite with status 'accepted' (must be 'pending')
    // Acting Role: Admin A
    // ---------------------------------------------------------------------------
    try {
      const rawTokenAcc = 'admin_insert_acc_' + ts;
      const tokenHashAcc = crypto.createHash('sha256').update(rawTokenAcc).digest('hex');

      const { error: insAccErr } = await adminA.client.from('invites').insert({
        organisation_id: orgAId,
        role: 'viewer',
        token_hash: tokenHashAcc,
        invited_by: adminA.userId,
        status: 'accepted',
      });

      if (insAccErr && insAccErr.message.includes('New invitations must have status pending.')) {
        logPass('Test 22: Admin cannot insert an invite with status accepted (Trigger blocks non-pending insert)', 'Admin A');
      } else {
        throw new Error(`Invite with status accepted was inserted! Err: ${insAccErr?.message}`);
      }
    } catch (err) {
      logFail('Test 22: Admin cannot insert invite with status accepted', 'Admin A', err);
    }

    // ---------------------------------------------------------------------------
    // Test 23: Active Owner cannot be demoted by accepting an invite
    // Acting Role: Owner A
    // ---------------------------------------------------------------------------
    try {
      const rawTokenDemote = 'demote_owner_inv_' + ts;
      const tokenHashDemote = crypto.createHash('sha256').update(rawTokenDemote).digest('hex');

      // Admin A creates a viewer invite
      const { error: invErr } = await adminA.client.from('invites').insert({
        organisation_id: orgAId,
        role: 'viewer',
        token_hash: tokenHashDemote,
        invited_by: adminA.userId,
      });
      if (invErr) throw invErr;

      // Active Owner A attempts to accept the viewer invite
      const { error: acceptErr } = await ownerAClient.rpc('accept_invite', { token: rawTokenDemote });

      // Verify Owner A's role in memberships is still 'owner' and active
      const { data: checkOwner } = await ownerAClient
        .from('memberships')
        .select('role, is_active')
        .eq('id', ownerAMembershipId)
        .single();

      if (
        acceptErr &&
        acceptErr.message.includes('You are already a member; ask an administrator to change your role.') &&
        checkOwner.role === 'owner' &&
        checkOwner.is_active === true
      ) {
        logPass('Test 23: Active Owner cannot be demoted by accepting an invite (accept_invite refuses active member)', 'Owner A');
      } else {
        throw new Error(`Active Owner demotion was not blocked! Accept err: ${acceptErr?.message}, Role: ${checkOwner?.role}`);
      }
    } catch (err) {
      logFail('Test 23: Active Owner cannot be demoted by accepting invite', 'Owner A', err);
    }

    // ---------------------------------------------------------------------------
    // Test 24: Non-member cannot forge membership insertion in another organisation
    // Acting Role: Executive A
    // ---------------------------------------------------------------------------
    try {
      // Executive A attempts direct insert into memberships for Org B
      const { data: forgeData, error: forgeErr } = await execA.client.from('memberships').insert({
        organisation_id: orgBId,
        user_id: execA.userId,
        role: 'owner',
        is_active: true,
      }).select();

      if (forgeErr || !forgeData || forgeData.length === 0) {
        logPass('Test 24: Non-member cannot forge membership insertion in another organisation (RLS and trigger block it)', 'Executive A');
      } else {
        throw new Error('Executive forged a membership in another organisation!');
      }
    } catch (err) {
      logFail('Test 24: Non-member cannot forge membership insertion', 'Executive A', err);
    }

    // ---------------------------------------------------------------------------
    // Test 25: Invite acceptance succeeds for a valid invite
    // Acting Role: New provisioned Viewer user
    // ---------------------------------------------------------------------------
    try {
      const validViewerEmail = `test.valid.viewer.${ts}@veridex.qa`;
      const viewerClient = createAnonClient(supabaseUrl, anonKey);
      const { data: vAuth, error: vAuthErr } = await viewerClient.auth.signUp({
        email: validViewerEmail,
        password: commonPassword,
      });
      if (vAuthErr || !vAuth.user) throw vAuthErr;
      createdAccounts.push({ email: validViewerEmail, id: vAuth.user.id });

      const rawTokenValid = 'valid_viewer_invite_' + ts;
      const tokenHashValid = crypto.createHash('sha256').update(rawTokenValid).digest('hex');

      const { error: invErr } = await adminA.client.from('invites').insert({
        organisation_id: orgAId,
        role: 'viewer',
        token_hash: tokenHashValid,
        invited_by: adminA.userId,
        email: validViewerEmail,
      });
      if (invErr) throw invErr;

      const { data: accRes, error: accErr } = await viewerClient.rpc('accept_invite', { token: rawTokenValid });

      const { data: vMem } = await viewerClient
        .from('memberships')
        .select('role, is_active')
        .eq('organisation_id', orgAId)
        .eq('user_id', vAuth.user.id)
        .single();

      if (!accErr && accRes?.success && vMem && vMem.role === 'viewer' && vMem.is_active === true) {
        logPass('Test 25: Invite acceptance succeeds for a valid invite (membership created, invite marked accepted)', 'Viewer');
      } else {
        throw new Error(`Valid invite acceptance failed! Acc err: ${accErr?.message}, Mem: ${JSON.stringify(vMem)}`);
      }
    } catch (err) {
      logFail('Test 25: Valid invite acceptance succeeds', 'Viewer', err);
    }
  } finally {
    // ---------------------------------------------------------------------------
    // CLEANUP: Dry-Run Mode By Default (Lists rows to delete, deletes nothing)
    // ---------------------------------------------------------------------------
    if (ownerAClient && orgAId) {
      const cleanupTargets = [
        { client: ownerAClient, orgId: orgAId },
      ];
      if (ownerBClient && orgBId) {
        cleanupTargets.push({ client: ownerBClient, orgId: orgBId });
      }
      await cleanupQAData(cleanupTargets, { dryRun: true, leftoverAccounts: createdAccounts });
    }

    console.log('=============================================================================');
    console.log('ALL 26 ROLE, PERMISSION, AND TENANT SECURITY TESTS COMPLETED');
    console.log('=============================================================================\n');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runTestSuite().catch((err) => {
    console.error('\nTest runner failed with unexpected exception:', err);
    process.exit(1);
  });
}
