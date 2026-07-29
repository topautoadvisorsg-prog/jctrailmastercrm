# 21 CRM

21 CRM is a production-focused CRM built as a true fork of Twenty. The product keeps Twenty's object model, metadata engine, React workspace, NestJS server, PostgreSQL persistence, Redis-backed jobs, and workflow foundations, then layers custom 21 CRM behavior on top.

## Current Build Status

- Platform direction: true Twenty fork, not a standalone rewrite.
- CRM feature layer: `/crm` now calls the authenticated `GET /rest/crm/dashboard` endpoint for live workspace counts, optional Work Order counts, recent CRM audit activity, and provider-event health.
- CRM module pages: `/crm/contacts`, `/crm/companies`, `/crm/deals`, `/crm/tasks`, and `/crm/work-orders` provide 21 CRM command surfaces that hand off to Twenty's native object records.
- Work Orders foundation: the admin-guarded setup endpoint is deployed and production-verified for the `workOrder` custom object, operational fields, idempotent repair, relations to people/companies/opportunities/workspace members, and native Twenty object navigation. Native create, edit, search, delete, notes, tasks, files, and timeline tabs were verified against the real workspace on 2026-07-29.
- Dashboard Work Order count: production backend deployment `16da6491-ee5e-4388-8f87-28c8c5dec45a` is live with image `sha256:0f31b7de249fdf10b06390694980a90a6c50ccf3459a565691d6c471acab27c6`; authenticated dashboard calls return `200`, and a QA Work Order smoke test proved count movement `0 -> 1 -> 0` with cleanup.
- Frontend shell: `/crm` dashboard route and `21 CRM` navigation section are in place.
- Backend extension boundary: custom CRM modules live under `packages/twenty-server/src/modules/custom`.
- Compliance foundation: SMS consent, opt-out, quiet-hour checks, and provider placeholders are implemented.
- Audit foundation: CRM activity log and provider-event idempotency persistence are implemented through core migrations.
- Verification gate: direct frontend typecheck, focused Jest suites, package-specific lint, formatting, and `npx nest build --path ./tsconfig.build.json` pass locally.
- Frontend bundle note: the Nx/Vite production frontend build can time out in this Windows Codex shell even after tests/typecheck/lint pass. Treat clean CI/Vercel build logs as the release bundle gate and keep wrapper timeouts documented separately from product defects.
- Provider keys: intentionally placeholders for now. No live Twilio, Stripe, Resend, Google, or AI provider calls are required for the current UI/build phase.

## Architecture

21 CRM uses the existing Twenty monorepo shape:

- `packages/twenty-front`: React/Vite frontend.
- `packages/twenty-server`: NestJS API, workers, auth, metadata, permissions, and CRM services.
- `packages/twenty-shared`, `packages/twenty-ui`, `packages/twenty-utils`: shared libraries.
- `packages/twenty-sdk`, `packages/twenty-client-sdk`, `packages/twenty-front-component-renderer`: required frontend/app SDK packages.

Custom planning and architecture decisions are documented in:

- `docs/ADR-000-platform-architecture.md`
- `docs/ADR-001-audit-and-provider-event-persistence.md`
- `docs/ADR-002-v1-phase-sequencing.md` — JC Trailmaster V1 phase plan (Phase 1 core audit, Phase 2 Service Operations)
- `docs/ADR-003-twenty-native-permissions-vs-custom-rbac.md` — Twenty native permissions vs. custom RBAC gap analysis and hybrid recommendation
- `docs/DEPLOYMENT_TROUBLESHOOTING_LOG.md` — full Railway backend deploy debugging history (7 bugs found and fixed, in order, with log evidence)
- `docs/FUTURE_MULTI_TENANT_PLATFORM.md` — future architecture note only; current deployment stays single-tenant, invite-only
- `docs/KNOWN_LIMITATIONS_V1.md` — honest V1 limitations list, kept current for JC Trailmaster onboarding
- `docs/CRM_POLISH_PLAN.md`
- `docs/TWENTY_EXTENSION_MAP.md`

