import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index.js";
import { quickCaptures, tasks, activityLogs } from "../db/schema.js";
import { eq, isNull, asc, desc, and } from "drizzle-orm";
import { ok, err } from "../response.js";
import { createId } from "@paralleldrive/cuid2";
import type { AppEnv } from "../types.js";

const CreateCaptureSchema = z.object({
  text: z.string().min(1),
});

export const capturesRouter = new Hono<AppEnv>()
  // GET /captures — unpromoted captures (limit 20)
  .get("/", async (c) => {
    const userId = c.get("userId");
    const limit = Number(c.req.query("limit") ?? 20);
    const captures = await db
      .select()
      .from(quickCaptures)
      .where(and(eq(quickCaptures.userId, userId), isNull(quickCaptures.promotedToTaskId)))
      .orderBy(desc(quickCaptures.createdAt))
      .limit(limit);

    return ok(c, captures.map(cap => ({
      id: cap.id,
      text: cap.text,
      createdAt: cap.createdAt?.toISOString() ?? new Date().toISOString(),
      promotedToTaskId: cap.promotedToTaskId,
    })));
  })

  // POST /captures
  .post("/", zValidator("json", CreateCaptureSchema), async (c) => {
    const userId = c.get("userId");
    const { text } = c.req.valid("json");
    const id = createId();
    const now = new Date();
    await db.insert(quickCaptures).values({ id, userId, text, createdAt: now });

    const [created] = await db.select().from(quickCaptures).where(eq(quickCaptures.id, id));
    return ok(c, {
      id: created.id,
      text: created.text,
      createdAt: created.createdAt?.toISOString() ?? now.toISOString(),
      promotedToTaskId: created.promotedToTaskId,
    }, undefined, 201);
  })

  // POST /captures/:id/promote — turn capture into a task
  .post("/:id/promote", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const [capture] = await db.select().from(quickCaptures).where(and(eq(quickCaptures.id, id), eq(quickCaptures.userId, userId)));
    if (!capture) return err(c, "Capture not found", 404);
    if (capture.promotedToTaskId) return err(c, "Capture already promoted", 409);

    const existing = await db
      .select({ sortOrder: tasks.sortOrder })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.status, "ideas")))
      .orderBy(asc(tasks.sortOrder));

    const maxOrder = existing.length > 0 ? existing[existing.length - 1].sortOrder : -1;

    const taskId = createId();
    const now = new Date();
    await db.insert(tasks).values({
      id: taskId,
      userId,
      title: capture.text,
      status: "ideas",
      sortOrder: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });

    await db.update(quickCaptures).set({ promotedToTaskId: taskId }).where(eq(quickCaptures.id, id));
    await db.insert(activityLogs).values({ id: createId(), userId, action: "created", occurredAt: now });

    return ok(c, { captureId: id, taskId });
  })

  // DELETE /captures/:id
  .delete("/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const [existing] = await db.select().from(quickCaptures).where(and(eq(quickCaptures.id, id), eq(quickCaptures.userId, userId)));
    if (!existing) return err(c, "Capture not found", 404);
    await db.delete(quickCaptures).where(and(eq(quickCaptures.id, id), eq(quickCaptures.userId, userId)));
    return ok(c, { id });
  });
