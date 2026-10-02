

**NEXT STEPS BUILD DOCUMENT**

Continue the existing VERIDEX code: fix the front page, animate it, add login, then build the flagship features.

| **Field**           | **Detail**                                                                                                                                                                          |
|---------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Version**         | 2.0, 30 September 2026                                                                                                                                                              |
| **Current state**   | Front page built with Next.js (App Router) in the GitHub repository "veridex" and deployed on Vercel.                                                                               |
| **Order of work**   | 1\. Fix the Live Control Signal card and logo. 2. Animate the front page. 3. Login and account pages. 4. App shell. 5. Data foundation. 6. Truth Engine. 7 to 9. Flagship features. |
| **Companion files** | VERIDEX_Product_Build_Document holds the full product plan. This document covers the current work and overrides it where they differ (see A3).                                      |







INSTRUCTION TO THE CODING AGENT
The existing repository is the source of truth. Do not rewrite or restructure it. Read Part A, then do the steps in Part B one at a time, in order. After each step, stop and report: what changed, how to test it, and what comes next. Wait for approval before starting the next step.




**PART A WHERE WE ARE AND GROUND RULES**

A1. Current state

| **Item**      | **Detail**                                                                                                                                                                                                                              |
|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Stack**     | Next.js App Router with TypeScript. Files: app/globals.css, app/layout.tsx, app/page.tsx, public/veridex-logo.png, next.config.ts, tsconfig.json, package.json.                                                                         |
| **Built**     | One front page: header with logo and Talk to us button, eyebrow line, headline "Truth in every control.", supporting text, two buttons, a trust line, and the Live Control Signal card (Trust Index 98.4, evidence integrity Verified). |
| **Problem 1** | On phones the tilted Live Control Signal card is positioned over the trust line ("Built for..."), so text is hidden behind it, and the card is cut off at the bottom of the screen.                                                     |
| **Problem 2** | The logo image shows as a black rectangle because the PNG has a baked-in black background that does not match the page.                                                                                                                 |
| **Problem 3** | The page is mostly static and there is no login.                                                                                                                                                                                        |

A2. Ground rules

- Keep and extend the existing brand tokens and colours in globals.css. The palette is in the first build document (A2): Void \#07080A, Ink \#0E1013, Cream \#F6F1E7, Amber \#F29A3D, Gold \#FFC46B, Olive \#4F6440.

- No emojis, emoticons or emote characters anywhere. Use SVG line icons only.

- TypeScript strict mode. Add a new library only when it is needed and say why in docs/decisions.md.

- Work on a feature branch per step (for example step-1-responsive-fix) and open a pull request. Vercel then gives a preview link that can be tested on a real phone.

- Never commit secrets. Confirm .gitignore covers node_modules and every .env file. Provide .env.example with variable names only.

- Commit small and often with clear messages.

A3. Decisions that update the first build document

| **Topic**           | **First document**                  | **Now**                                                                                                                        |
|---------------------|-------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| **Structure**       | Monorepo with apps/web and apps/api | Keep the single Next.js app at the repository root. No restructuring.                                                          |
| **Backend**         | Separate FastAPI service            | Next.js route handlers and server actions plus Supabase (Postgres, Auth, Storage) until an engine truly needs its own service. |
| **Everything else** | Steps 1 to 15                       | Unchanged. Continue from Step 8 of that document after Step 9 here (see Step 10).                                              |

Reason: it is faster for one builder, and the site already runs on Vercel.

Device test matrix (used in Steps 1 and 2)

| **Device class**              | **Viewport widths (CSS px) to test**                                     |
|-------------------------------|--------------------------------------------------------------------------|
| **Small and standard phones** | 320, 360, 375, 390, 412, 430 (portrait), and 667 to 932 wide (landscape) |
| **Tablets**                   | 768, 820, 1024                                                           |
| **Laptops and MacBooks**      | 1280, 1440, 1512 (14 inch MacBook), 1728 (16 inch MacBook)               |
| **Large desktops**            | 1920, 2560                                                               |

**PART B BUILD STEPS. DO IN ORDER**

**STEP 00** Onboard yourself to the repository

Understand the code before changing it.

**BUILD**

- Read the whole repository. Run npm install and npm run dev and confirm the front page opens at localhost:3000.

- Create AGENTS.md in the repository root with: project summary, stack, folder map, brand colours and fonts, the no-emoji rule, the ground rules in A2, and the commands to run and build.

- Create a docs folder with decisions.md and a qa folder. Copy this document and the first build document into docs.

- Report any existing problems found (build warnings, unused files, missing .gitignore entries) without fixing them yet.

> **Done when:** the site runs locally, AGENTS.md and docs exist, and you have posted a short summary of the codebase.

