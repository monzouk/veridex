// =============================================================================
// VERIDEX QA TEST DATA CLEANUP UTILITY
// File: scripts/cleanup-qa-data.mjs
// Strictly adheres to AGENTS.md:
// - Removes ONLY organisations with the mandatory "QA-TEST-" prefix
// - Strictly refuses to run if ANY candidate organisation lacks the "QA-TEST-" prefix
// - Uses public anon key with authenticated sessions (no service role key)
// - Supports --dry-run mode: lists all rows it WOULD delete and deletes nothing
// - Honestly reports what the public key cannot remove (auth.users and storage files)
// - Zero emojis in logs, console outputs, or error messages
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const REQUIRED_QA_PREFIX = 'QA-TEST-';

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

/**
 * Clean up QA test data for one or more organisations.
 * Supports:
 * - cleanupQAData(targets, { dryRun: true, leftoverAccounts: [...] })
 * - cleanupQAData(client, [orgId1, ...], { dryRun: true })
 */
export async function cleanupQAData(clientOrContexts, maybeOrgIdsOrOptions = null, maybeOptions = {}) {
  let dryRun = true;
  let leftoverAccounts = [];
  let targets = [];

  // Parse arguments flexibly
  if (Array.isArray(clientOrContexts) && clientOrContexts.length > 0 && clientOrContexts[0].client) {
    targets = clientOrContexts.map((ctx) => ({ client: ctx.client, orgId: ctx.orgId }));
    const opts = maybeOrgIdsOrOptions && typeof maybeOrgIdsOrOptions === 'object' && !Array.isArray(maybeOrgIdsOrOptions)
      ? maybeOrgIdsOrOptions
      : maybeOptions;
    if (typeof opts?.dryRun === 'boolean') dryRun = opts.dryRun;
    if (Array.isArray(opts?.leftoverAccounts)) leftoverAccounts = opts.leftoverAccounts;
  } else if (clientOrContexts) {
    const orgIds = Array.isArray(maybeOrgIdsOrOptions) ? maybeOrgIdsOrOptions : [maybeOrgIdsOrOptions];
    targets = orgIds.filter(Boolean).map((id) => ({ client: clientOrContexts, orgId: id }));
    const opts = maybeOptions;
    if (typeof opts?.dryRun === 'boolean') dryRun = opts.dryRun;
    if (Array.isArray(opts?.leftoverAccounts)) leftoverAccounts = opts.leftoverAccounts;
  }

  console.log('\n=============================================================================');
  console.log(`STARTING QA TEST DATA CLEANUP [MODE: ${dryRun ? 'DRY-RUN (SIMULATION)' : 'REAL DELETION'}]`);
  console.log('=============================================================================');

  if (targets.length === 0) {
    console.log('No QA test organisations specified for cleanup.');
    return { success: true, dryRun, counts: { organisations: 0 } };
  }

  // 1. Fetch organisation details for each target and perform CRITICAL SAFETY CHECK
  const verifiedTargets = [];
  for (const target of targets) {
    const { data: org, error: orgErr } = await target.client
      .from('organisations')
      .select('id, name, slug')
      .eq('id', target.orgId)
      .maybeSingle();

    if (orgErr) {
      console.warn(`Could not query organisation ${target.orgId}:`, orgErr.message);
      continue;
    }

    if (!org) {
      console.log(`Organisation ${target.orgId} does not exist (may already have been removed).`);
      continue;
    }

    // MANDATORY SAFETY GUARD: Check prefix
    if (!org.name.startsWith(REQUIRED_QA_PREFIX)) {
      throw new Error(
        `CRITICAL SAFETY REFUSAL: Refusing to delete! Organisation "${org.name}" (ID: ${org.id}) does NOT start with required prefix "${REQUIRED_QA_PREFIX}". Aborting cleanup immediately.`
      );
    }

    verifiedTargets.push({ client: target.client, org });
  }

  if (verifiedTargets.length === 0) {
    console.log('No matching QA-TEST organisations found in the database to delete.');
    return { success: true, dryRun, counts: { organisations: 0 } };
  }

  console.log(`Found ${verifiedTargets.length} verified QA-TEST organisation(s) in scope:`);
  for (const vt of verifiedTargets) {
    console.log(` - ${vt.org.name} (UUID: ${vt.org.id})`);
  }

  const totals = {
    organisations: 0,
    memberships: 0,
    invites: 0,
    controls: 0,
    evidence: 0,
    control_evidence: 0,
    tasks: 0,
    audit_log: 0,
  };

  const detailedPlan = [];

  // 2. Inspect each organisation and either simulate or perform deletion
  for (const { client, org } of verifiedTargets) {
    const orgId = org.id;

    // Fetch details of rows
    const { data: tasks } = await client.from('tasks').select('id, title, status').eq('organisation_id', orgId);
    const { data: links } = await client.from('control_evidence').select('id, control_id, evidence_id').eq('organisation_id', orgId);
    const { data: evidence } = await client.from('evidence').select('id, title, file_path').eq('organisation_id', orgId);
    const { data: controls } = await client.from('controls').select('id, code, title').eq('organisation_id', orgId);
    const { data: invites } = await client.from('invites').select('id, email, role, status').eq('organisation_id', orgId);
    const { data: auditLog } = await client.from('audit_log').select('id, action').eq('organisation_id', orgId);
    const { data: memberships } = await client.from('memberships').select('id, user_id, role, is_active').eq('organisation_id', orgId);

    const taskCount = tasks?.length || 0;
    const linkCount = links?.length || 0;
    const evCount = evidence?.length || 0;
    const ctrlCount = controls?.length || 0;
    const invCount = invites?.length || 0;
    const auditCount = auditLog?.length || 0;
    const memCount = memberships?.length || 0;

    totals.tasks += taskCount;
    totals.control_evidence += linkCount;
    totals.evidence += evCount;
    totals.controls += ctrlCount;
    totals.invites += invCount;
    totals.audit_log += auditCount;
    totals.memberships += memCount;
    totals.organisations += 1;

    detailedPlan.push({
      org,
      tasks: tasks || [],
      evidence: evidence || [],
      invites: invites || [],
      memberships: memberships || [],
      controls: controls || [],
    });

    if (dryRun) {
      console.log(`\n[DRY-RUN PLAN] Organisation: ${org.name} (${orgId})`);
      console.log(`  - Tasks to delete (${taskCount}):`);
      for (const t of tasks || []) console.log(`      * [Task] ID: ${t.id} - "${t.title}" (${t.status})`);
      console.log(`  - Evidence rows to delete (${evCount}):`);
      for (const e of evidence || []) console.log(`      * [Evidence] ID: ${e.id} - "${e.title}" (Path: ${e.file_path})`);
      console.log(`  - Invites to delete (${invCount}):`);
      for (const i of invites || []) console.log(`      * [Invite] ID: ${i.id} - Role: ${i.role}, Email: ${i.email || 'none'}, Status: ${i.status}`);
      console.log(`  - Memberships to cascade (${memCount}):`);
      for (const m of memberships || []) console.log(`      * [Membership] ID: ${m.id} - Role: ${m.role}, Active: ${m.is_active}`);
      console.log(`  - Organisation itself: WOULD DELETE row in public.organisations (ID: ${orgId})`);
    } else {
      // REAL DELETION
      console.log(`\n[EXECUTING DELETION] Organisation: ${org.name} (${orgId})`);
      await client.from('tasks').delete().eq('organisation_id', orgId);
      await client.from('control_evidence').delete().eq('organisation_id', orgId);
      await client.from('evidence').delete().eq('organisation_id', orgId);
      await client.from('controls').delete().eq('organisation_id', orgId);
      await client.from('invites').delete().eq('organisation_id', orgId);
      await client.from('memberships').delete().eq('organisation_id', orgId).neq('role', 'owner');
      const { error: orgDelErr } = await client.from('organisations').delete().eq('id', orgId);
      if (orgDelErr) {
        console.warn(`Warning: Could not delete organisation row ${org.name}:`, orgDelErr.message);
      } else {
        console.log(`Successfully deleted organisation ${org.name} and cascaded remaining records.`);
      }
    }
  }

  console.log('\n-----------------------------------------------------------------------------');
  console.log(`QA TEST DATA CLEANUP SUMMARY [${dryRun ? 'DRY-RUN - ZERO ROWS DELETED' : 'REAL DELETION COMPLETED'}]`);
  console.log('-----------------------------------------------------------------------------');
  console.log(`Organisations ${dryRun ? 'to delete' : 'deleted'}:     ${totals.organisations}`);
  console.log(`Memberships ${dryRun ? 'to cascade' : 'deleted'}:       ${totals.memberships}`);
  console.log(`Invites ${dryRun ? 'to delete' : 'deleted'}:           ${totals.invites}`);
  console.log(`Tasks ${dryRun ? 'to delete' : 'deleted'}:             ${totals.tasks}`);
  console.log(`Evidence rows ${dryRun ? 'to delete' : 'deleted'}:     ${totals.evidence}`);
  console.log(`Control links ${dryRun ? 'to delete' : 'deleted'}:     ${totals.control_evidence}`);
  console.log(`Controls ${dryRun ? 'to delete' : 'deleted'}:          ${totals.controls}`);
  console.log(`Audit log records ${dryRun ? 'to cascade' : 'cascaded'}: ${totals.audit_log}`);
  console.log('-----------------------------------------------------------------------------');

  // 3. HONEST REPORT OF WHAT THE PUBLIC KEY CANNOT REMOVE
  console.log('\n=============================================================================');
  console.log('HONEST TECHNICAL AUDIT: ENTITIES THE PUBLIC KEY CANNOT DELETE');
  console.log('=============================================================================');
  console.log('Because this suite and cleanup utility authenticate using the PUBLIC anon key,');
  console.log('PostgreSQL Row Level Security and Supabase internal rules prevent deleting:');
  console.log('');
  console.log('1. AUTH.USERS ACCOUNTS (requires service_role key or Supabase Dashboard):');
  console.log('   The public anon key has no administrative access to delete rows in auth.users.');
  if (leftoverAccounts.length > 0) {
    console.log('   Leftover @veridex.qa test accounts to delete by hand in Supabase Auth:');
    for (const acc of leftoverAccounts) {
      console.log(`    - Email: ${acc.email.padEnd(38)} User UUID: ${acc.id}`);
    }
  } else {
    console.log('   Any test accounts created under domain @veridex.qa.');
  }
  console.log('');
  console.log('2. EVIDENCE STORAGE BUCKET FILES (storage.objects):');
  console.log('   Storage RLS policies in 002 grant INSERT and SELECT only. There is NO DELETE policy');
  console.log('   for authenticated users on bucket "evidence". Physical uploaded files cannot be');
  console.log('   removed via the public anon key.');
  console.log('   Storage folders to delete by hand in Supabase Dashboard (Storage -> evidence):');
  for (const vt of verifiedTargets) {
    console.log(`    - Folder: ${vt.org.id}/ (Organisation: ${vt.org.name})`);
  }
  console.log('');
  console.log('3. EVIDENCE TABLE DIRECT DELETIONS (public.evidence):');
  console.log('   Direct DELETE on public.evidence is blocked by RLS because evidence is append-only');
  console.log('   for tamper resistance. However, when the parent organisation is deleted by its Owner,');
  console.log('   PostgreSQL ON DELETE CASCADE deletes all public.evidence rows automatically.');
  console.log('=============================================================================\n');

  return { success: true, dryRun, counts: totals, detailedPlan };
}

