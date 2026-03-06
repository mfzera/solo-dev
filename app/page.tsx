import StatsRow from "@/components/StatsRow";
import ActivitySection from "@/components/ActivitySection";
import KanbanBoard from "@/components/KanbanBoard";
import { getTasksByStatus, getStatsData, getActivityData } from "@/lib/queries";

export default async function BoardPage() {
  const [tasks, stats, activity] = await Promise.all([
    getTasksByStatus(),
    getStatsData(),
    getActivityData(),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <StatsRow stats={stats} />
      <ActivitySection data={activity} />
      <KanbanBoard tasks={tasks} />
    </div>
  );
}
