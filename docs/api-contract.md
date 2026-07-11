# FleetFlow — API Contract

Legend: 🟢 = implemented and live in `src/app/api/` · 🟡 = designed/planned only, not built.

This document only describes routes that exist under `src/app/api/` today, exactly as implemented — not the aspirational full API surface. See [§4](#4-not-yet-built) for what's still missing.

A pattern worth calling out up front: several pages (`/admin/orders`, `/admin/dashboard`, `/admin/zones`, `/rider/jobs`, `/orders`, `/orders/:id/track`) query Prisma **directly inside server components** rather than calling a `GET` API route. That's an intentional, Next.js–idiomatic choice for server-rendered reads — API routes in this app exist for **client-initiated mutations** (`POST`/`PATCH` from a `"use client"` component) and for the two general-purpose collection `GET`s that a client component actually needs to fetch itself: `GET /api/orders`, and `GET /api/zones` (called from `OrderRequestForm` to populate the zone `<select>`, since that data isn't known server-side at the time the form's client component mounts). It does not violate the "no client talks to Supabase directly" rule, since these reads happen server-side against Prisma/Postgres, not client-side against Supabase.

One deliberate exception to that rule: `/orders/:id/track`'s map component subscribes to Supabase Realtime **directly from the browser** (`supabase.channel(...).on("postgres_changes", ...)`) for live `RiderLocation` updates. This is infrastructure-layer pub/sub, not a business-operation write, and there's no other way to get sub-second position updates without it — but it's why the `RiderLocation` RLS policy in [§2](#2-rider-locations) exists at all: it's the one table a browser client reads from Supabase directly, so the database itself has to enforce who can see what.

---

## 1. Orders

### 🟢 `POST /api/orders`

Creates a new delivery order.

- **File**: `src/app/api/orders/route.ts`
- **Role**: `CUSTOMER` (must have a linked `Customer` row)

**Request body**
```json
{
  "pickupAddress": "string (required)",
  "pickupLat": "number (required)",
  "pickupLng": "number (required)",
  "dropoffAddress": "string (required)",
  "dropoffLat": "number (required)",
  "dropoffLng": "number (required)",
  "packageDescription": "string (optional)",
  "weightKg": "number (optional)",
  "zoneId": "string (optional)"
}
```
All four coordinates are validated as present (`pickupLat`, `pickupLng`, `dropoffLat`, `dropoffLng`) — this was tightened alongside the pricing engine below, since a missing longitude now silently corrupts the price calculation (`NaN`) rather than just a cosmetic map-marker issue.

**Response — `201`**: the full created `Order` row (raw Prisma object; no relations included).

**Business logic**
- `price` is now **calculated**, not hardcoded — see [`calculatePrice`](../src/lib/services/pricing-service.ts): `price = baseFee + (straight-line distance in km × perKmRate) + (weightKg × weightSurchargeRate, if both are present)`, rounded to the nearest whole Naira. Distance is straight-line (haversine), not road distance — there's no routing/mapping integration yet.
  - The rule used is the active `PricingRule` for the order's `zoneId` if one is given, otherwise the active global rule (`zoneId: null`). **No fallback chain** — if a `zoneId` is passed but has no active rule of its own, it does *not* fall back to the global rule; it fails.
  - **Requires at least one active `PricingRule` to exist.** If none is found, `calculatePrice` throws `"No active pricing rule configured"`, which this route catches and returns as `500` rather than letting it crash unhandled or silently defaulting to a magic number. Seed one via `scripts/seed-pricing.ts` (creates a global default with placeholder rates — not real business pricing).
- `orderNumber` is generated client-of-the-request-side as `FF-{year}-{random 6-digit number}`. It relies on the DB's `@unique` constraint to catch collisions; a collision would currently surface as an unhandled Prisma error (500), not a friendly retry.
- Creates the first `OrderStatusHistory` row (`status: "PENDING"`) inline as part of the same write.

**Errors**
- `403 Forbidden` — authenticated but not a `CUSTOMER`, or no linked `Customer` row.
- `400 Bad Request` — missing required fields.
- `401 Unauthorized` — *intended* for unauthenticated requests, but see **Known issue** below.
- `500 Internal Server Error` — no active `PricingRule` found for the requested `zoneId`/global default.

### 🟢 `GET /api/orders`

Lists orders, scoped by the caller's role.

- **File**: `src/app/api/orders/route.ts`
- **Role**: any authenticated user; behavior branches by role.

**Response — `200`**: raw array of `Order` rows (no relations included).
- `CUSTOMER` → their own orders (`customerId` match), `deletedAt: null`, newest first.
- `ADMIN` → all non-deleted orders, newest first, capped at 100.
- `RIDER` → all orders where `delivery.riderId` is their own rider id, newest first. **Note:** unlike the `/rider/jobs` page, this is not filtered to "active" statuses — it returns every order ever assigned to the rider, including delivered/completed ones. No current UI calls this branch.
- Anything else → `403 Forbidden`.

**Known issue**: both handlers call `requireUser()`, which throws a raw `Response` object on missing auth ([`get-current-user.ts`](../src/lib/auth/get-current-user.ts)) rather than returning one. Next.js route handlers don't specially catch arbitrary thrown `Response`s — only redirect/not-found internals — so an unauthenticated request to either handler currently resolves to a generic `500`, not the intended `401`. The `PATCH /status` and `POST /assign` routes below avoid this by calling `getCurrentUser()` directly and returning `NextResponse.json(...)` explicitly instead of throwing.

---

### 🟢 `PATCH /api/orders/:id/status`

The single endpoint for every order status transition (accept, reject, pickup, deliver, cancel, etc.) — per the architecture decision against fragmenting into per-action routes. **Exception:** `DELIVERED` is explicitly blocked here — see below.

- **File**: `src/app/api/orders/[id]/status/route.ts`
- **Role**: `RIDER` (only for orders they're assigned to) or `ADMIN` (any order).

**Request body**
```json
{ "status": "RIDER_ACCEPTED" }
```
`status` must be one of the 11 `OrderStatus` enum values, **except `DELIVERED`** (see below).

**Response — `200`**: the updated `Order` row.

**`DELIVERED` is blocked here.** Requesting `{ "status": "DELIVERED" }` returns `400` with `"DELIVERED can only be set via proof-of-delivery upload at POST /api/orders/:id/proof"`, checked immediately after status validation and before any role/ownership check or call into `transitionOrderStatus` — so it's rejected outright for every caller, admin included. This forces every delivery completion through [`POST /api/orders/:id/proof`](#-post-apiordersidproof), which requires a photo. That route is unaffected by this restriction: it calls `transitionOrderStatusInTx` directly inside its own transaction, never going through this route handler.

**Authorization**
- `RIDER` — must have a linked `Rider` row, and the target order's `delivery.riderId` must equal that rider's id, or `403`. Beyond ownership and the `DELIVERED` block above, the route does **not** further restrict *which* target statuses a rider may set — the state machine (not a per-role allow-list) is what actually constrains valid transitions.
- `ADMIN` — no ownership check; can transition any order to any status the state machine allows, except `DELIVERED`.
- Any other role → `403 Forbidden`.

**Business logic** — delegates entirely to [`transitionOrderStatus`](../src/lib/services/order-service.ts), which:
1. Loads the order inside a transaction; `404`-equivalent (`400` with message `"Order not found"`) if missing or soft-deleted.
2. Validates the transition against [`order-state-machine.ts`](../src/lib/services/order-state-machine.ts); rejects invalid transitions with a `400` and a message like `"Cannot transition order from DELIVERED to PICKED_UP"`.
3. Updates `Order.status` and writes an `OrderStatusHistory` row (`previousStatus`, `status`, `changedByUserId`) atomically.
4. If the new status is `DELIVERED`, `REJECTED_BY_RIDER`, `DELIVERY_FAILED`, or `CANCELLED`, frees the assigned rider back to `availability: "AVAILABLE"`.

**Errors**
- `401 Unauthorized` — no session.
- `400 Bad Request` — invalid/missing `status`, target status is `DELIVERED`, order not found, or an invalid state transition.
- `403 Forbidden` — role/ownership check failed.

### 🟢 `POST /api/orders/:id/assign`

Assigns a rider to an order (admin dispatch action).

- **File**: `src/app/api/orders/[id]/assign/route.ts`
- **Role**: `ADMIN` only.

**Request body**
```json
{ "riderId": "string (required)" }
```

**Response — `200`**: the updated `Order` row (now `status: "ASSIGNED"`).

**Business logic** — delegates to [`assignRiderToOrder`](../src/lib/services/order-service.ts), which, in one transaction:
1. Confirms the order exists, is not soft-deleted, and can validly transition to `ASSIGNED` (i.e. is currently `PENDING`, `REJECTED_BY_RIDER`, or `DELIVERY_FAILED`).
2. Confirms the rider exists, is not soft-deleted, and has `availability: "AVAILABLE"`.
3. Upserts the order's `Delivery` row (`riderId`, `assignedByUserId`, `assignedAt`) — handles both first assignment and reassignment (e.g. after a rejection).
4. Flips the rider's `availability` to `BUSY`.
5. Updates `Order.status` to `ASSIGNED` and writes the `OrderStatusHistory` row.

The rider is freed back to `availability: "AVAILABLE"` when the order later reaches `DELIVERED`, `REJECTED_BY_RIDER`, `DELIVERY_FAILED`, or `CANCELLED` — see `PATCH /status` above.

**Errors**
- `401 Unauthorized` — no session.
- `403 Forbidden` — not an admin.
- `400 Bad Request` — missing `riderId`, order not found, rider not found, rider not available, or an invalid state transition.

### 🟢 `POST /api/orders/:id/proof`

Uploads proof of delivery (a photo, plus optional recipient name/notes) and transitions the order to `DELIVERED` in the same step. This is the **only** way to reach `DELIVERED` — see the `DELIVERED` block on `PATCH /status` above.

- **File**: `src/app/api/orders/[id]/proof/route.ts`
- **Role**: `RIDER` (only if `delivery.riderId` matches them) or `ADMIN`.
- **Content-Type**: `multipart/form-data`.

**Request body (form fields)**
- `photo` — file, required.
- `recipientName` — string, optional.
- `notes` — string, optional.

**Preconditions**
- Order must exist, not be soft-deleted, and currently be `IN_TRANSIT` — `409 Conflict` otherwise (checked before the file is parsed).
- Order must have a linked `Delivery` — `409 Conflict` otherwise (defensive; not reachable via the normal state machine, since `IN_TRANSIT` implies a rider was assigned).

**Response — `201`**
```json
{ "proof": { "...": "ProofOfDelivery row" }, "order": { "...": "updated Order row" } }
```

**Business logic**
1. Uploads `photo` to the Supabase Storage `proof-of-delivery` bucket via [`createSupabaseAdminClient`](../src/lib/supabase/admin.ts) (service role — bypasses RLS; server-only, never importable from a client component), under a key of `{orderId}-{timestamp}.{ext}`, and resolves its public URL.
2. In one Prisma transaction: creates the `ProofOfDelivery` row (`photoUrl`, `recipientName`, `notes`), stamps `Delivery.deliveredAt`, then calls `transitionOrderStatusInTx` to move the order to `DELIVERED` — reusing the same validation/audit-trail/rider-freeing logic `PATCH /status` uses, rather than duplicating it.

**Errors**
- `401 Unauthorized` — no session.
- `403 Forbidden` — role/ownership check failed.
- `404 Not Found` — order doesn't exist or is soft-deleted.
- `409 Conflict` — order isn't `IN_TRANSIT`, or has no linked delivery.
- `400 Bad Request` — missing/empty `photo`, or the transaction failed (e.g. an invalid state transition raced with another request).
- `500 Internal Server Error` — the Storage upload itself failed.

### 🟢 `POST /api/orders/:id/rating`

Submits the customer's rating for a delivered order. **This is also the only way an order reaches `COMPLETED`** — rating and completion happen atomically together; that wasn't explicit in the original contract but is how it's actually built.

- **File**: `src/app/api/orders/[id]/rating/route.ts`
- **Role**: `CUSTOMER`, and only for their own order (`order.customerId` must match).

**Request body**
```json
{ "rating": 4, "comment": "Great service (optional)" }
```
`rating` must be an integer `1`–`5`. `comment` is optional.

**Preconditions**
- Order must exist, not be soft-deleted, and belong to the requesting customer — `404`/`403` otherwise.
- Order must currently be `DELIVERED` — `409 Conflict` otherwise. Since submitting a rating always advances the order to `COMPLETED` in the same transaction, this also naturally blocks rating the same order twice in the normal sequential case (the second attempt finds the order already `COMPLETED`, not `DELIVERED`).

**Response — `201`**
```json
{ "rating": { "...": "CustomerRating row" }, "order": { "...": "updated Order row, now COMPLETED" } }
```

**Business logic** — in one Prisma transaction:
1. Creates the `CustomerRating` row (`orderId`, `customerId`, `riderId` — taken from `delivery.riderId`, `rating`, `comment`).
2. Calls `transitionOrderStatusInTx` to move the order `DELIVERED → COMPLETED` — reusing the same shared transition logic as `PATCH /status` and the proof route, not duplicated here.
3. Increments the assigned rider's `completedDeliveries` by 1.
4. Recomputes the rider's `averageRating` as the **true average** across all their `CustomerRating` rows (a fresh `aggregate` query inside the same transaction, not an incremental running approximation) — this correctly sees the row just created in step 1, since it's the same transaction.

**Errors**
- `401 Unauthorized` — no session.
- `403 Forbidden` — not a customer, or not this order's customer.
- `404 Not Found` — order doesn't exist or is soft-deleted.
- `409 Conflict` — order isn't `DELIVERED`, has no assigned rider, or (defense-in-depth against a genuine race — two concurrent submissions both passing the `DELIVERED` check before either commits) the `CustomerRating.orderId` unique constraint was violated. That last case is caught explicitly (`P2002`) and returned as a clean `"This order has already been rated"` rather than a raw Prisma error/`500`.
- `400 Bad Request` — `rating` missing or outside `1`–`5`.

---

## 2. Rider Locations

### 🟢 `POST /api/rider-locations`

Records one GPS ping from the rider currently sharing their live location. Feeds the real-time tracking map on `/orders/:id/track` via Supabase Realtime (`postgres_changes` on `RiderLocation` INSERTs), not through this route directly — this endpoint only writes the row.

- **File**: `src/app/api/rider-locations/route.ts`
- **Role**: `RIDER` only.

**Request body**
```json
{ "lat": 6.45, "lng": 3.39, "heading": 90, "speed": 5 }
```
`lat`/`lng` required numbers. `heading`/`speed` optional numbers.

**Preconditions**: the rider must have **exactly one** non-deleted `Delivery` whose order is currently `IN_TRANSIT` — checked via `findMany`, not `findFirst`, specifically so a data anomaly (two simultaneous active deliveries for one rider, which the normal assign/status flow should never produce) fails loud instead of silently picking one. `0` or `>1` both return `409`.

**Response — `201`**: the created `RiderLocation` row.

**Errors**
- `401 Unauthorized` — no session.
- `403 Forbidden` — not a rider.
- `409 Conflict` — rider doesn't have exactly one active `IN_TRANSIT` delivery.
- `400 Bad Request` — `lat`/`lng` missing or not numbers.

**Infrastructure this depends on, not just app code** — see migration `20260710170738_add_riderlocation_realtime_rls`:
- `RiderLocation` must be added to the `supabase_realtime` publication for `postgres_changes` to fire at all.
- RLS is enabled on `RiderLocation` with a policy scoping `SELECT` to: the rider themselves, or the customer of an order currently `IN_TRANSIT` and assigned to that rider — evaluated through a `SECURITY DEFINER` `plpgsql` function (`public.can_view_rider_location`), since the `authenticated` role has no direct grants on `Rider`/`User`/`Delivery`/`Order`/`Customer` (all business data normally only goes through the Next.js API layer). Without this, Realtime would silently deliver nothing to any subscriber — no error, just no events, ever.
- The function is `plpgsql`, not `sql`, specifically so the migration stays replayable against a plain Postgres shadow/test database that has no `auth` schema (`prisma migrate dev`/`reset` use one) — `sql`-language functions are validated at `CREATE FUNCTION` time and would fail immediately on a database without `auth.uid()`; `plpgsql` compiles lazily on first call, which only ever happens against a real Supabase database.

---

## 3. Zones & Pricing

### 🟢 `GET /api/zones`

Lists all delivery zones. Deliberately **not** admin-only — customers need this list to populate the zone `<select>` on the order request form.

- **File**: `src/app/api/zones/route.ts`
- **Role**: any authenticated user.

**Response — `200`**: array of `DeliveryZone` rows, ordered by `name`.

**Errors**
- `401 Unauthorized` — no session.

### 🟢 `POST /api/zones`

Creates a delivery zone.

- **File**: `src/app/api/zones/route.ts`
- **Role**: `ADMIN` only.

**Request body**
```json
{ "name": "Lagos Mainland", "baseFee": 300 }
```

**Response — `201`**: the created `DeliveryZone` row.

**Note on `DeliveryZone.baseFee` vs `PricingRule.baseFee`**: these are two separate fields in the schema. `DeliveryZone.baseFee` is a nominal/reference figure shown in the admin UI; the base fee actually used in `calculatePrice` comes from the zone's `PricingRule.baseFee` (§below), not this field. They aren't kept in sync automatically — an admin can set them to different values, and only the `PricingRule` one affects real order pricing.

**Errors**
- `401 Unauthorized` — no session.
- `403 Forbidden` — not an admin.
- `400 Bad Request` — missing/invalid `name` or `baseFee`.
- `409 Conflict` — a zone with this `name` already exists (`DeliveryZone.name` is `@unique`).

### 🟢 `PATCH /api/zones/:id`

Updates a zone's `name` and/or `baseFee`. Partial — send only the fields you want to change.

- **File**: `src/app/api/zones/[id]/route.ts`
- **Role**: `ADMIN` only.

**Response — `200`**: the updated `DeliveryZone` row.

**Errors**
- `401 Unauthorized` — no session.
- `403 Forbidden` — not an admin.
- `400 Bad Request` — invalid field types, or an empty body (nothing to update).
- `404 Not Found` — zone doesn't exist.
- `409 Conflict` — the new `name` collides with an existing zone.

### 🟢 `GET /api/pricing-rules`

Lists all pricing rules, each with its `zone` included (`null` for the global default rule).

- **File**: `src/app/api/pricing-rules/route.ts`
- **Role**: `ADMIN` only.

**Response — `200`**: array of `PricingRule` rows (with `zone`), newest first.

**Errors**
- `401 Unauthorized` — no session.
- `403 Forbidden` — not an admin.

### 🟢 `POST /api/pricing-rules`

Creates a pricing rule for a zone (or the global default, if `zoneId` is `null`).

- **File**: `src/app/api/pricing-rules/route.ts`
- **Role**: `ADMIN` only.

**Request body**
```json
{ "zoneId": "...", "baseFee": 700, "perKmRate": 120, "weightSurchargeRate": 60, "isActive": true }
```
`zoneId` required — a string, or `null` for the global default rule. `baseFee` required. `perKmRate`/`weightSurchargeRate` optional (default `null` — see `calculatePrice`'s formula, §1). `isActive` optional (defaults `true`, matching the schema default).

**Response — `201`**: the created `PricingRule` row (with `zone`).

**No uniqueness enforcement**: nothing stops an admin from creating a second active rule for the same zone — `calculatePrice`'s `findFirst` would then pick one with no defined tiebreak. The admin UI (`/admin/zones`) avoids this in practice by only ever showing a "create" form when a zone has no rule yet, and an "edit" (`PATCH`) form once one exists, but the API itself doesn't guard against it.

**Errors**
- `401 Unauthorized` — no session.
- `403 Forbidden` — not an admin.
- `400 Bad Request` — missing/invalid `zoneId` or `baseFee`.
- `404 Not Found` — `zoneId` given but no zone with that id exists.

### 🟢 `PATCH /api/pricing-rules/:id`

Updates a pricing rule — e.g. toggling `isActive`, or changing rates. Partial — send only the fields you want to change.

- **File**: `src/app/api/pricing-rules/[id]/route.ts`
- **Role**: `ADMIN` only.

**Response — `200`**: the updated `PricingRule` row (with `zone`).

**Errors**
- `401 Unauthorized` — no session.
- `403 Forbidden` — not an admin.
- `400 Bad Request` — invalid field types, or an empty body.
- `404 Not Found` — rule doesn't exist.

---

## 4. Admin

### 🟢 `GET /api/admin/dashboard`

Returns the operational stats shown on the `/admin/dashboard` page. Note the page itself doesn't call this route — it calls `getDashboardStats()` directly from the server component to avoid a self-referential HTTP round trip. This endpoint exists for any other client (future mobile app, external tooling) that needs the same data over HTTP.

- **File**: `src/app/api/admin/dashboard/route.ts`
- **Role**: `ADMIN` only.

**Response — `200`**
```json
{
  "activeDeliveries": 0,
  "pendingDeliveries": 0,
  "completedToday": 0,
  "failedDeliveries": 0,
  "availableRiders": 1,
  "ridersDelivering": 0,
  "revenueToday": 0,
  "avgDeliveryTimeMinutes": 34.79
}
```

All figures come from [`getDashboardStats()`](../src/lib/services/dashboard-service.ts), computed as parallel Prisma queries (not cached):

| Field | Meaning |
|---|---|
| `activeDeliveries` | Count of non-deleted orders with status in `ASSIGNED`, `RIDER_ACCEPTED`, `PICKED_UP`, `IN_TRANSIT`. |
| `pendingDeliveries` | Count of non-deleted orders with status `PENDING`. |
| `completedToday` | Count of non-deleted orders with status `DELIVERED` or `COMPLETED` whose `updatedAt` falls on or after local midnight (server timezone) today. |
| `failedDeliveries` | Count of non-deleted orders with status `DELIVERY_FAILED` or `RETURNED_TO_SENDER`. |
| `availableRiders` | Count of non-deleted riders with `availability: "AVAILABLE"`. |
| `ridersDelivering` | Count of non-deleted riders with `availability: "BUSY"`. |
| `revenueToday` | Sum of `Order.price` for the same "delivered/completed today" set as `completedToday`; `0` if none. |
| `avgDeliveryTimeMinutes` | Average of `(Delivery.deliveredAt − Delivery.assignedAt)` in minutes, across non-deleted deliveries where both timestamps are set. `null` if no delivery has both timestamps yet (never `NaN`/divide-by-zero). |

**Errors**
- `401 Unauthorized` — no session.
- `403 Forbidden` — not an admin.

---

## 5. Users

### 🟢 `POST /api/users/bootstrap`

Creates the `User` (+ linked `Customer`) row for a Supabase-authenticated identity that doesn't have one yet. Called by the signup flow immediately after `supabase.auth.signUp`.

- **File**: `src/app/api/users/bootstrap/route.ts`
- **Role**: any authenticated Supabase session (no Prisma `User` row required — that's the point of this endpoint).

**Request body**
```json
{ "name": "string (required unless the user already exists)" }
```

**Response**
- `200` — a `User` row (with `customer` included) already existed for this `supabaseId`; returned as-is, **idempotently**. The request body is ignored in this case, even if `name` differs from what's on file.
- `201` — newly created `User` (with `customer` included).

**Security invariant**: `role` is **hardcoded to `"CUSTOMER"`** in the create path — it is never read from the request body. There is no way to self-assign `ADMIN` or `RIDER` through this endpoint, by design.

**Errors**
- `401 Unauthorized` — no Supabase session.
- `400 Bad Request` — `name` missing/blank (only reached on first bootstrap for a given identity).

### 🟢 `POST /api/riders/bootstrap`

The rider-signup counterpart to `POST /api/users/bootstrap` above — same idempotency pattern, same "role is hardcoded, never client-supplied" invariant, but creates a `User` (role `RIDER`) + linked `Rider` instead of a `Customer`. Called by `src/app/rider-signup/page.tsx` immediately after `supabase.auth.signUp`.

- **File**: `src/app/api/riders/bootstrap/route.ts`
- **Role**: any authenticated Supabase session (same reasoning as `/api/users/bootstrap`).

**Request body**
```json
{ "name": "string (required unless the rider already exists)", "vehicleType": "BIKE | VAN | TRUCK" }
```

**Response**
- `200` — an existing `User` (with `rider`) for this `supabaseId`; returned as-is, idempotently. The request body is ignored in this case.
- `201` — newly created `User` (with `rider`).

**Security invariants**:
- `role` is hardcoded to `"RIDER"` — never read from the request body.
- `Rider.availability` is hardcoded to `"OFFLINE"` — a self-signed-up rider cannot immediately receive assignments. There is currently no in-app approval workflow to flip this to `AVAILABLE`; an admin does it directly (Prisma Studio, or a future admin action) after reviewing the rider on `/admin/riders`.

**Errors**
- `401 Unauthorized` — no Supabase session.
- `400 Bad Request` — `name` missing/blank, or `vehicleType` missing/not one of `BIKE`/`VAN`/`TRUCK` (only reached on first bootstrap for a given identity).

---

## 6. Authentication

There is no `/api/auth/*` surface. Sign-in and sign-up are handled **directly** by the Supabase Auth browser client (`createSupabaseBrowserClient` in `src/lib/supabase/client.ts`) from `src/app/login/page.tsx`, `src/app/signup/page.tsx`, and `src/app/rider-signup/page.tsx` — consistent with the architecture rule that Supabase is the infrastructure layer (auth is infrastructure, not a FleetFlow business operation). Signup additionally calls `POST /api/users/bootstrap` (customers) or `POST /api/riders/bootstrap` (riders) right after `supabase.auth.signUp` succeeds, to create the corresponding Prisma row. Customers land on `/request`; riders land on `/rider-signup/pending`, since a freshly self-signed-up rider is `OFFLINE` and can't work yet.

---

## 7. Not Yet Built

Present in the Prisma schema and/or referenced in planning docs, but with no route (or, in some cases, no UI) yet:

| Area | Status | Notes |
|---|---|---|
| `/api/orders/:id` (single order `GET`) | 🟡 | Pages that need one order's data query Prisma directly in a server component instead. |
| Notifications | 🟡 | `Notification` model exists; no route, no `NotificationService` (deliberately deferred per `CLAUDE.md`). |
| Customer-initiated cancellation | 🟡 | The state machine supports `CANCELLED` from `PENDING`/`ASSIGNED`/`RIDER_ACCEPTED`, but `PATCH /status` currently returns a flat `403` for any `CUSTOMER` caller regardless of target status — there's no authorized path for a customer to cancel their own order yet. |
| Fragmented per-action endpoints (`/accept`, `/reject`, `/pickup`, ...) | — | Not a gap — deliberately rejected in favor of the single `PATCH /status` endpoint. |
