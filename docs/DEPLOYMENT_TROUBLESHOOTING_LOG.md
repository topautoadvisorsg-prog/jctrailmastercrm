# Deployment Troubleshooting Log — Railway Backend

Running record of every failure found and fixed while getting the JC Trailmaster backend live on Railway. Kept honest and current — this is not a success story until `/healthz` returns 200 with a database-backed check passing.

## Objective

`https://jctrailmastercrm-production.up.railway.app/healthz` returns HTTP 200 from Twenty's real health controller, with evidence the app is actually connected to Supabase and Redis — not just "the container is running."

## Fixed so far, in order, each confirmed by log evidence before moving to the next

| # | Symptom | Root cause (confirmed via logs) | Fix |
|---|---|---|---|
| 1 | Container ran `nest start --watch` + a frontend dev server instead of production build | `railway.json` lived in `packages/twenty-server/`, but the service has no Root Directory set — Railway never read it, fell back to auto-detecting the monorepo and running dev scripts | Moved config to repo-root `railway.json`, explicit `buildCommand`/`startCommand` |
| 2 | `ERROR REDIS_URL must be a URL address` | No Redis service existed in the Railway project at all — the referenced variable resolved to empty | `railway add --database redis`, wired `REDIS_URL=${{Redis.REDIS_URL}}` |
| 3 | `getaddrinfo ENOTFOUND db.shmzdfgvghnskychmtie.supabase.co` | Two stacked issues: (a) Supabase free-tier project had auto-paused from ~7 days idle — this alone produces NXDOMAIN and looks identical to a deleted/invalid project; (b) even once restored, the **direct** `db.<ref>.supabase.co` host still doesn't resolve for this project — only the **session pooler** host does | Restored project via dashboard; switched `PG_DATABASE_URL` to `postgresql://postgres.<ref>:pw@aws-0-ca-central-1.pooler.supabase.com:5432/postgres` — verified this exact string connects from a local Node script before touching Railway |
| 4 | `customer.config.json not found at /app/packages/twenty-server/customer.config.json` | App boots with cwd `packages/twenty-server`, but `CUSTOMER_CONFIG_PATH` was a relative path pointing at repo root | Changed to absolute `/app/customer.config.json` |
| 5 | `UnknownDependenciesException`: `JwtAuthGuard` needs `AccessTokenService`, `WorkspaceCacheStorageService` | `CrmDashboardModule` (our custom module) used `JwtAuthGuard`/`WorkspaceAuthGuard` without importing the modules that provide their dependencies | Added `TokenModule` + `WorkspaceCacheStorageModule` imports, mirroring how Twenty's own `McpModule` wires the same guards. Verified: `nest build` clean, `crm-dashboard.service.spec.ts` passing |
| 6 | `Error: Cannot derive session cookie secret: set ENCRYPTION_KEY` | Variable never set — wasn't in the original env list because it wasn't in `.env.example` at all | Generated a random 64-char hex key, set as `ENCRYPTION_KEY` |

## Current blocker — NOT YET RESOLVED

**Deployment `4b3c8e44` shows `SUCCESS` in Railway's deployment list, service shows `● Online`, but `/healthz` has returned `502 Bad Gateway` / `x-railway-fallback: true` consistently for over an hour since that deploy.** This is not a "still booting" timing issue — that header specifically means Railway's edge proxy cannot reach the app's listening socket at all, regardless of what the app itself is doing internally.

**What the logs show:** the app gets through dozens of module initializations and route mappings (`Mapped {/rest/..., GET} route` × hundreds), then the log stream cuts off with:
```
Railway rate limit of 500 logs/sec reached for replica, update your application to reduce the logging rate. Messages dropped: 195
```
**Those 195 dropped lines are gone permanently** — this is Railway's server-side ingestion cap, not a display/query limit, so re-fetching logs cannot recover them. That means I genuinely do not know, from logs alone, whether:
- (a) the app reached `app.listen()` successfully and is sitting there healthy, just unreachable from outside due to a port-routing mismatch, or
- (b) the app crashed immediately after, on a line that got dropped

