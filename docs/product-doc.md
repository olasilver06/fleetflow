# FleetFlow — Product Doc

## 1. Vision & Positioning

**FleetFlow — Last-Mile Delivery Operations Platform.**

FleetFlow is *not* a general logistics or warehouse management system. Its scope is deliberately narrow and end-to-end:

```
customer request → rider dispatch → delivery → proof → rating
```

Everything the product does should trace back to that pipeline. Features that belong to broader logistics (multi-leg freight, warehousing, inventory management, multi-tenant fleets) are explicitly out of scope for v1 — see [Section 6](#6-architecture--scope-decisions).

## 2. Personas

### Customer
Requests deliveries, tracks them in real time, and rates the rider afterward.

- Primary surface: mobile-first customer web app (`src/app/(customer)/`, `src/app/orders/`).
- Core jobs: submit a pickup/dropoff request, watch order status change, see who's carrying their package, rate the experience.
- Never sees other customers' orders, pricing internals, or rider operational data beyond the assigned rider's name.

### Admin
Runs dispatch — the "control tower." Watches the order queue and assigns riders to unassigned or failed jobs.

- Primary surface: desktop-first admin console (`src/app/admin/`).
- Core jobs: see orders stuck in `PENDING` / `REJECTED_BY_RIDER` / `DELIVERY_FAILED`, see which riders are `AVAILABLE`, assign a rider to an order.
- Has override authority: can transition any order's status, not just the ones a rider or customer could normally touch.

### Rider
Executes deliveries. Accepts or rejects assignments, moves a job through pickup → in-transit → delivered.

- Primary surface: mobile-first rider app (`src/app/rider/`).
- Core jobs: see active jobs assigned to them, accept/reject an assignment, advance job status as the physical delivery progresses.
- Can only act on orders where `delivery.riderId` matches their own rider record — enforced server-side, not just hidden in the UI.

## 3. Design System

Dark, operational, **"control tower"** aesthetic — not decorative. Every color below is defined in [`tailwind.config.ts`](../tailwind.config.ts) as a Tailwind theme token; there is no styling in this app that falls outside this palette.

| Token | Hex | Usage |
|---|---|---|
| `background` | `#111827` | Page background |
| `surface` | `#1C212B` | Cards, panels |
| `surface-hover` | `#242A36` | Hover state for surfaces |
| `border` | `#2A2D35` | Card borders, dividers, timeline rules |
| `primary` | `#2F6FED` | Signal Blue — primary actions, "Assigned"-family status |
| `accent` | `#FF7A32` | Route Orange — "Picked Up" / "In Transit"-family status |
| `success` | `#2ECC71` | "Delivered" / "Completed"-family status, confirmations |
| `warning` | `#F59E0B` | "Pending"-family status |
| `danger` | `#EB5757` | "Failed" / "Cancelled"-family status, errors, destructive actions |
| `info` | `#38BDF8` | Reserved — not yet used in shipped UI |
| `neutral` | `#6B7280` | Fallback/unknown states |
| `text-primary` | `#F4F5F7` | Primary text on dark surfaces |
| `text-secondary` | `#9CA3AF` | Secondary/muted text |

**Typography**
- **Inter** (`font-sans`) — all UI text.
- **JetBrains Mono** (`font-mono`) — reserved specifically for order numbers, tracking IDs, and timestamps. Never used for body copy or labels.

**Icons**: Lucide React (planned; not yet used in shipped components).

**Layout philosophy**: desktop-first for the admin console, mobile-first for the rider app. Customer surfaces are responsive but designed mobile-first, matching how most delivery requests happen.

**Established UI patterns** (see `src/components/`):
- Card: `rounded-xl border border-border bg-surface p-6`.
- Status badge: `inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-mono`, background at 10% opacity of the status color (`bg-{color}/10 text-{color}`), with a small solid dot (`h-1.5 w-1.5 rounded-full bg-current`).
- Primary button: `rounded-lg bg-primary px-4 py-2/py-3 text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-40`.
- Destructive/negative button (e.g. "Reject"): same shape, `bg-danger` instead of `bg-primary`.
- Inline error text: `text-danger text-sm`, `role="alert"`.
- Timeline (order status history): a `border-l border-border pl-4` rule with stacked rows, oldest at top.

## 4. Order Status Lifecycle

```
PENDING → ASSIGNED → RIDER_ACCEPTED → PICKED_UP → IN_TRANSIT → DELIVERED → COMPLETED
```

**Branches**

- **Rejection loop**: `ASSIGNED → REJECTED_BY_RIDER → ASSIGNED`. If a rider rejects an assignment, the order goes back to the assignable pool for an admin to reassign — it does not fall back to `PENDING`.
- **Delivery failure**: `IN_TRANSIT → DELIVERY_FAILED → RETURNED_TO_SENDER` (terminal) **or** `DELIVERY_FAILED → ASSIGNED` (retry with a new/same rider).
- **Cancellation**: `CANCELLED` is terminal and reachable from `PENDING`, `ASSIGNED`, or `RIDER_ACCEPTED` only — once a rider has physically picked up the package (`PICKED_UP` or later), the order can no longer be cancelled outright; it must run through `DELIVERY_FAILED` instead.

Terminal states: `COMPLETED`, `RETURNED_TO_SENDER`, `CANCELLED`.

The full transition graph is enforced in code by [`src/lib/services/order-state-machine.ts`](../src/lib/services/order-state-machine.ts) and must never drift from this document — the two are meant to be kept in sync by hand.

## 5. Audit Trail

Every status transition — regardless of which branch — writes an `OrderStatusHistory` row recording both `previousStatus` and `status`, plus who made the change (`changedByUserId`). This is not optional per-transition; it's enforced centrally in [`order-service.ts`](../src/lib/services/order-service.ts), which is the only code path allowed to mutate `Order.status`.

## 6. Architecture & Scope Decisions

These are standing decisions, not just "not built yet" — see `CLAUDE.md` for the authoritative, enforced list. Summarized:

- **Supabase is infrastructure, not the application layer.** Clients never call Supabase directly for business operations (creating orders, assigning riders, changing status) — everything goes through Next.js API routes. Supabase Auth *is* called directly from the browser for sign-in/sign-up, since authentication itself is infrastructure, not a FleetFlow business operation.
- **Role is always re-derived server-side from Prisma**, never trusted from a client-supplied role or JWT claim alone.
- **One status endpoint** (`PATCH /api/orders/:id/status`), not a fragmented `/accept`, `/reject`, `/pickup` set of routes.
- **Soft deletes only** — `deletedAt` on `User`/`Customer`/`Rider`/`Order`/`Delivery`; every query against these models filters `deletedAt: null`.
- **No repository layer** — Prisma is the data access abstraction already; an additional repository pattern on top of it is deliberately not built.
- **No background job queue, no Redis/caching, no multi-tenancy** in v1. Each has an explicit trigger condition in `CLAUDE.md` for when to revisit (e.g. background jobs once synchronous request latency is a measured problem).
- **No `NotificationService` / `RecommendationService`** files exist yet — they are intentionally not stubbed out ahead of the features that need them (recommendation scoring is Phase 5.5).

## 7. Non-Functional Notes

- **Error tracking**: Sentry, intended to be set up before further Phase 3+ work (not yet wired in as of this doc).
- **Realtime**: Supabase Realtime is part of the stack for live order/status updates; not yet used — current pages re-fetch via server-side re-render (`router.refresh()`) after a mutating action rather than subscribing to live changes.
- **Maps**: Leaflet + OpenStreetMap planned for pickup/dropoff address entry and rider tracking; current order creation takes raw lat/lng input directly, no map picker yet.
- **Deployment target**: Vercel (app) + Supabase (Postgres, Auth, Realtime, Storage).
