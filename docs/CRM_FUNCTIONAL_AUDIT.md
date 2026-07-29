# CRM Functional Audit

Audit date: 2026-07-29

Production frontend: https://jc-trailmaster-crm.vercel.app

Production backend: https://jctrailmastercrm-production.up.railway.app

## Scope And Method

This audit treats the CRM like a first-customer QA candidate. The review combines live anonymous production checks, authenticated production checks where credentials were available, local browser verification of patched frontend code, source review, and targeted test review. No provider API keys were available, so SMS, email, calendar-provider, payment, AI, and external webhook actions were not live-tested.

Authenticated Work Orders testing was completed against the production workspace. Broader multi-user auth, permissions, settings, provider, and service-operation flows still require dedicated QA users, admin configuration, or production provider credentials.

## Status Legend

- ✅ Working: implemented and verified enough for the current scope.
- 🟡 Partial: implemented in part, blocked by access/provider keys, or dependent on native Twenty behavior that still needs customer-specific verification.
- 🔴 Broken: clearly failing or unsafe.
- ⚪ Placeholder: not implemented, intentionally hidden, or only represented in planning/UI copy.

## Executive Findings

- The backend is live and healthy, and unauthenticated REST CRM endpoints correctly reject missing authentication.
- A production auth UX/security issue was found: anonymous users saw the sign-in modal over Twenty mock workspace UI. This is fixed in code and needs a frontend redeploy.
- Production public workspace metadata currently returns `JC Test`, while the customer config and docs target `JC Trailmaster`.
- The current custom 21 CRM layer is primarily a command dashboard plus module handoff pages. The real contact/company/opportunity/task CRUD surface remains Twenty native object pages.
- Work Orders foundation is now production-installed and authenticated QA passed for setup idempotency, native object navigation, create, edit, search, delete, notes, tasks, files/attachments, and timeline tab rendering.
- The CRM dashboard endpoint is production-verified after backend deployment `16da6491-ee5e-4388-8f87-28c8c5dec45a`; authenticated dashboard calls return `200`, and Work Order counts were proven through a 0 -> 1 -> 0 create/delete smoke test.
- Estimates, customer invoicing, service dispatch calendar, unified communications inbox, missed-call text-back, and reputation automation are not built yet.
- AI receptionist readiness is planned around Retell AI, but it should wait until the CRM can turn calls into meaningful records: Lead → Work Order → Estimate → Invoice.
- The platform is not ready for first customer handoff until the patched frontend is deployed, production workspace identity is corrected, and broader authenticated smoke tests are completed.

## Authentication

Status: 🟡 Partial

Purpose: protect the CRM, support login/logout/session persistence, password reset, invite flow, and profile access.

Expected behavior: anonymous users should see only auth/onboarding UI, authenticated users should enter the CRM workspace, sessions should persist securely, password reset and invite links should land on their dedicated flows, and profile/settings should be reachable after login.

Current behavior:

- Password authentication is enabled in public workspace metadata.
- Google, Microsoft, SSO, magic link, and auth bypass are disabled in production public metadata.
- Unauthenticated REST calls to `/rest/crm/dashboard` and `/rest/metadata/objects` return `403 Missing authentication token`.
- The deployed `/welcome` page currently renders the auth modal over Twenty mock workspace UI until the patched frontend is redeployed.
- Local patched verification shows the auth page with no mock workspace navigation or seeded company rows.
- Password login works against the production workspace for the supplied admin test account.
- Logout, session persistence across browser restarts, password reset, invite acceptance, and user profile were not fully live-tested in this pass.

Issues:

- AUD-001: Auth modal rendered over mock workspace UI.
  Description: anonymous production `/welcome` displayed Twenty demo navigation and seeded companies behind the sign-in modal.
  Root cause: `DefaultLayout` rendered `BackgroundMockNavigationDrawer` and `BackgroundMockPage` whenever the auth modal was visible.
  Priority: P0.
  Estimated effort: Done in code; redeploy required.
  Recommended solution: deploy the patched frontend and re-run anonymous auth smoke tests.

