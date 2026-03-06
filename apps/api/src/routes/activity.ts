import { Hono } from "hono";
import { db } from "../db/index.js";
import { activityLogs, tasks, tagConfigs } from "../db/schema.js";
import { eq, and, gte, lt, isNotNull, inArray } from "drizzle-orm";
import { ok, err } from "../response.js";
import { createId } from "@paralleldrive/cuid2";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

function parseTags(json: string): string[] {
  try { return JSON.parse(json); } catch { return []; }
}

type ActivityCell = { date: string; level: number; count: number };

export const activityRouter = new Hono()
  // GET /activity/heatmap — 52-week heatmap grid
  .get("/heatmap", async (c) => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const currentWeekMonday = new Date(startOfToday);
    const currentDow = currentWeekMonday.getDay();
    currentWeekMonday.setDate(currentWeekMonday.getDate() - ((currentDow + 6) % 7));

    const startDate = new Date(currentWeekMonday);
    startDate.setDate(startDate.getDate() - 51 * 7);

    const logs = await db
      .select({ occurredAt: activityLogs.occurredAt })
      .from(activityLogs)
      .where(and(gte(activityLogs.occurredAt, startDate), eq(activityLogs.action, "completed")));

    const dayCounts = new Map<string, number>();
    for (const log of logs) {
      if (!log.occurredAt) continue;
      const key = log.occurredAt.toISOString().slice(0, 10);
      dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
    }

    const grid: ActivityCell[][] = [];
    const weekCounts: number[] = [];
    let totalShipped = 0;
    let activeDays = 0;
    let totalDays = 0;
    let streakDays = 0;
    let streakCounting = true;
    const monthCounts = new Map<string, number>();
    const dayNameCounts: Record<string, number> = {};
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let w = 0; w < 52; w++) {
      const week: ActivityCell[] = [];
      let weekTotal = 0;
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + w * 7 + d);
        const key = date.toISOString().slice(0, 10);
        if (date > now) {
          week.push({ date: key, level: 0, count: 0 });
          continue;
        }
        totalDays++;
        const count = dayCounts.get(key) || 0;
        totalShipped += count;
        weekTotal += count;
        if (count > 0) activeDays++;

        const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 2 ? 2 : count <= 3 ? 3 : 4;
        week.push({ date: key, level, count });

        const dayName = dayNames[date.getDay()];
        dayNameCounts[dayName] = (dayNameCounts[dayName] || 0) + count;

        const monthKey = date.toLocaleDateString("en", { month: "short" });
        monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + count);
      }
      weekCounts.push(weekTotal);
      grid.push(week);
    }

    const todayKey = startOfToday.toISOString().slice(0, 10);
    const startOffset = (dayCounts.get(todayKey) || 0) > 0 ? 0 : -1;
    for (let d = startOffset; d >= -364 && streakCounting; d--) {
      const date = new Date(startOfToday);
      date.setDate(date.getDate() + d);
      const key = date.toISOString().slice(0, 10);
      if ((dayCounts.get(key) || 0) > 0) streakDays++;
      else streakCounting = false;
    }

    let bestWeekIdx = 0;
    let bestWeekCount = 0;
    weekCounts.forEach((cnt, i) => {
      if (cnt > bestWeekCount) { bestWeekCount = cnt; bestWeekIdx = i; }
    });

    let bestDay = "Monday";
    let bestDayCount = 0;
    for (const [day, count] of Object.entries(dayNameCounts)) {
      if (count > bestDayCount) { bestDayCount = count; bestDay = day; }
    }

    const weeksActive = Math.max(totalDays / 7, 1);
    const avgPerWeek = Math.round((totalShipped / weeksActive) * 10) / 10;

    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleDateString("en", { month: "short" }));
    }
    const currentMonth = now.toLocaleDateString("en", { month: "short" });
    const monthlyOutput = months.map(m => ({
      month: m,
      value: monthCounts.get(m) || 0,
      isCurrent: m === currentMonth,
    }));

    return ok(c, {
      grid,
      totalShipped,
      bestWeekLabel: `W${bestWeekIdx + 1}`,
      bestWeekCount,
      bestDay,
      avgPerWeek,
      activeDays,
      totalDays,
      streakDays,
      monthlyOutput,
    });
  })

  // GET /activity/day?date=YYYY-MM-DD — tasks completed on a specific day
  .get("/day", zValidator("query", z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format"),
  })), async (c) => {
    const { date } = c.req.valid("query");

    const dayStart = new Date(date + "T00:00:00.000Z");
    const dayEnd = new Date(date + "T23:59:59.999Z");

    const logs = await db
      .select({ taskId: activityLogs.taskId })
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.action, "completed"),
          gte(activityLogs.occurredAt, dayStart),
          lt(activityLogs.occurredAt, dayEnd),
          isNotNull(activityLogs.taskId),
        ),
      );

    const taskIds = [...new Set(logs.map(l => l.taskId!))];
    if (taskIds.length === 0) return ok(c, []);

    const completedTasks = await db
      .select({ id: tasks.id, title: tasks.title, tags: tasks.tags })
      .from(tasks)
      .where(inArray(tasks.id, taskIds));

    return ok(c, completedTasks.map(t => ({ ...t, tags: parseTags(t.tags) })));
  })

  // POST /activity — log an activity event
  .post("/", zValidator("json", z.object({
    action: z.string().min(1),
    taskId: z.string().nullable().optional(),
  })), async (c) => {
    const { action, taskId } = c.req.valid("json");
    const id = createId();
    await db.insert(activityLogs).values({ id, action, taskId: taskId ?? null, occurredAt: new Date() });
    return ok(c, { id }, undefined, 201);
  });
