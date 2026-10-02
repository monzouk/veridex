# AGENTS.md — VERIDEX Project Guide

## 1. Project Summary
**VERIDEX** is an enterprise compliance intelligence platform and website. Tagline: *"Truth in every control."*
Unlike traditional compliance platforms where users manually mark controls as "Compliant", VERIDEX connects requirements, controls, SOPs, people, systems, and evidence, then **calculates** whether each control is truly working and explains why.
- **Core Promise**: Reveal which controls appear healthy on paper but lack fresh, valid, tamper-evident evidence.
- **Golden Rule**: Status is always derived from evidence and rules. It is never typed in by a user and never decided by AI.
- **AI Rule**: AI may suggest, extract, and explain. A human approves. AI never sets a compliance status.

## 2. Technology Stack
- **Framework**: Next.js (App Router) with TypeScript (Strict mode).
- **Styling**: Vanilla CSS tokens and custom layout in `app/globals.css` with Tailwind CSS utilities available.
- **Icons**: Lucide React (`lucide-react`) line icons (1.5px stroke). **Strictly no emojis, emoticons, or emote characters.**
- **Backend / Data (Current Architecture Decision)**: Next.js route handlers and server actions + Supabase (PostgreSQL with RLS, Auth, Storage) until an engine truly needs its own service.
- **Runtime**: Node.js v20+ / v22+ LTS.

## 3. Repository Folder Map
```
veridex/
├── app/
│   ├── globals.css         # Design system tokens, responsive layout styles
│   ├── layout.tsx          # Root HTML layout, Inter font, metadata
│   └── page.tsx            # Interactive homepage ("The Truth Lens")
├── docs/
│   ├── decisions.md        # Architecture and design decision log
│   ├── qa/                 # Visual QA screenshots and responsiveness tests
│   ├── VERIDEX_Next_Steps.md # Active roadmap and current build instructions
│   └── VERIDEX_Product_Build_Document.md # Master specification
├── public/
│   └── veridex-logo.png    # Original asset (to be superseded by transparent vector)
├── AGENTS.md               # Onboarding and ground rules for agents
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration (strict mode)
```

## 4. Brand Colours and Fonts

### Brand Palette (A2)
- **Void** (`#07080A`): Page background everywhere (marketing and app).
- **Ink** (`#0E1013`): Cards, panels, navigation.
- **Graphite** (`#181B1F`): Raised panels, inputs, table headers.
- **Line** (`#2A2E34`): Borders and dividers.
- **Cream** (`#F6F1E7`): Primary text and wordmark colour.
- **Stone** (`#A8A496`): Secondary text, captions, metadata tags.
- **Amber** (`#F29A3D`): Primary accent (buttons, links, highlights, tagline).
- **Ember** (`#D97A1E`): Hover and pressed state of Amber.
- **Gold** (`#FFC46B`): Glow, focus rings, hairline highlights.
- **Olive** (`#4F6440`): Secondary accent, proof and verified surfaces.
- **Forest** (`#2A3827`): Deep green panels behind verified content.

### Status Colours (Truth States)
- **Verified** (`#86AA70`): Solid circle with tick.
- **Aging** (`#F29A3D`): Half-filled ring.
- **Stale** (`#E2553F`): Ring with open gap.
- **Missing** (`#8C9098`): Dashed ring.
- **Contradicted** (`#E2553F`): Circle split into two halves.

### Typography
- **Headings**: Sora (semi-bold, generous width, echoes the wide wordmark) or sleek geometric sans.
- **Body**: Inter.
- **Hashes and Numbers**: JetBrains Mono / tabular monospace numbers.
- **Eyebrow**: Small uppercase labels in Amber with wide letter-spacing (`0.2em`).

## 5. Ground Rules (from Next Steps A2 & master spec)
1. **Brand tokens**: Keep and extend brand tokens in `app/globals.css`. Never use generic ad-hoc colors.
2. **No emoji rule**: No emojis, emoticons, or emote characters anywhere (UI, copy, alerts, or empty states). SVG line icons only.
3. **TypeScript Strict Mode**: Add new libraries only when strictly needed and record the rationale in `docs/decisions.md`.
4. **Feature branches**: Work on feature branches per step (e.g. `step-1-responsive-fix`).
5. **Never commit secrets**: Ensure `.gitignore` ignores `node_modules`, `.next`, and all `.env*` files. Provide `.env.example` with names only.
6. **Commit small and often**: Use clear, concise commit messages.
7. **Accessibility & Quality**: Contrast must meet WCAG AA (4.5:1). Interactive elements need Gold focus rings. Support `prefers-reduced-motion`.

## 6. Commands to Run and Build
- **Install dependencies**: `npm install`
- **Start development server**: `npm run dev` (runs at `http://localhost:3000`)
- **Production build**: `npm run build`
- **Start production server**: `npm run start`
- **Lint**: `npm run lint`
