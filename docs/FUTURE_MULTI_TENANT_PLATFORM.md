# Future Multi-Tenant Platform — Architecture Note

Status: Planning only. No code or infrastructure changes accompany this document.
Date: 2026-07-28

This document exists because, during JC Trailmaster's onboarding test, it became visible that Twenty's underlying architecture is natively multi-tenant (each workspace is schema-isolated). That prompted the question of whether Smart Click Agency should eventually run one shared platform for many customers instead of one dedicated deployment per customer. This note captures that direction for future consideration. **It does not change anything about the live JC Trailmaster deployment.**

## Current deployment model (approved, in production)

- One deployment: one Railway service (backend + worker via pre-deploy step), one Vercel frontend, one Supabase database.
- One primary workspace/customer: JC Trailmaster.
- Invite-only user onboarding — public self-signup is disabled by Twenty's own default behavior (`isSignUpEnabled()` in `sign-in-up.service.ts` only allows sign-up when `IS_MULTIWORKSPACE_ENABLED` is true or the instance has zero workspaces; JC Trailmaster's workspace already exists and `IS_MULTIWORKSPACE_ENABLED` was never set, so it self-locked after the first workspace was created — verified live against the production GraphQL endpoint, confirmed response: `"New workspace setup is disabled"` / `SIGNUP_DISABLED`).
- One global `customer.config.json` — JC Trailmaster-specific branding and business configuration, validated by `customer-config.schema.ts`.
- Twenty-native workspace schema and user isolation (see below).

**This is the approved model for the JC Trailmaster beta. Do not enable public multi-workspace signup on this deployment.**

## What Twenty already supports per workspace (verified against code)

| Capability | Verified location | Note |
|---|---|---|
| Workspace name | `workspace.entity.ts:74` — `displayName` column | |
| Workspace logo | `workspace.entity.ts:79` — `logo` column | |
| Users and invitations | `app-token.entity.ts` — `AppTokenType.InvitationToken`; `core.userWorkspace` links users to a specific workspace | Invite flow is already workspace-scoped, separate from public sign-up |
| Roles | `role.entity.ts` — `RoleEntity extends SyncableEntity`, unique constraint on `['label', 'workspaceId']` | |
| Object permissions | `object-permission.entity.ts` — `ObjectPermissionEntity extends SyncableEntity`, indexed on `workspaceId` | |
| Field permissions | `field-permission.entity.ts` — same `SyncableEntity` base | |
| Row-level permission predicates (Enterprise) | `row-level-permission-predicate.entity.ts` — same base, `workspaceId` column | See ADR-003 — Enterprise-licensed, not in use |
| Contacts, Companies, Opportunities, Tasks, Notes | Standard objects, physically stored in a per-workspace Postgres schema (`workspace_<hash>`) | Directly confirmed during this deploy's troubleshooting — verified via live query showing zero tables until workspace activation succeeds, then the correct standard-object tables appear only in that workspace's own schema |
| Custom fields | `fieldMetadata` table, scoped by `workspaceId` | Confirmed via direct query during the uuid_generate_v4 incident (0 rows for the broken workspace, matching its 0 physical tables) |
| Saved views | `view`, `viewField`, `viewFilter`, etc. — same workspace-schema pattern | |
| Workspace database schema | `workspace_<hash>` schema per workspace, created by `WorkspaceManagerService.init()` | This is Twenty's actual multi-tenancy mechanism — confirmed directly by inspecting `information_schema.schemata` during this deployment's debugging |
| Record isolation | Enforced by schema separation — one workspace's queries cannot see another's tables without cross-schema access, which the app never does | |

**Base class confirmation:** `SyncableEntity extends WorkspaceRelatedEntity` (`syncable-entity.interface.ts`) — this is why roles, object permissions, and field permissions are consistently workspace-scoped: it's inherited from a shared base, not implemented ad hoc per entity.

**Conclusion: the object model, permissions, and data isolation Twenty already provides are sufficient for a real multi-tenant platform without modification.** Nothing about Twenty's core needs to change or be replaced for multi-tenancy — this matches ADR-000's original decision to build on Twenty rather than around it.

## What remains deployment-global today (not tenant-scoped)