- AUD-002: Production workspace identity is wrong.
  Description: public metadata returns display name `JC Test` instead of `JC Trailmaster`.
  Root cause: production workspace/database configuration does not match `customer.config.json`.
  Priority: P0.
  Estimated effort: Small, once admin access is available.
  Recommended solution: rename/provision the production workspace through the authoritative admin flow, add the final logo when available, then verify auth screens and metadata.

- AUD-003: Broader authenticated QA is incomplete.
  Description: Work Orders were verified with an authenticated admin account, but the full auth matrix still needs logout, session persistence, reset, invite, profile, and multi-role checks.
  Root cause: this pass used one supplied admin account and focused on Work Orders.
  Priority: P1.
  Estimated effort: Small to medium.
  Recommended solution: create dedicated QA admin and standard users, then run login/logout/session/reset/profile/invite smoke tests.

## Dashboard

Status: 🟡 Partial

Purpose: provide a live command center for CRM health, counts, activity, provider events, and launch readiness.

Expected behavior: show live metrics, loading states, empty states, refresh behavior, recent activity, provider health, and clear readiness lanes.

Current behavior:

- The authenticated backend endpoint `/rest/crm/dashboard` is implemented and protected by Twenty workspace auth guards.
- The frontend dashboard hook sends non-empty bearer tokens only, validates payloads through a Zod schema, and exposes readable loading/error states.
- The dashboard renders operational snapshot metrics, object handoff links, recent activity, provider health, and readiness groups.
- Work Orders are counted when the `workOrder` custom object exists; before setup, local code intentionally reports zero instead of failing the whole CRM page.
- Anonymous production access is correctly denied at the API layer.
- Live authenticated production dashboard calls return `200`.
- Backend deployment `16da6491-ee5e-4388-8f87-28c8c5dec45a` fixed the production permission/count failure by counting workspace tables through the core datasource with permission-safe query options and preserving TypeORM query binding.
- Work Order dashboard count was production-proven on 2026-07-29: before create `0`, after creating QA Work Order `cc69e557-1261-4604-876a-277e79eff110` count `1`, after delete count `0`.
- The Lingui warning for `Could not find flat entity in maps` was removed by replacing an internal exception `t` macro with a plain developer error string; fresh deployment logs after the dashboard proof showed no matching Lingui/uncompiled-message warnings.
- Reporting is minimal and not a custom report-builder/export experience.

Issues:

- AUD-004: Dashboard endpoint production failure resolved.
  Description: authenticated `GET /rest/crm/dashboard` previously returned `500` with `"Entity performing the request does not have permission"`, blocking live dashboard Work Order count verification.
  Root cause: workspace repository counts were too tightly coupled to Twenty object permission evaluation for this aggregate dashboard use case, and the first production fix lost TypeORM datasource method binding.
  Priority: Resolved P1.
  Estimated effort: Done.
  Recommended solution: keep the focused regression tests for permission-style count failures, missing Work Order tables, missing CRM audit/provider tables, and datasource query binding.

- AUD-005: Reporting is intentionally minimal.
  Description: dashboard counts and readiness panels do not replace pipeline reporting, exports, sales velocity, or service-business reporting.
  Root cause: V1 scope kept reporting lightweight.
  Priority: P2.
  Estimated effort: Medium.
  Recommended solution: add customer-value reports after CRUD and service operations are stable.

## Contacts

Status: 🟡 Partial

Purpose: manage people, relationship context, notes, tasks, timelines, search, filters, import, and export.

Expected behavior: users should be able to create, edit, delete, search, filter, relate contacts to companies/deals, add notes, view timeline activity, and import/export contact data.

Current behavior:

- The custom `/crm/contacts` page is a CRM operating layer with readiness context and a handoff to Twenty's native People object page.
- Native Twenty People pages are the intended source of truth for CRUD, filters, saved views, import/export, notes, relations, and record details.
- Backend compliance services know how to evaluate contact-style consent states, but consent persistence and UI wiring need authenticated object-field verification.
- Live authenticated contact CRUD was not tested.

Issues:

