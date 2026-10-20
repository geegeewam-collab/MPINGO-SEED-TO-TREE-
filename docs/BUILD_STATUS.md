# Build Status: Mpingo Seed-to-Tree Network

## Current Milestone: Milestone 3 — Distribution, Inventory, GPS Planting Sites and Planting Events

### Implementation Plan
1. **Database Schema**: Create migration `0004_nursery_and_distribution.sql` for nurseries, batches, inventory movements, distributions, planting sites, and planting events.
2. **Inventory Logic**: Implement atomic PostgreSQL functions for seedling stock deduction at dispatch.
3. **Distribution UI**: Build `/app/distributions` for managing seedling transfers (Draft -> Approved -> Dispatched -> Received).
4. **Planting Sites UI**: Build `/app/planting-sites` with integrated Browser Geolocation API for GPS capture.
5. **Planting Events UI**: Build `/app/planting-events` to record actual planting linked to distributions.
6. **Security**: Implement RLS policies to protect sensitive site coordinates and operational records.
7. **Verification**: Test the full chain: Nursery Batch -> Distribution -> Planting Event.

### Progress
- [ ] Database migrations for nurseries and distributions.
- [ ] Atomic inventory functions.
- [ ] Distribution management screens.
- [ ] Planting site registry with GPS capture.
- [ ] Planting event recording.
- [ ] RLS policy configuration.

## Implemented Features
- [x] Authentication and Role-Based Access Control (RBAC).
- [x] Mother Tree Registry (Database).
- [x] Seed Lot Management & Provenance (Database).
- [x] Public Seed Lot Traceability (Database).
- [x] Basic Application Shell.

## Known Issues
- [ ] Documentation lags behind actual code progress (updated now).
- [ ] Mother Tree and Seed Lot UI components need final verification.

## Next Milestone: Milestone 4 — Survival Verification and Sponsor Reporting
- [ ] Survival check forms and calculations.
- [ ] Verifier approval workflow.
- [ ] Internal and Public Grove reporting.