**STEP 01** Fix the Live Control Signal card, layout and logo

The front page must look correct on every phone, tablet, laptop and desktop.

**BUILD**

- **Reproduce first.** Open the page at 360, 390 and 412 wide in browser device mode and save before screenshots in docs/qa. Cause to fix: the card is absolutely positioned and rotated on small screens, covers the trust line and runs past the bottom of the viewport; the rings use fixed pixel sizes.

- **Phones (under 768 wide):** one column in this order: eyebrow, headline, text, buttons, trust line, then the card centred below with clear spacing. The card has no rotation, no absolute positioning and no negative margins. Width is min(100%, 360px).

- **Tablets (768 to 1023):** single centred column, card up to 420px wide.

- **Laptops and up (1024 and wider):** two columns, text left and card right. Container max width 1440 centred so 1920 and 2560 screens stay balanced. The card may tilt up to 6 degrees with the pointer, only where (hover: hover) and (pointer: fine) apply. On touch devices it stays flat.

- **Card internals:** build the rings as one SVG with a viewBox so they scale with the card. All text sizes use clamp(). No fixed heights. The footer row (Evidence integrity, Verified) must always be fully visible. Use tabular numbers for the clock and index.

- **Live behaviour:** the UTC clock ticks every second (render it after mount to avoid a hydration mismatch). The Trust Index eases smoothly between 98.1 and 98.7 every few seconds. Add a small Stone-coloured tag "Illustrative signal" so the sample data is honest. Pause updates when the tab is hidden. With reduced motion, show static values.

- **Viewport:** hero uses min-height 100svh, not 100vh. Export a Next.js viewport with width=device-width, initial-scale=1, viewport-fit=cover. Add safe-area padding. There must be no horizontal scroll at any width.

- **Headline:** font size clamp(2.5rem, 8vw, 5.5rem) with tight leading. "Truth in every control." must wrap cleanly at 320 wide.

- **Logo:** replace the PNG in the header with a transparent SVG (the V mark plus the VERIDEX wordmark), or a transparent PNG. Until it exists, apply mix-blend-mode: screen as a stopgap. Use next/image with alt text. Minimum logo height 32px on phones.

- **Navigation:** the hamburger opens a full-screen overlay with Platform, Solutions, Pricing, Resources and Login. Trap focus inside it and close it on Escape.

> **Done when:** there is no overlap, no clipped content and no horizontal scroll at any width in the test matrix, screenshots for every width are saved in docs/qa, and Lighthouse mobile accessibility is 95 or higher.

**STEP 02** Animate the front page

Make the page feel alive and premium without slowing it down.

**BUILD**

- **Load sequence (about 2 seconds):** the V mark draws itself with a glowing stroke. The eyebrow line grows. Headline words rise and fade in one after another, about 80 ms apart. Then the text and buttons fade in. The card arrives last.

- **Headline light sweep:** a slow amber light passes across the word "control." every six seconds. The amber to olive gradient is used only here and on rings.

- **Background:** slow drifting amber and green glows, concentric rings that rotate and pulse gently, and a faint canvas of thin evidence lines linking drifting nodes (18 nodes on phones, up to 40 on desktop). Cap device pixel ratio at 2. Pause when off screen or when the tab is hidden.

- **Cursor lens (desktop only):** an amber spotlight follows the pointer with easing. A dim layer of claims sits behind the hero, such as "Access reviews completed" and "Backups tested quarterly". Inside the lens each claim resolves into proof: a small chip with source, time and a short hash, or a broken line marked "No evidence". On touch devices the lens drifts automatically.

- **Card life:** the Trust Index counts up from 0 to 98.4 on load. A scan line passes over the fingerprint icon. The outer ring pulses slowly. A soft breathing glow sits behind the card.

- **Buttons and header:** the primary button fills with a light sweep on hover and its arrow nudges forward. The secondary link draws its underline. The header turns into blurred glass after 24 px of scroll and the logo shrinks slightly.

- **Scroll:** sections reveal once with a 24 px rise and fade. Numbers count up when visible. A thin amber progress line sits at the top of the page.

- **Performance rules:** animate only transform and opacity. Use IntersectionObserver for triggers. Keep will-change to a minimum. Reduce node counts on low-power devices (for example navigator.hardwareConcurrency of 4 or less). Layout shift under 0.05. Keep mobile Lighthouse performance at 85 or higher.

- **Accessibility:** with prefers-reduced-motion, show the final state of every section with no movement. Nothing may flash more than three times per second.

> **Done when:** the page feels animated on desktop and phone, reduced motion shows a complete static version, and the performance and layout shift targets are met.

**STEP 03** Login and account pages

A secure sign-in that matches the brand.