## Local Setup

Use Node 24 and Yarn 4 via Corepack.

```bash
corepack enable
yarn install --immutable
```

On Windows, if `corepack enable` cannot write shims into `C:\Program Files\nodejs`, run Yarn through Corepack directly:

```bash
corepack yarn install --immutable
corepack yarn nx build twenty-front
```

That is an environment permission issue, not an application workaround. CI and Vercel should use Corepack with the committed `packageManager` and `.yarn/releases/yarn-4.13.0.cjs`.

## Build Commands

Frontend:

```bash
yarn nx build twenty-front
```

Server:

```bash
cd packages/twenty-server
npx nest build --path ./tsconfig.build.json
```

Targeted checks used during development:

```bash
npx oxfmt --check <changed files>
npx oxlint -c packages/twenty-front/.oxlintrc.json <changed frontend files>
npx oxlint -c packages/twenty-server/.oxlintrc.json <changed server files>
npx jest --config packages/twenty-server/jest.config.mjs <changed server spec files> --runInBand
(cd packages/twenty-front && npx tsgo -p tsconfig.json)
git diff --check
```

## Deployment

### Vercel Frontend

The committed `vercel.json` deploys the React frontend as a static SPA:

- install: `corepack enable && yarn install --immutable`
- build: `yarn nx build twenty-front && node scripts/write-vercel-front-env.mjs`
- output: `packages/twenty-front/build`
- routing: all routes rewrite to `index.html`

This matches Vercel's documented support for custom build commands, output directories, Corepack package-manager detection, and monorepo builds.

Set `REACT_APP_SERVER_BASE_URL` in Vercel to the public backend API origin. If it is missing, the frontend falls back to Twenty's default URL resolution and a standalone Vercel frontend will show the backend-unreachable error screen.

### Backend Services

Vercel is enough for the static frontend. The full CRM backend is not a pure static/serverless app. Production needs:

- a long-running `twenty-server` NestJS API process
- a worker process
- PostgreSQL
- Redis
- file storage
- provider webhook endpoints
- scheduled/background jobs

Deploy those backend services on infrastructure suited for long-running Node services and workers. Keep the frontend on Vercel and point it at the production API once the backend environment is provisioned.

## Resolved Build Issues

### Yarn Command Availability

Issue: the local Windows shell had Corepack available but no bare `yarn` shim on `PATH`, causing dependent Nx package builds to fail with `yarn` not recognized.

Resolution: the repo is configured for Corepack/Yarn 4 through `packageManager` and `.yarnrc.yml`. Local Windows shells without shims should use `corepack yarn ...`; Vercel/CI should run `corepack enable` before `yarn install`.

Temporary: no. This is the intended package-manager path for the repo.

### SDK Declaration Cleanup

Issue: `packages/twenty-sdk/project.json` used shell glob cleanup through `rimraf`. On Windows, those paths were rejected during the frontend dependency build with `Illegal characters in path`.

Resolution: cleanup now runs through `packages/twenty-sdk/scripts/clean-generated-declarations.mjs`, which removes generated declaration files with Node filesystem APIs instead of shell glob behavior.

Temporary: no. This is a source fix to the Nx build command.

### Front Component Renderer Strict Type

Issue: `twenty-front-component-renderer` failed strict declaration generation because `createCommandConfirmationModalBridge.ts` left the modal params callback implicitly typed as `any`.

Resolution: the callback now uses `Parameters<OpenCommandConfirmationModalFunction>[0]`, keeping the renderer aligned with the SDK contract.

Temporary: no. This is a type-contract fix.

### Frontend Build Warnings

Current non-blocking warnings:

