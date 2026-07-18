# ADR-003: Twenty Native Permissions vs. 21 CRM Custom RBAC

Status: Accepted
Date: 2026-07-18

> Note on naming: the requesting brief titled this "Twenty Native Permissions vs SmartKlix CRM RBAC." SmartKlix CRM is a confirmed **separate, unrelated codebase** (see project memory). This document covers the custom RBAC module in *this* repo (21 CRM, `modules/custom/permissions/`), not SmartKlix.

## 1. What Twenty already does natively (free, open-core, no license required)

Verified by reading `packages/twenty-server/src/engine/metadata-modules/role/`, `object-permission/`, and related entities — none of these files carry Twenty's `@license Enterprise` header, confirming they ship in the open-source core:

- **Custom roles** (`RoleEntity`) — arbitrary roles per workspace (`label`, `description`, `icon`), not a fixed enum. Flags like `canUpdateAllSettings`, `canAccessAllTools`, `canReadAllObjectRecords`, `canUpdateAllObjectRecords`, `canSoftDeleteAllObjectRecords`, `canDestroyAllObjectRecords` give coarse "this role can do X to everything" toggles.
- **Per-object permissions** (`ObjectPermissionEntity`) — for a given role + object type (Person, Company, Opportunity, Task, or any custom object), independently toggle `canReadObjectRecords`, `canUpdateObjectRecords`, `canSoftDeleteObjectRecords`, `canDestroyObjectRecords`. This is real, per-object-type CRUD control — e.g. "Field Tech role cannot read/edit Opportunities at all."
- **Per-field permissions** (`FieldPermissionEntity`) — restrict specific fields on an object per role (e.g. hide a "Deal Value" field from a role that can otherwise view Opportunities).
- **Workspace isolation** — fundamental to Twenty's architecture; each workspace (JC Trailmaster's) is a fully separate tenant. Not something we add — it's the foundation everything else sits on.
- **Admin controls** — Settings → Roles/Security UI to create roles and assign per-object/per-field permissions, and assign roles to workspace members. No code required to configure this per customer.
- **Record visibility / ownership (partial):** `canReadAllObjectRecords` etc. are workspace-wide flags — "this role can read all records of this type" — there is no free-tier concept of "this role can only read records they own."

## 2. What Twenty's Enterprise-licensed tier adds (requires a paid `ENTERPRISE_KEY`)

Verified: `row-level-permission-predicate/` entities and services all carry a `/* @license Enterprise */` header, and `EnterprisePlanService` (`engine/core-modules/enterprise/`) implements real license-key validation — a signed JWT checked against Twenty's own license API (`ENTERPRISE_API_URL`), not a stub.

- **Row-Level Permission Predicates** (`RowLevelPermissionPredicateEntity` + `RowLevelPermissionPredicateGroupEntity`) — this is the actual per-record ownership mechanism: a role + object type gets one or more predicates (field, operator, value), groupable with AND/OR logic, and — critically — a predicate can compare a field directly to **the current workspace member** (`workspaceMemberFieldMetadataId`). This is exactly "Sales Rep can only see Opportunities where AssignedRep = themselves." It's wired into the real query path (`workspace-select-query-builder.ts`, `apply-row-level-permission-predicates.util.ts`) — not decorative.
- **Conclusion: Twenty already has a native, more sophisticated version of what the custom RBAC's `canAccessOwnedRecord()` does — but it's licensed, not free.**

## 3. What the custom RBAC (`modules/custom/permissions/`) does

Five fixed roles (`admin`, `manager`, `sales_rep`, `field_tech`, `viewer`) each mapped to a `Set` of ten fixed permission strings (`contacts:view/edit`, `deals:view/edit`, `tasks:view/edit`, `messages:send`, `settings:white_label`, `users:manage`, `reports:view`), plus `canAccessOwnedRecord()` — an ownership check comparing `ownerId`/`assignedRepId` to the current user, bypassed entirely for `admin`/`manager`.

## 4. Feature-by-feature comparison against the five roles requested

| Capability needed | Office Manager | Sales Rep | Field Technician | Dispatcher | Read-only Office Staff | Covered natively? |
|---|---|---|---|---|---|---|
| Full CRUD on Contacts/Companies/Deals/Tasks | ✓ | ✓ | partial | partial | ✗ (read-only) | **Yes** — per-object permissions, free |
| No access to Deals object at all | n/a | n/a | ✓ (should be blocked) | n/a | n/a | **Yes** — `ObjectPermissionEntity` can deny read entirely on Opportunity |
| Read-only across the board | n/a | n/a | n/a | n/a | ✓ | **Yes** — set all `canUpdate/canSoftDelete/canDestroy` false, `canRead` true |
| Only see deals/tasks they personally own or are assigned | n/a | ✓ | ✓ | n/a | n/a | **Enterprise only** (Row-Level Permission Predicates). Not available in our free tier. Custom RBAC's `canAccessOwnedRecord()` is the only free option — but see caveat below. |
| Send SMS / messaging action gate | role-dependent | ✓ | ✗ | ✓ | ✗ | **No native equivalent** — Twenty has no "messages:send" permission flag concept; this is 21 CRM-specific business logic |
| Edit white-label/branding settings | ✓ (admin only really) | ✗ | ✗ | ✗ | ✗ | **No native equivalent** — `settings:white_label` is a 21 CRM concept, not a Twenty setting permission |
| Manage users/roles | ✓ | ✗ | ✗ | ✗ | ✗ | **Yes**, natively — Twenty's own `WORKSPACE_MEMBERS`/`ROLES` settings permission flags already do this |
| Dispatcher (schedule/assign jobs across techs) | — | — | — | n/a until Service Ops exists | — | Not yet meaningful — no Jobs/Scheduling object exists yet (Phase 2) |

