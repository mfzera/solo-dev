/**
 * Creates or updates the admin user in the database.
 * Usage: cd apps/api && npm run setup-admin
 *
 * Set ADMIN_EMAIL and ADMIN_PASSWORD in apps/api/.env before running.
 */

import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { users } from "../src/db/schema.js";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file first.");
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

const passwordHash = await bcrypt.hash(password, 12);

const [existing] = await db
  .select({ id: users.id })
  .from(users)
  .where(eq(users.email, email.toLowerCase()));

if (existing) {
  await db.update(users).set({ passwordHash }).where(eq(users.email, email.toLowerCase()));
  console.log(`Admin user updated: ${email}`);
} else {
  await db.insert(users).values({
    id: createId(),
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date(),
  });
  console.log(`Admin user created: ${email}`);
}

await client.end();
