# Architectural & Design Decisions

## Decision 001: Architecture Streamlining (from Next Steps A3)
- **Context**: The master blueprint originally specified a monorepo with `apps/web` (Next.js), `apps/api` (FastAPI), and `apps/worker` (Celery).
- **Decision**: Keep a single Next.js App Router project at the repository root. Use Next.js route handlers, server actions, and Supabase (PostgreSQL with RLS, Auth, Storage) for the backend until an engine truly necessitates a standalone service.
- **Rationale**: Faster single-builder development velocity and leverages the existing Vercel deployment pipeline.

## Decision 002: Design System & CSS Modernization (Step 01)
- **Context**: Existing `app/globals.css` used non-standard color variables (`--ink: #091115`, `--cyan`, `--green`) and fixed absolute positioning for the Live Control Signal card, which broke mobile layouts and caused overlaps.
- **Decision**:
  1. Align all color tokens to the official A2 palette: Void (`#07080A`), Ink (`#0E1013`), Graphite (`#181B1F`), Line (`#2A2E34`), Cream (`#F6F1E7`), Stone (`#A8A496`), Amber (`#F29A3D`), Ember (`#D97A1E`), Gold (`#FFC46B`), Olive (`#4F6440`), Forest (`#2A3827`).
  2. Implement responsive layout using CSS grid / flexbox with modern `clamp()`, safe-area insets, `min-height: 100svh`.
  3. SVG-based responsive scalable rings with `viewBox` instead of fixed pixel wrappers.
  4. Tabular numbers (`font-variant-numeric: tabular-nums`) for jitter-free ticking clocks and metric counters.
  5. Live simulation with hydration safety (post-mount tick) and `prefers-reduced-motion` adherence.

## Decision 003: Addition of puppeteer-core (DevDependency)
- **Context**: Step 01 mandates automated visual regression and QA validation across an 18-viewport device test matrix (320px to 2560px), along with mobile navigation focus-trap and Escape key verification.
- **Decision**: Added `puppeteer-core` as a development-only dependency. It drives the locally installed Google Chrome browser without downloading a bundled Chromium binary (~300MB saved).
- **Rationale**: Enables repeatable, headless device emulation, full-page screenshots, scroll overflow checks, and Lighthouse accessibility audits.
## Decision 004: Front-Page Animation Architecture & Performance Isolation (Step 02)
- **Context**: Step 02 requires animating the homepage (load sequence, headline light sweep, drifting evidence canvas, cursor Truth Lens, card life animations, hover/header glass effects, scroll progress bar, section reveals) while enforcing strict performance rules: animate only `transform` and `opacity`, CLS < 0.05, Mobile Lighthouse Performance >= 85, Mobile Accessibility >= 95, and a complete static version for `prefers-reduced-motion`.
- **Decision**:
  1. **Evidence Canvas (`components/EvidenceCanvas.tsx`)**: Lightweight HTML5 2D Canvas rendering drifting evidence nodes and proximity lines. Automatically scales node density (14–18 on mobile, 24–40 on desktop) based on `navigator.hardwareConcurrency`. Device pixel ratio is capped at 2. Automatically pauses animation frames when scrolled off-screen via `IntersectionObserver` and when the tab is hidden via `visibilitychange`.
  2. **The Truth Lens (`components/TruthLens.tsx`)**: Interactive cursor spotlight powered by CSS `clip-path: circle(...)` and pointer `lerp` easing. Resolves dim compliance claims ("Access reviews completed", "Backups tested quarterly", "Encryption keys rotated") into cryptographically-grounded proof chips (source system, timestamp, hash). On touch devices, automatically executes a gentle figure-8 drift. Hidden under 768px to ensure mobile headline readability.
  3. **Animated Logo Mark (`components/AnimatedLogo.tsx`)**: Dynamic stroke dash-offset draw-in sequence on the V ribbon with SVG glow filter and amber-to-olive gradients, transitioning into the crisp Cream wordmark.
  4. **Performance & Reduced-Motion Isolation**: Zero layout shift (CLS = 0.0000). Production Lighthouse scores: 98/100 Mobile Performance, 100/100 Mobile Accessibility. All animations collapse into static final states with zero movement or flash under `prefers-reduced-motion: reduce`.

## Decision 005: Supabase Auth Architecture, Security Controls, and Split-Screen Portal (Step 03)
- **Context**: Step 03 requires secure authentication matching the Veridex A2 brand aesthetic with email + password, OAuth button placeholders ("Coming soon"), Company SSO link ("Business plan"), password strength validation, route protection for `/app`, and strict security guarantees (generic auth errors, non-revealing password reset, rate-limiting, relative redirect sanitization, httpOnly cookies).
- **Decision**:
  1. **Supabase SSR**: Implemented authentication using `@supabase/ssr` with cookie handling via Next.js `cookies()` (`getAll`/`setAll`) and Next.js Edge Middleware (`middleware.ts`).
  2. **Security Controls**:
     - `lib/security/redirect.ts`: Strict sanitization of `redirectTo` parameter to ensure only relative paths starting with `/` (rejecting protocol-relative `//`, backslashes `\`, external domains) are accepted.
     - `lib/security/rate-limit.ts`: In-memory sliding window rate limiter on auth actions (5 attempts/min for login, 3 attempts/min for password reset).
     - `lib/validations/auth.ts`: Zod schema validation on both server and client for strict email formatting and password complexity (8+ chars, upper, lower, numbers/symbols).
     - Generic errors on login failure ("Email or password is incorrect") and non-revealing generic confirmation on forgot-password recovery to prevent user enumeration.
  3. **Split-Screen UX Architecture (`components/AuthSplitShell.tsx`)**:
     - Left brand panel (desktop >= 992px) featuring animated V mark, drifting evidence canvas, and three rotating proof statements ("Proof over assertion...", "Real-time control intelligence...", "Know which controls are genuinely working...").
     - Right form card with responsive container, 16px minimum text to eliminate iOS zoom, 44px minimum tap targets, Gold focus rings (`var(--gold)`), password show/hide SVG toggles, and dynamic strength meter.
     - Single column layout on mobile (<992px) with a slim top brand strip.
  4. **Workspace Gate (`/app` and `middleware.ts`)**:
     - Middleware guards all `/app/*` routes, redirecting unauthenticated requests to `/login?redirectTo=...` and redirecting authenticated sessions away from public auth pages.