- AUD-006: Contact workflow depends on native Twenty configuration.
  Description: contact CRUD is not custom-built in the CRM wrapper; it depends on native People object pages and workspace field/view setup.
  Root cause: true Twenty fork architecture.
  Priority: P1.
  Estimated effort: Medium.
  Recommended solution: with admin access, verify People fields, required service-business fields, notes/timeline relations, import/export, filters, and role visibility.

- AUD-007: Consent data model needs final customer-facing wiring.
  Description: SMS/email safety logic exists, but the visible fields and audit trail for opt-in/opt-out need end-to-end verification.
  Root cause: provider layer is intentionally disabled until keys and webhooks are approved.
  Priority: P1.
  Estimated effort: Medium.
  Recommended solution: add/verify consent fields, STOP/START persistence, activity logging, and communication-blocking UI before live messaging.

## Companies

Status: 🟡 Partial

Purpose: manage organizations, linked contacts, notes, activities, search, and filters.

Expected behavior: users should be able to create, edit, delete, search/filter companies, relate contacts/deals, and review company-level notes and activity.

Current behavior:

- The custom `/crm/companies` page provides module context and links to the native Companies object page.
- Native Twenty Companies are expected to handle CRUD, relations, saved views, notes, and activity.
- Live authenticated company CRUD and relationship testing was not possible.

Issues:

- AUD-008: Company readiness is unverified in production.
  Description: source review confirms the intended path, but actual fields/views/relations need live QA.
  Root cause: no authenticated workspace access.
  Priority: P1.
  Estimated effort: Small to medium.
  Recommended solution: run company CRUD, contact linking, deal linking, notes, filters, and delete/restore tests with a QA account.

## Opportunities / Pipeline

Status: 🟡 Partial

Purpose: track deals/opportunities through configured pipeline stages and provide pipeline visibility.

Expected behavior: create opportunities, move stages, persist drag-and-drop changes, filter by owner/stage, and report pipeline value/conversion.

Current behavior:

- The custom `/crm/deals` page hands off to Twenty's native Opportunities object page.
- `customer.config.json` contains JC Trailmaster-style stages: New Lead, Contacted, Estimate Sent, Estimate Approved, Closed Won, Closed Lost.
- It is not confirmed that those stages are applied in the production workspace database.
- Pipeline reporting is currently dashboard-level, not a full reporting module.
- Drag-and-drop/stage persistence was not live-tested.

Issues:

- AUD-009: Pipeline stage configuration is not verified in production.
  Description: config file stages may not match the live workspace stage options.
  Root cause: workspace metadata/setup access was unavailable.
  Priority: P1.
  Estimated effort: Small.
  Recommended solution: verify and, if needed, update opportunity stage options through the workspace setup path.

- AUD-010: Pipeline reporting is not production-complete.
  Description: V1 does not include full funnel reports, aging, conversion, forecast, or export.
  Root cause: reporting was deferred behind core CRM stability.
  Priority: P2.
  Estimated effort: Medium.
  Recommended solution: add reports after opportunity CRUD/stages are stable.

## Tasks

Status: 🟡 Partial

Purpose: manage follow-ups, due dates, assignment, completion, and task-driven customer workflows.

Expected behavior: users should create, assign, complete, edit, and filter tasks, with due-date handling and optional notifications.

Current behavior:

- The custom `/crm/tasks` page hands off to the native Tasks object page.
- Native Twenty tasks are the expected source of truth for CRUD, assignment, due dates, and completion.
- Missed-call task creation and provider-driven notifications are not live because communications automation is deferred.
- Authenticated task testing was not completed.

Issues:

- AUD-011: Task workflow needs authenticated smoke testing.
  Description: native task behavior has not been verified in the deployed workspace.
  Root cause: no QA user/invite.
  Priority: P1.
  Estimated effort: Small.
  Recommended solution: test create/edit/assign/complete/due-date filters and dashboard overdue counts.

- AUD-012: Task notifications are not implemented for service workflows.
  Description: no verified notification flow exists for missed calls, due tasks, or service reminders.
  Root cause: provider/background-job layer is deferred.
  Priority: P2.
  Estimated effort: Medium.
  Recommended solution: add notification rules after communications and background jobs are approved.