Everything below lives in `customer.config.json` (one file, one deployment) or in Railway environment variables (one deployment, one set of secrets):

| Setting | Currently | Should eventually be |
|---|---|---|
| Brand colors (primary/secondary) | Global, `customer.config.json` | **Per workspace** |
| Business name and contact info (address, phone) | Global | **Per workspace** |
| Timezone | Global | **Per workspace** |
| SMS quiet hours | Global | **Per workspace** |
| Email sender name/address | Global | **Per workspace** |
| Feature/module toggles (jobs, booking, invoicing, etc.) | Global | **Per workspace** (entitlements — see below) |
| Custom navigation behavior (`NavigationDrawerCrmSection.tsx`) | Global (hardcoded nav items) | **Per workspace**, driven by module entitlements |
| Custom dashboard configuration (`CrmDashboardService`) | Global | **Per workspace** (dashboard already queries by `workspaceId` under the hood via `GlobalWorkspaceOrmManager`, but the *config* driving what it shows is global) |
| Twilio credentials (`TWILIO_ACCOUNT_SID`, etc.) | Global, Railway env vars | **Deployment-level secret**, never per-workspace in plaintext (see Secrets section) |
| Provider credentials generally (email, AI) | Global, Railway env vars | **Deployment-level secret** |
| Custom CRM RBAC module (`modules/custom/permissions/`) | Restored per ADR-003, not wired to enforcement | Decision already deferred in ADR-003; unaffected by this note |

**Values that should remain deployment-level secrets regardless of tenancy model:** raw Twilio/email/AI provider API keys, `ENCRYPTION_KEY`, database credentials, `ACCESS_TOKEN_SECRET`/`LOGIN_TOKEN_SECRET`/`REFRESH_TOKEN_SECRET`/`FILE_TOKEN_SECRET`. These protect the whole instance, not one tenant, and must never be stored in a per-workspace database record even after multi-tenant work begins.

**Values that may need both a global default and a per-workspace override:** SMS quiet hours (a sensible global default like 8pm–8am, overridable per business type), date format, currency — a new workspace should inherit sane platform defaults, not start blank.

## Future SaaS target architecture (direction, not a commitment)

