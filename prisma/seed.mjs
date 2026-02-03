import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cheeses = [
  {
    name: "Sakura",
    origin: "Hokkaido, Japan",
    description: "Cherry blossom infused soft cheese made from Jersey milk.",
    agingDays: 10,
  },
  {
    name: "Iberico",
    origin: "Spain",
    description: "Semi-hard blended milk cheese with nutty flavors.",
    agingDays: 60,
  },
  {
    name: "Gouda Reserve",
    origin: "Netherlands",
    description: "Caramel-like aged Gouda with crunchy tyrosine crystals.",
    agingDays: 365,
  },
];

async function main() {
  for (const cheese of cheeses) {
    await prisma.cheese.upsert({
      where: { name: cheese.name },
      update: cheese,
      create: cheese,
    });
  }

  console.log(`Seeded ${cheeses.length} cheeses ✅`);
}

main()
  .catch((error) => {
    console.error("Seeding failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
