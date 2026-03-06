import { prisma } from "./db";
import { parseTags } from "./helpers";
import type { TaskStatus, TaskView, StatsData, ActivityData, WeeklyPlanView, QuickCaptureView, Tag } from "./types";
import { ALL_STATUSES } from "./types";

function toTaskView(t: {
  id: string; title: string; description: string | null; status: string; tags: string;
  estimate: string | null; flagged: boolean; blocked: boolean; checked: boolean;
  progress: number | null; sortOrder: number; completedAt: Date | null; createdAt: Date;
}): TaskView {
  return {
    ...t,
    status: t.status as TaskStatus,
    tags: parseTags(t.tags),
    completedAt: t.completedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
  };
}

export async function getTasksByStatus(): Promise<Record<TaskStatus, TaskView[]>> {
  const tasks = await prisma.task.findMany({
    where: { archivedAt: null },
    orderBy: { sortOrder: "asc" },
  });

  const result: Record<TaskStatus, TaskView[]> = {
    ideas: [], backlog: [], next: [], "in-progress": [], review: [], done: [],
  };

  for (const t of tasks) {
    const status = t.status as TaskStatus;
    if (result[status]) {
      result[status].push(toTaskView(t));
    }
  }
  return result;
}

export async function getStatsData(): Promise<StatsData> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(startOfToday);
  const dow = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dow + (dow === 0 ? -6 : 1));

  const tasks = await prisma.task.findMany({ where: { archivedAt: null } });

  const doneToday = tasks.filter(
    t => t.status === "done" && t.completedAt && t.completedAt >= startOfToday
  ).length;

  const doneThisWeek = tasks.filter(
    t => t.status === "done" && t.completedAt && t.completedAt >= startOfWeek
  ).length;

  const inProgress = tasks.filter(t => t.status === "in-progress").length;

  // Dev distribution
  const tagCounts: Record<string, number> = { Frontend: 0, Backend: 0, Infra: 0, Bugs: 0 };
  for (const t of tasks) {
    const tags = parseTags(t.tags);
    if (tags.includes("frontend")) tagCounts.Frontend++;
    if (tags.includes("backend")) tagCounts.Backend++;
    if (tags.includes("infra")) tagCounts.Infra++;
    if (tags.includes("bug")) tagCounts.Bugs++;
  }
  const maxTag = Math.max(...Object.values(tagCounts), 1);
  const devDistribution = [
    { label: "Frontend", count: tagCounts.Frontend, color: "#4ade80", max: maxTag },
    { label: "Backend",  count: tagCounts.Backend,  color: "#60a5fa", max: maxTag },
    { label: "Infra",    count: tagCounts.Infra,    color: "#a78bfa", max: maxTag },
    { label: "Bugs",     count: tagCounts.Bugs,     color: "#f87171", max: maxTag },
  ];

  // Progress
  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.status === "done").length;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Up next
  const nextTasks = tasks
    .filter(t => t.status === "next")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toTaskView);

  // Weekly productivity (last 7 days)
  const weeklyProductivity: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(startOfToday);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const count = await prisma.activityLog.count({
      where: {
        action: "completed",
        occurredAt: { gte: dayStart, lt: dayEnd },
      },
    });
    weeklyProductivity.push(count);
  }

  return {
    doneToday,
    doneThisWeek,
    inProgress,
    weeklyProductivity,
    devDistribution,
    progressPct,
    totalBacklog: totalTasks - completedCount,
    totalCompleted: completedCount,
    upNext: nextTasks,
  };
}

