import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.weeklyPlanEntry.deleteMany();
  await prisma.quickCapture.deleteMany();
  await prisma.task.deleteMany();
  await prisma.tagConfig.deleteMany();

  // --- DEFAULT TAGS ---
  await prisma.tagConfig.createMany({
    data: [
      { name: "frontend", color: "#4ade80", sortOrder: 0 },
      { name: "backend",  color: "#60a5fa", sortOrder: 1 },
      { name: "infra",    color: "#a78bfa", sortOrder: 2 },
      { name: "bug",      color: "#f87171", sortOrder: 3 },
      { name: "auth",     color: "#fb923c", sortOrder: 4 },
    ],
  });

  console.log("Seed complete — default tags created.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
