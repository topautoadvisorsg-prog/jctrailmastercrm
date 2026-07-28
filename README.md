# 21 CRM

21 CRM is a production-focused CRM built as a true fork of Twenty. The product keeps Twenty's object model, metadata engine, React workspace, NestJS server, PostgreSQL persistence, Redis-backed jobs, and workflow foundations, then layers custom 21 CRM behavior on top.

## Current Build Status

- Platform direction: true Twenty fork, not a standalone rewrite.
- CRM feature layer: `/crm` now calls the authenticated `GET /rest/crm/dashboard` endpoint for live workspace counts, recent CRM audit activity, and provider-event health.
- CRM module pages: `/crm/contacts`, `/crm/companies`, `/crm/deals`, and `/crm/tasks` provide 21 CRM command surfaces that hand off to Twenty's native object records.
- Frontend shell: `/crm` dashboard route and `21 CRM` navigation section are in place.
- Backend extension boundary: custom CRM modules live under `packages/twenty-server/src/modules/custom`.
- Compliance foundation: SMS consent, opt-out, quiet-hour checks, and provider placeholders are implemented.
- Audit foundation: CRM activity log and provider-event idempotency persistence are implemented through core migrations.
- Build pipeline: `corepack yarn nx build twenty-front` and `npx nest build --path ./tsconfig.build.json` pass.
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

Resolution: the server now exposes `GET /rest/crm/dashboard` under the authenticated CRM module. It aggregates contacts, companies, deals, and tasks through Twenty's workspace repository layer, then reads recent CRM audit entries and provider-event health from the custom core tables. The frontend dashboard now renders live KPIs, recent activity, provider health, loading states, retry behavior, and fallback messaging when the backend is unavailable.

Temporary: no. This is the first production feature-layer slice and keeps using Twenty's auth, workspace context, and object repositories.

Issue: the new dashboard initially imported local page code through an alias that Vite does not resolve for `src/pages`, causing the frontend production build to fail.

Resolution: dashboard-local imports now use relative paths from `CrmDashboardPage.tsx`, matching the existing frontend build boundaries.

Temporary: no. This is a source import-boundary fix.

Issue: direct root-level `npx oxlint <files>` can pick up package `.oxlintrc.json` files in a way that rejects the existing package-level `options.typeAware` setting.

Resolution: use package-specific lint configs for targeted linting. The targeted frontend and server CRM dashboard files pass with their package configs, and Nest compile remains the required server build check.

Temporary: no code workaround was added. This documents the current tool behavior so CI/local verification commands stay explicit.

Issue: on Windows, server `oxlint` can panic from allocator pressure when checking TypeScript server files with default parallelism.

Resolution: rerun targeted server lint with `--threads=1` while keeping the package-specific server config. The same CRM dashboard server files pass with zero warnings and zero errors, and the Nest server build also passes.

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

## API Keys

Keep provider keys empty until the UI and backend foundations are ready.

Placeholder environment variables are in `.env.example`. Live provider actions must stay disabled until credentials, webhook URLs, consent handling, rate limits, audit logging, and explicit provider approval flags are verified in the target environment.
