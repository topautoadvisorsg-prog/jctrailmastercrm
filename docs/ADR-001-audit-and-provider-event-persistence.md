# ADR-001: Audit and Provider Event Persistence

Status: Accepted
Date: 2026-05-29

## Decision

Persist V1 audit and provider integration events in direct PostgreSQL tables managed by the Twenty server migration system.

Twenty metadata/custom objects remain the default for CRM business entities, but audit/provider event data needs direct tables because it is cross-cutting, append-heavy, security-sensitive, and used for idempotency.

## Required Tables

### `"core"."crmActivityLog"`

Purpose: immutable audit trail for all custom CRM mutations and automated/system actions.

Required fields:

- `id`
- `workspaceId`
- `entityType`
- `entityId`
- `action`
- `actorId`
- `actorType`
- `contactId`
- `metadata`
- `createdAt`

Required indexes:

- `(workspaceId, contactId, createdAt DESC)`
- `(workspaceId, entityType, entityId, createdAt DESC)`
- `(workspaceId, actorId, createdAt DESC)`

### `"core"."crmProviderEvent"`

Purpose: webhook/event idempotency and provider audit record.

Required fields:

- `id`
- `workspaceId`
- `provider`
- `eventType`
- `externalEventId`
- `payloadHash`
- `receivedAt`
- `processedAt`
- `status`
- `errorMessage`
- `metadata`

Required constraints/indexes:

- Unique `(workspaceId, provider, externalEventId)` when `externalEventId` is present.
- Index `(workspaceId, provider, receivedAt DESC)`.
- Index `(workspaceId, status, receivedAt DESC)`.

## Consequences

- No custom mutation endpoint should be considered production-ready until it writes to `"core"."crmActivityLog"`.
- Twilio inbound SMS, missed-call, Stripe, Resend, and future Google webhooks must insert into `"core"."crmProviderEvent"` before side effects are processed.
- Provider payloads should store a hash and limited metadata by default; full payload retention requires a privacy/retention decision.

## Open Questions

- Whether `workspaceId` should reference a core table directly or follow Twenty's existing workspace scoping conventions.
- Retention period for message bodies and provider payload metadata.
