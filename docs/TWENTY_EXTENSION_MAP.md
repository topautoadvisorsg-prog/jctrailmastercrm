# Twenty Extension Map

Pinned upstream: `twentyhq/twenty` tag `v2.8.3`
Pinned commit: `5024f5497697ecf42f23cf66ede941c0eb4eaacb`
Decision: `ADR-000-platform-architecture.md` accepted.

## V1 Platform Direction

21 CRM is implemented as a true Twenty fork. Custom CRM behavior should extend Twenty modules instead of creating a standalone NestJS/React app.

## Core Twenty Packages Checked Out

- `packages/twenty-server`: backend, engine, REST/GraphQL/MCP APIs, workspace metadata, standard CRM objects.
- `packages/twenty-front`: frontend application modules and UI integration points.
- `packages/twenty-shared`: shared types and utilities.
- `packages/twenty-ui`: shared UI components.
- `packages/twenty-utils`: common utilities.
- `packages/twenty-emails`: required by `twenty-server`.
- `packages/twenty-client-sdk`: required by `twenty-server`.
- `packages/twenty-front-component-renderer`: required by `twenty-front`.
- `packages/twenty-sdk`: required by `twenty-front-component-renderer`.
- `packages/twenty-oxlint-rules`: required for project lint checks.
- `packages/twenty-docker`: local infrastructure references.

The sparse checkout intentionally excludes `twenty-website`, `twenty-zapier`, `twenty-docs`, e2e packages, app templates, and other non-core packages for Windows compatibility and V1 focus.

## Existing CRM Foundations

- Contacts: `packages/twenty-server/src/modules/person`
- Companies: `packages/twenty-server/src/modules/company`
- Deals/opportunities: `packages/twenty-server/src/modules/opportunity`
- Tasks: `packages/twenty-server/src/modules/task`
- Notes: `packages/twenty-server/src/modules/note`
- Timeline/activity: `packages/twenty-server/src/modules/timeline`
- Messaging: `packages/twenty-server/src/modules/messaging`
- Workflow foundation: `packages/twenty-server/src/modules/workflow`
- Workspace members/users: `packages/twenty-server/src/modules/workspace-member`

## API and Runtime Foundations

- Root app module: `packages/twenty-server/src/app.module.ts`
- Business module aggregator: `packages/twenty-server/src/modules/modules.module.ts`
- REST engine: `packages/twenty-server/src/engine/api/rest`
- GraphQL engine: `packages/twenty-server/src/engine/api/graphql`
- MCP engine: `packages/twenty-server/src/engine/api/mcp`
- Auth context middleware: `packages/twenty-server/src/engine/core-modules/auth`
- Config service: `packages/twenty-server/src/engine/core-modules/twenty-config`
- Twenty ORM and workspace metadata: `packages/twenty-server/src/engine/twenty-orm` and `packages/twenty-server/src/engine/workspace-manager`

## Custom CRM Extension Boundary

Custom V1 foundation code starts under:

`packages/twenty-server/src/modules/custom`

Current custom modules:

- `crm-custom.module.ts`: custom CRM module aggregator imported by Twenty's `ModulesModule`.
- `activity-log`: mutation audit persistence for custom CRM/system actions.
- `provider-events`: provider webhook/event idempotency storage for Twilio, Stripe, Resend, Google, MCP, and system events.
- `white-label`: `customer.config.json` loader, validation, and feature-toggle checks.
- `permissions`: CRM role and object ownership policy helpers layered on top of Twenty auth.
- `messaging`: consent, opt-out, quiet-hours, and automated-send safety rules.
- `twilio`: Twilio webhook signature validation and no-live-call placeholder client.

## V1 MVP Object Strategy

Use existing Twenty objects first:

- Contact -> `person`
- Company -> `company`
- Deal -> `opportunity`
- Task -> `task`
- Note -> `note`
- Timeline -> `timelineActivity`

Direct custom tables require a separate ADR unless they are for provider webhook idempotency, audit/event logs, queues, or reporting performance.

## Provider Key Policy

No live provider calls are expected in the current build. API keys are placeholders only:

- Twilio: signature validation is implemented, outbound send remains blocked until credentials are configured.
- Resend/email, Stripe, Google Calendar/Maps, and Anthropic are placeholders in `.env.example`.

## Next Build Steps

1. Add workspace metadata extensions for Do Not Contact, consent, tags, and pipeline stage history.
2. Wire custom permission checks into the first custom service endpoints.
3. Add Twilio inbound webhook endpoint using provider-event idempotency storage.
4. Add UI surfaces for the locked V1 CRM scope.
