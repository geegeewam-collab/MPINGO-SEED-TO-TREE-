# Build status (verified against the source, not earlier progress notes)

Last verified: migrations applied and behaviour-tested on a real Postgres (`python supabase/tests/run_tests.py`, 35 checks);
`tsc`, `next build` pass; lint clean on all files changed in this pass.

## Working
- Database: migrations 0001-0008 apply cleanly. Reference numbers are generated; stock functions are role-checked; survival checks must add up to the number planted and cannot be reviewed by their submitter; verified checks are final; audit trail is written by triggers.
- Public: `/join` and `/seed-requests/new` save to the database (success is shown only after a successful save). `/trace/[token]` and `/groves/[slug]` read approved summaries through `public_trace` and `public_grove` (no coordinates, no exact collection place, only verified survival results).
- Staff app: sign-in, role-aware navigation, overview with live counts, read-only registries for every module, survival report from verified checks.

## Not built yet
- Create / edit / detail screens for every module (nothing can be added from the interface yet).
- Verifier review screen; request and membership review actions; role management for admins.
- Offline capture: `src/lib/offline` exists but nothing calls it; no PWA manifest or service worker; queue needs retry for stuck items and idempotent keys.
- QR code generation, map, photo upload (Supabase Storage), report export, member directory, password reset page.
- Public form spam protection beyond a hidden field (add a captcha or rate limit before launch).

## Known pre-existing lint errors (not touched)
`src/app/page.tsx`, `src/app/resources/page.tsx`, `src/lib/calculations/survival.ts`, `src/components/ui/Input.tsx`, `src/components/ui/Table.tsx`, `src/lib/offline/db.ts`, `src/lib/offline/sync.ts`.
