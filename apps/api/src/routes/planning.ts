import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index.js";
import { weeklyPlanEntries } from "../db/schema.js";
import { eq, and, gte, lt, asc } from "drizzle-orm";
import { ok, err } from "../response.js";
import { createId } from "@paralleldrive/cuid2";

function getMondayOfCurrentWeek(): Date {
  const now = new Date();
  const monday = new Date(now);
  const dow = monday.getDay();
  monday.setDate(monday.getDate() - dow + (dow === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

const CreatePlanEntrySchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  taskTitle: z.string().min(1),
  taskId: z.string().nullable().optional(),
});

export const planningRouter = new Hono()
  // GET /planning — entries for current week (or ?weekStart=ISO)
  .get("/", async (c) => {
    const weekStartParam = c.req.query("weekStart");
    const monday = weekStartParam ? new Date(weekStartParam) : getMondayOfCurrentWeek();
    const nextMonday = new Date(monday);
    nextMonday.setDate(nextMonday.getDate() + 7);

    const entries = await db
      .select()
      .from(weeklyPlanEntries)
      .where(
        and(
          gte(weeklyPlanEntries.weekStart, monday),
          lt(weeklyPlanEntries.weekStart, nextMonday),
        ),
      )
      .orderBy(asc(weeklyPlanEntries.dayOfWeek), asc(weeklyPlanEntries.sortOrder));

    return ok(c, entries.map(e => ({
      id: e.id,
      dayOfWeek: e.dayOfWeek,
      taskTitle: e.taskTitle,
      done: e.done,
      taskId: e.taskId,
    })));
  })

  // POST /planning
  .post("/", zValidator("json", CreatePlanEntrySchema), async (c) => {
    const body = c.req.valid("json");
    const monday = getMondayOfCurrentWeek();

    const existing = await db
      .select({ sortOrder: weeklyPlanEntries.sortOrder })
      .from(weeklyPlanEntries)
      .where(eq(weeklyPlanEntries.dayOfWeek, body.dayOfWeek))
      .orderBy(asc(weeklyPlanEntries.sortOrder));

    const maxOrder = existing.length > 0 ? existing[existing.length - 1].sortOrder : -1;

    const id = createId();
    await db.insert(weeklyPlanEntries).values({
      id,
      dayOfWeek: body.dayOfWeek,
      weekStart: monday,
      taskTitle: body.taskTitle,
      taskId: body.taskId ?? null,
      sortOrder: maxOrder + 1,
      createdAt: new Date(),
    });

    const [created] = await db.select().from(weeklyPlanEntries).where(eq(weeklyPlanEntries.id, id));
    return ok(c, created, undefined, 201);
  })

  // PATCH /planning/:id/toggle
  .patch("/:id/toggle", async (c) => {
    const id = c.req.param("id");
    const [entry] = await db.select().from(weeklyPlanEntries).where(eq(weeklyPlanEntries.id, id));
    if (!entry) return err(c, "Entry not found", 404);

    await db.update(weeklyPlanEntries).set({ done: !entry.done }).where(eq(weeklyPlanEntries.id, id));
    const [updated] = await db.select().from(weeklyPlanEntries).where(eq(weeklyPlanEntries.id, id));
    return ok(c, updated);
  })

  // DELETE /planning/:id
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    const [existing] = await db.select().from(weeklyPlanEntries).where(eq(weeklyPlanEntries.id, id));
    if (!existing) return err(c, "Entry not found", 404);
    await db.delete(weeklyPlanEntries).where(eq(weeklyPlanEntries.id, id));
    return ok(c, { id });
  });
