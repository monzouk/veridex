

**PRODUCT BUILD DOCUMENT**

Enterprise compliance intelligence platform and website. Written for an AI coding agent to build step by step.

| **Field**          | **Detail**                                                                                                                    |
|--------------------|-------------------------------------------------------------------------------------------------------------------------------|
| **Product**        | VERIDEX. Tagline: Truth in every control.                                                                                     |
| **Version**        | 1.0, September 2026                                                                                                           |
| **Builds**         | Public multi-page website + multi-tenant web application + API + background automation                                        |
| **Companion file** | VERIDEX_Product_Blueprint.docx holds strategy, market and pricing reasoning. This file holds what to build and in what order. |







INSTRUCTION TO THE CODING AGENT
Read Part A fully before writing code. Then execute the steps in Part B strictly in order. Do not start a step until the previous step meets its Done when condition. Ask no questions unless a step is impossible; otherwise choose the simplest option that satisfies the step and note the choice in /docs/decisions.md.




**PART A REFERENCE. READ FIRST**

A1. The product in brief

VERIDEX is a compliance intelligence platform. It does not let people type "Compliant" into a box. It connects requirements, controls, SOPs, people, systems and evidence, then **calculates** whether each control is really working, and explains why.

It continuously answers three questions: **What must be true? What is actually true? Can we prove it right now?**

| **Item**             | **Decision**                                                                                                                                                           |
|----------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Target customers** | Regulated and compliance-heavy organisations: pharma, medtech, biotech, IT and security companies, AI-enabled enterprises. First market India, built to sell globally. |
| **Core promise**     | Show which controls look healthy on paper but are not supported by current evidence.                                                                                   |
| **Golden rule**      | Status is always derived from evidence and rules. It is never typed in by a user and never decided by AI.                                                              |
| **AI rule**          | AI may suggest, extract and explain. A human approves. AI never sets a compliance status.                                                                              |

A2. Brand and design system

The logo is a glowing amber V folded with an olive-green ribbon, a cream wordmark and an amber tagline, all on near-black. The whole product must feel like the logo: dark, precise, warm light on deep shadow. Amber is the light, olive is the proof, cream is the text.

Colour palette

| **Name**     | **Hex**      | **Use**                                                   |
|--------------|--------------|-----------------------------------------------------------|
| **Void**     | **\#07080A** | Page background everywhere (marketing and app)            |
| **Ink**      | **\#0E1013** | Cards, panels, navigation                                 |
| **Graphite** | **\#181B1F** | Raised panels, inputs, table headers                      |
| **Line**     | **\#2A2E34** | Borders and dividers                                      |
| **Cream**    | **\#F6F1E7** | Primary text and wordmark colour                          |
| **Stone**    | **\#A8A496** | Secondary text, captions                                  |
| **Amber**    | **\#F29A3D** | Primary accent: buttons, links, highlights, tagline style |
| **Ember**    | **\#D97A1E** | Hover and pressed state of Amber                          |
| **Gold**     | **\#FFC46B** | Glow, focus rings, hairline highlights                    |
| **Olive**    | **\#4F6440** | Secondary accent, proof and verified surfaces             |
| **Forest**   | **\#2A3827** | Deep green panels behind verified content                 |

Status colours (used for control truth states)

| **State**        | **Hex**      | **Icon shape (never rely on colour alone)** |
|------------------|--------------|---------------------------------------------|
| **Verified**     | **\#86AA70** | Solid circle with tick                      |
| **Aging**        | **\#F29A3D** | Half-filled ring                            |
| **Stale**        | **\#E2553F** | Ring with open gap                          |
| **Missing**      | **\#8C9098** | Dashed ring                                 |
| **Contradicted** | **\#E2553F** | Circle split into two halves                |

Design rules

- **Signature gradient:** 135 degrees from Amber to Olive. Use sparingly: one hero word, progress rings, graph edges. Never on body text.

- **Contrast:** all text must reach WCAG AA (4.5:1). Cream or Stone on Void or Ink only. Amber text only for large text or UI on dark backgrounds, never on light.

- **Typography:** headings Sora (semi-bold, generous width, echoes the wide wordmark). Body Inter. Hashes and IDs JetBrains Mono. Small uppercase eyebrow labels in Amber with wide letter spacing, like the tagline.

- **No emojis, emoticons or emote characters anywhere:** not in UI, copy, notifications, emails or empty states. Use custom or Lucide-style SVG line icons (1.5 px stroke) and geometric shapes only.

