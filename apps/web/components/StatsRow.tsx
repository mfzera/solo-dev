"use client";
import type { StatsData } from "@/lib/types";
import Tag from "./Tag";
import type { Tag as TagType } from "@/lib/types";
import { Circle } from "lucide-react";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div style={{ background: "#242424", border: "1px solid #2e2e2e", borderRadius: 8, padding: "14px 16px" }}
         className={className}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ color: "#666", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 10 }}>{children}</div>;
}

function Productivity({ doneToday, doneThisWeek, inProgress, weeklyProductivity }: Pick<StatsData, "doneToday" | "doneThisWeek" | "inProgress" | "weeklyProductivity">) {
  const days = ["M","T","W","T","F","S","S"];
  const max = Math.max(...weeklyProductivity, 1);
  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>PRODUCTIVITY</SectionLabel>
      </div>
      <div className="flex gap-5 mb-4">
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{doneToday}</div>
          <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>done today</div>
        </div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{doneThisWeek}</div>
          <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>done this week</div>
        </div>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#d4702a", lineHeight: 1 }}>{inProgress}</div>
          <div style={{ color: "#666", fontSize: 11, marginTop: 2 }}>in progress</div>
        </div>
      </div>
      <div className="flex items-end gap-1" style={{ height: 36 }}>
        {weeklyProductivity.map((v, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div style={{
              width: "100%", borderRadius: 2,
              height: `${(v / max) * 28}px`,
              background: i === todayIdx ? "#d4702a" : "#333",
              minHeight: 2,
            }} />
            <span style={{ color: "#555", fontSize: 10 }}>{days[i]}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DevDist({ data }: { data: StatsData["devDistribution"] }) {
  return (
    <Card>
      <SectionLabel>DEV DISTRIBUTION</SectionLabel>
      <div className="flex flex-col gap-2">
        {data.map(({ label, count, color, max }) => (
          <div key={label} className="flex items-center gap-2">
            <span style={{ width: 60, color: "#aaa", fontSize: 12 }}>{label}</span>
            <div style={{ flex: 1, background: "#1e1e1e", borderRadius: 2, height: 6, overflow: "hidden" }}>
              <div style={{ width: `${(count / Math.max(max, 1)) * 100}%`, background: color, height: "100%", borderRadius: 2 }} />
            </div>
            <span style={{ color: "#888", fontSize: 12, width: 14, textAlign: "right" }}>{count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Progress({ pct, total, completed }: { pct: number; total: number; completed: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <Card>
      <SectionLabel>PROGRESS</SectionLabel>
      <div className="flex items-center gap-4">
        <svg width={88} height={88}>
          <circle cx={44} cy={44} r={r} fill="none" stroke="#333" strokeWidth={8} />
          <circle cx={44} cy={44} r={r} fill="none" stroke="#d4702a" strokeWidth={8}
                  strokeDasharray={circ} strokeDashoffset={offset}
                  strokeLinecap="round" transform="rotate(-90 44 44)" />
          <text x={44} y={44} textAnchor="middle" dominantBaseline="middle"
                fill="#e8e8e8" fontSize={16} fontWeight={700}>{pct}%</text>
        </svg>
        <div className="flex flex-col gap-2">
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{total}</div>
            <div style={{ color: "#666", fontSize: 11 }}>total backlog</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#d4702a" }}>{completed}</div>
            <div style={{ color: "#666", fontSize: 11 }}>completed</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function UpNext({ tasks }: { tasks: StatsData["upNext"] }) {
  return (
    <Card className="flex-1">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>UP NEXT</SectionLabel>
        <div className="flex items-center gap-1">
          <Circle size={7} fill="#d4702a" stroke="none" />
          <span style={{ color: "#d4702a", fontSize: 11 }}>{tasks.length} queued</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <div key={task.id}
               style={{ background: "#1e1e1e", border: "1px solid #2e2e2e", borderRadius: 6, padding: "8px 10px" }}>
            <div className="flex items-start justify-between gap-2">
              <span style={{ fontSize: 12, color: "#d8d8d8", lineHeight: 1.4 }}>{task.title}</span>
              <span style={{ color: "#555", fontSize: 11, whiteSpace: "nowrap" }}>{task.estimate}</span>
            </div>
            <div className="flex gap-1 mt-1.5">
              {task.tags.map(t => <Tag key={t} tag={t as TagType} />)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function StatsRow({ stats }: { stats: StatsData }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "220px 200px 200px 1fr" }}>
      <Productivity doneToday={stats.doneToday} doneThisWeek={stats.doneThisWeek}
                    inProgress={stats.inProgress} weeklyProductivity={stats.weeklyProductivity} />
      <DevDist data={stats.devDistribution} />
      <Progress pct={stats.progressPct} total={stats.totalBacklog} completed={stats.totalCompleted} />
      <UpNext tasks={stats.upNext} />
    </div>
  );
}