- Browserslist data is stale.
- Some large chunks are inherited from the upstream Twenty frontend.
- Vite warns about a few dynamic imports that are also statically imported.
- Node can emit a `MaxListenersExceededWarning` during the Nx frontend build on Windows.
- In the local Windows Codex shell, the Nx/Yarn wrapper can remain alive after Vite prints a successful build; stop the Nx daemon with `corepack yarn nx daemon --stop` if that happens.
- Yarn reports inherited peer dependency warnings during immutable install.

Resolution: these do not block the Vercel frontend build. Treat bundle-size optimization and Browserslist refresh as performance hardening tasks, not current build blockers.

### Sparse Workspace Risk

Issue: this fork currently checks out only the core Twenty packages needed for the 21 CRM V1 scope. That keeps the workspace focused, but it also means root workspace and lockfile changes must be treated intentionally.

Resolution: the README, extension map, and package workspace list now document the focused package set. If a deferred upstream package becomes required, add it back deliberately and regenerate the lockfile.

Temporary: no, but it is an architecture decision that must be maintained consciously.

### CRM Polish Pass

Issue: pre-provider-key code needed focused safety tests before live integration work starts.

Resolution: targeted unit tests now cover SMS compliance policy, Twilio signature validation, CRM permission boundaries, and provider-event idempotency behavior.

Temporary: no. These tests are part of the production safety net for the custom CRM layer.

Issue: the `/crm` dashboard contained smart apostrophes that rendered incorrectly in the Windows shell review path.

Resolution: dashboard copy now uses ASCII apostrophes for stable rendering across editors, shells, and build output.

Temporary: no. This is a source cleanup.

### CRM Dashboard Feature Layer

Issue: the first `/crm` page was a static foundation shell, which was useful for navigation but not yet a real CRM operating surface.

Resolution: the server now exposes `GET /rest/crm/dashboard` under the authenticated CRM module. It aggregates contacts, companies, deals, tasks, and Work Orders through exact workspace-table counts, then reads recent CRM audit entries and provider-event health from the custom core tables when those tables are available. The frontend dashboard now renders live KPIs, recent activity, provider health, loading states, retry behavior, and fallback messaging when the backend is unavailable.

Issue: production dashboard counts initially failed with a permission error, and the first direct core-query hotfix failed in production with `Cannot read properties of undefined (reading 'manager')`.

Resolution: dashboard counts now use exact workspace-table counts through the injected core datasource with Twenty permission bypass options limited to this aggregate dashboard endpoint. The core query helper preserves TypeORM's datasource method binding, and focused tests cover missing Work Order metadata/table states, permission-style failures, missing CRM activity/provider tables, and datasource binding regression.

Temporary: no. This is the durable dashboard aggregate path for the custom CRM command center.

Issue: production logs emitted Lingui `Uncompiled message detected` warnings for the internal flat-entity exception message `Could not find flat entity in maps`.

Resolution: the internal developer exception message now uses a plain string, matching adjacent flat-entity helpers. User-facing exception text still flows through the existing `userFriendlyMessage` descriptor path.

Temporary: no. Fresh production logs after deployment `16da6491-ee5e-4388-8f87-28c8c5dec45a` and the dashboard smoke test showed no matching Lingui warnings.

Temporary: no. This is the first production feature-layer slice and keeps using Twenty's auth, workspace context, and object repositories.

Issue: the new dashboard initially imported local page code through an alias that Vite does not resolve for `src/pages`, causing the frontend production build to fail.

Resolution: dashboard-local imports now use relative paths from `CrmDashboardPage.tsx`, matching the existing frontend build boundaries.

Temporary: no. This is a source import-boundary fix.

Issue: direct root-level `npx oxlint <files>` can pick up package `.oxlintrc.json` files in a way that rejects the existing package-level `options.typeAware` setting.

Resolution: use package-specific lint configs for targeted linting. The targeted frontend and server CRM dashboard files pass with their package configs, and Nest compile remains the required server build check.

Temporary: no code workaround was added. This documents the current tool behavior so CI/local verification commands stay explicit.