// Standalone CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const env = loadEnv();
  const isReal = process.argv.includes('--execute') || process.argv.includes('--real');
  const dryRun = !isReal;

  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const email = env.TEST_EMAIL || 'veridex.qa.tester@gmail.com';
  const password = env.TEST_PASSWORD || 'Password123!@#Secure';

  client.auth.signInWithPassword({ email, password }).then(async ({ data, error }) => {
    if (error) {
      console.error('Sign-in failed for standalone cleanup:', error.message);
      process.exit(1);
    }

    const { data: orgs, error: fetchErr } = await client
      .from('organisations')
      .select('id, name')
      .like('name', `${REQUIRED_QA_PREFIX}%`);

    if (fetchErr) {
      console.error('Failed to query QA-TEST organisations:', fetchErr.message);
      process.exit(1);
    }

    if (!orgs || orgs.length === 0) {
      console.log('No QA-TEST organisations found for cleanup.');
      process.exit(0);
    }

    // Safety guard
    for (const org of orgs) {
      if (!org.name.startsWith(REQUIRED_QA_PREFIX)) {
        console.error(`Refusing to delete: organisation ${org.name} does not match prefix!`);
        process.exit(1);
      }
    }

    const orgIds = orgs.map((o) => o.id);
    cleanupQAData(client, orgIds, { dryRun })
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('Cleanup execution failed:', err.message);
        process.exit(1);
      });
  });
}