- One platform deployment.
- Multiple isolated customer workspaces, using Twenty's existing per-workspace schema mechanism — unchanged.
- Each customer controls its own branding and business settings (the per-workspace config model described below).
- Platform owner (Smart Click Agency) controls plans, modules, limits, provisioning, billing, and global policy — a new layer, not something Twenty provides natively.
- Users may belong to one or more workspaces where Twenty already supports it (multi-workspace membership is part of `core.userWorkspace`'s design).
- All data access continues to be protected by Twenty's native workspace isolation — **this note does not propose replacing or modifying that architecture.**

## Configuration model recommendation (future work, not started)

Move `customer.config.json` from a static file into workspace-scoped configuration, organized as:

**Workspace branding:** display name, logo, primary/secondary/accent color, email branding.

**Business settings:** address, phone, timezone, business hours, quiet hours, service categories.

**Module entitlements:** jobs, estimates, invoicing, booking, messaging, reputation, automations, AI features — these gate which Phase 2 modules (per ADR-002) a given workspace can see, once those modules exist.

**Platform-managed settings** (owned by Smart Click Agency, not the customer): subscription plan, usage limits, enabled integrations, feature flags, trial status, billing status.

### Secrets strategy (required before any of this is built)

Provider secrets (Twilio, email, AI, payment, webhooks) must **not** be stored as plaintext fields on ordinary per-workspace config records. Recommended approach when this work actually starts: a dedicated secrets table or external secrets manager, referenced by workspace ID but access-controlled separately from general workspace data, with encryption at rest and audit-logged reads — the same posture Twenty itself uses for `ENCRYPTION_KEY`-derived secrets (see `resolve-session-cookie-secrets.util.ts`), extended to per-workspace provider credentials.

## Future provisioning flow (design sketch, not implemented)

1. Customer creates or is assigned a workspace.
2. Workspace schema is provisioned (Twenty's existing `WorkspaceManagerService.init()` mechanism — unchanged).
3. Default roles are created.
4. Default pipeline stages are seeded.
5. Branding and business settings are saved (new: written to the per-workspace config model instead of a shared file).
6. Modules are enabled according to the customer's plan (new: entitlements check).
7. Owner is invited or activated.
8. **Workspace readiness is verified** — activation status must reach `ACTIVE`, and the flow must check for and reject a workspace stuck in `ONGOING_CREATION` rather than allowing a customer to silently enter a broken state.
9. Customer enters the application.

**Failure-state handling is not optional.** This deployment already hit exactly the failure this flow must guard against: a workspace stuck in `ONGOING_CREATION` with an empty schema and no way to retry cleanly (documented in `DEPLOYMENT_TROUBLESHOOTING_LOG.md`, root cause: a Postgres `uuid_generate_v4()` schema mismatch, now fixed). A production provisioning flow needs to detect this state automatically (e.g., a stuck `ONGOING_CREATION` workspace past some timeout) and either retry or surface a clear error — not leave a customer staring at a blank page with no path forward.

## Migration strategy (for when this work is actually scoped)

Moving JC Trailmaster's current `customer.config.json` into a future per-workspace model, without disrupting the live client:

- Preserve every existing value — a scripted, reviewed migration from the JSON file's current contents into the new per-workspace record, not a re-entry.
- Remain backward compatible during transition — the config loader should be able to read from either source until the migration is confirmed complete, so a partial rollout never breaks the live instance.
- Support global defaults — new workspaces get sane platform defaults; JC Trailmaster's real values simply become that first workspace's overrides.
- Avoid exposing secrets — provider credentials stay in deployment-level env vars / secrets storage, never copied into the new per-workspace config records.
- Allow rollback — keep `customer.config.json` intact and functional until the new path is verified in production, not deleted the moment the migration script runs.
- Include validation — reuse or extend the existing `customer-config.schema.ts` Zod validation against the new storage location.
- Include audit logging — config changes should be recorded the same way `ActivityLogService` already records other custom-module actions, per `docs/TWENTY_EXTENSION_MAP.md`.

## Explicit non-goals for now

- Do not enable public multi-workspace signup on the JC Trailmaster deployment.
- Do not alter the live JC Trailmaster deployment as a result of this document.
- Do not move the current configuration into the database yet.
- Do not introduce billing or subscription code.
- Do not redesign authentication.
- Do not build tenant administration screens.
- Do not start a SaaS conversion without a separately approved scope.

## Trigger for reconsidering multi-tenancy

Revisit this direction only after:

- JC Trailmaster completes onboarding.
- Staff use the CRM in real day-to-day operations.
- The system remains stable for an initial operating period.
- We know which custom settings real customers actually ask to change (this is currently a guess — the categories above are reasonable, not confirmed by real usage).
- A second qualified customer is ready to onboard — a real second data point beats designing for a hypothetical one.
- We can compare the actual cost of one dedicated deployment per customer versus the engineering cost of a shared platform, with real numbers instead of estimates.

## Checkpoint preserved for this decision point

- **Checkpoint path:** `C:\Users\jovan\Downloads\21crm-jctrailmaster-checkpoint` (source only — `node_modules`, `.yarn`, `build`, `dist` excluded; ~263MB).
- **Commit hash:** `7140d7460def62c7ef1b776646a1f548c34a96e0` ("Fix Supabase uuid_generate_v4 schema mismatch blocking workspace creation").
- **Reconstruction command:** from the checkpoint folder, run `corepack yarn install --immutable` to regenerate `node_modules`, then `corepack yarn nx build twenty-front` / the server build commands documented in the main `README.md`.
- **Excluded generated artifacts:** `node_modules`, `.yarn` (cache/releases stay in the real repo via `.yarnrc.yml`/lockfile, regenerable via install), `build`, `dist`, `.git.old-partial-clone` (the pre-fix partial-clone leftover from initial repo setup, already superseded).
- **Deployment version associated with this checkpoint:** Railway deployment `2b8e837a-d186-4a68-bc65-e4683cc9002f` (backend, includes the UUID compatibility fix) and Vercel deployment aliased to `jc-trailmaster-crm.vercel.app` (frontend, includes the `FRONTEND_URL` redirect-loop fix). Both verified working end-to-end via a real signup-to-dashboard test on 2026-07-28.