## Work Orders / Jobs

Status: Partial

Purpose: turn leads, calls, and service requests into actionable operational records before estimates, invoices, dispatch, and AI receptionist workflows.

Expected behavior: admins should be able to set up a Work Orders object once, then users should create, edit, search, filter, assign, relate, schedule, and track work orders through native Twenty object pages.

Current behavior:

- Backend deployment `7e4b4661-38de-4ce0-83fa-400f02961336` exposes `GET /rest/crm/work-orders-setup` and `POST /rest/crm/work-orders-setup`.
- Both setup endpoints require Twenty workspace authentication and the native `DATA_MODEL` permission.
- The setup service creates a custom `workOrder` object through Twenty metadata services instead of side tables.
- Work Order fields include status, priority, service type, source, description, service address, scheduled start/end, completed at, estimated amount, customer, company, opportunity, and assigned technician.
- The frontend includes `/crm/work-orders`, sidebar navigation, dashboard links, module context, and native handoff to `/objects/workOrders` in the local codebase.
- Production `GET /rest/crm/work-orders-setup` returns `200`, `isReady: true`, object `ee836032-6ecf-41a6-9af0-942a042fc0c8`, and all 14 expected fields as existing.
- Two repeat production `POST /rest/crm/work-orders-setup` calls returned `201`, `isReady: true`, 14 existing fields, 0 created fields, and 0 missing fields, proving idempotency after repair.
- Native `/objects/workOrders` opens in the deployed frontend.
- Work Orders appears in Twenty's native workspace object navigation.
- Native UI create, edit/autosave, list count, full record open, notes, tasks, files/attachments, and timeline tabs were verified.
- REST create/read/update/search/delete was verified, including `name[ilike]` search filtering.
- QA Work Order, QA note, and QA task records were deleted after verification; final production Work Order count is 0.
- The CRM dashboard counts Work Orders in production. The final smoke test created QA Work Order `cc69e557-1261-4604-876a-277e79eff110`, moved the dashboard count from `0` to `1`, deleted the QA record, and confirmed the count returned to `0`.
- The deployed frontend's custom `21 CRM` section still does not show the Work Orders shortcut until the frontend release is deployed, but native Twenty navigation does show it through metadata.
- Labor, parts, photos, dispatch history, estimate conversion, invoice conversion, and workflow automation are not built yet.

Issues:

- AUD-028: Dashboard Work Order count production proof completed.
  Description: Work Orders setup, native object behavior, REST CRUD, and dashboard count movement are now proven in production.
  Root cause: the earlier blocker was the dashboard aggregate count path, not the Work Order object metadata.
  Priority: Resolved P1.
  Estimated effort: Done.
  Recommended solution: keep future Work Order count checks in the release smoke suite and avoid weakening native object permissions for aggregate dashboards.

- AUD-029: Work Orders are not yet a complete field-service job module.
  Description: the foundation captures intake, status, scheduling, ownership, relationships, notes, tasks, and attachments, but does not yet track labor, parts, photos, technician dispatch history, or conversion to estimates/invoices.
  Root cause: this slice intentionally builds the operational anchor before deeper service workflows.
  Priority: P1.
  Estimated effort: Large.
  Recommended solution: extend the model around line items, job activity, dispatch scheduling, and estimate/invoice handoff after dashboard and frontend release blockers are cleared.

- AUD-030: Work Orders custom 21 CRM sidebar shortcut needs frontend release.
  Description: native Twenty workspace navigation includes Work Orders, but the deployed custom `21 CRM` section still lists Dashboard, Contacts, Companies, Deals, and Tasks only.
  Root cause: Vercel frontend deployment was intentionally not attempted from an unauthorized local session.
  Priority: P1.
  Estimated effort: Small.
  Recommended solution: deploy the already-implemented frontend Work Orders navigation through the approved Vercel/GitHub release path.

- AUD-031: Railway project name should be cleaned up.
  Description: Railway reports project `attractive-fascination`, environment `production`, and service `jctrailmastercrm`. The service URL is confirmed as the intended production backend, so the project name is not a hotfix blocker.
  Root cause: Railway project naming/configuration drift.
  Priority: P3.
  Estimated effort: Small.
  Recommended solution: rename or relink the Railway project label when convenient so future release target checks are less confusing.
