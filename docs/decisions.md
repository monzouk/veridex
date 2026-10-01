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