Issue: on Windows, server `oxlint` can panic from allocator pressure when checking TypeScript server files with default parallelism or while other lint/build processes are running.

Resolution: rerun targeted server lint by itself with `--threads 1` while keeping the package-specific server config. The same CRM dashboard and Work Orders server files pass with zero warnings and zero errors, and the Nest server build also passes.

Temporary: no application workaround was added. This is a local tooling invocation constraint, not a product-code shortcut.

### CRM Module Pages

Issue: the 21 CRM sidebar previously jumped directly into raw Twenty object lists. That worked, but it did not give users a CRM-specific operating surface for contacts, companies, deals, or tasks.

Resolution: added dedicated CRM module pages for contacts, companies, deals, and tasks. Each module shows the live dashboard metric, workflow-specific quick actions, readiness/status checks, and links into the underlying Twenty object records for actual data management.

Temporary: no. This keeps the fork aligned with Twenty's object engine while adding a 21 CRM experience layer.

Issue: the first module config file included an unused convenience export, which violated the repo's frontend `max-consts-per-file` lint rule.

Resolution: removed the unused export and kept the config file to one top-level const.

Temporary: no. This is a source cleanup that follows the existing lint rule.

### CRM Module Operational Polish

Issue: the module pages were useful handoff screens, but they did not yet help an operator understand what to inspect when provider credentials are still intentionally disabled or when live dashboard data is temporarily unavailable.

Resolution: each CRM module page now includes module-specific operational focus cards, retry controls, and a backend-error notice that preserves access to the underlying Twenty records. This makes the pages useful during local development, Vercel frontend preview, and production backend outages without pretending provider automations are live.

Temporary: no. This is product UX polish built on the existing authenticated dashboard data hook and native object-record handoffs.

### CRM Audit Visibility Polish

Issue: the CRM dashboard exposed activity and provider health, but it did not yet show enough operational context for QA. Provider duplicate counts were hidden, activity rows lacked actor/metadata context, and the page did not show when the live data was generated.

Resolution: dashboard activity rows now show actor and metadata summaries, provider health rows show duplicate-event counts, empty states explain why no provider events are expected before API keys are configured, and the header shows the live data freshness timestamp.

Temporary: no. This is permanent dashboard polish on top of the existing CRM dashboard endpoint.

### CRM Operational Snapshot Polish

Issue: the dashboard exposed raw metrics, activity rows, and provider rows, but operators still had to infer overall CRM health from several panels.

Resolution: the authenticated dashboard endpoint now returns a first-class `summary` object with total CRM records, visible recent activity count, provider event totals, duplicate/failed provider counts, and a provider health status. The dashboard renders that contract as an operational snapshot before the detailed panels.

Temporary: no. This is a stable API/UI contract for production operations and future reporting.

Issue: the new dashboard summary contract did not yet have a focused server test, so a future refactor could break the operational snapshot while still compiling.

Resolution: added a `CrmDashboardService` unit test that exercises the public `getDashboard` path with mocked Twenty workspace repositories and provider/activity rows. It verifies record metrics, summary totals, failed/duplicate provider counts, and the `needs-attention` health status.

Temporary: no. This is permanent contract coverage for the CRM dashboard API.

### CRM Launch Readiness Polish

Issue: the dashboard readiness section mixed ready foundation work, API-key blockers, and deployment dependencies in one flat list. That made it harder to tell what was truly complete versus intentionally parked.

Resolution: readiness is now grouped into `Ready now`, `Waiting on keys`, and `Deployment required` lanes. This makes launch QA clearer while keeping provider-driven features disabled until credentials and backend runtime services are available.

Temporary: no. This is permanent UX polish for production readiness review.

### CRM Module Source-of-Truth Polish

Issue: the individual CRM module pages showed workflow context, but they did not explicitly tell users that Twenty object records remain the system of record. They also did not show when their live metric data was generated.

Resolution: module pages now show the live data freshness timestamp and include a source-of-truth handoff panel that links to the native object workspace for create, edit, import, export, filters, and saved views.

