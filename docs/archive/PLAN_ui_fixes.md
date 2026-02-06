# Implementation Plan: UI Fixes & Firewall Templates

The goal is to resolve UI overlapping issues, update terminology ("RouterOS Management" -> "Configurations"), and provide additional firewall templates for the Configuration Studio.

## User Review Required

> [!NOTE]
> **UI Overlap Fix**: I suspect the `main-content` is not respecting the `sidebar` width because `.sidebar` is `position: sticky` but `main-content` doesn't account for it in some viewports, or `page-container` padding is conflicting.
> **Fix Strategy**: Ensure `.main-content` has appropriate margin or flex behavior to avoid being covered by the sidebar if they overlap, although current CSS suggests `display: flex` on `.app-layout`. I will enforce `flex-shrink: 0` on Sidebar and ensure `main-content` takes remaining space properly.

## Proposed Changes

### Frontend Component (`frontend-specialist`)

#### [MODIFY] [App.css](file:///c:/Users/Ronald/Desktop/NetworkWeaver/ConfigWeaver/frontend/src/App.css)
- Ensure `.main-content` correctly fills space next to Sidebar without overlap.
- Check `.page-container` margins.

#### [MODIFY] [RouterOS/index.jsx](file:///c:/Users/Ronald/Desktop/NetworkWeaver/ConfigWeaver/frontend/src/pages/RouterOS/index.jsx)
- Rename title **"RouterOS Management"** to **"Configurations"**.
- Update subtitle if needed to match context.

### Backend Component (`backend-specialist`)

#### [NEW] [firewall_basic.rsc](file:///c:/Users/Ronald/Desktop/NetworkWeaver/ConfigWeaver/backend/scripts/routeros/firewall_basic.rsc)
- Basic Input/Forward chain rules.
- Allow established/related.
- Drop invalid.

#### [NEW] [firewall_strict.rsc](file:///c:/Users/Ronald/Desktop/NetworkWeaver/ConfigWeaver/backend/scripts/routeros/firewall_strict.rsc)
- stricter rules, blocking bogons, ICMP rate limiting.

## Verification Plan

### Manual Verification
1.  **UI Check**:
    - Verify Sidebar does not cover "Configurations" title.
    - Check page title reads "Configurations".
2.  **Templates Check**:
    - Go to "Configurations" (Config Executor).
    - Check dropdown for "Firewall Basic" and "Firewall Strict".

---
**Prepared by:** `project-planner`