## Calendar

Status: 🟡 Partial

Purpose: support calendar rendering, provider sync, event creation/editing, navigation, and timezone-safe scheduling.

Expected behavior: users should see calendar events, create/edit events, navigate time periods, and trust timezone behavior.

Current behavior:

- Twenty includes native calendar sync/import modules and account calendar settings.
- The 21 CRM service-business calendar/dispatch/booking module is not built and `booking` is disabled in `customer.config.json`.
- Provider calendar testing was not performed because no Google/Microsoft credentials are available.
- No technician dispatch calendar or appointment-booking flow exists yet.

Issues:

- AUD-013: Service dispatch calendar is absent.
  Description: Twenty's account calendar features do not satisfy field-service scheduling, technician assignment, or booking needs.
  Root cause: Phase 2 service operations scope is not implemented.
  Priority: P1.
  Estimated effort: Large.
  Recommended solution: build service appointment/work-order scheduling after Work Orders setup is run and native Work Order workflows are QA'd.

- AUD-014: Provider calendar sync is unverified.
  Description: native calendar setup exists, but no external calendar connection was tested.
  Root cause: no provider credentials.
  Priority: P2.
  Estimated effort: Small after credentials.
  Recommended solution: test connect/disconnect, sync, event creation, editing, and timezone display with sandbox provider accounts.

## Activities

Status: 🟡 Partial

Purpose: preserve notes, calls, emails, provider events, user actions, and timeline history.

Expected behavior: record timelines should show ordered history; custom provider events and compliance-sensitive actions should be audit logged.

Current behavior:

- Twenty native notes/tasks/timeline capabilities exist for records.
- Custom `crmActivityLog` and `crmProviderEvent` services exist and have targeted test coverage.
- The custom dashboard reads recent activity/provider health.
- There is no unified communication timeline combining calls, SMS, email, and notes into a service-business inbox.
- Authenticated timeline ordering and record-level activity display were not live-tested.

Issues:

- AUD-015: Unified CRM activity timeline is incomplete.
  Description: native activity exists and custom audit logs exist, but there is no fully unified customer communication/activity timeline.
  Root cause: communications layer and custom timeline UI are deferred.
  Priority: P1.
  Estimated effort: Medium to large.
  Recommended solution: connect provider events, notes, emails, calls, SMS, and object updates into a consistent timeline after communications persistence is finalized.

## Invoices / Estimates

Status: ⚪ Placeholder

Purpose: create customer estimates, convert approved estimates to jobs/invoices, collect payment, and track accounting status.

Expected behavior: users should build line-item estimates, send for approval, convert to invoices, accept payment, and associate invoices with customers/jobs.

Current behavior:

- Twenty includes subscription/billing infrastructure for the CRM application's own billing, including Stripe-oriented internals.
- Source review did not find a service-business estimate or invoice object/module in this fork.
- The `invoicing` customer module flag is disabled.
- Docs correctly mark estimates and invoicing as planned Phase 2 work.
- This does not appear to be an unfinished implementation or a hidden Enterprise-only service-invoice module in the reviewed code. It is absent for this product scope.

Issues:

- AUD-016: Customer estimates and invoices are not built.
  Description: no estimate builder, line items, approval flow, invoice conversion, payment collection, or invoice ledger exists.
  Root cause: planned Phase 2 product scope, not Twenty-native functionality.
  Priority: P1.
  Estimated effort: Large.
  Recommended solution: run and QA Work Orders setup first, then build estimates, approvals, invoice conversion, and payment collection against that model.

## Email

Status: 🟡 Partial

Purpose: configure email accounts, send/receive messages, log communication, and handle attachments.

Expected behavior: users should connect email, send and receive messages, log messages to records, and handle attachments safely.

Current behavior:

- Twenty includes native messaging/email sync infrastructure and email account settings.
- No provider credentials were available, so send/receive/sync/attachment testing was not performed.
- The 21 CRM unified communications inbox is not built.
- SMS compliance guardrails are implemented server-side, but email consent/template/rate-limit policy needs final product wiring.

