import { prisma } from "../src/lib/prisma";

// Placeholder rates for testing the pricing engine — not real business
// pricing. Replace via the (not-yet-built) pricing admin UI before this
// matters outside of dev/test.
async function main() {
  const rule = await prisma.pricingRule.create({
    data: {
      zoneId: null,
      baseFee: 500,
      perKmRate: 100,
      weightSurchargeRate: 50,
      isActive: true,
    },
  });

  console.log("Created pricing rule:", rule);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
