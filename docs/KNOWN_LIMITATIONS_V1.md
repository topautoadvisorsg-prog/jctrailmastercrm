# Known Limitations — Version 1.0

Honest, concise list of what V1 does not do yet, so nobody — us or JC Trailmaster — accidentally assumes functionality that isn't built. This is a beta launch; she knows it's beta. Update this file as gaps close.

## Not built yet (Phase 2 roadmap — see `docs/ADR-002-v1-phase-sequencing.md`)

- **Jobs / Work Orders (Service Operations):** Foundation is production-installed and verified through the admin-guarded setup endpoint, native Twenty navigation, native create/edit/search/delete, notes, tasks, attachments, timeline tabs, and dashboard count movement. The custom 21 CRM sidebar shortcut still needs the approved frontend release. Labor, parts, photos, dispatch history, and deep job workflow are not built yet.
- **Estimates:** Planned. No line-item estimate builder or estimate-approval flow.
- **Invoicing:** Planned. No job-to-invoice conversion; no payment collection.
- **Calendar / Dispatch Scheduling:** Planned. No technician calendar or appointment scheduling.
- **Workflow Automation:** Planned. No stage-triggered actions (e.g. "estimate approved → create job").
- **Unified Communications Inbox:** Planned. SMS/email/call-log compliance rules exist server-side, but there is no thread-style inbox UI yet.
- **Missed Call Text-Back:** Planned. Flagged as highest-priority Phase 2 automation once messaging exists.
- **Reputation Management:** Planned. No automated review-request flow.

## Working, but with real boundaries

- **SMS/Twilio:** Compliance logic (consent, opt-out, quiet hours, Do Not Contact) is implemented and tested, but **no live SMS can be sent** — `TWILIO_LIVE_SENDS_APPROVED` stays `false` until credentials, webhooks, and a real approval step are in place. This is a deliberate safety gate, not a bug.
- **Record-level ownership:** Limited to the current Twenty edition's capabilities. Twenty's free/native permissions control access **per object type** (e.g. "Field Tech role can't see Deals at all"), configured for real per JC Trailmaster's staff in Settings → Roles. **Per-record ownership** ("Sales Rep A can't see Sales Rep B's deals") requires Twenty's Enterprise edition, which we are not using in V1. See `docs/ADR-003-twenty-native-permissions-vs-custom-rbac.md` for the full analysis — this is a deferred product/business decision, not a technical oversight.
- **Custom RBAC module** (`modules/custom/permissions/`): exists and is tested, but only ever governs 21 CRM-specific custom actions (white-label settings, messaging sends) — it does not and cannot govern access to the actual Contact/Company/Deal/Task records, which flow entirely through Twenty's native permission engine.
- **Branding:** Company name, colors, address, phone, and timezone are configured for JC Trailmaster. No logo image asset exists yet — add one when she provides it.
- **Reporting:** Dashboard code supports live counts, including Work Orders, and recent activity/provider health when those CRM audit tables are present. Reporting is intentionally minimal: no custom report builder or exports yet.

## Infrastructure

- Backend and frontend deployment are live:
  - Frontend: `https://jc-trailmaster-crm.vercel.app`
  - Backend health: `https://jctrailmastercrm-production.up.railway.app/healthz`
- Current launch limitation: Work Orders authenticated production QA passed with the supplied admin account, but broader auth/settings/permissions QA still needs dedicated admin and standard test users.
- Current production-configuration issue: public workspace metadata returns `JC Test`; rename/provision the production workspace as `JC Trailmaster` before customer handoff.
- Current release-control issue: Railway reports the backend project name as `attractive-fascination`, even though the environment is `production`, service is `jctrailmastercrm`, and backend URL is correct. This is configuration cleanup, not a hotfix blocker once the service URL is verified.
- Latest verified backend deployment: Railway deployment `16da6491-ee5e-4388-8f87-28c8c5dec45a`, image `sha256:0f31b7de249fdf10b06390694980a90a6c50ccf3459a565691d6c471acab27c6`, health `200`. The dashboard Work Order count was production-smoked `0 -> 1 -> 0` on 2026-07-29, and the QA record was deleted.

## How to use this document

When JC Trailmaster (or anyone) asks "can it do X" and X is on this list: the honest answer is "not yet, it's on the roadmap" — not a workaround, not a promise of a specific date unless one has actually been committed. Update this file the moment any item ships; don't let it go stale.
