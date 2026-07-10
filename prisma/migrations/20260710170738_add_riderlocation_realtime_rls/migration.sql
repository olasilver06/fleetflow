-- Enables Supabase Realtime postgres_changes delivery for RiderLocation and
-- makes it actually reach clients: RLS was already enabled on this table
-- with zero policies and no baseline SELECT grant, which meant Realtime
-- would silently deliver nothing to any authenticated/anon subscriber.
--
-- Visibility is scoped to: the rider themselves, or the customer of an
-- order currently IN_TRANSIT and assigned to that rider. Not a blanket
-- "any authenticated user can see every rider's location" grant.
--
-- The publication check is guarded on the publication itself existing —
-- `supabase_realtime` is a Supabase-platform object, not something a plain
-- shadow/test Postgres database (used by `prisma migrate dev`/`reset`) has,
-- so this stays replayable outside a real Supabase-provisioned database.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'RiderLocation'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE "RiderLocation";
    END IF;
  END IF;
END $$;

GRANT SELECT ON "RiderLocation" TO authenticated;

-- SECURITY DEFINER because `authenticated` has no grants on Rider/User/
-- Delivery/Order/Customer (all business data is normally only reachable
-- through the Next.js API layer, per this project's architecture rules) —
-- a plain RLS USING clause referencing those tables directly would fail
-- with "permission denied" at query time. This function runs with the
-- privileges of its owner (the migration role, which owns those tables)
-- and only ever returns a boolean, so it doesn't widen access to anything
-- beyond "can this caller see this one rider's location or not".
--
-- LANGUAGE plpgsql (not sql) deliberately: it's compiled lazily on first
-- call rather than validated at CREATE FUNCTION time, so this migration
-- stays replayable in a plain Postgres shadow/test database that has no
-- `auth` schema at all — `auth.uid()` only needs to exist once this
-- function is actually invoked, which only ever happens against a real
-- Supabase-provisioned database.
CREATE OR REPLACE FUNCTION public.can_view_rider_location(target_rider_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "Rider" r
    JOIN "User" ru ON ru."id" = r."userId"
    WHERE r."id" = target_rider_id
      AND ru."supabaseId" = auth.uid()::text
  )
  OR EXISTS (
    SELECT 1 FROM "Delivery" d
    JOIN "Order" o ON o."id" = d."orderId"
    JOIN "Customer" c ON c."id" = o."customerId"
    JOIN "User" cu ON cu."id" = c."userId"
    WHERE d."riderId" = target_rider_id
      AND o."status" = 'IN_TRANSIT'
      AND cu."supabaseId" = auth.uid()::text
  );
END;
$$;

CREATE POLICY "rider_locations_visible_to_rider_and_active_customer"
ON "RiderLocation"
FOR SELECT
TO authenticated
USING (public.can_view_rider_location("RiderLocation"."riderId"));