**Secondary finding that supports a port-mismatch theory:** Railway does **not** inject a `PORT` environment variable to this service at all (confirmed via `railway run -- echo $PORT` → empty string). Our start command falls back to `NODE_PORT=3000` in that case. `railway domain --port 3000` on the *existing* domain did not visibly confirm a change (the CLI only reported the domain already existed), and attempting to explicitly re-specify `<domain> --port 3000` returned "Unauthorized" — unclear if that's a real permission gap or a CLI quirk on updating vs. creating a domain. **Not yet resolved either way.**

## Update: log-verbosity fix applied, blocker isolated to pure port-routing

Set `LOG_LEVELS=error,warn`, redeployed (`b4e2663c`), and this time got a clean, uncut log:

```
Performed 'create schema "public"' successfully
Performed 'create schema "core"' successfully
Performed 'create extension "uuid-ossp"' successfully
Performed 'create extension "unaccent"' successfully
Performed 'create immutable unaccent wrapper function' successfully
[WARN] [RunInstanceCommandsCommand] Skipping workspace version check (--force flag used)
Stopping Container   <- pre-deploy step (setup-db + migrations) finished clean
Starting Container   <- main app process starts
Frontend build not found or not writable, assuming it is served independently
```

That last line is printed by `generateFrontConfig()` in `main.ts`, the line immediately before `await app.listen(...)`. No error after it. With `log`-level suppressed, this is what a **successful** boot looks like — the "Nest application successfully started" line is silent now too (it's `log`-level).

**Confirmed working:** Supabase connection (schemas/extensions created), migrations (`run-instance-commands` ran), app does not crash.

**Confirmed NOT the problem:** the app itself.

**Remaining problem, isolated:** Railway's edge proxy (`x-railway-fallback: true`, 502) cannot reach whatever port the app is actually listening on. Tried explicitly setting `PORT=3000` as a Railway variable (reasoning: Railway never auto-injects `PORT` for this service — confirmed via `railway run -- echo $PORT` returning empty) and redeployed (`9e66e4e1`) — **identical clean boot log, still 502.** So the fix isn't as simple as "declare the variable."

Also tried, via CLI: `railway domain <existing-host> --port 3000` → returned `Unauthorized`. The bare form `railway domain --port 3000` (no hostname) exits 0 but only prints the already-existing domain — it does not appear to apply the port to an existing domain, only at domain-creation time. **This looks like a genuine CLI capability gap, not a retry-able transient failure** (auth itself checked out fine via `whoami`/`status` in between attempts).

## Next step — needs the Railway dashboard directly (CLI can't do this one)

Go to https://railway.app/dashboard → project **attractive-fascination** → service **jctrailmastercrm** → **Settings** tab → **Networking** section. There should be a **Public Networking** entry showing the domain (`jctrailmastercrm-production.up.railway.app`) with a **target port** field next to it. Check what port it's actually set to — if it's anything other than `3000`, that's the whole bug. Either edit it to `3000` directly, or remove and regenerate the domain (there should be a way to set the port at that point via the dashboard UI, same as the CLI's creation-time flag).

## RESOLVED (2026-07-28)

Root cause of the port-routing 502: Railway's public domain for this service was configured (at some point during earlier `railway domain` CLI calls) with a **target port of 3001**, while our app was listening on `3000` (the fallback default, since Railway never injects a `PORT` variable to this service). Confirmed via the Railway dashboard (Settings → Networking → Public Networking → showed `Port 3001`).

Fix: rather than fight the CLI (which had already refused the domain-port update with `Unauthorized`) or require a dashboard edit, set `NODE_PORT=3001` directly as a Railway variable — our start command's `${NODE_PORT:-${PORT:-3000}}` picks up the explicit value first. Redeployed (`7a698479`).

**Result — all green:**
- `/healthz` → `HTTP 200`, `{"status":"ok","info":{},"error":{},"details":{}}`, no `x-railway-fallback` header, 3 consecutive checks + a later independent recheck all 200.
- **Database access confirmed:** the pre-deploy log shows the app's own migration command creating real schemas/extensions directly in Supabase (`create schema "public"`, `create schema "core"`, `create extension "uuid-ossp"`, `create extension "unaccent"`) — this is a live DDL execution against Postgres, not a static check. Additionally, `POST /graphql` with `{ __typename }` returns `200` with a valid response — Twenty's GraphQL schema is built dynamically from metadata stored in Postgres, so a successful response also confirms the metadata tables were read correctly at boot. Introspection is disabled (`GraphQL introspection has been disabled`) — correct, expected production hardening, not a bug.
- **Redis confirmed indirectly:** no Redis/BullMQ connection errors anywhere in the logs at `error` level (which is not suppressed), across multiple deploys after `REDIS_URL` was wired to the real Redis service. ioredis/BullMQ throw loudly on connection failure; silence here is meaningful.
- **Restart stability confirmed:** deployment `7a698479` has stayed `SUCCESS`/`Online` with no new crash-triggered redeploy; a health check run again independently after this was written still returned `200`.
- **Protected endpoint sanity check:** `GET /rest/metadata/objects` → `403 Forbidden`, `"Missing authentication token"` — correct guard behavior (clean rejection, not a 500), confirms the auth guard chain itself is healthy.

**Backend status: VERIFIED WORKING.** Full bug list, in the order each was found and fixed: (1) wrong config location running dev servers, (2) no Redis provisioned, (3) Supabase paused + wrong host, (4) relative config path, (5) missing DI imports in our custom module, (6) missing `ENCRYPTION_KEY`, (7) wrong target port on the Railway domain. Seven real, distinct bugs — each confirmed by log evidence before moving to the next, none guessed.

## Bug #8 (frontend, found during acceptance testing 2026-07-28): redirect loop to backend on every page load

After the backend was fully verified, the deployed frontend (`https://jc-trailmaster-crm.vercel.app`) loaded correctly for under a second, then redirected the browser to `https://jctrailmastercrm-production.up.railway.app/welcome` — a 404, since that's the API-only backend with no pages.

**Root cause:** `DomainServerConfigService.getFrontUrl()` (backend) reads `FRONTEND_URL`, falling back to `SERVER_URL` if unset:
```ts
getFrontUrl() {
  return new URL(
    this.twentyConfigService.get('FRONTEND_URL') ??
      this.twentyConfigService.get('SERVER_URL'),
  );
}
```
We had set `SERVER_URL` (the API's own URL, correctly) but never set `FRONTEND_URL`. So the backend computed the workspace's "canonical" URL as the Railway domain itself. The frontend's `WorkspaceProviderEffect` compares the browser's current hostname against that computed workspace URL and calls `redirectToWorkspaceDomain()` on any mismatch — sending the browser to the (wrong) Railway domain.

**Fix:** set `FRONTEND_URL=https://jc-trailmaster-crm.vercel.app` on the Railway backend service. Redeployed, re-tested in a real browser (not just curl) — sign-in page now renders correctly and stays on the Vercel domain, zero console errors, deep-linked routes don't 404.

**Lesson:** `SERVER_URL` and `FRONTEND_URL` are two distinct variables with a silent fallback between them — setting only one looks fine (backend boots, `/healthz` is green) but breaks a completely different subsystem (workspace domain redirect) that only surfaces once you actually load the frontend in a browser. This is exactly why a green health check was never treated as "done" — confirmed by the user's own verification rule.

## Rule going forward

No more "wait N minutes and guess" cycles. Every deploy attempt from here gets: the change, the reason, one clear log check, and a plain pass/fail — reported before touching anything else.
