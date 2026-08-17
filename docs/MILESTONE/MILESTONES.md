# Milestones & Versioning

This document tracks what ships in each version and how progress is measured. It’s concise, actionable, and maps directly to the current codebase and docs.

## Versioning
- Semantic-ish: `MAJOR.MINOR`
- Tags: `v1.0`, `v1.1`, `v2.0`, `v2.1`

## Progress Scoring (Simple 50/50)
- Weighting: 50% Frontend, 50% Backend.
- Formula: Overall progress = 0.5 × Frontend% + 0.5 × Backend%
- Example: If Frontend is 50% and Backend is 100%, overall = 0.5×50 + 0.5×100 = 75%.

Definition of Done (count towards % only when):
- Feature implemented, reviewed, and merged
- Tests or manual verification notes added (where relevant)
- Docs updated (user-facing or dev notes)

Status codes:
- Planned: not started
- In Progress: work underway
- Complete: merged and validated

---

## v1.0 — Core Platform (Complete)

Scope
- Authentication (register, login, JWT), protected APIs
- Monitors: CRUD, intervals/timeouts, expected status, headers/body
- Worker: scheduled checks, lock manager, response-time/status capture
- SSE: live updates for dashboard and detail views
- Logs: history, uptime % calculation, basic analytics

Deliverables
- Backend: Express + TypeORM models, services, controllers, SSE manager, worker
- Frontend: Vue 3 SPA with dashboard, monitor detail, auth pages
- Docs: Overview, backend/frontend architecture, database design, local dev

Acceptance Criteria
- Can create a monitor and see live status updates without refresh
- Check logs persist and uptime% reflects recent state
- Worker runs continuously and avoids duplicate checks (locks)

Non‑Goals
- Teams, sharing, advanced notifications, new UI styling

Progress Tracking
- Frontend: 100%
- Backend: 100%
- Overall: 100%

---

## v1.1 — Quality Refresh (Complete)

Scope
- Search and filter across monitors
- Improved email notification templates (styling, content clarity)

Deliverables
- Backend: query params for search/filter; refined mailer templates
- Frontend: search input, filter chips, empty/error states

Acceptance Criteria
- Can filter by name/tag/status and combine filters
- Email templates render cleanly on major clients

Progress Tracking
- Frontend: 100%
- Backend: 100%
- Overall: 100%

---

## v2.0 — New UI + Teams (Complete)

Scope
- New sidebar-first UI and styling refresh
- Team monitoring (full CRUD and parity with personal monitors)
- Notification center tabs (All, Shares, Invites, Alerts)
- Sharing monitors to users/teams with roles

Deliverables
- Backend: Teams, TeamMembers, SharedMonitors, Notification models + routes; SSE channelization for teams; migrations
- Frontend: Team dashboards and detail views; share flows; updated nav and layouts
- Docs: Monitor scoping (`docs/14-MONITOR-SCOPING-IMPLEMENTATION.md`), features plan (`docs/10-NEW-FEATURES-TO-IMPLEMENT.md`)

Acceptance Criteria
- Clear separation of personal vs team monitors (no data leakage across scopes)
- Team members see team monitors; owner/admin permissions enforced for edits
- Share invitations/resulting access reflected in UI; SSE updates flow to correct scope/channel

Data & Migrations
- Add/verify tables: Teams, TeamMembers, SharedMonitors, Notifications, Tags, Dependencies
- Ensure safe migration order and backfill strategies

Progress Tracking (example placeholder)
- Frontend: 100% 
- Backend: 100% 
- Overall: 100%



---

## v2.1 — Productivity (Planned)

Scope
- Popup browser notifications for critical events
- Team member management page (CRUD)
 

Deliverables
- Backend: notification preference controls; team member endpoints (list/add/update/remove)
- Frontend: permissioned team member UI; browser notification opt‑in

Acceptance Criteria
- Browser notifications gated by permission, de‑duplication and throttle applied
- Team member CRUD respects roles; changes reflected real time
 

Progress Tracking
- Frontend: 100%
- Backend: 100%
- Overall: 0.5×100 + 0.5×100 = 100%

---

## v2.2 — SSO & Integrations (Planned)

Scope
- Microsoft SSO login/register

Deliverables
- Backend: OAuth (Microsoft) integration (authorization code flow), secure token handling
- Frontend: SSO entry points (login/register), logout handling, error states

Acceptance Criteria
- Microsoft SSO completes full auth lifecycle and pairs/creates local user securely
- Protects against CSRF/state replay; proper nonce/state validation

Progress Tracking
- Frontend: 0%
- Backend: 0%
- Overall: 0%