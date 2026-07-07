# FleetFlow — Folder Structure

This reflects the actual repository layout as of this writing (Phase 4, customer/admin/rider flows built). Per `CLAUDE.md`, this structure is **frozen — don't reorganize without a real reason.**

```
fleetflow/
├── docs/                          # This directory
│   ├── product-doc.md
│   ├── api-contract.md
│   ├── openapi.yaml
│   └── folder-structure.md
│
├── prisma/
│   ├── schema.prisma               # Source of truth for the data model (v1.2)
│   └── migrations/
│       ├── migration_lock.toml
│       └── 20260707083415_init/
│           └── migration.sql
├── prisma.config.ts                # Prisma 7 config (datasource URL, migrations path) — schema.prisma no longer declares the DB URL directly
│
├── scripts/
│   └── seed-test-user.ts           # Ad-hoc dev seeding script, run via `npx tsx`
│
├── src/
│   ├── app/                        # Next.js App Router — routes, layouts, API handlers
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Root page ("/")
│   │   ├── globals.css
│   │   │
│   │   ├── (customer)/              # Route group — customer-facing pages, no URL segment added
│   │   │   └── request/
│   │   │       └── page.tsx         # "/request" — order request form
│   │   ├── orders/
│   │   │   └── page.tsx             # "/orders" — customer's own order list + status timeline
│   │   ├── login/
│   │   │   └── page.tsx             # "/login"
│   │   ├── signup/
│   │   │   └── page.tsx             # "/signup"
│   │   │
│   │   ├── admin/
│   │   │   └── orders/
│   │   │       └── page.tsx         # "/admin/orders" — dispatch console, rider assignment
│   │   ├── rider/
│   │   │   └── jobs/
│   │   │       └── page.tsx         # "/rider/jobs" — active jobs assigned to the current rider
│   │   │
│   │   └── api/                     # Route Handlers (server-side mutations + the one collection GET)
│   │       ├── orders/
│   │       │   ├── route.ts         # POST /api/orders, GET /api/orders
│   │       │   └── [id]/
│   │       │       ├── assign/
│   │       │       │   └── route.ts # POST /api/orders/:id/assign
│   │       │       └── status/
│   │       │           └── route.ts # PATCH /api/orders/:id/status
│   │       └── users/
│   │           └── bootstrap/
│   │               └── route.ts     # POST /api/users/bootstrap
│   │
│   ├── components/                 # Client components, grouped by which persona/page owns them
│   │   ├── customer/
│   │   │   └── OrderRequestForm.tsx
│   │   ├── admin/
│   │   │   └── AssignRiderControl.tsx
│   │   └── rider/
│   │       └── OrderStatusControl.tsx
│   │
│   └── lib/
│       ├── prisma.ts                # Prisma Client singleton (driver adapter: @prisma/adapter-pg)
│       ├── auth/
│       │   └── get-current-user.ts  # getCurrentUser / requireUser / requireRole — the ONLY place role is derived
│       ├── services/
│       │   ├── order-state-machine.ts # Valid OrderStatus transition graph
│       │   └── order-service.ts       # transitionOrderStatus, assignRiderToOrder — the ONLY writers of Order.status
│       └── supabase/
│           ├── client.ts            # createSupabaseBrowserClient (browser-side auth calls)
│           └── server.ts            # createSupabaseServerClient (server-side session reads)
│
├── public/                          # Static assets (default create-next-app content)
├── CLAUDE.md                        # Enforced project conventions (this file's authority)
├── AGENTS.md                        # Notes this Next.js version has non-standard/breaking-change behavior
├── README.md
├── tailwind.config.ts                # Design system tokens — the single source of truth for colors/fonts
├── next.config.ts
├── eslint.config.mjs
├── postcss.config.mjs
├── tsconfig.json
├── package.json
└── .env                              # Not committed (see .gitignore) — Supabase keys, DATABASE_URL
```

## Naming/organization conventions actually in use

- **Route groups** (`(customer)`) are used to logically namespace customer pages without adding a URL segment.
- **API routes mirror the resource hierarchy**: `/api/orders/[id]/assign` and `/api/orders/[id]/status` are nested under the order they act on, not flattened into `/api/assign-order` etc.
- **Components are grouped by the persona/page that owns them** (`components/customer/`, `components/admin/`, `components/rider/`), mirroring the `app/` structure, not by component "type" (no `components/buttons/`, `components/forms/`, etc.).
- **`lib/services/`** holds the business-logic layer that owns writes to shared, audited state (order status). This is deliberately separate from `lib/auth/` (identity/role) and `lib/supabase/` (raw infra clients).

## Patterns intentionally **not** present yet

Per the architecture decisions in `CLAUDE.md` — these are absences by design, not oversights, and shouldn't be added speculatively:

- **`src/repositories/`** — doesn't exist and isn't planned. Prisma is already the data access abstraction; a repository layer on top of it was explicitly rejected.
- **`NotificationService` / `RecommendationService`** — no such files under `lib/services/`. Don't stub these out ahead of the features that need them; recommendation scoring is Phase 5.5, not before.
- **`src/lib/cache/` or any Redis integration** — not present. Trigger condition to revisit: dashboard queries measurably slow down at real order/rider volume.
- **A background job runner** (`src/jobs/`, Trigger.dev/Inngest/BullMQ config, etc.) — not present. Trigger condition to revisit: synchronous request latency becomes a measured problem.
- **`Company`/`Organization` models or any multi-tenancy scaffolding** — not present. Single-tenant by design for v1.
- **Fragmented order-action routes** (`/api/orders/:id/accept`, `/reject`, `/pickup`, ...) — deliberately not built; all transitions go through the single `PATCH /api/orders/:id/status`.

## One structural gap, not covered by a `CLAUDE.md` decision

- **No `middleware.ts`.** There is no centralized Next.js middleware doing role-based route protection. Every protected server component (`/admin/orders`, `/rider/jobs`, `/orders`) and API route currently re-derives the role itself, per-request, via `getCurrentUser()`/`requireUser()`. This satisfies the letter of the "always re-derive role from Prisma" rule, but there's no single choke point — a new protected page added without remembering to call `getCurrentUser()` would silently have no protection. Worth a deliberate decision (add `middleware.ts` for UX-level redirects, or keep relying on per-page checks) rather than an accident of omission.
