import StatsRow from "@/components/StatsRow";
import ActivitySection from "@/components/ActivitySection";
import KanbanBoard from "@/components/KanbanBoard";
import { getTasksByStatus, getStatsData, getActivityData, getTagConfigs } from "@/lib/queries";

export default async function BoardPage() {
  const [tasks, stats, activity, tagConfigs] = await Promise.all([
    getTasksByStatus(),
    getStatsData(),
    getActivityData(),
    getTagConfigs(),
  ]);

  const tagColors = Object.fromEntries(tagConfigs.map(t => [t.name, t.color]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <StatsRow stats={stats} />
      <ActivitySection data={activity} tagColors={tagColors} />
      <KanbanBoard tasks={tasks} tagConfigs={tagConfigs} />
    </div>
  );
}
