# Load test (k6)

Measures the real ceiling of the PostgREST surface before the app needs a
Supabase compute/plan upgrade. Models the app's actual request mix (reads
dominate: feed / own-likes / notifications / wardrobe; sprinkles like,
reaction, comment, mark-read writes and the username RPC).

## Prerequisites

- [k6](https://k6.io/docs/getting-started/installation/) (single binary, `winget install k6` on Windows)
- A **Supabase dev branch** to run against — never hammer production. Create one
  in the Supabase dashboard (Database → Branching) or via MCP.
- The dev branch's **JWT secret** (Settings → API → JWT secret). It's only used
  to mint per-VU test JWTs; the secret never leaves your machine.

## Run

```bash
k6 run \
  -e SUPABASE_URL=https://<branch-ref>.supabase.co \
  -e SUPABASE_JWT_SECRET=<jwt-secret> \
  -e MAX_VUS=200 \
  scripts/loadtest/k6-load-test.js
```

## What it does

1. **Setup** (once, via a service_role token it mints): creates
   `MAX_VUS` `user_profiles` rows (`loadtest-user-1..N`) so FK-constrained
   writes succeed, plus 10 seed posts for likes/comments/reactions.
2. **Ramp** to `MAX_VUS` virtual users over 60s, hold 60s, ramp down.
3. Each VU mints its own `authenticated` HS256 JWT with `sub=loadtest-user-<VU>`,
   so every request goes through the same RLS path as a real signed-in client.
4. Each iteration picks one operation from the weighted mix and reports a `check`
   for status correctness.

## Reading results

- **`http_req_duration` p(95)** — the latency budget (default threshold 2s).
- **`http_req_failed` rate** — errors must stay < 1%.
- **`iterations` / `http_reqs`** — total throughput; watch `http_reqs` per
  second across the ramp to find where it stops scaling (that's the breaking
  point where the compute upgrade matters).

## Notes

- The request mix is representative, not exact: image uploads, edge functions
  (Gemini / remove.bg / fal.ai) and Realtime sockets are **not** covered — those
  are rate-limited separately and billed per-call.
- Re-runs are idempotent: user_profiles/posts are upserted on `user_id`/`id`.
- Tune the mix in `mix()` if you want to stress a specific surface (e.g. set
  the feed branch to 90%).
