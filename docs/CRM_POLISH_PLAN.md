# 21 CRM Polish Plan

This plan keeps the pre-API-key phase focused on production readiness. Work should move module by module, with tests and docs updated as issues are found.

## Current Principle

Do not add temporary provider behavior. Until credentials are available, live provider actions stay disabled, but validation, persistence, compliance, and UI readiness should be real.

## Module Order

1. Platform and deployment
   - Keep Twenty as the platform fork.
   - Keep Vercel scoped to the static frontend.
   - Keep backend API, worker, PostgreSQL, Redis, file storage, webhooks, and jobs as long-running services.
   - Verify frontend builds with injected `REACT_APP_SERVER_BASE_URL`.

2. CRM foundation modules
   - Confirm audit and provider-event tables are migration-backed.
   - Keep provider-event idempotency database-enforced.
   - Add focused unit tests for safety logic before adding live integrations.

3. Compliance and communications
   - Enforce consent, opt-out, Do Not Contact, quiet hours, and provider signature verification before any live SMS/email sends.
   - Keep outbound provider calls blocked until credentials and webhook URLs are approved.
   - Add webhook endpoints only after idempotency and audit logging are wired in.

4. Permissions
   - Keep role helpers narrow and explicit.
   - Wire helpers into custom endpoints before exposing write-capable CRM or MCP actions.
   - Require audit logs for write-capable automation actions.

5. Frontend CRM shell
   - Keep the `/crm` dashboard useful without provider keys.
   - Prefer existing Twenty object routes for contacts, companies, deals, and tasks.
   - Add loading, empty, error, and mobile states as each new CRM surface is introduced.

6. Documentation
   - Update `README.md` when a build issue, production risk, or deployment assumption is found.
   - Record durable architecture decisions in ADRs.
   - Keep temporary workarounds out of the product path.

## Completed Polish Checks

- Fixed CRM dashboard copy encoding so text renders cleanly.
- Added unit coverage for messaging compliance guardrails.
- Added unit coverage for Twilio signature validation.
- Added unit coverage for CRM role permission boundaries.
- Added unit coverage for provider-event idempotency behavior.

## Next Polish Targets

1. Add the first read-only CRM dashboard API/data source.
2. Wire dashboard cards to real Twenty object counts and recent activity.
3. Add custom metadata fields for consent and Do Not Contact.
4. Add Twilio inbound webhook endpoint with signature verification, provider-event persistence, and activity logging.
5. Add UI states for provider configuration readiness.