Issues:

- AUD-017: Email provider flow is unverified.
  Description: native email features exist but have not been tested against a real provider in this deployment.
  Root cause: no provider credentials.
  Priority: P2.
  Estimated effort: Small to medium.
  Recommended solution: use sandbox accounts to test account connection, inbound sync, outbound send, attachments, and record logging.

- AUD-018: Unified communications inbox is absent.
  Description: service users need one place to see customer SMS, calls, emails, and notes.
  Root cause: Phase 2 communications module is not implemented.
  Priority: P1.
  Estimated effort: Large.
  Recommended solution: build a communications data model and inbox only after consent/audit rules are locked.

## AI Receptionist Readiness

Status: ⚪ Planned

Purpose: capture after-hours callers and automatically create actionable CRM records instead of loose notes.

Expected behavior: the AI receptionist should answer after-hours calls, collect caller information, understand the reason for the call, create or update CRM records, preserve the transcript and summary, and route follow-up work to the owner.

Recommended provider: Retell AI.

Current behavior:

- No Retell AI integration exists yet.
- No production AI receptionist webhook, call transcript persistence, call summary persistence, or call-to-record workflow exists yet.
- Work Orders foundation is production-installed and native-object QA passed, but Estimates/Invoices are not built yet. Retell AI should still wait until the operational record flow can continue from Work Order to Estimate to Invoice.
- Existing provider-event and activity-log infrastructure can be reused as part of the future call ingestion/audit trail.
- API keys remain placeholders; no Retell calls or live provider tests were performed.

Phase 1 scope:

- Answer after-hours calls.
- Collect caller name, phone, email, address, and request type.
- Answer common business questions from approved business information.
- Create or update the contact/lead.
- Save transcript.
- Save AI summary.
- Create a follow-up task.
- Notify the owner the next business day.

Phase 2 scope:

- Appointment scheduling.
- Existing customer lookups.
- Estimate status lookup.
- Invoice status lookup.
- Calendar integration.
- CRM lookups during calls.

Issues:

- AUD-019: AI receptionist is blocked by incomplete operational records.
  Description: calls about estimates, repairs, scheduling, or invoice status need production-ready Work Orders, Estimates, and Invoices before automation can create useful outcomes.
  Root cause: Work Orders foundation is production-proven, but deeper job workflow, estimate, and invoice modules are still pending.
  Priority: P1.
  Estimated effort: Large.
  Recommended solution: finish QA, lock the core CRM, then build Work Orders, Estimates, and Invoices before Retell AI call automation.

- AUD-020: Retell AI integration needs a dedicated security/compliance design.
  Description: call transcripts and AI summaries can contain personal information and customer-service commitments.
  Root cause: no AI provider integration architecture has been approved yet.
  Priority: P1.
  Estimated effort: Medium.
  Recommended solution: define webhook verification, transcript retention, consent disclosure, owner notifications, task creation rules, and audit logging before live calls.

## Permissions

Status: 🟡 Partial

Purpose: enforce admin and standard-user access, object visibility, field permissions, and safe custom actions.

Expected behavior: native CRM data should use Twenty's object/field permission engine; custom actions should use scoped checks and audit logging.

Current behavior:

- Architecture docs correctly choose native Twenty permissions for real records.
- Custom CRM permission service exists and is tested for custom actions.
- Dashboard API uses native Twenty workspace guards.
- Custom RBAC is not a replacement for object/record-level permissions.
- Record-level ownership is deferred because it depends on edition/business decisions.
- Admin/standard-user production role testing was not performed.

Issues:

- AUD-021: Role behavior needs live verification.
  Description: admin vs standard user visibility, object permissions, and field permissions are not QA-verified in production.
  Root cause: no multiple test users/roles.
  Priority: P1.
  Estimated effort: Medium.
  Recommended solution: create admin and standard QA users, configure native roles, and run object/field visibility tests.