Temporary: no. This preserves the true Twenty-fork architecture while making the CRM layer clearer for operators.

### CRM Dashboard Fetch Hardening

Issue: the frontend dashboard data hook could send an empty `Authorization: Bearer ` header if the stored token pair existed but the token string was empty.

Resolution: the hook now only sends the authorization header for non-empty tokens. Focused frontend tests cover authenticated requests, schema-version headers, empty-token behavior, and readable request failures.

Temporary: no. This is permanent client-side hardening for the authenticated CRM dashboard contract.

Issue: the frontend trusted `response.json()` as valid CRM dashboard data. During partial deploys, proxy mistakes, or stale backend responses, malformed payloads could enter UI state and create harder-to-debug rendering failures.

Resolution: the dashboard response now passes through a Zod runtime schema before the hook updates UI data. The exported dashboard TypeScript types are derived from that schema, and focused tests verify malformed responses are rejected with a readable error.

Temporary: no. This is permanent response validation for the CRM dashboard data contract.

Issue: the first dashboard response schema checked field shape but still allowed impossible operational values such as negative counts or invalid timestamp strings.

Resolution: dashboard response validation now requires ISO datetime strings and non-negative integer counts for metrics, summaries, and provider health. Focused hook tests verify impossible values are rejected before they reach UI state.

Temporary: no. This is permanent data-integrity hardening for the CRM dashboard contract.

### CRM Display Formatter Polish

Issue: CRM timestamp, freshness, activity metadata, and provider-health display rules were implemented inline in the dashboard and module pages. That made future page changes more likely to drift or format operational states inconsistently.

Resolution: shared CRM display formatters now live under the CRM page utilities and are covered by focused frontend tests. Dashboard and module pages both use the same freshness formatter, and dashboard activity/provider rows use the shared metadata and status formatters.

Temporary: no. This is permanent UI-contract cleanup for consistency and testability.

Issue: the initial formatter test hard-coded English date output even though the CRM UI intentionally formats dates using the user's runtime locale.

Resolution: the test now compares against the same `Intl.DateTimeFormat` options rather than hard-coded English text, preserving locale-aware product behavior while still testing the freshness contract.

Temporary: no. This is the correct test strategy for locale-aware UI formatting.

### CRM Activity Log Persistence Polish

Issue: the CRM activity logger assumed the database would always return an inserted audit row and returned optional actor/metadata fields in a less normalized shape than the row it persisted.

Resolution: activity logging now normalizes actor type and metadata before both insert and return, and it raises a clear server error if persistence returns no activity row. Focused backend tests cover system actors, user actors, explicit MCP actors, metadata/contact preservation, and empty insert results.

Temporary: no. This is permanent audit reliability hardening for the custom CRM layer.

### CRM Route Contract Polish

Issue: contacts and companies linked to native Twenty object pages with repeated raw route strings, while deals and tasks already used shared `AppPath` values. That created a route-drift risk between the sidebar, module handoff panels, and future routing changes.

Resolution: people and companies object routes are now first-class `AppPath` values. CRM module configs and the sidebar active-state logic use those shared paths, and a focused config test pins every CRM module to its native Twenty object handoff.

Temporary: no. This is permanent route-contract cleanup for navigation consistency.

### CRM Responsive Layout Polish

Issue: the CRM dashboard and module pages handled major mobile breakpoints, but trailing activity timestamps, provider timestamps, and module action arrows could land in awkward grid positions on narrow screens.

Resolution: dashboard trailing metadata now has explicit mobile placement, and module action/handoff arrows now collapse into the text column instead of creating cramped third columns.

Temporary: no. This is permanent responsive UI polish for the CRM operating layer.

### CRM Customer Config Validation Polish

Issue: the white-label customer config loader parsed JSON into a TypeScript type directly, so malformed files, invalid field values, missing explicit paths, and bad timezones could fail with generic runtime errors.

