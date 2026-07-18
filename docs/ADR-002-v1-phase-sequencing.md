# ADR-002: V1 Phase Sequencing for JC Trailmaster Launch

Status: Proposed
Date: 2026-07-18

## Decision

Ship JC Trailmaster's V1 in two phases. Do not build Phase 2 field-service modules before Phase 1 core is production-ready and deployed.

Phase 2's "Jobs" module is renamed **Service Operations** — a generic work-record primitive (customer, asset, status, assignee, priority, notes, photos, attachments, labor, parts, timeline) that fits trailer repair today and any other service business later. Never build it as a trailer-repair-specific object.

## Rationale

The first production customer validates the platform, not a feature checklist. `CRM_BLUEPRINT_V2.md` describes the full GoHighLevel + Housecall Pro product vision; that is the roadmap, not the V1 cut. Shipping a stable, fully-working core earns trust and produces the real usage feedback that should drive Phase 2 priority, rather than guessing at feature order in advance.

Working style for this engagement: slow and deliberate, not fast. Every phase gets reviewed before merge, architecture stays clean (no scrambled folders, no `// TODO`/ignored lint errors), and this doc plus the READMEs get updated as the source of truth so mistakes don't get silently re-introduced.

## Phase 1 — Production Core (audit + polish, not a rebuild)

Most of this already exists via Twenty's core engine. The work is verification and polish, not net-new features:

- Contacts & Companies — verify record pages, list views, filters work end-to-end
- Pipeline / Deals — verify Kanban, stage config, won/lost reasons
- Tasks — verify linkage to contacts/companies/deals
- Notes & Activity Timeline — verify Notes (`modules/note`) actually surface on contact/company record pages (flagged as unverified from JC Trailmaster's note-per-contact request)
- Dashboard — verify live KPIs, activity feed, provider health panel render correctly with real data
- User Management & Permissions — verify `modules/custom/permissions` covers the roles JC Trailmaster actually needs
- Basic Reporting — verify `crm-dashboard` summary numbers are accurate against seeded/real data
- SMS compliance & messaging safety — already implemented (`messaging-compliance.service.ts`, Twilio safety gating); verify config matches JC Trailmaster's actual quiet hours/consent requirements
- Tenant configuration & branding — white-label `customer.config.json` for JC Trailmaster (name, colors, logo, address, phone, Eastern timezone, pipeline stages for a repair shop)
- Backend deployment — Railway (API + worker) + Supabase (Postgres) + S3/R2 (file storage), wired to the existing Vercel frontend

**Exit criterion:** every module exposed in the nav is fully functional. Disabled modules (`jobs`, `booking`, `invoicing`, `automations`, `reputation`, `forms` — currently `false` in `customer.config.json`) stay hidden, not present-but-broken.

## Phase 2 — Service Operations Foundation (priority order)

1. Service Operations (generic work-order record) — customer, asset, status, assignee, priority, notes, photos, attachments, labor, parts, timeline
2. Estimates — line items, labor, parts, tax, discounts, approval status; Estimate → Service Operation conversion
3. Invoicing — Service Operation → Invoice, no duplicate data entry
4. Calendar & Scheduling — built around Service Operations; technician assignment, appointment dates, calendar views (drag-and-drop deferred)
5. Workflow Automation — stage-triggered actions (new job → notify technician, job completed → review request, estimate approved → create work order, invoice unpaid → reminder, customer inactive → follow-up)
6. Unified Communications — SMS + email + phone log history on the customer timeline (builds on existing compliance foundation)
7. Missed Call Text-Back — highest-ROI automation; detect missed call → check consent → send configured response → create follow-up task if no reply
8. Reputation Management — post-completion review requests, tracking, follow-up automation

Each item only starts after the previous one is production-verified with JC Trailmaster's real usage feedback informing whether the priority order still holds.

## Engineering rule for every feature (both phases)

Before building anything, ask: does this belong in the platform, or only to JC Trailmaster?
- Benefits multiple service businesses → build into the platform, config-driven (not hardcoded)
- Unique to JC Trailmaster → isolate behind tenant configuration/feature flags, do not let it leak into shared code paths

## Success Criteria for V1

- JC Trailmaster manages customers confidently
- Pipeline/opportunities tracked without confusion
- CRM is stable and reliable — no exposed half-finished modules
- Onboarding process is smooth
- Real feedback collected to shape Phase 2 priority

## Consequences

- Phase 2 work does not start until Phase 1 audit is complete, deployed, and confirmed working with JC Trailmaster.
- This ADR supersedes ad-hoc feature requests during Phase 1 — new asks get triaged into "Phase 1 polish," "Phase 2 backlog item," or "JC-specific config," not built ad hoc.

## Correction Log (2026-07-18)

**Mistake:** during the Phase 1 permissions audit, `CrmPermissionsService`/`CrmRole` (`modules/custom/permissions/`) was found unwired to any guard/controller and deleted as apparent dead scaffolding, without first checking whether it was planned, unfinished work.

**Correction:** `CRM_BLUEPRINT_V2.md` (Security section, line ~778) explicitly requires "Role-based and object-ownership access ... enforced through the CRM permissions layer on every custom route/resolver/service entry point," and lists it as an unchecked V1 checklist item. `PRE_BUILD_REVIEW_AND_ROADMAP.md` independently flags "RBAC/object ownership leaks data" as a **High** risk and calls out the JWT+custom-RBAC vs. Twenty-native-auth question as an unresolved contradiction needing a decision. This is planned, unfinished scope — not dead code. Twenty's native per-object-type roles do not provide the per-record ownership check (`ownerId`/`assignedRepId`) this service implements, which is a materially different capability.

The deleted files (`crm-role.type.ts`, `crm-permissions.service.ts`) were restored verbatim from conversation history; `crm-permissions.module.ts` and `crm-permissions.service.spec.ts` were reconstructed (not recovered verbatim — this repo's `packages/twenty-server/src/modules/custom/` tree is untracked by git, so there was no history to restore from). Registration in `crm-custom.module.ts` restored. Build and tests verified green after restoration.

**Rule going forward:** before deleting any custom module under `modules/custom/*` as "unused," grep `CRM_BLUEPRINT_V2.md`, `PRE_BUILD_REVIEW_AND_ROADMAP.md`, and this ADR for references to it first. "Unwired" is not the same as "unplanned."

**Still open, not yet decided:** `CrmPermissionsService` is restored but still enforces nothing today — it still needs to actually be wired into a guard/interceptor on the relevant custom routes before it does anything. Given the roadmap's "High" risk rating, this should be resolved before JC Trailmaster goes live with more than one user role, not deferred to Phase 2.