export async function getActivityData(): Promise<ActivityData> {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // 26 weeks = 182 days
  const startDate = new Date(startOfToday);
  startDate.setDate(startDate.getDate() - 181);
  // Align to Monday
  const startDow = startDate.getDay();
  startDate.setDate(startDate.getDate() - ((startDow + 6) % 7));

  const logs = await prisma.activityLog.findMany({
    where: { occurredAt: { gte: startDate } },
    select: { occurredAt: true },
  });

  // Count per day
  const dayCounts = new Map<string, number>();
  for (const log of logs) {
    const key = log.occurredAt.toISOString().slice(0, 10);
    dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
  }

  // Build grid (26 weeks x 7 days)
  const grid: number[][] = [];
  const weekCounts: number[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayNameCounts: Record<string, number> = {};
  let totalShipped = 0;
  let activeDays = 0;
  let totalDays = 0;
  let streakDays = 0;
  let streakCounting = true;
  const monthCounts = new Map<string, number>();

  for (let w = 0; w < 26; w++) {
    const week: number[] = [];
    let weekTotal = 0;
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + w * 7 + d);
      if (date > now) {
        week.push(0);
        continue;
      }
      totalDays++;
      const key = date.toISOString().slice(0, 10);
      const count = dayCounts.get(key) || 0;
      totalShipped += count;
      weekTotal += count;
      if (count > 0) activeDays++;

      // Heatmap level (0-4)
      const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 2 ? 2 : count <= 3 ? 3 : 4;
      week.push(level);

      // Day name stats
      const dayName = dayNames[date.getDay()];
      dayNameCounts[dayName] = (dayNameCounts[dayName] || 0) + count;

      // Monthly
      const monthKey = date.toLocaleDateString("en", { month: "short" });
      monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + count);
    }
    weekCounts.push(weekTotal);
    grid.push(week);
  }

  // Streak (counting backwards from today)
  for (let d = 0; d >= -182 && streakCounting; d--) {
    const date = new Date(startOfToday);
    date.setDate(date.getDate() + d);
    const key = date.toISOString().slice(0, 10);
    if ((dayCounts.get(key) || 0) > 0) {
      streakDays++;
    } else {
      streakCounting = false;
    }
  }

  // Best week
  let bestWeekIdx = 0;
  let bestWeekCount = 0;
  weekCounts.forEach((c, i) => {
    if (c > bestWeekCount) { bestWeekCount = c; bestWeekIdx = i; }
  });

  // Best day
  let bestDay = "Monday";
  let bestDayCount = 0;
  for (const [day, count] of Object.entries(dayNameCounts)) {
    if (count > bestDayCount) { bestDayCount = count; bestDay = day; }
  }

  const weeksActive = Math.max(totalDays / 7, 1);
  const avgPerWeek = Math.round((totalShipped / weeksActive) * 10) / 10;

  // Monthly output (last 7 months)
  const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const monthlyOutput = months.map(m => ({
    month: m,
    value: monthCounts.get(m) || 0,
  }));

  return {
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
  };
}

export async function getWeeklyPlan(): Promise<WeeklyPlanView[]> {
  const now = new Date();
  const monday = new Date(now);
  const dow = monday.getDay();
  monday.setDate(monday.getDate() - dow + (dow === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);

  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);

  const entries = await prisma.weeklyPlanEntry.findMany({
    where: {
      weekStart: { gte: monday, lt: nextMonday },
    },
    orderBy: [{ dayOfWeek: "asc" }, { sortOrder: "asc" }],
  });

  return entries.map(e => ({
    id: e.id,
    dayOfWeek: e.dayOfWeek,
    taskTitle: e.taskTitle,
    done: e.done,
    taskId: e.taskId,
  }));
}

export async function getQuickCaptures(limit = 5): Promise<QuickCaptureView[]> {
  const captures = await prisma.quickCapture.findMany({
    where: { promotedToTaskId: null },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return captures.map(c => ({
    id: c.id,
    text: c.text,
    createdAt: c.createdAt.toISOString(),
    promotedToTaskId: c.promotedToTaskId,
  }));
}

export async function getArchivedTasks(): Promise<TaskView[]> {
  const tasks = await prisma.task.findMany({
    where: { archivedAt: { not: null } },
    orderBy: { archivedAt: "desc" },
  });
  return tasks.map(toTaskView);
}

export async function getTimelineTasks(): Promise<TaskView[]> {
  const tasks = await prisma.task.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "asc" },
  });
  return tasks.map(toTaskView);
}
