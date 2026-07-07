import { prisma } from "../src/lib/prisma";

async function main() {
  const supabaseId = "a504434e-a656-4001-9ea9-f2c35206227f"
  const user = await prisma.user.create({
    data: {
      supabaseId,
      email: "test@fleetflow.com",
      name: "Test Customer",
      role: "CUSTOMER",
    },
  });

  const customer = await prisma.customer.create({
    data: { userId: user.id },
  });

  console.log("Created user:", user);
  console.log("Created customer:", customer);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