Resolution: customer config now passes through a Zod runtime schema with field-level validation for required sections, colors, quiet-hour times, timezone names, enum values, non-negative automation delays, and module flags. Focused backend tests cover explicit config paths, missing files, malformed JSON, invalid colors/timezones, and module enablement behavior.

Temporary: no. This is permanent startup-contract hardening for Vercel and self-hosted deployments.

### CRM Twilio Provider Safety Polish

Issue: Twilio provider readiness only checked for truthy environment variables, so whitespace placeholders could look configured. Live SMS sends also needed an explicit approval gate before future provider code is connected.

Resolution: Twilio readiness now trims credentials, reports missing credential keys, and requires `TWILIO_LIVE_SENDS_APPROVED=true` before live sends can be considered available. The current `sendSms` method still raises a service-unavailable error, and focused tests cover whitespace credentials, approval gating, and the disabled-send response.

Temporary: no. This is permanent provider-safety hardening before real API credentials are introduced.

### CRM Auth Background Leak Fix

Issue: live anonymous audit of `https://jc-trailmaster-crm.vercel.app/welcome` showed the sign-in modal rendered over Twenty's mock workspace background, including app navigation, seeded companies, and demo objects. Even though that background is mock/demo UI, it looks like customer CRM data and is unacceptable on a production login screen.

Resolution: `DefaultLayout` no longer renders `BackgroundMockNavigationDrawer` or `BackgroundMockPage` behind auth/onboarding modals. Auth pages now show only the authentication modal over a neutral layout background, while authenticated routes continue to render the real workspace navigation.

Temporary: no. This is a production auth UX/security fix discovered during the functional audit.

### CRM Functional Audit Findings

Issue: live public workspace metadata for `https://jc-trailmaster-crm.vercel.app` currently returns the display name `JC Test`, while the authoritative customer config and product docs identify the deployment as JC Trailmaster.

Resolution: no code workaround was applied. The solid fix is to correct the production workspace record through the normal authenticated/admin provisioning path, add the final logo when available, and then verify the auth screens and public workspace metadata again.

Temporary: no. This remains an open production-configuration fix, not a temporary frontend mask.

Issue: the functional audit confirmed that estimates, customer invoicing, service dispatch calendar, unified communications inbox, missed-call text-back, reputation automation, and full service work-order workflows are not currently built product modules.

Resolution: these remain intentionally deferred modules. They should stay hidden/disabled until designed and implemented on top of the stable Twenty-native CRM foundation.

Temporary: no. This is the current product boundary, documented in `docs/CRM_FUNCTIONAL_AUDIT.md` and `docs/KNOWN_LIMITATIONS_V1.md`.

Issue: the planned AI receptionist should not be integrated before the CRM can turn a service call into structured work. Work Orders now have a foundation, but without production-ready Work Orders plus Estimates and Invoices, a receptionist would still mostly create notes instead of complete operational records.

Resolution: `docs/CRM_FUNCTIONAL_AUDIT.md` now includes an `AI Receptionist Readiness` section with Retell AI as the recommended provider and sequences the roadmap as QA → locked CRM → Work Orders → Estimates → Invoices → Retell AI → unified communications inbox.

Temporary: no. This is a product architecture gate, not a placeholder workaround.

### CRM Work Orders Foundation

Issue: the CRM had no structured place for calls, leads, repairs, and service requests to become operational work. That would make Retell AI or missed-call automation create loose notes instead of actionable service records.

Resolution: added a Twenty-native Work Orders foundation. The backend exposes authenticated, `DATA_MODEL`-guarded setup endpoints at `GET /rest/crm/work-orders-setup` and `POST /rest/crm/work-orders-setup` that create/check a customer-owned custom object named `workOrder` with status, priority, service type, source, description, service address, schedule timestamps, completion timestamp, estimated amount, and relations to customer, company, opportunity, and assigned technician. The dashboard now counts Work Orders when the object exists and safely reports zero before setup. The frontend adds `/crm/work-orders`, navigation, dashboard links, and the native object handoff to `/objects/workOrders`.

