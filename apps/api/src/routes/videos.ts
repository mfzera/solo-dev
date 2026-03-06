import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index.js";
import { videoSessions } from "../db/schema.js";
import { eq, asc, and } from "drizzle-orm";
import { ok, err } from "../response.js";
import { createId } from "@paralleldrive/cuid2";
import type { AppEnv } from "../types.js";

const VideoStatusSchema = z.enum(["idea", "scripting", "filming", "editing", "published"]);

const CreateVideoSchema = z.object({
  title: z.string().min(1),
});

const UpdateVideoSchema = z.object({
  title: z.string().min(1).optional(),
  status: VideoStatusSchema.optional(),
  script: z.string().nullable().optional(),
  ideas: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

function toVideoView(v: typeof videoSessions.$inferSelect) {
  return {
    id: v.id,
    title: v.title,
    status: v.status,
    script: v.script,
    ideas: v.ideas,
    tags: JSON.parse(v.tags) as string[],
    sortOrder: v.sortOrder,
    createdAt: v.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: v.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

export const videosRouter = new Hono<AppEnv>()
  // GET /videos
  .get("/", async (c) => {
    const userId = c.get("userId");
    const videos = await db.select().from(videoSessions).where(eq(videoSessions.userId, userId)).orderBy(asc(videoSessions.sortOrder));
    return ok(c, videos.map(toVideoView));
  })

  // GET /videos/:id
  .get("/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const [video] = await db.select().from(videoSessions).where(and(eq(videoSessions.id, id), eq(videoSessions.userId, userId)));
    if (!video) return err(c, "Video session not found", 404);
    return ok(c, toVideoView(video));
  })

  // POST /videos
  .post("/", zValidator("json", CreateVideoSchema), async (c) => {
    const userId = c.get("userId");
    const { title } = c.req.valid("json");
    const all = await db.select({ sortOrder: videoSessions.sortOrder }).from(videoSessions).where(eq(videoSessions.userId, userId)).orderBy(asc(videoSessions.sortOrder));
    const maxOrder = all.length > 0 ? all[all.length - 1].sortOrder : -1;

    const id = createId();
    const now = new Date();
    await db.insert(videoSessions).values({ id, userId, title, sortOrder: maxOrder + 1, createdAt: now, updatedAt: now });

    const [created] = await db.select().from(videoSessions).where(eq(videoSessions.id, id));
    return ok(c, toVideoView(created), undefined, 201);
  })

  // PATCH /videos/:id
  .patch("/:id", zValidator("json", UpdateVideoSchema), async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const [existing] = await db.select().from(videoSessions).where(and(eq(videoSessions.id, id), eq(videoSessions.userId, userId)));
    if (!existing) return err(c, "Video session not found", 404);

    const updateData: Partial<typeof videoSessions.$inferInsert> = { updatedAt: new Date() };
    if (body.title !== undefined) updateData.title = body.title;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.script !== undefined) updateData.script = body.script;
    if (body.ideas !== undefined) updateData.ideas = body.ideas;
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags);

    await db.update(videoSessions).set(updateData).where(and(eq(videoSessions.id, id), eq(videoSessions.userId, userId)));
    const [updated] = await db.select().from(videoSessions).where(eq(videoSessions.id, id));
    return ok(c, toVideoView(updated));
  })

  // DELETE /videos/:id
  .delete("/:id", async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const [existing] = await db.select().from(videoSessions).where(and(eq(videoSessions.id, id), eq(videoSessions.userId, userId)));
    if (!existing) return err(c, "Video session not found", 404);
    await db.delete(videoSessions).where(and(eq(videoSessions.id, id), eq(videoSessions.userId, userId)));
    return ok(c, { id });
  });
