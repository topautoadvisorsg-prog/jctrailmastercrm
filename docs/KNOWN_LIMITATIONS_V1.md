# Known Limitations — Version 1.0

Honest, concise list of what V1 does not do yet, so nobody — us or JC Trailmaster — accidentally assumes functionality that isn't built. This is a beta launch; she knows it's beta. Update this file as gaps close.

## Not built yet (Phase 2 roadmap — see `docs/ADR-002-v1-phase-sequencing.md`)

- **Jobs / Work Orders (Service Operations):** Planned. No way yet to track a repair job's status, assigned technician, labor, parts, or photos.
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
- **Reporting:** Dashboard shows live counts and recent activity, but is intentionally minimal (counts, pipeline value, overdue tasks) — no custom report builder or exports yet.

## Infrastructure

- Backend deployment (Railway + Supabase + object storage) is in progress as of this writing — see `docs/ADR-000-platform-architecture.md` and the deploy plan in this README. Until it's live, the CRM is not reachable outside local development.

## How to use this document

When JC Trailmaster (or anyone) asks "can it do X" and X is on this list: the honest answer is "not yet, it's on the roadmap" — not a workaround, not a promise of a specific date unless one has actually been committed. Update this file the moment any item ships; don't let it go stale.