- **The Fold motif:** two angled planes meeting at a point, taken from the V. Use for section dividers (clip-path), card corner cuts, loading animation and favicon.

- **Motion:** slow and precise, 300 to 700 ms, ease-out. Light sweeps and line drawing rather than bouncing. Respect prefers-reduced-motion with a static equivalent.

- **Logo files:** save the supplied logo as /apps/web/public/brand/veridex-logo-original.png. Recreate the V mark as a clean transparent SVG (veridex-mark.svg) and a horizontal lockup SVG. Derive favicon and app icon from the mark.

- **App theme:** dark by default. A light theme (Cream background, Ink text, deeper amber \#B8600F for text) is optional in Step 15.

A3. Tech stack, repository and data model

| **Layer**          | **Choice**                                                                                                                 |
|--------------------|----------------------------------------------------------------------------------------------------------------------------|
| **Frontend**       | Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion, GSAP (homepage only), React Flow or Cytoscape (graph)       |
| **Backend**        | Python FastAPI, SQLAlchemy, Alembic migrations, Pydantic                                                                   |
| **Database**       | PostgreSQL with pgvector and row-level security. Relationships stored in an edge table first (no separate graph database). |
| **Storage**        | S3-compatible object storage (MinIO locally, S3 in production)                                                             |
| **Jobs and cache** | Redis + Celery (scheduled and event-driven jobs)                                                                           |
| **Search**         | PostgreSQL full-text search first                                                                                          |
| **Auth**           | Email and password, Google, Microsoft, TOTP MFA, OIDC/SAML for the Business tier                                           |
| **Payments**       | Razorpay (INR, India) and Stripe (international)                                                                           |
| **Email**          | Any transactional provider behind a single interface                                                                       |
| **Observability**  | Structured logs and OpenTelemetry                                                                                          |
| **DevOps**         | Docker Compose locally, GitHub Actions CI, containerised deploy                                                            |

Repository layout

> veridex/
>
> apps/web Next.js: public site + /app application
>
> apps/api FastAPI: REST API, engines, AI gateway
>
> apps/worker Celery: scheduled and event jobs
>
> packages/ui Design tokens and shared components
>
> infra/ Docker Compose, deployment files
>
> docs/ decisions.md, API docs, runbooks
>
> seed/ Frameworks and demo organisation data

Core entities

Every table carries tenant_id, created_at, created_by. Requirements, Controls and SOPs are versioned: an edit creates a new version and never overwrites the old one.

| **Entity**                | **Key fields**                                                                                   |
|---------------------------|--------------------------------------------------------------------------------------------------|
| **Requirement**           | source, clause_id, title, summary, version, effective_date, applicability                        |
| **Control**               | objective, owner, frequency, criticality, test_logic (JSON rules), version                       |
| **SOP / Policy**          | title, version, status, effective_date, owner, file                                              |
| **Process, System, Role** | name, owner, criticality or data classification                                                  |
| **Evidence**              | file, sha256, prev_hash, source_system, owner, collected_at, valid_until, confidence, legal_hold |
| **Risk**                  | scenario, likelihood, impact, treatment, residual_risk                                           |
| **Action / CAPA**         | source_control, root_cause, action, owner, due_date, effectiveness_check, closing_evidence       |
| **Audit and Request**     | scope, auditor, period, requests, findings                                                       |
| **AI System, Supplier**   | use_case, model, version, risk_class, monitoring; service, criticality, certificates             |
| **Edge (relationship)**   | from_id, to_id, type, status (suggested or approved), valid_from, valid_to, created_by           |

Edge types: SATISFIED_BY, IMPLEMENTED_BY, EVIDENCED_BY, GENERATED_BY, OWNED_BY, MITIGATES, REQUIRES_TRAINING, IMPACTS. The valid_from and valid_to fields on edges and the append-only evidence rule are what make the Time Machine feature possible. Do not skip them.

A4. Website and application map

The website is a full multi-page product site plus the application. Every route below must exist, load, and be reachable from navigation.

Public website

| **Route**                                                                                    | **Purpose**                                                                  |
|----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------|
| **/**                                                                                        | Interactive homepage (see A5)                                                |
| **/platform**                                                                                | Platform overview with the eight modules                                     |
| **/platform/control-truth-engine**                                                           | Flagship feature page                                                        |
| **/platform/evidence-vault, /compliance-graph, /audit-room, /impact-engine, /ai-governance** | One page per module, same template                                           |
| **/solutions/pharma-medtech, /information-security, /ai-enabled-enterprises**                | Industry pages with tailored examples                                        |
| **/pricing**                                                                                 | Three tiers, monthly and annual toggle, comparison table, FAQ                |
| **/trust**                                                                                   | Trust centre: security practices, data handling, sub-processors, status link |
| **/resources and /resources/\[slug\]**                                                       | Blog and guides written in MDX. Ship three starter articles.                 |
| **/docs**                                                                                    | Public product and API documentation                                         |
| **/demo**                                                                                    | Guided read-only sandbox with seeded data, no signup needed                  |
| **/contact**                                                                                 | Book a demo form (saved to database and emailed)                             |
| **/about, /legal/privacy, /legal/terms, /legal/dpa**                                         | Company and legal pages using clean templates                                |
| **/login, /signup, /verify/\[id\]**                                                          | Authentication, and public Proof Seal verification                           |

Application (after login)

| **Route**                                  | **Purpose**                                                             |
|--------------------------------------------|-------------------------------------------------------------------------|
| **/app**                                   | Executive Cockpit                                                       |
| **/app/controls and /app/controls/\[id\]** | Control list and Control Truth detail with evidence chain               |
| **/app/requirements, /app/sops**           | Requirements library and SOP library                                    |
| **/app/evidence**                          | Evidence Explorer                                                       |
| **/app/graph**                             | Interactive Compliance Graph                                            |
| **/app/actions**                           | Action Centre (issues and CAPA)                                         |
| **/app/impact**                            | Impact Centre                                                           |
| **/app/audit**                             | Audit Room and evidence packs                                           |
| **/app/time-machine, /app/radar**          | Signature features (see A6)                                             |
| **/app/assistant, /app/ai-governance**     | Evidence-grounded assistant; AI system inventory                        |
| **/app/settings**                          | Organisation, users and roles, integrations, billing, API keys          |
| **/admin**                                 | Internal console: tenants, plans, usage, feature flags (your team only) |

A5. Homepage specification: "The Truth Lens"

The homepage must not look like a template. Its idea: **most compliance dashboards show what is claimed; VERIDEX shows what is proven.** The visitor discovers this by interacting. Build these six sections in this order. Use canvas or SVG with Framer Motion or GSAP. No emojis, no stock illustrations, no video required.

| **\#** | **Section**                       | **What it does**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
|--------|-----------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **1**  | Hero: the Lens                    | Black screen, the V mark draws itself as a glowing outline, then the tagline fades in. Behind it floats a dim field of compliance claims in Stone text (for example "Access reviews completed", "Backups tested quarterly", "Suppliers certified"). The cursor is an amber lens (radial mask about 180 px). Inside the lens each claim resolves into its proof: a small chip showing source, timestamp and a short hash in mono text, or a broken-line mark reading "No evidence". On touch devices the lens follows the finger, or drifts automatically if idle. |
| **2**  | Paper versus Proof                | A full-width split view with a draggable divider. Left side: a dashboard claiming 97 percent compliant. Right side: the same dashboard recalculated from evidence, showing 61 percent with failing controls marked. Dragging the divider wipes between the two.                                                                                                                                                                                                                                                                                                   |
| **3**  | The Why Chain                     | A horizontal chain of nodes: Evidence, Control, Requirement, Risk, Owner, Action. One node is broken. Clicking it lights the chain in sequence with amber light and shows a one-sentence explanation at each step.                                                                                                                                                                                                                                                                                                                                                |
| **4**  | Evidence decay                    | A slider labelled with days. Dragging it moves time forward. A progress ring loses confidence gradually and the control state changes from Verified to Aging to Stale, with a forecast line "Fails in 12 days without new evidence".                                                                                                                                                                                                                                                                                                                              |
| **5**  | Modules and Proof Seal            | Module cards with line icons and a Fold-shaped corner cut. Below them, an audit evidence pack "seals" with an animated hash, and a visitor can paste any text to see verification fail if a single character changes.                                                                                                                                                                                                                                                                                                                                             |
| **6**  | Pricing teaser and call to action | Three tiers in brief, then two buttons: Try the live demo (goes to /demo) and Book a demo. Footer with full sitemap.                                                                                                                                                                                                                                                                                                                                                                                                                                              |

Homepage quality rules

- Everything works with mouse, touch and keyboard. Interactive elements have visible Gold focus rings.

- prefers-reduced-motion shows a static version of every section with the same information.

- Lighthouse on mobile: performance 90 or higher, accessibility 95 or higher. Lazy-load sections below the hero. Total initial JavaScript under 250 KB gzipped where possible.

- All copy is short, confident and plain. No jargon in headlines.

A6. Signature features (the differentiators)

These are built into one platform. As far as I know, no mainstream compliance product combines all of them, but market copy should say "built in", not "the only". Verify against competitors before making exclusivity claims.

| **Feature**                 | **What it does**                                                                                                                                  | **Built in step** |
|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|-------------------|
| **Control Truth Engine**    | Calculates control status from evidence, freshness, ownership and exceptions. Status cannot be typed in.                                          | Step 7            |
| **Evidence Decay Curve**    | Evidence confidence fades continuously, based on evidence type, instead of flipping at an expiry date. Forecasts when each control will go stale. | Step 11           |
| **Compliance Time Machine** | Pick any past date and see exactly which controls were verified, with which evidence and owners, on that day. Built from append-only history.     | Step 11           |
| **Contradiction Radar**     | Cross-checks evidence between sources, for example an HR record says the person left while the access system shows an active account.             | Step 11           |
| **Rubber-Stamp Detector**   | Flags controls that are performed for show: approvals within seconds, identical evidence templates, and bulk uploads just before audit windows.   | Step 11           |
| **Blast Radius Simulator**  | Before changing an SOP, system or supplier, simulate which controls, people, training and audit evidence would be affected.                       | Step 11           |
| **Proof Seal**              | Audit evidence packs carry a signed hash manifest and a public verification page, so an auditor can check integrity independently.                | Step 10           |
| **Audit Rehearsal**         | An AI plays the auditor, asks likely questions from your scope, and scores readiness with the exact evidence gaps.                                | Step 11           |

**PART B BUILD STEPS. DO IN ORDER**

Each step lists what to build and a Done when test. Write automated tests as you go. Commit after every completed step.

**STEP 01** Foundation

A running project with the brand baked in.

**BUILD**

- Create the monorepo from A3. Docker Compose starts Postgres (pgvector), Redis, MinIO, API, web and worker.

- Put the A2 colours and fonts in one design-token file, exposed as CSS variables and a Tailwind theme.

- Build base components in packages/ui: Button, Input, Card, Badge, Table, Modal, Tabs, Toast, StatusIcon (five truth states), TruthRing.

- Add CI: lint, type check and tests on every push.

> **Done when:** docker compose up starts everything, and /dev/ui shows every component in the brand colours.

**STEP 02** Public website

All public pages from A4, real content, fully responsive.

**BUILD**

- Shared layout: header with a mega menu (Platform, Solutions, Pricing, Resources), footer with full sitemap, dark theme.

- Build every public route from A4 except the homepage interactions. Write concise professional copy for each page from the content in this document.

- Add SEO metadata, Open Graph images, sitemap.xml and robots.txt.

- Contact form saves to the database and emails the team. Resources use MDX with three starter articles. Legal pages use clean templates.

> **Done when:** every public route loads on mobile and desktop, forms work, and Lighthouse shows 90 or higher for performance, accessibility and SEO.

**STEP 03** Interactive homepage

Implement A5 exactly.

**BUILD**

- Build the six sections in order with Framer Motion, GSAP and canvas or SVG.

- Add the reduced-motion and touch fallbacks.

- Build the animated V mark from the SVG created in Step 1.

> **Done when:** all six sections work with mouse, touch and keyboard, the reduced-motion version shows the same information, and the mobile Lighthouse targets in A5 are met.

**STEP 04** Accounts, tenancy and roles

Secure multi-tenant foundation.

**BUILD**

- Sign up, email verification, login, password reset, TOTP MFA, Google and Microsoft sign-in. Add OIDC/SAML behind a feature flag for the Business tier.

- Organisation (tenant) model. Enforce isolation with Postgres row-level security on every table using tenant_id.

- Roles: Owner, Compliance Admin, Control Owner, Contributor, Auditor (read-only, expiring access), Viewer.

- Immutable audit log of security-relevant actions.

- Onboarding wizard: organisation name, industry, frameworks, invite team, then either load the demo data or start blank.

> **Done when:** an automated test proves that two organisations cannot read each other's data, and roles correctly limit both screens and API calls.

**STEP 05** Core data and API

The entities from A3, with history.

**BUILD**

- Create migrations for all entities. Build a REST API with OpenAPI docs, pagination and filtering.

- Implement versioning for Requirements, Controls and SOPs. Never overwrite.

- Implement the Edge table with suggested and approved status and valid_from and valid_to.

- Seed framework requirement sets for ISO 27001, ISO 37301, ISO 42001, SOC 2 and India DPDP Act 2023. Use clause IDs and your own short summaries. Do not paste copyrighted standard text.

- Build list, create and edit screens in /app for requirements, controls and SOPs.

> **Done when:** every entity can be created and edited through the API and the UI, edits create new versions, and edges keep their history.

**STEP 06** Evidence Vault

The proof layer.

**BUILD**

- Upload PDF, DOCX, XLSX, CSV and images to object storage. Compute SHA-256 on upload and store metadata from A3.

- Append-only rule: replacing evidence creates a new linked version. Nothing is deleted. A legal-hold flag blocks any removal.

- Store the previous record's hash in each new record so the chain is tamper-evident. Add a nightly job that verifies the chain and file hashes.

- Extract text from documents, with OCR for scans, and index it for search.

- Build the Evidence Explorer: search, filters, freshness badge, hash display, linked controls.

> **Done when:** an uploaded file appears in the Explorer with its hash and freshness, and altering a stored file is detected by the verification job.

**STEP 07** Control Truth Engine

The flagship feature.

**BUILD**

- Each control has test_logic as JSON: required evidence types, frequency, maximum age, minimum count, required approver or signature, allowed exceptions.

- The engine computes a truth state (Verified, Aging, Stale, Missing, Contradicted), a Truth Score from 0 to 100, and a list of machine-readable reasons.

- Track design effectiveness and operating effectiveness as two separate results.

- Recalculate when evidence is added, when rules or edges change, and every hour as time passes.

- Status cannot be edited. An override needs an exception record with reason, approver and expiry.

- Build the Why Chain endpoint: failed evidence, control state change, affected requirement, risk, owner, recommended action, evidence needed to close.

- Build the Control detail page showing state, reasons, evidence chain and history.

> **Done when:** unit tests cover every state and transition, and the Control page explains any status in plain language with links to evidence.

**STEP 08** Core application screens

The daily workspace.

**BUILD**

- Executive Cockpit: control health, critical failures, evidence coverage, overdue actions, audit readiness. Every number is clickable and opens the records behind it.

- Action Centre for issues and CAPA. An action is created from a failing control, has an owner and due date, and cannot close without closing evidence.

- Notifications in the app and by email when a control changes state or an action is due.

> **Done when:** a user can log in, see the cockpit, drill into a failed control, create and assign an action, and close it with evidence.

**STEP 09** Compliance Graph

The relationship explorer.

**BUILD**

- Interactive graph of Requirement, Control, SOP, Evidence and Risk with filters by framework, state and owner.

- Style nodes and edges in the brand palette. Broken or missing links are dashed brick red. Use the same visual language as the homepage.

- Selecting a failing control highlights its Why Chain.

> **Done when:** the graph renders 500 nodes smoothly, and selecting a failing control highlights its chain end to end.

**STEP 10** Audit Room and Proof Seal

Turn evidence into an audit-ready pack.

**BUILD**

- Auditor request workflow: a request resolves automatically to its requirement, control and evidence chain, then a completeness check runs.

- Evidence pack export: PDF cover, index, evidence files, traceability page and manifest.json with all hashes. Sign the manifest with a server key.

- Public page /verify/\[id\] validates a pack and shows pass or fail.

- Read-only auditor portal with expiring invitation links.

- If evidence is incomplete, the pack says so clearly. It never shows a false green.

> **Done when:** a pack can be generated for a chosen set of controls, /verify confirms it, and changing any file in the pack makes verification fail.

**STEP 11** Signature features

Build the differentiators from A6 in this order.

**BUILD**

- Evidence Decay Curve, with per-evidence-type half-lives and a stale forecast on every control.

- Compliance Time Machine at /app/time-machine, using valid_from and valid_to and the append-only history.

- Contradiction Radar and Rubber-Stamp Detector at /app/radar, with explainable rules (list which rule fired and on what data).

- Blast Radius Simulator on SOP, system and supplier edit screens.

- Audit Rehearsal at /app/audit, using the AI layer from Step 13 once it exists (stub it now, complete it in Step 13).

> **Done when:** each feature has its own screen, tests, and an on-page explanation of how its result was calculated.

**STEP 12** Impact Engine

From change to action.

**BUILD**

- Change events: new SOP version, requirement update, system change, role change, supplier certificate expiry.

- Traverse the graph to produce an impact set: affected controls, SOPs, risks, training, suppliers and evidence.

- A human approves the impact set. Approval creates assigned actions.

> **Done when:** editing an SOP produces an impact assessment listing affected controls, training and risks, and approving it creates actions with owners.

**STEP 13** AI layer

Assistive only, always with sources.

**BUILD**

- Build a provider-agnostic model gateway configured by environment variables. Log prompts and outputs per tenant. Never train on customer data.

- Features: requirement extraction from uploaded text, mapping suggestions (approve or reject), evidence classification, natural-language questions over the tenant's data using pgvector retrieval, and Audit Rehearsal.

- Every AI answer shows: conclusion, confidence, evidence used, evidence age, affected objects, recommended action, approval status.

- AI output can never set a truth state. Suggested edges stay in suggested status until a human approves.

> **Done when:** asking "which controls have stale evidence?" returns an answer with clickable sources, and no AI suggestion takes effect without human approval.

**STEP 14** Commercial layer

Everything needed to sell without manual help.

**BUILD**

- Billing: Razorpay for INR and Stripe for international. Plans Pilot, Professional and Business, free trial, plan limits (users, storage, frameworks), invoices with GST fields.

- Integrations v1 through one adapter interface: Microsoft 365 and SharePoint, Google Drive, Jira, and a generic webhook and API-key endpoint. Each connector pulls evidence on a schedule.

- Internal /admin console: tenants, plans, usage, feature flags.

- Slack and Teams notification webhooks. Public API documentation and API key management.

> **Done when:** a new visitor can sign up, pay, onboard, connect a source and reach a working cockpit with no help from you.

**STEP 15** Hardening and launch

Make it safe and ready to sell.

**BUILD**

- Encryption in transit and at rest, secrets manager, rate limiting, dependency and code scanning, tested backups and restore.

- Separate development, staging and production environments with deployment through CI.

- OWASP Top 10 review, penetration-test checklist, load test, WCAG 2.2 AA accessibility audit.

- Publish the Trust page, help centre, status page and terms. Optional light theme for the app.

> **Done when:** the launch checklist is fully green, production deploys from CI, and a restore from backup has been tested.

**PART C AUTOMATION, DEMO DATA AND QUALITY GATES**

C1. Automation (what runs without a human)

| **Schedule or trigger**          | **Job**                                                                                                  |
|----------------------------------|----------------------------------------------------------------------------------------------------------|
| **Every hour**                   | Recalculate all truth states and decay scores                                                            |
| **Daily**                        | Evidence expiry warnings at 30, 14 and 7 days. Email digest to control owners. Overdue action reminders. |
| **Weekly**                       | Executive summary email with changes since last week                                                     |
| **Nightly**                      | Hash chain and file integrity verification. Backups.                                                     |
| **On evidence upload**           | Hash, extract text, classify, link suggestions, recalculate affected controls                            |
| **On SOP or requirement change** | Run Impact Engine and notify owners                                                                      |
| **On schedule per connector**    | Pull evidence from connected systems and run Contradiction Radar                                         |
| **On billing events**            | Activate, upgrade, suspend and email invoices automatically                                              |

C2. Demo organisation

Create a seeded demo organisation used by /demo and by tests. It must show every state: about 60 controls across ISO 27001 and ISO 42001, 40 SOPs, 200 evidence items, some Verified, some Aging, some Stale, some Missing, at least three Contradicted, one broken Why Chain, one Rubber-Stamp flag, and one completed audit pack. Use fictional company data only.

C3. Quality gates for every step

- Automated tests for all business logic, especially the Truth Engine, tenant isolation and hash verification.

- No emojis or emoticons anywhere in the codebase output, checked by a lint rule.

- Every screen has loading, empty and error states in the brand style.

- Keyboard accessible, WCAG AA contrast, responsive from 360 px upwards.

- Every API endpoint checks tenant and role. No endpoint returns data without a tenant filter.

- Record any assumption in /docs/decisions.md. Update the README after each step.