- AUD-022: Write-capable MCP or automation would need stricter controls.
  Description: any future write tools must include scoped permissions, confirmation flows for destructive actions, and audit logging.
  Root cause: write automation is intentionally deferred.
  Priority: P2.
  Estimated effort: Medium.
  Recommended solution: keep MCP read-only until a security design and tests exist.

## Settings

Status: 🟡 Partial

Purpose: let admins manage workspace identity, members, roles, accounts, objects, fields, providers, billing, and branding.

Expected behavior: settings pages should be reachable after login, persist changes, respect permissions, and make incomplete provider features obvious.

Current behavior:

- Twenty has broad native settings surfaces for workspace, members, roles, accounts, objects, and integrations.
- Production public metadata still identifies the workspace as `JC Test`.
- `customer.config.json` contains JC Trailmaster branding, colors, contact info, quiet hours, module flags, and placeholders.
- No final logo asset exists yet.
- The frontend HTML metadata still contains Twenty defaults in static shell markup.
- Every settings page was not live-tested due to missing authenticated access.

Issues:

- AUD-023: Workspace branding is incomplete/mismatched.
  Description: production display name and static app metadata are not fully aligned with JC Trailmaster.
  Root cause: production workspace configuration and frontend shell metadata were not finalized.
  Priority: P1.
  Estimated effort: Small.
  Recommended solution: update production workspace name/logo and frontend title/meta/favicon assets as a release-blocking polish task.

- AUD-024: Settings QA is incomplete.
  Description: role, member, account, object, field, and provider settings need a tab-by-tab authenticated pass.
  Root cause: no authenticated QA account.
  Priority: P1.
  Estimated effort: Medium.
  Recommended solution: run settings smoke tests with admin and standard users before handoff.

## Performance

Status: 🟡 Partial

Purpose: ensure the CRM loads quickly, avoids slow queries, and remains stable under realistic usage.

Expected behavior: pages should load without blank states, dashboard queries should remain fast, and builds/deploys should be predictable.

Current behavior:

- Backend health endpoint responds successfully.
- Anonymous protected REST endpoints fail fast with authentication errors.
- Dashboard service uses count queries and limited recent activity/provider-event reads.
- Local Vite verification required forced dependency optimization after a stale cache error.
- Local Nx frontend build timed out in this environment, so production build verification still needs CI/Vercel confirmation.
- Authenticated page load timing was not measured.

Issues:

- AUD-025: Local frontend build/dev verification is unstable in this environment.
  Description: Vite cache produced a missing dependency error on first run, and `nx build twenty-front` timed out locally.
  Root cause: local workspace/tooling cache and large Twenty frontend build behavior.
  Priority: P1.
  Estimated effort: Medium.
  Recommended solution: rely on clean CI/Vercel build logs for release approval, and document a cache reset path for local QA.

- AUD-026: Dashboard aggregate strategy may need scaling review.
  Description: per-object count queries are acceptable for launch but should be watched as data grows.
  Root cause: simple aggregate implementation.
  Priority: P3.
  Estimated effort: Medium later.
  Recommended solution: add metrics caching or rollups only after production data volume requires it.

## Error Handling

Status: 🟡 Partial

Purpose: avoid blank pages, unhandled exceptions, silent failures, missing validation, and broken routes.

Expected behavior: invalid routes should recover, API failures should show readable UI states, and malformed data should not crash the app.

Current behavior:

- Dashboard fetch code exposes readable request and validation failures.
- Dashboard response payloads are runtime-validated before entering UI state.
- Invalid CRM module keys redirect to `/crm`.
- Local patched auth page loaded without failed network requests after dependency optimization.
- Production auth page still needs redeploy of the mock-background fix.
- Full authenticated error-path testing was not possible.

Issues:

- AUD-027: Authenticated error-path coverage is incomplete.
  Description: forms, settings, native object pages, and provider settings need manual failure/validation checks.
  Root cause: this authenticated pass focused on Work Orders, not the full app-wide error-path matrix.
  Priority: P1.
  Estimated effort: Medium.
  Recommended solution: run form validation, invalid route, failed save, delete, import, and permission-denied tests before customer handoff.