## 5. The caveat that changes the recommendation

Even if `CrmPermissionsService.canAccessOwnedRecord()` were wired into a guard, **it can only protect custom REST endpoints we write** (e.g. `/rest/crm/dashboard`, future custom routes). Per ADR-000, we do not modify Twenty's core GraphQL resolvers — which means the actual day-to-day CRUD on Person/Company/Opportunity/Task records (what users touch 95% of the time, through Twenty's native object pages) is **not** reachable by our custom guard at all. Twenty's own resolver stack has no hook for our custom RBAC to intercept.

So: wiring the custom RBAC in (Option B) would only ever gate our own custom endpoints — it cannot deliver "Sales Rep A can't see Sales Rep B's deals" on the actual deal records, because that data flows entirely through Twenty's native API. The only way to get real per-record ownership enforcement on the actual objects is Twenty's Enterprise Row-Level Permission Predicates (paid), or building our own query-layer interceptor (large, risky, effectively rebuilding what Twenty already sells).

## 6. Recommendation: Option C (Hybrid) — confirmed by evidence, not just intuition

- **Use Twenty's native role/object/field permissions** for everything that's actually about the real CRM data (Contacts, Companies, Deals, Tasks): configure roles for JC Trailmaster's actual staff (Office Manager, Sales Rep, Field Tech, Read-only) via Settings → Roles, no code. This is free, already works, and is the only thing that can reach the real object data.
- **Keep the custom RBAC module** strictly for the things Twenty has no concept of at all: gating our own custom actions (`messages:send` for Twilio sends, `settings:white_label` for the branding config page, future custom endpoints). This is genuinely justified — not duplicated — because Twenty's permission system cannot express these.
- **Do not attempt per-record ownership ("only see your own deals") in Phase 1.** It is not achievable for free on the actual object data without Twenty Enterprise. If JC Trailmaster needs this, the real options are: (a) accept object-type-level roles only for now (all Sales Reps see all deals) — reasonable for a single small shop in Phase 1 — or (b) evaluate purchasing Twenty Enterprise if/when she has multiple reps who must not see each other's pipeline. This is a pricing/business decision, not an engineering one, and should come back to the user rather than being decided in code.
- `canAccessOwnedRecord()` stays in the module (harmless, tested) but should not be presented as "ownership enforcement is live" — it isn't, and per the caveat above, wiring it in wouldn't make it meaningfully live for the real data anyway.

## Consequences

- No change to authorization behavior before JC Trailmaster's launch — lowest risk, per the stated Phase 1 objective.
- Real next step for permissions is a Twenty-native task: configure actual roles (Office Manager / Sales Rep / Field Tech / Read-only Staff) in Settings → Roles for JC Trailmaster's real staff once she confirms who needs what — this is a config task, not a code task.
- Whether to ever pay for Twenty Enterprise (for row-level ownership) is flagged as an open business question, not decided here.
- This resolves the roadmap's "RBAC/object ownership leaks data" High risk item for Phase 1: risk is bounded (object-type-level access is enforced natively; per-record ownership is a known, documented gap, not a silent one).

## Decision Confirmed (2026-07-18)

Accepted as written. Explicit split of ownership going forward:

- **Twenty owns:** authentication, workspace membership, object-level permissions, field-level permissions, CRUD authorization, record access (within the capabilities of whichever Twenty edition we're on). Configuration-driven wherever possible — no code required per customer.
- **21 CRM (custom RBAC) owns:** business capabilities Twenty has no model for — white-label administration, SMS policy/compliance workflows, AI features, Service Operations modules (Phase 2), industry-specific automation, and any future custom REST endpoint. The custom RBAC module protects these, it does not duplicate or wrap Twenty's security model.
- **Record-level ownership is a product/business decision, deferred, not an engineering gap to close now.** If/when it becomes a real requirement: (1) evaluate Twenty Enterprise licensing/cost, (2) design a custom ownership model scoped only to custom modules, or (3) accept object-level permissions as sufficient for smaller customers. No decision needed before JC Trailmaster onboards.
- No further architecture work on this topic before deployment.