**BUILD**

- **Provider:** use Supabase Auth with the @supabase/ssr package (email and password, Google, Microsoft, TOTP two-factor prepared for later). Record the choice in docs/decisions.md.

- **Routes:** /login, /signup, /forgot-password, /reset-password, /auth/callback, and sign out. Add Login to the header and the mobile menu.

- **Desktop layout of /login:** split screen. Left half is a brand panel with the animated V mark, slow evidence lines and three short rotating statements about proof. Right half is the form card. On phones it is a single column with a slim brand strip on top.

- **Form:** email, password with a show and hide toggle (SVG icon), Keep me signed in, Forgot password, primary Sign in button with a loading state, an "or continue with" divider, Google and Microsoft buttons, and a Company SSO link marked as a Business plan feature. Footer: New to Veridex? Create account or Book a demo.

- **Quality:** labels on every input, correct autocomplete attributes, 16 px minimum input text (stops iOS zoom), 44 px minimum tap targets, Gold focus rings, works with password managers.

- **Security:** validate on the server with zod. Use a generic error ("Email or password is incorrect"). The forgot-password screen never reveals whether an account exists. Rate limit attempts. Only allow relative redirect paths. Use httpOnly session cookies. Middleware protects everything under /app and redirects logged-out visitors to /login.

- **Signup:** email and password with strength hint, email verification, and Terms and Privacy links.

- **Environment variables:** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY (server only). List them in .env.example.

> **Done when:** a new user can sign up, verify email, log in, reach /app, log out, and reset a password, and a logged-out visitor cannot open any /app page.







TASKS ONLY THE OWNER CAN DO FOR STEP 3
Create a free Supabase project and copy its URL and anon key. Create Google and Microsoft (Entra) OAuth apps and paste their client IDs into Supabase. Add the Supabase callback URL and your Vercel address as allowed redirects. Add the environment variables in Vercel and in .env.local. The agent must list these as a checklist and not attempt them.




**STEP 04** App shell

The place users land after login.

**BUILD**

- Build /app with a left sidebar (a bottom tab bar on phones), top bar with organisation name and user menu with Sign out. Pages: Overview, Controls, Evidence, Proof Debt, Settings. Unbuilt pages show a designed empty state.

- Overview shows an empty-state Trust Index ring and a clear "Add your first control" action.

- Loading skeletons, error states and full keyboard navigation on every page.

> **Done when:** a logged-in user sees the shell on phone, tablet and desktop, and every link works.

**STEP 05** Data foundation

The tables and rules that everything else stands on.

**BUILD**

- In Supabase create: organisations, memberships (with role), controls, evidence, and control_evidence links. Add tenant_id to every table and enforce isolation with row-level security.

- First-run onboarding creates the organisation. Roles: Owner, Admin, Control Owner, Auditor (read only), Viewer.

- Evidence upload to Supabase Storage. Compute SHA-256 on upload. Evidence is append-only: replacing creates a new version linked to the old one, storing the previous hash for a tamper-evident chain.

- Add a "Load demo data" button that seeds about 30 fictional controls and 80 evidence items in mixed conditions.

> **Done when:** an automated test proves two organisations cannot see each other's data, and uploaded evidence appears with its hash and date.

**STEP 06** Control Truth Engine v1

Status calculated from evidence, never typed in.

**BUILD**

- Each control has test rules: required evidence types, maximum age in days, minimum number of items.

- Compute a state (Verified, Aging, Stale, Missing), a Truth Score from 0 to 100, and a list of plain-language reasons. Contradicted arrives later with the Contradiction Radar.

- Recalculate when evidence changes and every hour using a Vercel Cron job. Users cannot edit a state. An override needs a recorded reason, approver and expiry date.

- Show state, reasons and the evidence behind it on the control page. Use the shapes and colours from the first build document (A2, status colours).

> **Done when:** unit tests cover every state and transition, and every status can be explained in plain language with links to its evidence.

**STEP 07** Proof Debt (flagship feature)

Build the feature described in C1.

**BUILD**

- Build /app/proof-debt exactly as specified in C1: the Proof Debt number, Audit Readiness Date, burn-down chart, and the Pay Down First list.

- Store a weekly snapshot of Proof Debt for the trend chart.

- Every number has an "Explain" panel showing the formula and the controls that contribute.

> **Done when:** the page shows correct figures for the demo data, the formulas are visible in the UI, and unit tests confirm the calculations.

**STEP 08** Self-revoking Proof Passport

Build the feature described in C2.

**BUILD**

- Owner selects which claims to publish and sets expiry. Public page /passport/\[slug\] shows only the claims, freshness band and signature. Never raw evidence.

- Sign each claim with an Ed25519 server key. Add a public verify endpoint.

