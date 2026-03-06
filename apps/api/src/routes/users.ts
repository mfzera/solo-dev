import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { ok, err } from "../response.js";
import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";

const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

const GetUserSchema = z.object({
  id: z.string().optional(),
  email: z.string().email().optional(),
});

export const usersRouter = new Hono()
  // GET /users/profile?id=<id>&email=<email>
  .get("/profile", zValidator("query", GetUserSchema), async (c) => {
    const { id, email } = c.req.valid("query");

    let user;
    if (id) {
      [user] = await db
        .select({ id: users.id, email: users.email, name: users.name, bio: users.bio, avatarUrl: users.avatarUrl, createdAt: users.createdAt })
        .from(users)
        .where(eq(users.id, id));
    } else if (email) {
      [user] = await db
        .select({ id: users.id, email: users.email, name: users.name, bio: users.bio, avatarUrl: users.avatarUrl, createdAt: users.createdAt })
        .from(users)
        .where(eq(users.email, email));
    } else {
      return err(c, "Either id or email query param required");
    }

    if (!user) return err(c, "User not found", 404);
    return ok(c, { ...user, createdAt: user.createdAt?.toISOString() ?? null });
  })

  // PATCH /users/profile
  .patch("/profile", zValidator("json", UpdateProfileSchema.extend({ id: z.string() })), async (c) => {
    const { id, ...data } = c.req.valid("json");
    const [existing] = await db.select().from(users).where(eq(users.id, id));
    if (!existing) return err(c, "User not found", 404);

    const updateData: Partial<typeof users.$inferInsert> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

    await db.update(users).set(updateData).where(eq(users.id, id));
    const [updated] = await db
      .select({ id: users.id, email: users.email, name: users.name, bio: users.bio, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, id));

    return ok(c, updated);
  })

  // POST /users/verify — validate credentials (used by NextAuth)
  .post("/verify", zValidator("json", z.object({
    email: z.string().email(),
    password: z.string().min(1),
  })), async (c) => {
    const { email, password } = c.req.valid("json");
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (!user || !user.passwordHash) return err(c, "Invalid credentials", 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return err(c, "Invalid credentials", 401);

    return ok(c, { id: user.id, email: user.email, name: user.name });
  })

  // POST /users/upsert — upsert OAuth user (used by NextAuth signIn callback)
  .post("/upsert", zValidator("json", z.object({
    email: z.string().email(),
    name: z.string().nullable().optional(),
    avatarUrl: z.string().nullable().optional(),
  })), async (c) => {
    const { email, name, avatarUrl } = c.req.valid("json");
    const now = new Date();

    const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (existing) {
      await db.update(users).set({
        name: name ?? existing.name,
        avatarUrl: avatarUrl ?? existing.avatarUrl,
      }).where(eq(users.id, existing.id));
      return ok(c, { id: existing.id });
    }

    const id = createId();
    await db.insert(users).values({ id, email: email.toLowerCase(), name: name ?? null, avatarUrl: avatarUrl ?? null, createdAt: now });
    return ok(c, { id }, undefined, 201);
  });
