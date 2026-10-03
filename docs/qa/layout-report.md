# VERIDEX Layout & Responsiveness QA Report

**Date of Execution**: 2026-10-03T08:42:57.398Z  
**Target Environments**: Chromium, WebKit (Safari), Firefox  
**Scope**: All public and authenticated routes, responsive viewports (320px to 2560px), and device profiles  
**Overall Result**: **PASS (100%)**

---

## 1. Executive Summary

| Metric | Result | Target Requirement |
| :--- | :--- | :--- |
| **Total Test Runs** | **853** | Full matrix across viewports and engines |
| **Pass Count** | **853** | 100% clean passes required |
| **Fail Count** | **0** | 0 failures allowed |
| **Sideways Scroll Violations** | **0** | 0 allowed across all viewports |
| **Offscreen Interactive Elements** | **0** | 0 allowed |
| **Visible Text/Element Overlaps** | **0** | 0 allowed |
| **Control Health Badge Position** | **Inside card padding box** | Must not hang off corner |
| **"Load data" Dialog Copy** | **Verified Exact** | Confirm dialog with Cancel & Add sample data |

---

## 2. Root Cause Analysis & Resolutions

### Problem 1: Home Page Hero on Laptops & Badge Hang
- **Root Cause**: Floating evidence chips in `TruthLens.tsx` used static percentage coordinates (`x: 25%, y: 72%`) without measuring collision against page elements. On laptop screens, this placed the "Encryption keys rotated" chip directly over the "Explore the platform" link and CTA button. Furthermore, `.float-badge` used negative absolute offsets (`bottom: -18px; right: -12px`), causing it to hang off the card.
- **Resolution**:
  - Implemented dynamic bounding box collision detection in `TruthLens.tsx` measuring 5 forbidden content boxes: heading, paragraph, button row, trust line, and card.
  - Enforced a minimum **24px clearance** zone around all content. If no safe slot exists with >= 24px clearance, the chip is cleanly hidden.
  - Placed evidence chips in an `aria-hidden="true"`, `data-decorative="true"`, `pointer-events: none` background layer (`z-index: 1`).
  - Anchored the Control health badge inside `.hero-card`'s internal padding box with relative layout and full-width integration.
  - Styled hero button row to wrap naturally and stack full-width below 480px.

### Problem 2: Organisation Setup Screen
- **Root Cause**: `OnboardingModal.tsx` referenced `.form-field`, `.form-label`, and `.input-field` classes that had no CSS declarations in `app/globals.css`. Consequently, the label defaulted to inline display and the input rendered as a small browser-default text input touching the label.
- **Resolution**:
  - Implemented comprehensive form design tokens in `app/globals.css`.
  - Configured label displayed as block above input with `13px` semi-bold typography.
  - Input given brand styling with `min-height: 48px`, `font-size: 16px` (preventing iOS zoom), graphite background, line border, and gold focus rings (`box-shadow: 0 0 0 3px rgba(242, 154, 61, 0.25)`).
  - Added helper text, inline error banner, input whitespace trimming, max 80 characters limit, and `autocomplete="organization"`.
  - Updated role list to exact specification: **Owner (you), Admin, Control Owner, CMS Executive, Executive, Auditor, Viewer**.

### Problem 3: App Dashboard on Phones
- **Root Cause**: The `.page-quick-actions` container held three horizontal action buttons ("Load data", "Upload Evidence", "Add Control") with `white-space: nowrap` and no wrapping or mobile stacking defined. Their combined width (>500px) overflowed phone viewports (320-430px), stretching the document's `scrollWidth` to ~550px. This made the 100%-width top bar and cards stop at ~60% of the canvas while buttons ran off the right edge.
- **Resolution**:
  - Configured top bar to strictly span 100% width.
  - Applied `grid-template-columns: minmax(0, 1fr)` and `min-width: 0` on all grid and flex children.
  - Styled action buttons to wrap and stack full width on phones (`< 768px`).
  - Added safe bottom padding on `.app-shell-content` (`calc(88px + env(safe-area-inset-bottom, 24px))`) so the mobile bottom tab bar never covers content.
  - Avoided `overflow-x: hidden` hacks to solve root layout mechanics cleanly.

### Problem 4: Rename "Load demo data" to "Load data" with Confirm Dialog
- **Root Cause**: The action previously directly executed seeding without confirmation and used the phrase "Load Demo Data".
- **Resolution**:
  - Renamed button to **"Load data"** across all app navigation and subpages.
  - Built an accessible modal confirmation dialog matching brand aesthetics.
  - Message copy: *"This adds sample controls and evidence so you can explore the product. You can remove them later."*
  - Interactive actions: **Cancel** (dismisses) and **Add sample data** (seeds sample controls and evidence).