Issue: the first setup URL used `/rest/crm/work-orders/setup`, which matched Twenty's generic REST object route shape and was intercepted as an invalid object query before the custom controller could run.

Resolution: moved the setup contract to `/rest/crm/work-orders-setup`, keeping it under the CRM namespace while avoiding the generic REST wildcard.

Temporary: no. This is the permanent setup route for the Work Orders metadata installer.

Issue: the first production setup POST failed after creating the `workOrder` object because Supabase session pooling returned `(EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15`.

Resolution: capped TypeORM core/raw pool size through `PG_POOL_MAX_CONNECTIONS`, set production to `PG_POOL_MAX_CONNECTIONS=5`, and made the Work Orders installer build relation field inputs sequentially to reduce metadata lookup pressure. Deployment `7e4b4661-38de-4ce0-83fa-400f02961336` repaired the partial metadata state.

Temporary: no. This is the permanent database-pool and installer behavior for Supabase session-mode deployments.

Issue: production Work Orders proof needed to verify installer idempotency and native Twenty behavior before Estimates, Invoices, Retell AI, or dispatch could begin.

Resolution: production verification on 2026-07-29 confirmed:

- `GET /rest/crm/work-orders-setup` returns `200`, `isReady: true`, object `ee836032-6ecf-41a6-9af0-942a042fc0c8`, and all 14 expected fields as existing.
- First repeat `POST /rest/crm/work-orders-setup` returns `201`, `isReady: true`, with 14 existing fields, 0 created fields, and 0 missing fields.
- Second repeat `POST /rest/crm/work-orders-setup` returns the same clean idempotent result with no duplicate object, fields, or relations.
- Native `/objects/workOrders` opens in the deployed frontend and Work Orders appears in Twenty's native workspace object navigation.
- Native UI create, edit/autosave, list count, full record open, notes, tasks, files/attachments, and timeline tabs were verified.
- REST create/read/update/search/delete was verified, including `name[ilike]` search filtering.
- QA Work Order, QA note, and QA task records were deleted after verification; final production Work Order count is 0.

Temporary: no. Work Orders are now the production-proven service-operations foundation. Deep job workflows still need later product work: labor, parts, photos, dispatch history, estimate conversion, invoice conversion, and automation.

Issue: Railway displays the project name as `attractive-fascination`, while the intended customer-facing service is JC Trailmaster CRM.

Resolution: the service target itself is verified: workspace `topautoadvisorsg-prog's Projects`, environment `production`, service `jctrailmastercrm`, and URL `https://jctrailmastercrm-production.up.railway.app`. Treat the project-name mismatch as configuration cleanup, not a hotfix blocker, as long as the service/environment/URL remain verified before deployment.

Temporary: no. Rename/relabel the Railway project when convenient to reduce future operator confusion.

### CRM Direct Typecheck Stabilization

Issue: direct frontend typecheck exposed two CRM regressions: the dashboard hook imported CRM types through an unsupported `@/pages` alias, and the hook tests mocked auth tokens without the generated `expiresAt` and `refreshToken` fields required by `AuthTokenPair`.

Resolution: the CRM dashboard hook now imports its inferred Zod type through the working `~/pages` alias, and the test fixtures now use complete token-pair objects. A separate unmodified front-component hook also had isolated implicit-parameter type errors; that was fixed with explicit host-API parameter annotations matching the existing SDK/shared contracts, without changing runtime behavior.

Temporary: no. `cd packages/twenty-front && npx tsgo -p tsconfig.json` is now a green verification gate for this branch.

## API Keys

Keep provider keys empty until the UI and backend foundations are ready.

Placeholder environment variables are in `.env.example`. Live provider actions must stay disabled until credentials, webhook URLs, consent handling, rate limits, audit logging, and explicit provider approval flags are verified in the target environment.
