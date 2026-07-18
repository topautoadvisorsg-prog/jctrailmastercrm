# ADR-000: Platform Architecture Decision

Status: Accepted
Date: 2026-05-28

## Decision

Use a true Twenty fork as the default implementation path.

The CRM should extend Twenty's existing platform, metadata model, auth, activity/timeline foundations, API surface, and MCP capability instead of starting as a standalone NestJS/React application.

## Rationale

The blueprint explicitly names Twenty as the base CRM and marks several Twenty systems as "keep/do not touch": core server, auth, custom objects engine, metadata engine, file storage hooks, timeline/activity feed, GraphQL/REST layer, and MCP server. Those are foundational product advantages.

Rebuilding them in a standalone app would increase schedule risk, duplicate solved CRM primitives, and weaken the stated goal of being Claude/Cowork native from day one.

The standalone NestJS/React structure in the blueprint should be treated as conceptual architecture, not the literal repository layout, unless later investigation proves Twenty cannot support the required extension model.

## Consequences

- Custom backend work belongs under Twenty extension/custom module boundaries, not a new unrelated `server/modules/*` tree.
- Auth should build on Twenty auth and add CRM-specific RBAC/object ownership checks where needed.
- Data modeling should prefer Twenty metadata/custom objects for CRM extensions, with direct tables only when there is a clear reason such as queue internals, webhook idempotency, provider logs, or performance-critical audit/reporting tables.
- API design should be hybrid only where needed: use Twenty's existing GraphQL/REST patterns first, and add custom REST endpoints for public widgets, provider webhooks, file uploads, and integration callbacks.
- Migrations, tests, deployment, and documentation must follow the pinned Twenty version's conventions.
- The first engineering task is to inspect the pinned Twenty release and produce a short extension map before deleting or stripping anything.

## Alternatives Considered

### Standalone CRM App

Rejected as the default because it contradicts the blueprint's "Base: Twenty" contract and would require rebuilding auth, metadata, custom objects, timeline, MCP, and core CRM primitives.

Standalone should only be chosen if Twenty's current architecture blocks core V1 requirements after inspection.

### Hybrid Fork Plus Separate App

Rejected for V1 because it creates two sources of truth and increases integration risk. Any custom surfaces should remain inside the Twenty fork unless there is a specific isolation reason.
