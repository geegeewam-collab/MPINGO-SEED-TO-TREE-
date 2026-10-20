# Product Specification: Mpingo Seed-to-Tree Network

## 1. Overview
The Mpingo Seed-to-Tree Network is a conservation technology platform designed for the Mpingo Restoration Initiative (MRI). It coordinates the lifecycle of Mpingo restoration: Seed Collection $\rightarrow$ Nursery Production $\rightarrow$ Distribution $\rightarrow$ Planting $\rightarrow$ Survival Monitoring $\rightarrow$ Reporting.

### Primary Principle
**Record once, reuse everywhere.** All downstream activities must link back to their source records to ensure traceability and data integrity.

## 2. Architecture

### Technology Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS.
- **Backend**: Supabase (PostgreSQL, Auth, Storage).
- **Validation**: Zod, React Hook Form.
- **Mapping**: Leaflet.
- **Traceability**: QR codes resolving to public tokens.

### Role-Based Access Control (RBAC)
| Role | Permissions |
| :--- | :--- |
| `admin` | Full system access, user/role management, audit logs. |
| `coordinator` | Manage requests, operational records, reporting, and publishing. |
| `nursery_operator` | Manage assigned nurseries, batches, and inventory. |
| `grower` | Submit requests, access records associated with their plantings. |
| `verifier` | Submit survival inspections (cannot approve own checks). |
| `sponsor` | View approved reports and public grove pages. |
| `pending` | Authenticated but awaiting admin approval for role assignment. |

## 3. Screen Inventory

### Public Screens
- `/`: Landing page with workflow explanation and intake entry points.
- `/join`: Network registration form for growers, nurseries, researchers.
- `/seed-requests/new`: Public form for requesting seeds or seedlings.
- `/trace/[token]`: Public QR-resolved page for record provenance.
- `/groves/[slug]`: Public sponsor grove page with approved progress reports.

### Auth Screens
- `/login`: Sign-in and account access.
- `/forgot-password`: Password reset flow.

### Authenticated Screens (`/app/...`)
- `/app/dashboard`: Role-aware operational hub with summary KPIs.
- `/app/requests`: Coordinator tool for managing seed/seedling requests.
- `/app/members`: Directory and application review for network members.
- `/app/mother-trees`: Registry of source trees with private coordinates.
- `/app/seed-lots`: Tracking of collected seed lots and provenance.
- `/app/nurseries`: Registry of approved nursery partners.
- `/app/nursery-batches`: Management of sowing, germination, and stock.
- `/app/distributions`: Transfer records from nursery to grower.
- `/app/planting-sites`: Registry of restoration sites with GPS capture.
- `/app/planting-events`: Records of seedlings planted at specific sites.
- `/app/survival-checks`: Field inspection forms and survival calculations.
- `/app/reports`: Aggregated restoration data and CSV exports.
- `/app/groves`: Internal management of sponsor grove public pages.
- `/app/team`: Admin tool for user roles and account status.
- `/app/audit-log`: Read-only history of sensitive system actions.
- `/app/settings`: User profile and account preferences.
- `/app/resources`: Knowledge library of restoration guides.

## 4. Core Workflow (The Journey)
`Mother Tree` $\rightarrow$ `Seed Lot` $\rightarrow$ `Nursery Batch` $\rightarrow$ `Distribution` $\rightarrow$ `Planting Site` $\rightarrow$ `Planting Event` $\rightarrow$ `Survival Check` $\rightarrow$ `Approved Result` $\rightarrow$ `Sponsor Grove Report`.

## 5. Data Integrity & Calculations
- **Inventory**: No negative stock. Atomic updates via database functions.
- **Survival Metrics**:
    - *Survival among classified*: $\frac{\text{Alive}}{\text{Alive} + \text{Dead}}$
    - *Confirmed alive share*: $\frac{\text{Alive}}{\text{Originally Planted}}$
    - *Assessment coverage*: $\frac{\text{Actually Assessed}}{\text{Originally Planted}}$
