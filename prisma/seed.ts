import prisma from "@/lib/prisma";
import "dotenv/config";
import { seedSports } from "./seeds/sports";


async function main() {
  console.log("🌱 Resetting database...");

  await prisma.sport.deleteMany();

  console.log("✅ Database reset");

  // Seed in correct order
  console.log("\n📦 Starting seeding...");
  await seedSports();

  console.log("\n✅ Seeding completed successfully!");
}

// Run script
main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
