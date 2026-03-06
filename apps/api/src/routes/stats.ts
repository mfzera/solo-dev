import { Hono } from "hono";
import { db } from "../db/index.js";
import { tasks, activityLogs, tagConfigs } from "../db/schema.js";
import { eq, and, gte, lt, isNull, asc } from "drizzle-orm";
import { ok } from "../response.js";

function parseTags(json: string): string[] {
  try { return JSON.parse(json); } catch { return []; }
}

function toTaskView(t: typeof tasks.$inferSelect) {
  return {
    id: t.id, title: t.title, description: t.description, status: t.status,
    tags: parseTags(t.tags), estimate: t.estimate, flagged: t.flagged,
    blocked: t.blocked, checked: t.checked, progress: t.progress,
    sortOrder: t.sortOrder, assignee: t.assignee,
    startDate: t.startDate?.toISOString() ?? null,
    dueDate: t.dueDate?.toISOString() ?? null,
    completedAt: t.completedAt?.toISOString() ?? null,
    createdAt: t.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export const statsRouter = new Hono()
  .get("/", async (c) => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(startOfToday);
    const dow = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dow + (dow === 0 ? -6 : 1));

    const allTasks = await db.select().from(tasks).where(isNull(tasks.archivedAt));
    const tagConfigList = await db.select().from(tagConfigs).orderBy(asc(tagConfigs.sortOrder));

    const doneToday = allTasks.filter(
      t => t.status === "done" && t.completedAt && t.completedAt >= startOfToday,
    ).length;

    const doneThisWeek = allTasks.filter(
      t => t.status === "done" && t.completedAt && t.completedAt >= startOfWeek,
    ).length;

    const inProgress = allTasks.filter(t => t.status === "in-progress").length;

    const tagCounts: Record<string, number> = {};
    for (const tc of tagConfigList) tagCounts[tc.name] = 0;
    for (const t of allTasks) {
      for (const tag of parseTags(t.tags)) {
        if (tag in tagCounts) tagCounts[tag]++;
      }
    }
    const maxTag = Math.max(...Object.values(tagCounts), 1);
    const devDistribution = tagConfigList.map(tc => ({
      label: tc.name.charAt(0).toUpperCase() + tc.name.slice(1),
      count: tagCounts[tc.name],
      color: tc.color,
      max: maxTag,
    }));

    const totalTasks = allTasks.length;
    const completedCount = allTasks.filter(t => t.status === "done").length;
    const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    const upNext = allTasks
      .filter(t => t.status === "next")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toTaskView);

    // Weekly productivity (last 7 days) — single query
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const tomorrow = new Date(startOfToday);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekLogs = await db
      .select({ occurredAt: activityLogs.occurredAt })
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.action, "completed"),
          gte(activityLogs.occurredAt, sevenDaysAgo),
          lt(activityLogs.occurredAt, tomorrow),
        ),
      );

    const dayCountMap = new Map<string, number>();
    for (const log of weekLogs) {
      if (!log.occurredAt) continue;
      const key = log.occurredAt.toISOString().slice(0, 10);
      dayCountMap.set(key, (dayCountMap.get(key) ?? 0) + 1);
    }

    const weeklyProductivity: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(startOfToday);
      day.setDate(day.getDate() - i);
      weeklyProductivity.push(dayCountMap.get(day.toISOString().slice(0, 10)) ?? 0);
    }

    return ok(c, {
      doneToday,
      doneThisWeek,
      inProgress,
      weeklyProductivity,
      devDistribution,
      progressPct,
      totalBacklog: totalTasks - completedCount,
      totalCompleted: completedCount,
      upNext,
    });
  });
