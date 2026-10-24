# Who can sign in, and who can see what

Accounts are created by invitation only. A new account has **no access** (it sees a waiting screen) until an administrator gives it a role on the *People and Access* screen. Pausing a person returns them to that state.

| Role | Does | Sees |
|---|---|---|
| Administrator | Everything, including people and access, audit log | Everything |
| Coordinator | Runs the network: creates and approves records, reviews requests and members, publishes resources and groves | All operational records and reports. Not the audit log or role management |
| Verifier | Submits and reviews survival checks (never their own) | Provenance, nursery, field records and reports |
| Nursery operator | Records production, losses and dispatches; creates batches | Only the nursery they run, its batches and distributions |
| Grower | Registers own sites and plantings | Own sites and plantings, distributions addressed to them |
| Sponsor | Follows the network | Shared pages only |

**Shared with every signed-in person (any role except "no access"):** the network overview (totals and verified survival), the directory (approved nurseries, and members who opted in: name, organisation, county only), the resource library, and published groves.

**Public, no sign-in:** the home page, join and seed request forms, published resources, seed lot QR pages and published groves. These show approved summaries only: never coordinates, exact collection places, or personal details.

Everything above is enforced in the database (row-level security and functions), and tested in `supabase/tests/run_tests.py`. The menus only reflect it.