- AUD-032: Production catalog warning resolved.
  Description: production logs previously repeated `Please compile your catalog first` warnings for `Could not find flat entity in maps`.
  Root cause: an internal flat-entity exception used a Lingui macro for developer-facing technical text.
  Priority: Resolved P2.
  Estimated effort: Done.
  Recommended solution: keep internal exception strings plain unless they are intentionally shown as localized user-facing messages; fresh logs after backend deployment `16da6491-ee5e-4388-8f87-28c8c5dec45a` showed no matching warnings.

## Features Fully Production-Ready

- Backend health route is live.
- Unauthenticated CRM REST access is denied.
- Provider live SMS sends are safety-gated and disabled without explicit credentials/approval.
- Twilio signature validation, client readiness checks, messaging compliance rules, provider-event persistence, activity-log persistence, customer-config validation, and dashboard contract logic have focused tests.

## Features Needing Minor Fixes

- Redeploy patched frontend so anonymous auth pages no longer show mock workspace UI.
- Deploy the frontend Work Orders shortcut in the custom `21 CRM` navigation through the approved frontend release path.
- Rename/provision production workspace from `JC Test` to `JC Trailmaster`.
- Add final logo and align static frontend title/meta/favicon.
- Run clean CI/Vercel build verification for the patched frontend.

## Features Needing Major Work

- Authenticated end-to-end QA for login, logout, profile, invite, reset, settings, permissions, and native object CRUD.
- Contact consent persistence and visible compliance audit trail.
- Deeper Work Orders service operations: labor, parts, photos, dispatch history, estimate handoff, invoice handoff, and automation.
- Estimates and customer invoicing.
- Service dispatch calendar and booking.
- Retell AI receptionist integration.
- Unified communications inbox and record communication timeline.
- Pipeline reporting and exports.

## Features To Postpone

- MCP write access.
- Generic AI assistants and recommendations beyond the Retell receptionist workflow.
- Advanced workflow automation builder.
- Reputation/review automation.
- Deep custom analytics.
- Record-level ownership unless the product/edition decision changes.

## Missing Features Important For Service Businesses

- Work orders/jobs are foundation-ready and production-verified for native object CRUD, notes, tasks, attachments, and timeline tabs, but still need labor, parts, photos, dispatch history, and deeper job workflow.
- Estimates with line items, approval, conversion, and customer-facing delivery.
- Invoices with payment status, payment links, refunds/voids, and accounting export.
- Calendar dispatch with timezone-safe appointment scheduling and technician workload.
- Unified customer communication timeline across calls, SMS, email, notes, and tasks.
- AI receptionist call intake with transcript, summary, lead/contact update, follow-up task, and owner notification.
- Missed-call text-back with consent, quiet hours, rate limits, STOP handling, and audit trail.
- Customer source tracking, lead response-time reporting, and pipeline conversion reporting.

## Recommended Implementation Order

1. Deploy the patched frontend auth-background fix and Work Orders shortcut, then verify both in production.
2. Correct production workspace identity, logo, title/meta, and customer branding.
3. Create QA admin and standard users; complete authenticated smoke tests for auth, settings, roles, and native object pages.
4. Lock the core CRM: native People, Companies, Opportunities, Tasks, roles, fields, views, imports/exports, and JC Trailmaster pipeline stages.
5. Lock the contact consent data model and audit trail before any live messaging or AI call handling.
6. Extend Work Orders as the operational anchor for service requests, jobs, scheduling, estimates, and invoices.
7. Build Estimates with line items and approval flow.
8. Build Invoices and payment status tracking after estimates are stable.
9. Integrate Retell AI receptionist Phase 1: after-hours answering, caller capture, contact/lead update, transcript, summary, follow-up task, and next-business-day owner notification.
10. Build the unified communications inbox and record communication timeline across calls, SMS, email, notes, tasks, and AI summaries.
11. Build dispatch calendar/booking on top of work orders.
12. Add missed-call text-back automation once messaging, consent, quiet hours, and audit logs are proven.
13. Expand reporting around pipeline, response time, work orders, estimates, invoices, calls, and revenue.
14. Revisit advanced automation, generic AI recommendations, reputation, and MCP write access after the customer-critical workflows are stable.