---

## 3. Detailed Test Matrix Results

| Engine | Viewport | Category | Tested Page | H-Scroll | Offscreen | Overlaps | Status |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| Chromium | Phone 320 (iPhone SE1) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 360 (Android Small) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 375 (iPhone SE/8) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 390 (iPhone 14) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 393 (iPhone 15 Pro) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 412 (Pixel 7) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 430 (iPhone 15 Pro Max) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 667x375 | Landscape Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 844x390 | Landscape Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 852x393 | Landscape Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 915x412 | Landscape Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 932x430 | Landscape Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 600 (Small Tablet) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 744 (iPad Mini) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 768 (iPad Portrait) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 810 (iPad 10.2) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 820 (iPad Air) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 834 (iPad Pro 11) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 1024 (iPad Landscape) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1280x720 | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1366x768 | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1440x900 | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 14-inch (1512x982) | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1536x864 | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 16-inch (1728x1117) | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1080p (1920x1080) | Desktop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1440p (2560x1440) | Desktop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 320 (iPhone SE1) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 360 (Android Small) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 375 (iPhone SE/8) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 390 (iPhone 14) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 393 (iPhone 15 Pro) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 412 (Pixel 7) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 430 (iPhone 15 Pro Max) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 667x375 | Landscape Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 844x390 | Landscape Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 852x393 | Landscape Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 915x412 | Landscape Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 932x430 | Landscape Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 600 (Small Tablet) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 744 (iPad Mini) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 768 (iPad Portrait) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 810 (iPad 10.2) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 820 (iPad Air) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 834 (iPad Pro 11) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 1024 (iPad Landscape) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1280x720 | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1366x768 | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1440x900 | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 14-inch (1512x982) | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1536x864 | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 16-inch (1728x1117) | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1080p (1920x1080) | Desktop | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1440p (2560x1440) | Desktop | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 320 (iPhone SE1) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 360 (Android Small) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 375 (iPhone SE/8) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 390 (iPhone 14) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 393 (iPhone 15 Pro) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 412 (Pixel 7) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 430 (iPhone 15 Pro Max) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 667x375 | Landscape Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 844x390 | Landscape Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 852x393 | Landscape Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 915x412 | Landscape Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 932x430 | Landscape Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 600 (Small Tablet) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 744 (iPad Mini) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 768 (iPad Portrait) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 810 (iPad 10.2) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 820 (iPad Air) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 834 (iPad Pro 11) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 1024 (iPad Landscape) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1280x720 | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1366x768 | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1440x900 | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 14-inch (1512x982) | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1536x864 | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 16-inch (1728x1117) | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1080p (1920x1080) | Desktop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1440p (2560x1440) | Desktop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 320 (iPhone SE1) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 360 (Android Small) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 375 (iPhone SE/8) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 390 (iPhone 14) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 393 (iPhone 15 Pro) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 412 (Pixel 7) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 430 (iPhone 15 Pro Max) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 667x375 | Landscape Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 844x390 | Landscape Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 852x393 | Landscape Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 915x412 | Landscape Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 932x430 | Landscape Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 600 (Small Tablet) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 744 (iPad Mini) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 768 (iPad Portrait) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 810 (iPad 10.2) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 820 (iPad Air) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 834 (iPad Pro 11) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 1024 (iPad Landscape) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1280x720 | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1366x768 | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1440x900 | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 14-inch (1512x982) | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1536x864 | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 16-inch (1728x1117) | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1080p (1920x1080) | Desktop | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1440p (2560x1440) | Desktop | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 320 (iPhone SE1) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 360 (Android Small) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 375 (iPhone SE/8) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 390 (iPhone 14) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 393 (iPhone 15 Pro) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 412 (Pixel 7) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 430 (iPhone 15 Pro Max) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 667x375 | Landscape Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 844x390 | Landscape Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 852x393 | Landscape Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 915x412 | Landscape Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 932x430 | Landscape Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 600 (Small Tablet) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 744 (iPad Mini) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 768 (iPad Portrait) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 810 (iPad 10.2) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 820 (iPad Air) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 834 (iPad Pro 11) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 1024 (iPad Landscape) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1280x720 | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1366x768 | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1440x900 | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 14-inch (1512x982) | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1536x864 | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 16-inch (1728x1117) | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1080p (1920x1080) | Desktop | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1440p (2560x1440) | Desktop | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 320 (iPhone SE1) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 360 (Android Small) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 375 (iPhone SE/8) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 390 (iPhone 14) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 393 (iPhone 15 Pro) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 412 (Pixel 7) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 430 (iPhone 15 Pro Max) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 667x375 | Landscape Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 844x390 | Landscape Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 852x393 | Landscape Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 915x412 | Landscape Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 932x430 | Landscape Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 600 (Small Tablet) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 744 (iPad Mini) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 768 (iPad Portrait) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 810 (iPad 10.2) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 820 (iPad Air) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 834 (iPad Pro 11) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 1024 (iPad Landscape) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1280x720 | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1366x768 | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1440x900 | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 14-inch (1512x982) | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1536x864 | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 16-inch (1728x1117) | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1080p (1920x1080) | Desktop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1440p (2560x1440) | Desktop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 320 (iPhone SE1) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 360 (Android Small) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 375 (iPhone SE/8) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 390 (iPhone 14) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 393 (iPhone 15 Pro) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 412 (Pixel 7) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 430 (iPhone 15 Pro Max) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 667x375 | Landscape Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 844x390 | Landscape Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 852x393 | Landscape Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 915x412 | Landscape Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 932x430 | Landscape Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 600 (Small Tablet) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 744 (iPad Mini) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 768 (iPad Portrait) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 810 (iPad 10.2) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 820 (iPad Air) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 834 (iPad Pro 11) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 1024 (iPad Landscape) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1280x720 | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1366x768 | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1440x900 | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 14-inch (1512x982) | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1536x864 | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 16-inch (1728x1117) | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1080p (1920x1080) | Desktop | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1440p (2560x1440) | Desktop | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 320 (iPhone SE1) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 360 (Android Small) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 375 (iPhone SE/8) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 390 (iPhone 14) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 393 (iPhone 15 Pro) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 412 (Pixel 7) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 430 (iPhone 15 Pro Max) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 667x375 | Landscape Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 844x390 | Landscape Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 852x393 | Landscape Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 915x412 | Landscape Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 932x430 | Landscape Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 600 (Small Tablet) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 744 (iPad Mini) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 768 (iPad Portrait) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 810 (iPad 10.2) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 820 (iPad Air) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 834 (iPad Pro 11) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 1024 (iPad Landscape) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1280x720 | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1366x768 | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1440x900 | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 14-inch (1512x982) | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1536x864 | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 16-inch (1728x1117) | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1080p (1920x1080) | Desktop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1440p (2560x1440) | Desktop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 320 (iPhone SE1) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 360 (Android Small) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 375 (iPhone SE/8) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 390 (iPhone 14) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 393 (iPhone 15 Pro) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 412 (Pixel 7) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 430 (iPhone 15 Pro Max) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 667x375 | Landscape Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 844x390 | Landscape Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 852x393 | Landscape Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 915x412 | Landscape Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 932x430 | Landscape Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 600 (Small Tablet) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 744 (iPad Mini) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 768 (iPad Portrait) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 810 (iPad 10.2) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 820 (iPad Air) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 834 (iPad Pro 11) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 1024 (iPad Landscape) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1280x720 | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1366x768 | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1440x900 | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 14-inch (1512x982) | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1536x864 | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 16-inch (1728x1117) | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1080p (1920x1080) | Desktop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1440p (2560x1440) | Desktop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 320 (iPhone SE1) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 360 (Android Small) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 375 (iPhone SE/8) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 390 (iPhone 14) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 393 (iPhone 15 Pro) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 412 (Pixel 7) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Phone 430 (iPhone 15 Pro Max) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 667x375 | Landscape Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 844x390 | Landscape Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 852x393 | Landscape Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 915x412 | Landscape Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Phone Landscape 932x430 | Landscape Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 600 (Small Tablet) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 744 (iPad Mini) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 768 (iPad Portrait) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 810 (iPad 10.2) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 820 (iPad Air) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 834 (iPad Pro 11) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Tablet 1024 (iPad Landscape) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1280x720 | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1366x768 | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1440x900 | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 14-inch (1512x982) | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Laptop 1536x864 | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | MacBook 16-inch (1728x1117) | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1080p (1920x1080) | Desktop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium | Desktop 1440p (2560x1440) | Desktop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPhone 14 | Built-in Profile | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPhone 14 | Built-in Profile | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPhone 14 | Built-in Profile | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPhone 14 | Built-in Profile | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPhone 14 | Built-in Profile | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPhone 14 | Built-in Profile | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPhone 14 | Built-in Profile | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPhone 14 | Built-in Profile | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPhone 14 | Built-in Profile | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPhone 14 | Built-in Profile | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Pixel 7 | Built-in Profile | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Pixel 7 | Built-in Profile | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Pixel 7 | Built-in Profile | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Pixel 7 | Built-in Profile | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Pixel 7 | Built-in Profile | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Pixel 7 | Built-in Profile | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Pixel 7 | Built-in Profile | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Pixel 7 | Built-in Profile | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Pixel 7 | Built-in Profile | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Pixel 7 | Built-in Profile | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Galaxy S9+ | Built-in Profile | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Galaxy S9+ | Built-in Profile | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Galaxy S9+ | Built-in Profile | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Galaxy S9+ | Built-in Profile | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Galaxy S9+ | Built-in Profile | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Galaxy S9+ | Built-in Profile | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Galaxy S9+ | Built-in Profile | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Galaxy S9+ | Built-in Profile | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Galaxy S9+ | Built-in Profile | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | Galaxy S9+ | Built-in Profile | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPad (gen 7) | Built-in Profile | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPad (gen 7) | Built-in Profile | Login Screen | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPad (gen 7) | Built-in Profile | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPad (gen 7) | Built-in Profile | Forgot Password | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPad (gen 7) | Built-in Profile | Reset Password | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPad (gen 7) | Built-in Profile | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPad (gen 7) | Built-in Profile | Controls Directory | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPad (gen 7) | Built-in Profile | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPad (gen 7) | Built-in Profile | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Chromium (Device Profile) | iPad (gen 7) | Built-in Profile | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 320 (iPhone SE1) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 360 (Android Small) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 375 (iPhone SE/8) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 390 (iPhone 14) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 393 (iPhone 15 Pro) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 412 (Pixel 7) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 430 (iPhone 15 Pro Max) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 667x375 | Landscape Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 844x390 | Landscape Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 852x393 | Landscape Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 915x412 | Landscape Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 932x430 | Landscape Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 600 (Small Tablet) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 744 (iPad Mini) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 768 (iPad Portrait) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 810 (iPad 10.2) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 820 (iPad Air) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 834 (iPad Pro 11) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 1024 (iPad Landscape) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1280x720 | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1366x768 | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1440x900 | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 14-inch (1512x982) | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1536x864 | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 16-inch (1728x1117) | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1080p (1920x1080) | Desktop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1440p (2560x1440) | Desktop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 320 (iPhone SE1) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 360 (Android Small) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 375 (iPhone SE/8) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 390 (iPhone 14) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 393 (iPhone 15 Pro) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 412 (Pixel 7) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 430 (iPhone 15 Pro Max) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 667x375 | Landscape Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 844x390 | Landscape Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 852x393 | Landscape Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 915x412 | Landscape Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 932x430 | Landscape Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 600 (Small Tablet) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 744 (iPad Mini) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 768 (iPad Portrait) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 810 (iPad 10.2) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 820 (iPad Air) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 834 (iPad Pro 11) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 1024 (iPad Landscape) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1280x720 | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1366x768 | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1440x900 | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 14-inch (1512x982) | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1536x864 | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 16-inch (1728x1117) | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1080p (1920x1080) | Desktop | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1440p (2560x1440) | Desktop | Login Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 320 (iPhone SE1) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 360 (Android Small) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 375 (iPhone SE/8) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 390 (iPhone 14) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 393 (iPhone 15 Pro) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 412 (Pixel 7) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 430 (iPhone 15 Pro Max) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 667x375 | Landscape Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 844x390 | Landscape Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 852x393 | Landscape Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 915x412 | Landscape Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 932x430 | Landscape Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 600 (Small Tablet) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 744 (iPad Mini) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 768 (iPad Portrait) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 810 (iPad 10.2) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 820 (iPad Air) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 834 (iPad Pro 11) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 1024 (iPad Landscape) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1280x720 | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1366x768 | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1440x900 | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 14-inch (1512x982) | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1536x864 | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 16-inch (1728x1117) | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1080p (1920x1080) | Desktop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1440p (2560x1440) | Desktop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 320 (iPhone SE1) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 360 (Android Small) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 375 (iPhone SE/8) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 390 (iPhone 14) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 393 (iPhone 15 Pro) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 412 (Pixel 7) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 430 (iPhone 15 Pro Max) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 667x375 | Landscape Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 844x390 | Landscape Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 852x393 | Landscape Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 915x412 | Landscape Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 932x430 | Landscape Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 600 (Small Tablet) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 744 (iPad Mini) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 768 (iPad Portrait) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 810 (iPad 10.2) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 820 (iPad Air) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 834 (iPad Pro 11) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 1024 (iPad Landscape) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1280x720 | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1366x768 | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1440x900 | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 14-inch (1512x982) | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1536x864 | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 16-inch (1728x1117) | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1080p (1920x1080) | Desktop | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1440p (2560x1440) | Desktop | Forgot Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 320 (iPhone SE1) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 360 (Android Small) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 375 (iPhone SE/8) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 390 (iPhone 14) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 393 (iPhone 15 Pro) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 412 (Pixel 7) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 430 (iPhone 15 Pro Max) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 667x375 | Landscape Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 844x390 | Landscape Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 852x393 | Landscape Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 915x412 | Landscape Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 932x430 | Landscape Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 600 (Small Tablet) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 744 (iPad Mini) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 768 (iPad Portrait) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 810 (iPad 10.2) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 820 (iPad Air) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 834 (iPad Pro 11) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 1024 (iPad Landscape) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1280x720 | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1366x768 | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1440x900 | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 14-inch (1512x982) | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1536x864 | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 16-inch (1728x1117) | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1080p (1920x1080) | Desktop | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1440p (2560x1440) | Desktop | Reset Password | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 320 (iPhone SE1) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 360 (Android Small) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 375 (iPhone SE/8) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 390 (iPhone 14) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 393 (iPhone 15 Pro) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 412 (Pixel 7) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 430 (iPhone 15 Pro Max) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 667x375 | Landscape Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 844x390 | Landscape Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 852x393 | Landscape Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 915x412 | Landscape Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 932x430 | Landscape Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 600 (Small Tablet) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 744 (iPad Mini) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 768 (iPad Portrait) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 810 (iPad 10.2) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 820 (iPad Air) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 834 (iPad Pro 11) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 1024 (iPad Landscape) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1280x720 | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1366x768 | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1440x900 | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 14-inch (1512x982) | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1536x864 | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 16-inch (1728x1117) | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1080p (1920x1080) | Desktop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1440p (2560x1440) | Desktop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 320 (iPhone SE1) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 360 (Android Small) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 375 (iPhone SE/8) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 390 (iPhone 14) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 393 (iPhone 15 Pro) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 412 (Pixel 7) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 430 (iPhone 15 Pro Max) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 667x375 | Landscape Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 844x390 | Landscape Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 852x393 | Landscape Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 915x412 | Landscape Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 932x430 | Landscape Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 600 (Small Tablet) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 744 (iPad Mini) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 768 (iPad Portrait) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 810 (iPad 10.2) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 820 (iPad Air) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 834 (iPad Pro 11) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 1024 (iPad Landscape) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1280x720 | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1366x768 | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1440x900 | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 14-inch (1512x982) | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1536x864 | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 16-inch (1728x1117) | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1080p (1920x1080) | Desktop | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1440p (2560x1440) | Desktop | Controls Directory | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 320 (iPhone SE1) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 360 (Android Small) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 375 (iPhone SE/8) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 390 (iPhone 14) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 393 (iPhone 15 Pro) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 412 (Pixel 7) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 430 (iPhone 15 Pro Max) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 667x375 | Landscape Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 844x390 | Landscape Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 852x393 | Landscape Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 915x412 | Landscape Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 932x430 | Landscape Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 600 (Small Tablet) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 744 (iPad Mini) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 768 (iPad Portrait) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 810 (iPad 10.2) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 820 (iPad Air) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 834 (iPad Pro 11) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 1024 (iPad Landscape) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1280x720 | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1366x768 | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1440x900 | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 14-inch (1512x982) | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1536x864 | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 16-inch (1728x1117) | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1080p (1920x1080) | Desktop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1440p (2560x1440) | Desktop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 320 (iPhone SE1) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 360 (Android Small) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 375 (iPhone SE/8) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 390 (iPhone 14) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 393 (iPhone 15 Pro) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 412 (Pixel 7) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 430 (iPhone 15 Pro Max) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 667x375 | Landscape Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 844x390 | Landscape Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 852x393 | Landscape Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 915x412 | Landscape Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 932x430 | Landscape Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 600 (Small Tablet) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 744 (iPad Mini) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 768 (iPad Portrait) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 810 (iPad 10.2) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 820 (iPad Air) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 834 (iPad Pro 11) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 1024 (iPad Landscape) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1280x720 | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1366x768 | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1440x900 | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 14-inch (1512x982) | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1536x864 | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 16-inch (1728x1117) | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1080p (1920x1080) | Desktop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1440p (2560x1440) | Desktop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 320 (iPhone SE1) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 360 (Android Small) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 375 (iPhone SE/8) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 390 (iPhone 14) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 393 (iPhone 15 Pro) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 412 (Pixel 7) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Phone 430 (iPhone 15 Pro Max) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 667x375 | Landscape Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 844x390 | Landscape Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 852x393 | Landscape Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 915x412 | Landscape Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Phone Landscape 932x430 | Landscape Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 600 (Small Tablet) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 744 (iPad Mini) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 768 (iPad Portrait) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 810 (iPad 10.2) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 820 (iPad Air) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 834 (iPad Pro 11) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Tablet 1024 (iPad Landscape) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1280x720 | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1366x768 | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1440x900 | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 14-inch (1512x982) | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Laptop 1536x864 | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | MacBook 16-inch (1728x1117) | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1080p (1920x1080) | Desktop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| WebKit | Desktop 1440p (2560x1440) | Desktop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 320 (iPhone SE1) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 360 (Android Small) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 375 (iPhone SE/8) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 390 (iPhone 14) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 393 (iPhone 15 Pro) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 412 (Pixel 7) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 430 (iPhone 15 Pro Max) | Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 667x375 | Landscape Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 844x390 | Landscape Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 852x393 | Landscape Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 915x412 | Landscape Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 932x430 | Landscape Phone | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 600 (Small Tablet) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 744 (iPad Mini) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 768 (iPad Portrait) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 810 (iPad 10.2) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 820 (iPad Air) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 834 (iPad Pro 11) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 1024 (iPad Landscape) | Tablet | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1280x720 | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1366x768 | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1440x900 | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 14-inch (1512x982) | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1536x864 | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 16-inch (1728x1117) | Laptop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1080p (1920x1080) | Desktop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1440p (2560x1440) | Desktop | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 320 (iPhone SE1) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 360 (Android Small) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 375 (iPhone SE/8) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 390 (iPhone 14) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 393 (iPhone 15 Pro) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 412 (Pixel 7) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 430 (iPhone 15 Pro Max) | Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 667x375 | Landscape Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 844x390 | Landscape Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 852x393 | Landscape Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 915x412 | Landscape Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 932x430 | Landscape Phone | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 600 (Small Tablet) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 744 (iPad Mini) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 768 (iPad Portrait) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 810 (iPad 10.2) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 820 (iPad Air) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 834 (iPad Pro 11) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 1024 (iPad Landscape) | Tablet | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1280x720 | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1366x768 | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1440x900 | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 14-inch (1512x982) | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1536x864 | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 16-inch (1728x1117) | Laptop | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1080p (1920x1080) | Desktop | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1440p (2560x1440) | Desktop | Login Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 320 (iPhone SE1) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 360 (Android Small) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 375 (iPhone SE/8) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 390 (iPhone 14) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 393 (iPhone 15 Pro) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 412 (Pixel 7) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 430 (iPhone 15 Pro Max) | Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 667x375 | Landscape Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 844x390 | Landscape Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 852x393 | Landscape Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 915x412 | Landscape Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 932x430 | Landscape Phone | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 600 (Small Tablet) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 744 (iPad Mini) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 768 (iPad Portrait) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 810 (iPad 10.2) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 820 (iPad Air) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 834 (iPad Pro 11) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 1024 (iPad Landscape) | Tablet | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1280x720 | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1366x768 | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1440x900 | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 14-inch (1512x982) | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1536x864 | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 16-inch (1728x1117) | Laptop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1080p (1920x1080) | Desktop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1440p (2560x1440) | Desktop | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 320 (iPhone SE1) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 360 (Android Small) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 375 (iPhone SE/8) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 390 (iPhone 14) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 393 (iPhone 15 Pro) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 412 (Pixel 7) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 430 (iPhone 15 Pro Max) | Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 667x375 | Landscape Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 844x390 | Landscape Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 852x393 | Landscape Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 915x412 | Landscape Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 932x430 | Landscape Phone | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 600 (Small Tablet) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 744 (iPad Mini) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 768 (iPad Portrait) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 810 (iPad 10.2) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 820 (iPad Air) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 834 (iPad Pro 11) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 1024 (iPad Landscape) | Tablet | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1280x720 | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1366x768 | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1440x900 | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 14-inch (1512x982) | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1536x864 | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 16-inch (1728x1117) | Laptop | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1080p (1920x1080) | Desktop | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1440p (2560x1440) | Desktop | Forgot Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 320 (iPhone SE1) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 360 (Android Small) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 375 (iPhone SE/8) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 390 (iPhone 14) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 393 (iPhone 15 Pro) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 412 (Pixel 7) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 430 (iPhone 15 Pro Max) | Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 667x375 | Landscape Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 844x390 | Landscape Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 852x393 | Landscape Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 915x412 | Landscape Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 932x430 | Landscape Phone | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 600 (Small Tablet) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 744 (iPad Mini) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 768 (iPad Portrait) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 810 (iPad 10.2) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 820 (iPad Air) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 834 (iPad Pro 11) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 1024 (iPad Landscape) | Tablet | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1280x720 | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1366x768 | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1440x900 | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 14-inch (1512x982) | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1536x864 | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 16-inch (1728x1117) | Laptop | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1080p (1920x1080) | Desktop | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1440p (2560x1440) | Desktop | Reset Password | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 320 (iPhone SE1) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 360 (Android Small) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 375 (iPhone SE/8) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 390 (iPhone 14) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 393 (iPhone 15 Pro) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 412 (Pixel 7) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 430 (iPhone 15 Pro Max) | Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 667x375 | Landscape Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 844x390 | Landscape Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 852x393 | Landscape Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 915x412 | Landscape Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 932x430 | Landscape Phone | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 600 (Small Tablet) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 744 (iPad Mini) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 768 (iPad Portrait) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 810 (iPad 10.2) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 820 (iPad Air) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 834 (iPad Pro 11) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 1024 (iPad Landscape) | Tablet | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1280x720 | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1366x768 | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1440x900 | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 14-inch (1512x982) | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1536x864 | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 16-inch (1728x1117) | Laptop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1080p (1920x1080) | Desktop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1440p (2560x1440) | Desktop | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 320 (iPhone SE1) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 360 (Android Small) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 375 (iPhone SE/8) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 390 (iPhone 14) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 393 (iPhone 15 Pro) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 412 (Pixel 7) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 430 (iPhone 15 Pro Max) | Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 667x375 | Landscape Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 844x390 | Landscape Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 852x393 | Landscape Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 915x412 | Landscape Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 932x430 | Landscape Phone | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 600 (Small Tablet) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 744 (iPad Mini) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 768 (iPad Portrait) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 810 (iPad 10.2) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 820 (iPad Air) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 834 (iPad Pro 11) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 1024 (iPad Landscape) | Tablet | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1280x720 | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1366x768 | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1440x900 | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 14-inch (1512x982) | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1536x864 | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 16-inch (1728x1117) | Laptop | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1080p (1920x1080) | Desktop | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1440p (2560x1440) | Desktop | Controls Directory | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 320 (iPhone SE1) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 360 (Android Small) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 375 (iPhone SE/8) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 390 (iPhone 14) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 393 (iPhone 15 Pro) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 412 (Pixel 7) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 430 (iPhone 15 Pro Max) | Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 667x375 | Landscape Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 844x390 | Landscape Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 852x393 | Landscape Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 915x412 | Landscape Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 932x430 | Landscape Phone | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 600 (Small Tablet) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 744 (iPad Mini) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 768 (iPad Portrait) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 810 (iPad 10.2) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 820 (iPad Air) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 834 (iPad Pro 11) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 1024 (iPad Landscape) | Tablet | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1280x720 | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1366x768 | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1440x900 | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 14-inch (1512x982) | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1536x864 | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 16-inch (1728x1117) | Laptop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1080p (1920x1080) | Desktop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1440p (2560x1440) | Desktop | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 320 (iPhone SE1) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 360 (Android Small) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 375 (iPhone SE/8) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 390 (iPhone 14) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 393 (iPhone 15 Pro) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 412 (Pixel 7) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 430 (iPhone 15 Pro Max) | Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 667x375 | Landscape Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 844x390 | Landscape Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 852x393 | Landscape Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 915x412 | Landscape Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 932x430 | Landscape Phone | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 600 (Small Tablet) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 744 (iPad Mini) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 768 (iPad Portrait) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 810 (iPad 10.2) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 820 (iPad Air) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 834 (iPad Pro 11) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 1024 (iPad Landscape) | Tablet | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1280x720 | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1366x768 | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1440x900 | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 14-inch (1512x982) | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1536x864 | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 16-inch (1728x1117) | Laptop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1080p (1920x1080) | Desktop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1440p (2560x1440) | Desktop | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 320 (iPhone SE1) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 360 (Android Small) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 375 (iPhone SE/8) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 390 (iPhone 14) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 393 (iPhone 15 Pro) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 412 (Pixel 7) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Phone 430 (iPhone 15 Pro Max) | Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 667x375 | Landscape Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 844x390 | Landscape Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 852x393 | Landscape Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 915x412 | Landscape Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Phone Landscape 932x430 | Landscape Phone | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 600 (Small Tablet) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 744 (iPad Mini) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 768 (iPad Portrait) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 810 (iPad 10.2) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 820 (iPad Air) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 834 (iPad Pro 11) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Tablet 1024 (iPad Landscape) | Tablet | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1280x720 | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1366x768 | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1440x900 | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 14-inch (1512x982) | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Laptop 1536x864 | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | MacBook 16-inch (1728x1117) | Laptop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1080p (1920x1080) | Desktop | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Firefox | Desktop 1440p (2560x1440) | Desktop | Workspace Settings | PASS | 0 | 0 | **PASS** |

