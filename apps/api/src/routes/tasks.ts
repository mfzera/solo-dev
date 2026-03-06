import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index.js";
import { tasks, activityLogs } from "../db/schema.js";
import { eq, isNull, isNotNull, asc, and } from "drizzle-orm";
import { ok, err } from "../response.js";
import { createId } from "@paralleldrive/cuid2";
import type { AppEnv } from "../types.js";

const TaskStatusSchema = z.enum(["ideas", "backlog", "next", "in-progress", "review", "done"]);

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  status: TaskStatusSchema.default("ideas"),
  tags: z.array(z.string()).default([]),
  estimate: z.string().optional(),
  description: z.string().optional(),
  flagged: z.boolean().default(false),
  startDate: z.string().datetime().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  estimate: z.string().nullable().optional(),
  flagged: z.boolean().optional(),
  blocked: z.boolean().optional(),
  checked: z.boolean().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  assignee: z.string().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

const MoveTaskSchema = z.object({
  status: TaskStatusSchema,
  sortOrder: z.number().int().min(0),
});

function parseTags(json: string): string[] {
  try { return JSON.parse(json); } catch { return []; }
}

function toTaskView(t: typeof tasks.$inferSelect) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    tags: parseTags(t.tags),
    estimate: t.estimate,
    flagged: t.flagged,
    blocked: t.blocked,
    checked: t.checked,
    progress: t.progress,
    sortOrder: t.sortOrder,
    assignee: t.assignee,
    startDate: t.startDate?.toISOString() ?? null,
    dueDate: t.dueDate?.toISOString() ?? null,
    completedAt: t.completedAt?.toISOString() ?? null,
    createdAt: t.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export const tasksRouter = new Hono<AppEnv>()
  // GET /tasks — list active tasks, optional ?status= filter
  .get("/", async (c) => {
    const userId = c.get("userId");
    const status = c.req.query("status");
    const archived = c.req.query("archived") === "true";

    let result;
    if (archived) {
      result = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.userId, userId), isNotNull(tasks.archivedAt)))
        .orderBy(asc(tasks.sortOrder));
    } else if (status) {
      result = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.userId, userId), eq(tasks.status, status)))
        .orderBy(asc(tasks.sortOrder));
    } else {
      result = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.userId, userId), isNull(tasks.archivedAt)))
        .orderBy(asc(tasks.sortOrder));
    }

    const ALL_STATUSES = ["ideas", "backlog", "next", "in-progress", "review", "done"] as const;
    const grouped = ALL_STATUSES.reduce<Record<string, ReturnType<typeof toTaskView>[]>>(
      (acc, s) => { acc[s] = []; return acc; },
      {} as Record<string, ReturnType<typeof toTaskView>[]>,
    );
    for (const t of result) {
      const key = t.status;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(toTaskView(t));
    }

    return ok(c, status || archived ? result.map(toTaskView) : grouped);
  })

  // GET /tasks/:id
  .get("/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    if (!task) return err(c, "Task not found", 404);
    return ok(c, toTaskView(task));
  })

  // POST /tasks
  .post("/", zValidator("json", CreateTaskSchema), async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const now = new Date();

    const existing = await db
      .select({ sortOrder: tasks.sortOrder })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.status, body.status)))
      .orderBy(asc(tasks.sortOrder));

    const maxOrder = existing.length > 0 ? existing[existing.length - 1].sortOrder : -1;

    const id = createId();
    await db.insert(tasks).values({
      id,
      userId,
      title: body.title,
      status: body.status,
      tags: JSON.stringify(body.tags),
      estimate: body.estimate ?? null,
      description: body.description ?? null,
      flagged: body.flagged,
      sortOrder: maxOrder + 1,
      startDate: body.startDate ? new Date(body.startDate) : null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(activityLogs).values({
      id: createId(),
      userId,
      action: "created",
      occurredAt: now,
    });

    const [created] = await db.select().from(tasks).where(eq(tasks.id, id));
    return ok(c, toTaskView(created), undefined, 201);
  })

  // PATCH /tasks/:id
  .patch("/:id", zValidator("json", UpdateTaskSchema), async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const [existing] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    if (!existing) return err(c, "Task not found", 404);

    const updateData: Partial<typeof tasks.$inferInsert> = { updatedAt: new Date() };
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags);
    if (body.estimate !== undefined) updateData.estimate = body.estimate;
    if (body.flagged !== undefined) updateData.flagged = body.flagged;
    if (body.blocked !== undefined) updateData.blocked = body.blocked;
    if (body.checked !== undefined) updateData.checked = body.checked;
    if (body.progress !== undefined) updateData.progress = body.progress;
    if (body.assignee !== undefined) updateData.assignee = body.assignee;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;

    await db.update(tasks).set(updateData).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    const [updated] = await db.select().from(tasks).where(eq(tasks.id, id));
    return ok(c, toTaskView(updated));
  })

  // DELETE /tasks/:id
  .delete("/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const [existing] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    if (!existing) return err(c, "Task not found", 404);
    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return ok(c, { id });
  })

  // POST /tasks/:id/archive
  .post("/:id/archive", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const [existing] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    if (!existing) return err(c, "Task not found", 404);

    const now = new Date();
    await db.update(tasks).set({ archivedAt: now, updatedAt: now }).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    await db.insert(activityLogs).values({ id: createId(), userId, taskId: id, action: "archived", occurredAt: now });

    return ok(c, { id });
  })

  // POST /tasks/:id/restore
  .post("/:id/restore", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const [existing] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    if (!existing) return err(c, "Task not found", 404);

    await db.update(tasks).set({ archivedAt: null, updatedAt: new Date() }).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return ok(c, { id });
  })

  // PATCH /tasks/:id/move
  .patch("/:id/move", zValidator("json", MoveTaskSchema), async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const { status: newStatus, sortOrder: newSortOrder } = c.req.valid("json");

    const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    if (!task) return err(c, "Task not found", 404);

    const now = new Date();
    const isMovingToDone = newStatus === "done" && task.status !== "done";
    const isLeavingDone = task.status === "done" && newStatus !== "done";

    await db.update(tasks).set({
      status: newStatus,
      sortOrder: newSortOrder,
      updatedAt: now,
      ...(isMovingToDone ? { completedAt: now, checked: true } : {}),
      ...(isLeavingDone ? { completedAt: null, checked: false } : {}),
    }).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    // Reorder siblings (only this user's tasks)
    const siblings = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.status, newStatus)))
      .orderBy(asc(tasks.sortOrder));

    for (let i = 0; i < siblings.length; i++) {
      if (siblings[i].id === id) continue;
      const idx = siblings.filter(s => s.id !== id).indexOf(siblings[i]);
      const order = idx >= newSortOrder ? idx + 1 : idx;
      if (siblings[i].sortOrder !== order) {
        await db.update(tasks).set({ sortOrder: order }).where(eq(tasks.id, siblings[i].id));
      }
    }

    await db.insert(activityLogs).values({
      id: createId(),
      userId,
      taskId: id,
      action: isMovingToDone ? "completed" : "moved",
      occurredAt: now,
    });

    const [updated] = await db.select().from(tasks).where(eq(tasks.id, id));
    return ok(c, toTaskView(updated));
  });
