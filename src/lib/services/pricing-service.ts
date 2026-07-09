import { prisma } from "@/lib/prisma";

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export async function calculatePrice({
  zoneId,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  weightKg,
}: {
  zoneId?: string | null;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  weightKg?: number | null;
}) {
  const rule = await prisma.pricingRule.findFirst({
    where: { zoneId: zoneId ?? null, isActive: true },
  });

  if (!rule) {
    throw new Error("No active pricing rule configured");
  }

  const distanceKm = haversineDistanceKm(pickupLat, pickupLng, dropoffLat, dropoffLng);
  const distanceCost = distanceKm * (rule.perKmRate ?? 0);
  const weightSurcharge =
    weightKg && rule.weightSurchargeRate ? weightKg * rule.weightSurchargeRate : 0;

  const price = Math.round(rule.baseFee + distanceCost + weightSurcharge);

  return {
    price,
    distanceKm,
    breakdown: {
      baseFee: rule.baseFee,
      distanceCost,
      weightSurcharge,
    },
  };
}