---

## 4. Playwright Device Profile Results

| Device Profile | Dimensions | Tested Route | Horizontal Scroll | Offscreen Elements | Overlaps | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| iPhone 14 | 390x664 | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| iPhone 14 | 390x664 | Login Screen | PASS | 0 | 0 | **PASS** |
| iPhone 14 | 390x664 | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| iPhone 14 | 390x664 | Forgot Password | PASS | 0 | 0 | **PASS** |
| iPhone 14 | 390x664 | Reset Password | PASS | 0 | 0 | **PASS** |
| iPhone 14 | 390x664 | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| iPhone 14 | 390x664 | Controls Directory | PASS | 0 | 0 | **PASS** |
| iPhone 14 | 390x664 | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| iPhone 14 | 390x664 | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| iPhone 14 | 390x664 | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Pixel 7 | 412x839 | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Pixel 7 | 412x839 | Login Screen | PASS | 0 | 0 | **PASS** |
| Pixel 7 | 412x839 | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Pixel 7 | 412x839 | Forgot Password | PASS | 0 | 0 | **PASS** |
| Pixel 7 | 412x839 | Reset Password | PASS | 0 | 0 | **PASS** |
| Pixel 7 | 412x839 | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Pixel 7 | 412x839 | Controls Directory | PASS | 0 | 0 | **PASS** |
| Pixel 7 | 412x839 | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Pixel 7 | 412x839 | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Pixel 7 | 412x839 | Workspace Settings | PASS | 0 | 0 | **PASS** |
| Galaxy S9+ | 320x658 | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| Galaxy S9+ | 320x658 | Login Screen | PASS | 0 | 0 | **PASS** |
| Galaxy S9+ | 320x658 | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| Galaxy S9+ | 320x658 | Forgot Password | PASS | 0 | 0 | **PASS** |
| Galaxy S9+ | 320x658 | Reset Password | PASS | 0 | 0 | **PASS** |
| Galaxy S9+ | 320x658 | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| Galaxy S9+ | 320x658 | Controls Directory | PASS | 0 | 0 | **PASS** |
| Galaxy S9+ | 320x658 | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| Galaxy S9+ | 320x658 | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| Galaxy S9+ | 320x658 | Workspace Settings | PASS | 0 | 0 | **PASS** |
| iPad (gen 7) | 810x1080 | Home Page ("The Truth Lens") | PASS | 0 | 0 | **PASS** |
| iPad (gen 7) | 810x1080 | Login Screen | PASS | 0 | 0 | **PASS** |
| iPad (gen 7) | 810x1080 | Sign Up Screen | PASS | 0 | 0 | **PASS** |
| iPad (gen 7) | 810x1080 | Forgot Password | PASS | 0 | 0 | **PASS** |
| iPad (gen 7) | 810x1080 | Reset Password | PASS | 0 | 0 | **PASS** |
| iPad (gen 7) | 810x1080 | Workspace Overview (Dashboard) | PASS | 0 | 0 | **PASS** |
| iPad (gen 7) | 810x1080 | Controls Directory | PASS | 0 | 0 | **PASS** |
| iPad (gen 7) | 810x1080 | Evidence Vault Ledger | PASS | 0 | 0 | **PASS** |
| iPad (gen 7) | 810x1080 | Proof Debt Model | PASS | 0 | 0 | **PASS** |
| iPad (gen 7) | 810x1080 | Workspace Settings | PASS | 0 | 0 | **PASS** |

---

## 5. Visual Artifacts
All screenshots captured during the test matrix audit are archived in:
`docs/qa/layout/`
