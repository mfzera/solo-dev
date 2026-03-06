import { getTimelineTasks } from "@/lib/queries";
import PlanningView, { type TimelineTask, type TimelineDay, type TimelineStats } from "@/components/PlanningView";

const TODAY_COL = 9;
const TOTAL_DAYS = 14;
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default async function PlanningPage() {
  const rawTasks = await getTimelineTasks();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const windowStart = new Date(todayStart);
  windowStart.setDate(windowStart.getDate() - TODAY_COL);

  const windowEnd = new Date(todayStart);
  windowEnd.setDate(windowEnd.getDate() + (TOTAL_DAYS - 1 - TODAY_COL));
  windowEnd.setHours(23, 59, 59, 999);

  // Build days array
  const days: TimelineDay[] = Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const date = new Date(windowStart);
    date.setDate(date.getDate() + i);
    return {
      label: String(date.getDate()),
      month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      col: i,
      weekday: WEEKDAYS[date.getDay()],
    };
  });

  // Build month groups
  const monthGroups: { label: string; count: number }[] = [];
  for (const d of days) {
    const last = monthGroups[monthGroups.length - 1];
    if (last && last.label === d.month) {
      last.count++;
    } else {
      monthGroups.push({ label: d.month, count: 1 });
    }
  }

  const rangeLabel = `${capMonth(days[0].month)} ${days[0].label} – ${capMonth(days[TOTAL_DAYS - 1].month)} ${days[TOTAL_DAYS - 1].label}`;

  // Map tasks to timeline
  const validTags = new Set(["frontend", "backend", "infra", "bug", "auth"]);
  const MS_PER_DAY = 86400000;

  const timelineTasks: TimelineTask[] = rawTasks
    .filter(t => ["done", "in-progress", "review"].includes(t.status))
    .reduce<TimelineTask[]>((acc, t) => {
      const createdAt = new Date(t.createdAt);
      const completedAt = t.completedAt ? new Date(t.completedAt) : null;

      const taskEnd = completedAt ?? windowEnd;
      if (createdAt > windowEnd || taskEnd < windowStart) return acc;

      const startDiff = Math.floor((createdAt.getTime() - windowStart.getTime()) / MS_PER_DAY);
      const startCol = Math.max(0, startDiff);

      const endDiff = completedAt
        ? Math.floor((completedAt.getTime() - windowStart.getTime()) / MS_PER_DAY)
        : TOTAL_DAYS - 1;
      const endCol = Math.min(TOTAL_DAYS - 1, endDiff);

      const spanCols = Math.max(1, endCol - startCol + 1);
      const ongoing = !completedAt;

      const tags: string[] = t.tags.filter(tag => validTags.has(tag));
      if (tags.length === 0) tags.push("backend");

      const durationLabel = t.estimate || (spanCols === 1 ? "1d" : `${spanCols}d`);
      const dateStr = createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const barLabel = ongoing ? `${durationLabel} · ongoing` : durationLabel;

      acc.push({
        id: t.id,
        name: t.title,
        tags,
        dateLabel: `${dateStr} · ${durationLabel}`,
        duration: durationLabel,
        startCol,
        spanCols,
        barLabel,
        ongoing,
      });
      return acc;
    }, []);

  // Compute stats
  const completedTasks = timelineTasks.filter(t => !t.ongoing);
  const avgDays = completedTasks.length > 0
    ? Math.round((completedTasks.reduce((s, t) => s + t.spanCols, 0) / completedTasks.length) * 10) / 10
    : 0;

  const longestTask = completedTasks.length > 0
    ? completedTasks.reduce((a, b) => a.spanCols > b.spanCols ? a : b)
    : null;

  const shortestTask = completedTasks.length > 0
    ? completedTasks.reduce((a, b) => a.spanCols < b.spanCols ? a : b)
    : null;

  const tagCounts = { frontend: 0, backend: 0, infra: 0, bug: 0 };
  for (const t of timelineTasks) {
    if (t.tags.includes("frontend")) tagCounts.frontend++;
    if (t.tags.includes("backend")) tagCounts.backend++;
    if (t.tags.includes("infra")) tagCounts.infra++;
    if (t.tags.includes("bug")) tagCounts.bug++;
  }
  const tagTotal = Math.max(Object.values(tagCounts).reduce((a, b) => a + b, 0), 1);
  const tagDistribution = [
    { label: "Frontend", pct: Math.round((tagCounts.frontend / tagTotal) * 100), color: "#4ade80" },
    { label: "Backend",  pct: Math.round((tagCounts.backend  / tagTotal) * 100), color: "#60a5fa" },
    { label: "Infra",    pct: Math.round((tagCounts.infra    / tagTotal) * 100), color: "#a78bfa" },
    { label: "Bugs",     pct: Math.round((tagCounts.bug      / tagTotal) * 100), color: "#f87171" },
  ].filter(t => t.pct > 0);

  const stats: TimelineStats = {
    avgDays,
    longestTask,
    shortestTask,
    completedCount: completedTasks.length,
    ongoingCount: timelineTasks.filter(t => t.ongoing).length,
    tagDistribution,
  };

  return (
    <PlanningView
      days={days}
      monthGroups={monthGroups}
      tasks={timelineTasks}
      todayCol={TODAY_COL}
      rangeLabel={rangeLabel}
      stats={stats}
    />
  );
}

function capMonth(m: string) {
  return m[0] + m.slice(1).toLowerCase();
}
