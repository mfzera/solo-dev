import StatsRow from "@/components/StatsRow";
import ActivitySection from "@/components/ActivitySection";
import KanbanBoard from "@/components/KanbanBoard";
import BottomRow from "@/components/BottomRow";
import { getTasksByStatus, getStatsData, getActivityData, getWeeklyPlan, getQuickCaptures } from "@/lib/queries";

export default async function BoardPage() {
  const [tasks, stats, activity, weeklyPlan, captures] = await Promise.all([
    getTasksByStatus(),
    getStatsData(),
    getActivityData(),
    getWeeklyPlan(),
    getQuickCaptures(),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <StatsRow stats={stats} />
      <ActivitySection data={activity} />
      <KanbanBoard tasks={tasks} />
      <BottomRow weeklyPlan={weeklyPlan} captures={captures} />
    </div>
  );
}
