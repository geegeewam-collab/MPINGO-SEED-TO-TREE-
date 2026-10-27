# Build status (verified against the source, not earlier progress notes)

Verified: migrations 0001-0012 applied and behaviour-tested on a real Postgres (`python supabase/tests/run_tests.py`, 83 checks);
`tsc`, lint (0 errors, 0 warnings) and `next build` pass.
**Not yet verified:** a live Supabase project, a real browser or phone, live email/SMS providers.

**Changes since the verified run (written but NOT yet run or built):**
- Migration `0014_seedlings_produced.sql`: recording production now also raises "Seedlings produced" (it stayed at 0 before), and existing batches are backfilled. `run_tests.py` has three new checks for it (86 in total). Run the tests before relying on it.
- Site map: colour now depends on how much of the site was assessed (grey below 50%, a placeholder for MRI to set), and each pop-up shows all three survival measures.
- `src/proxy.ts`: refreshes Supabase sign-in sessions so long sessions are not cut off. Test by staying signed in for over an hour.
- Search engines are asked not to list the site while it is a prototype (nothing is shown on the page). Set `NEXT_PUBLIC_PROTOTYPE_MODE=off` only after MRI approves a real launch.
- The site always uses the light palette. The dark palette in `globals.css` now applies only if the page has `data-theme="dark"`, instead of following the device's dark mode.
- Please run `npm run build` and lint before deploying these changes.

See `docs/ACCESS_MODEL.md` (who sees what) and `docs/LAUNCH_CHECKLIST.md` (setup).

## Working
- **Access:** invitation-only accounts; new accounts see a waiting screen until an admin assigns a role; role-aware menus backed by database rules; admin People and Access screen (change role, pause access, invite by email); last administrator cannot be removed.
- **Shared with every signed-in person:** network overview with verified survival, directory (approved nurseries and opted-in members), resource library, published groves.
- **Public:** home page, join and seed request forms (saved, throttled, acknowledgement email if configured), resource library, seed lot QR pages, published groves. No coordinates or personal details.
- **Records:** create, edit (where the stage allows), detail and status actions for mother trees, seed lots, nurseries, batches, distributions, sites, events, survival checks, groves, resources; stock production/loss; survival review by a different person; request and membership review with email/SMS notification if configured; grove update posts.
- **Field:** offline-capable Field Entry page for plantings and survival checks (queue on the device, idempotent sync, retry, visible status, installable app with service worker); GPS only on request; site map (planting sites only).
- **Photo evidence:** photos can be added to plantings and survival checks (private storage, shrunk on the phone before upload, visible only to people who can see the record, locked once a check is verified) and approved photos can be published on sponsor groves.
- **Reports:** survival from verified checks, CSV download.
- **Account:** sign-in handled on the server with a login throttle; password reset by email link.

## Not built yet
- Photos can only be added while online, after the record is saved. Photos taken offline are not queued.
- Offline use covers the Field Entry page only; the rest of the app needs a connection.
- Kiswahili resources: the library supports them, but no content has been loaded. Publish only guidance MRI has reviewed.
- Spam protection is a hidden field plus a per-connection throttle; add a captcha if abuse appears.
- Seed lot source trees cannot be changed after creation.
- Payments: out of scope until MRI agrees who holds the money.

## Needs real-world testing
Offline capture on a real phone; email and SMS with live provider keys; invitation and reset email links with your Supabase templates.
