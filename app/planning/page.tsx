import { getTimelineTasks, getTagConfigs } from "@/lib/queries";
import PlanningView, { type TimelineTask, type TimelineDay, type TimelineStats } from "@/components/PlanningView";

const TODAY_COL = 9;
const TOTAL_DAYS = 14;
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default async function PlanningPage() {
  const [rawTasks, tagConfigs] = await Promise.all([getTimelineTasks(), getTagConfigs()]);

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
  const tagColorMap = Object.fromEntries(tagConfigs.map(t => [t.name, t.color]));
  const validTags = new Set(tagConfigs.map(t => t.name));
  const firstTag = tagConfigs[0]?.name ?? "backend";
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
      if (tags.length === 0 && firstTag) tags.push(firstTag);

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

  const tagCounts: Record<string, number> = {};
  for (const tc of tagConfigs) tagCounts[tc.name] = 0;
  for (const t of timelineTasks) {
    for (const tag of t.tags) {
      if (tag in tagCounts) tagCounts[tag]++;
    }
  }
  const tagTotal = Math.max(Object.values(tagCounts).reduce((a, b) => a + b, 0), 1);
  const tagDistribution = tagConfigs
    .map(tc => ({
      label: tc.name.charAt(0).toUpperCase() + tc.name.slice(1),
      pct: Math.round((tagCounts[tc.name] / tagTotal) * 100),
      color: tagColorMap[tc.name] ?? "#888",
    }))
    .filter(t => t.pct > 0);

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
