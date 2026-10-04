# VERIDEX Multi-Role Layout & Responsiveness QA Report

**Date of Execution**: 2026-10-04T04:01:47.595Z  
**Target Environments**: Chromium, WebKit (Safari), Firefox  
**Scope**: All public routes, real one-time invite portal, and individual authenticated role dashboards (Owner, Admin, Control Owner, CMS Executive, Executive)  
**Overall Result**: **ATTENTION (38 failures)**

---

## 1. Executive Summary

| Metric | Result | Target Requirement |
| :--- | :--- | :--- |
| **Total Test Runs** | **1377** | Full matrix across viewports, engines, and roles |
| **Pass Count** | **1339** | 100% clean passes required |
| **Fail Count** | **38** | 0 failures allowed |
| **Sideways Scroll Violations** | **0** | 0 allowed across all viewports |
| **Offscreen Interactive Elements** | **38** | 0 allowed |
| **Visible Text/Element Overlaps** | **0** | 0 allowed |
| **Control Health Badge Position** | **Inside card padding box** | Must not hang off corner |
| **Real Token Acceptance Screen** | **Verified Live** | Token queried from public.invites with real org |

---

## 2. Tested Role Coverage Matrix

| Role | Tested Screens | Viewports Tested | Engines Tested |
| :--- | :--- | :--- | :--- |
| **Unauthenticated Visitor** | Home, Login, Signup, Forgot Password, Reset Password, Real One-Time Invite Portal (`/invite/[token]`) | 27 viewports (320px to 2560px) | Chromium, WebKit, Firefox |
| **Owner** | Executive Overview (`/app`), Team Governance (`/app/team`), Controls, Evidence, Proof Debt, Settings | 27 viewports (320px to 2560px) | Chromium, WebKit, Firefox |
| **Admin** | Administrative Dashboard (`/app`), Team Management (`/app/team`) | 27 viewports (320px to 2560px) | Chromium, WebKit, Firefox |
| **Control Owner** | Controls & Evidence Review Center (`/app`) with reporting delegates | 27 viewports (320px to 2560px) | Chromium, WebKit, Firefox |
| **CMS Executive** | Tasks & Submissions Dashboard (`/app`) with supervisor reporting line & queue | 27 viewports (320px to 2560px) | Chromium, WebKit, Firefox |
| **Executive** | Tasks Queue & Attestation Ledger (`/app`) with supervisor reporting line & SHA-256 history | 27 viewports (320px to 2560px) | Chromium, WebKit, Firefox |

---

## 3. Visual Artifacts
All screenshots captured during the multi-role test matrix audit are archived in:
`docs/qa/layout/`