- When the underlying control turns Stale or Contradicted, notify the owner, wait the grace window, then mark the claim Under review automatically.

> **Done when:** a claim goes to Under review by itself when its control fails, and a copied or altered claim fails verification.

**STEP 09** Compliance Fire Drills

Build the feature described in C3.

**BUILD**

- Build /app/drills with six ready scenarios. Drills run on a simulated copy and never change real data.

- Record detection time, owner response time, actions created and score impact. Save the Drill Report as evidence linked to continual-improvement controls.

> **Done when:** a drill can be started and finished, and its report appears in the Evidence Explorer.

**STEP 10** Continue the main plan

Return to the first build document.

**BUILD**

- Continue from its Step 8 onward (screens, Compliance Graph, Audit Room and Proof Seal, Contradiction Radar and other signature features, Impact Engine, AI layer, billing, launch), applying the decisions in A3.

- Add the Physical Evidence Bridge (C4) when the first paying customer needs site controls.

> **Done when:** the agent has produced an updated plan in docs/decisions.md and awaits approval.

**PART C FEATURE SPECIFICATIONS**

A note on originality: as far as I know, mainstream compliance tools track control status, collect evidence and publish trust centres, but I am not aware of any that combine the four ideas below. I cannot guarantee that none exist. Check competitors before claiming exclusivity in marketing.

C1. Proof Debt (flagship)

Software teams understand technical debt. Compliance teams have the same problem with no number for it. **Proof Debt** is the amount of work owed to make every control truly provable today.

| **Element**              | **Specification**                                                                                                                                                                             |
|--------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Proof Debt**           | Total in "proof-hours". For each control: effort_hours x (1 - truth_score / 100) x criticality_weight x interest. Total is the sum across all controls.                                       |
| **Criticality weight**   | Low 1, Medium 2, High 3 (editable).                                                                                                                                                           |
| **Interest**             | 1 + (days_unproven / 90), capped at 2. Multiplied by 1.5 in the 30 days before a scheduled audit.                                                                                             |
| **Effort hours**         | Editable defaults per control type, for example quarterly access review 6, policy review 3, training completion 4, backup restore test 8.                                                     |
| **Risk-days unproven**   | For each control, days since last valid evidence x criticality weight. Shown as a second number.                                                                                              |
| **Audit Readiness Date** | Today plus total debt divided by team capacity (hours per week, entered by the user), critical controls first. Compared with the audit date: "Audit on 2 Nov. Ready on 14 Nov. Gap: 12 days." |
| **Pay Down First**       | Controls ranked by debt removed per hour of work, so the owner knows what to fix first.                                                                                                       |
| **Burn-down**            | Weekly snapshots plotted as a trend line with a projected finish.                                                                                                                             |
| **Transparency**         | Every figure has an Explain panel showing the formula and inputs. Nothing is a black box.                                                                                                     |

Why it sells: it gives a CEO or CFO one number they can budget, track and be held to, and it turns audit preparation from a panic into a plan.

C2. Self-revoking Proof Passport

A public, shareable page that customers and partners can check instead of sending security questionnaires. The difference from a normal trust page: every claim is calculated from evidence, cryptographically signed, and expires.

- Claims read like "Access reviews performed in the last 90 days", each with status, a freshness band (for example 0 to 30 days) and a signature. No files or raw evidence are ever shown.

- Each claim expires (default 30 days) and renews only if the control still passes.

- If a control turns Stale or Contradicted, the owner is warned first. After a grace window (default 72 hours) the claim turns to Under review automatically, and visitors see that.

- Anyone can verify a claim through a public verification page or endpoint.

C3. Compliance Fire Drills

Scheduled, simulated failures that test whether the organisation notices and responds, like a fire drill. Results become evidence of preparedness.

| **Scenario**                           | **What is simulated**                                   |
|----------------------------------------|---------------------------------------------------------|
| **Supplier certificate expires today** | A critical supplier certificate lapses                  |
| **Control owner leaves**               | The owner of many controls resigns                      |
| **Silent integration**                 | An evidence source stops sending data for seven days    |
| **Regulator request**                  | An inspector asks for specific evidence within 48 hours |
| **Restore test failure**               | A backup restore test fails                             |
| **Policy changed without retraining**  | A key SOP changes and training is not updated           |

Each drill measures detection time, owner response time, actions raised and score impact, and produces a Drill Report saved as evidence.

C4. Physical Evidence Bridge

Imports access-control logs, visitor registers, biometric attendance exports and sensor data (CSV or API) as evidence for physical-security and site controls. It feeds the Contradiction Radar, for example flagging server room entry by someone without approved access. This is valuable in regions where physical controls are still recorded in registers and spreadsheets.
