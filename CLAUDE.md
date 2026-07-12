@AGENTS.md

# FleetFlow

Last-mile delivery operations platform. Not a general logistics/warehouse system — scope is strictly customer request → rider dispatch → delivery → proof → rating.

## Docs (read before making architectural decisions)

- `docs/product-doc.md` — vision, personas, design system, NFRs, architecture decisions
- `docs/api-contract.md` — every endpoint's request/response/errors/business logic/realtime/notifications. 🟢 = implemented, 🟡 = designed only, not built
- `docs/openapi.yaml` — machine-readable API spec
- `docs/folder-structure.md` — frozen structure, don't reorganize without a real reason
- `prisma/schema.prisma` — source of truth for data model, currently v1.2

## Stack

- Next.js 14+ (App Router), TypeScript, Tailwind CSS
- PostgreSQL via Supabase, Prisma ORM
- Supabase Auth (roles: CUSTOMER, ADMIN, RIDER), Supabase Realtime, Supabase Storage
- Leaflet + OpenStreetMap for maps
- Sentry for error tracking (set up first, before other Phase 3 work)
- Deployment: Vercel (app) + Supabase (backend)

## Commands

```bash
npm run dev
npx prisma migrate dev --name <description>
npx prisma generate
npx prisma studio
```

## Architecture rules — don't violate these

1. **No client talks to Supabase directly for business operations.** Customer/Admin/Rider apps all go through Next.js API routes. Supabase is the infrastructure layer, not the application layer.
2. **Every protected route re-derives the role from Prisma via `lib/auth/get-current-user.ts`.** Never trust a role claimed by the client or read from a JWT alone. **There is no `middleware.ts` in this project** — route protection is not centralized; every protected page and API route calls `getCurrentUser()`/`requireRole()` itself. When adding a new protected route, you must add this check yourself; nothing enforces it automatically. (See `docs/folder-structure.md`.)
3. **Order status changes only through `lib/services/order-service.ts`.** `transitionOrderStatus` and `assignRiderToOrder` are the single source of truth. Never update `Order.status` directly in a route handler — it bypasses `order-state-machine.ts` and the audit trail.
4. **One status endpoint, not several.** `PATCH /api/orders/:id/status` handles every transition (accept/reject/pickup/deliver/cancel) via the state machine. Don't fragment into `/accept`, `/reject`, `/pickup` etc. — decided against this in Phase 3.5 review; revisit only if a specific transition needs a genuinely different request shape or permission model.
5. **Every status transition writes an `OrderStatusHistory` row with both `previousStatus` and `status`.** This is the audit trail — don't skip it for "simple" transitions.
6. **Soft deletes only.** `deletedAt` on User/Customer/Rider/Order/Delivery — never hard-delete these. Every query against them needs `deletedAt: null`, or add a Prisma middleware to apply it globally if that's cleaner.

## Explicitly deferred — do not build unless the trigger condition is met

- **Background job queue** (Trigger.dev/Inngest/BullMQ) — for notifications, recommendation scoring, reports. Trigger: synchronous request latency actually becomes a measured problem.
- **Redis/caching** — for zones, pricing, dashboard stats. Trigger: dashboard queries measurably slow down at real order/rider volume.
- **`repositories/` layer** — Prisma is already the data access abstraction; don't add a repository pattern on top of it.
- **`NotificationService` / `RecommendationService`** — don't create empty service files for features that don't exist yet. Recommendation scoring formula is Phase 5.5, not before.
- **Multi-tenancy** (`Company`/`Organization` models) — single-tenant by design for v1.

## Design system

Dark, operational, "control tower" aesthetic — not decorative.
- Background `#111827`, Surface `#1C212B`
- Primary (Signal Blue) `#2F6FED`, Accent (Route Orange) `#FF7A32`
- Status colors: Pending=Amber `#F59E0B`, Assigned=Blue, Picked Up/In Transit=Orange, Delivered/Completed=Green `#2ECC71`, Failed/Cancelled=Red `#EB5757`
- Font: Inter (UI), JetBrains Mono (order numbers, tracking IDs, timestamps only)
- Icons: Lucide React
- Desktop-first for admin, mobile-first for rider

## Order status enum (do not add/remove without updating order-state-machine.ts)

`PENDING → ASSIGNED → RIDER_ACCEPTED → PICKED_UP → IN_TRANSIT → DELIVERED → COMPLETED`
Branches: `REJECTED_BY_RIDER` (loops back to ASSIGNED), `DELIVERY_FAILED` (→ RETURNED_TO_SENDER or retry ASSIGNED), `CANCELLED` (terminal, from PENDING/ASSIGNED/RIDER_ACCEPTED).

## Current build status

Phase 3 complete: auth, RBAC, order state machine, `POST /api/orders`, `PATCH /api/orders/:id/status`, `POST /api/orders/:id/assign`.
Phase 3.5 complete: API contract, ERD, sequence diagrams, OpenAPI spec — see `docs/`.
Next: Phase 4 — Customer Web App, starting with the order request form against `POST /api/orders`.