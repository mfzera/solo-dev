import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index.js";
import { tagConfigs } from "../db/schema.js";
import { eq, ne, and, asc } from "drizzle-orm";
import { ok, err } from "../response.js";
import { createId } from "@paralleldrive/cuid2";
import type { AppEnv } from "../types.js";

const TagSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
});

export const tagsRouter = new Hono<AppEnv>()
  // GET /tags
  .get("/", async (c) => {
    const userId = c.get("userId");
    const tags = await db.select().from(tagConfigs).where(eq(tagConfigs.userId, userId)).orderBy(asc(tagConfigs.sortOrder));
    return ok(c, tags);
  })

  // POST /tags
  .post("/", zValidator("json", TagSchema), async (c) => {
    const userId = c.get("userId");
    const { name, color } = c.req.valid("json");
    const trimmed = name.trim().toLowerCase();

    const [existing] = await db.select().from(tagConfigs).where(and(eq(tagConfigs.userId, userId), eq(tagConfigs.name, trimmed)));
    if (existing) return err(c, "Tag already exists", 409);

    const all = await db.select({ sortOrder: tagConfigs.sortOrder }).from(tagConfigs).where(eq(tagConfigs.userId, userId)).orderBy(asc(tagConfigs.sortOrder));
    const maxOrder = all.length > 0 ? all[all.length - 1].sortOrder : -1;

    const id = createId();
    const now = new Date();
    await db.insert(tagConfigs).values({ id, userId, name: trimmed, color, sortOrder: maxOrder + 1, createdAt: now });

    const [created] = await db.select().from(tagConfigs).where(eq(tagConfigs.id, id));
    return ok(c, created, undefined, 201);
  })

  // PATCH /tags/:id
  .patch("/:id", zValidator("json", TagSchema.partial()), async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const [existing] = await db.select().from(tagConfigs).where(and(eq(tagConfigs.id, id), eq(tagConfigs.userId, userId)));
    if (!existing) return err(c, "Tag not found", 404);

    if (body.name) {
      const trimmed = body.name.trim().toLowerCase();
      const [dup] = await db
        .select()
        .from(tagConfigs)
        .where(and(eq(tagConfigs.userId, userId), eq(tagConfigs.name, trimmed), ne(tagConfigs.id, id)));
      if (dup) return err(c, "Tag already exists", 409);
      body.name = trimmed;
    }

    await db.update(tagConfigs).set(body).where(and(eq(tagConfigs.id, id), eq(tagConfigs.userId, userId)));
    const [updated] = await db.select().from(tagConfigs).where(eq(tagConfigs.id, id));
    return ok(c, updated);
  })

  // DELETE /tags/:id
  .delete("/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const [existing] = await db.select().from(tagConfigs).where(and(eq(tagConfigs.id, id), eq(tagConfigs.userId, userId)));
    if (!existing) return err(c, "Tag not found", 404);
    await db.delete(tagConfigs).where(and(eq(tagConfigs.id, id), eq(tagConfigs.userId, userId)));
    return ok(c, { id });
  });
