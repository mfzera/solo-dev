"use client";
import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar, ChevronDown, Check } from "lucide-react";

type TagColor = "frontend" | "backend" | "infra" | "bug" | "auth";

const TAG_STYLES: Record<TagColor, { bg: string; color: string }> = {
  frontend: { bg: "#1e3a2f", color: "#4ade80" },
  backend:  { bg: "#1e2a3a", color: "#60a5fa" },
  infra:    { bg: "#2a1e3a", color: "#a78bfa" },
  bug:      { bg: "#3a1e1e", color: "#f87171" },
  auth:     { bg: "#2a2a1e", color: "#fb923c" },
};

const BAR_COLORS: Record<TagColor, { bg: string; border: string }> = {
  frontend: { bg: "#2563eb", border: "#3b82f6" },
  backend:  { bg: "#7c3aed", border: "#8b5cf6" },
  infra:    { bg: "#15803d", border: "#22c55e" },
  bug:      { bg: "#b91c1c", border: "#ef4444" },
  auth:     { bg: "#b45309", border: "#d97706" },
};

export interface TimelineDay {
  label: string;
  month: string;
  col: number;
  weekday: string;
}

export interface TimelineTask {
  id: string;
  name: string;
  tags: string[];
  dateLabel: string;
  duration: string;
  startCol: number;
  spanCols: number;
  barLabel: string;
  ongoing: boolean;
}

export interface TimelineStats {
  avgDays: number;
  longestTask: TimelineTask | null;
  shortestTask: TimelineTask | null;
  completedCount: number;
  ongoingCount: number;
  tagDistribution: { label: string; pct: number; color: string }[];
}

export interface PlanningViewProps {
  days: TimelineDay[];
  monthGroups: { label: string; count: number }[];
  tasks: TimelineTask[];
  todayCol: number;
  rangeLabel: string;
  stats: TimelineStats;
  view: string;
  offset: number;
}

const COL_W = 64;
const TASK_COL_W = 240;

const FILTERS = [
  { label: "All tasks" },
  { label: "Frontend", tag: "frontend" as TagColor },
  { label: "Backend",  tag: "backend"  as TagColor },
  { label: "Infra",    tag: "infra"    as TagColor },
  { label: "Bugs",     tag: "bug"      as TagColor },
];

const VIEW_OPTIONS = ["week", "2weeks", "month", "custom"] as const;
const VIEW_LABELS: Record<string, string> = {
  week: "Week",
  "2weeks": "2 Weeks",
  month: "Month",
  custom: "Custom",
};

const GROUP_OPTIONS = ["None", "Category"] as const;

function TagBadge({ tag }: { tag: string }) {
  const s = TAG_STYLES[tag as TagColor] ?? TAG_STYLES.backend;
  return (
    <span style={{ background: s.bg, color: s.color, padding: "1px 5px", borderRadius: 3, fontSize: 10, fontWeight: 500 }}>
      {tag}
    </span>
  );
}

function TaskBar({ task, todayCol, onHover, hovered }: {
  task: TimelineTask;
  todayCol: number;
  onHover: (id: string | null) => void;
  hovered: boolean;
}) {
  const primaryTag = (task.tags[0] ?? "backend") as TagColor;
  const color = BAR_COLORS[primaryTag] ?? BAR_COLORS.backend;
  const left = task.startCol * COL_W + 4;
  const width = task.spanCols * COL_W - 8;

  return (
    <div
      onMouseEnter={() => onHover(task.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        position: "absolute",
        left, width,
        top: "50%", transform: "translateY(-50%)",
        height: 28,
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: 5,
        display: "flex", alignItems: "center",
        padding: "0 8px",
        cursor: "pointer",
        opacity: task.ongoing ? 0.85 : 1,
        zIndex: hovered ? 10 : 1,
      }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {task.barLabel}
      </span>
      {task.ongoing && (
        <div style={{
          position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)",
          width: 8, height: 8, borderRadius: "50%",
          background: color.border, border: "2px solid #1a1a1a",
        }} />
      )}
      {hovered && (
        <div style={{
          position: "absolute", top: -36, left: "50%", transform: "translateX(-50%)",
          background: "#111", border: "1px solid #333", borderRadius: 6,
          padding: "5px 10px", whiteSpace: "nowrap", zIndex: 20,
          fontSize: 11, color: "#ddd", pointerEvents: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}>
          {task.name} · {task.dateLabel.split(" · ")[0]} · <strong>{task.duration}</strong>
          <div style={{
            position: "absolute", bottom: -5, left: "50%",
            width: 8, height: 8, background: "#111",
            border: "1px solid #333", borderBottom: "none", borderRight: "none",
            transform: "translateX(-50%) rotate(225deg)",
          }} />
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, days, todayCol, hoveredTask, setHoveredTask, totalDays }: {
  task: TimelineTask;
  days: TimelineDay[];
  todayCol: number;
  hoveredTask: string | null;
  setHoveredTask: (id: string | null) => void;
  totalDays: number;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "stretch",
      borderBottom: "1px solid #242424",
      minHeight: 48,
    }}>
      <div style={{ width: TASK_COL_W, flexShrink: 0, padding: "8px 16px", borderRight: "1px solid #2a2a2a" }}>
        <div className="flex items-center gap-1.5 mb-1">
          <div style={{
            width: 14, height: 14, borderRadius: "50%",
            border: "1.5px solid #22c55e",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {!task.ongoing && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#d8d8d8", lineHeight: 1.3 }}>{task.name}</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {task.tags.map(t => <TagBadge key={t} tag={t} />)}
          <span style={{ fontSize: 10, color: "#555" }}>{task.dateLabel}</span>
        </div>
      </div>

      <div style={{ flex: 1, position: "relative", display: "flex" }}>
        {days.map((d, i) => (
          <div key={i} style={{
            width: COL_W, flexShrink: 0,
            borderLeft: "1px solid #242424",
            background: d.col === todayCol ? "rgba(212,112,42,0.05)" : "transparent",
          }} />
        ))}
        {todayCol >= 0 && todayCol < totalDays && (
          <div style={{
            position: "absolute",
            left: todayCol * COL_W,
            top: 0, bottom: 0,
            width: 1,
            background: "rgba(212,112,42,0.3)",
            pointerEvents: "none",
          }} />
        )}
        <TaskBar task={task} todayCol={todayCol} onHover={setHoveredTask} hovered={hoveredTask === task.id} />
      </div>
    </div>
  );
}

export default function PlanningView({ days, monthGroups, tasks, todayCol, rangeLabel, stats, view, offset }: PlanningViewProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [activeFilter, setActiveFilter] = useState("All tasks");
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<"None" | "Category">("Category");
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  const navigate = useCallback((newView: string, newOffset: number) => {
    const params = new URLSearchParams();
    params.set("view", newView);
    params.set("offset", String(newOffset));
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname]);

  const filteredTasks = activeFilter === "All tasks"
    ? tasks
    : tasks.filter(t => t.tags.some(tag => tag === activeFilter.toLowerCase() || (activeFilter === "Bugs" && tag === "bug")));

  const totalWidth = days.length * COL_W;
  const totalDays = days.length;

  // Group tasks by primary tag when groupBy === "Category"
  const groupedTasks: { groupLabel: string | null; tasks: TimelineTask[] }[] = (() => {
    if (groupBy === "None") return [{ groupLabel: null, tasks: filteredTasks }];
    const groups: Record<string, TimelineTask[]> = {};
    for (const task of filteredTasks) {
      const key = task.tags[0] ?? "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    }
    return Object.entries(groups).map(([label, tasks]) => ({ groupLabel: label, tasks }));
  })();

  return (
    <div style={{ fontFamily: "var(--font-inter, system-ui, sans-serif)", color: "#e8e8e8" }}>
      {/* Page header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, lineHeight: 1 }}>Execution Timeline</h1>
            <span style={{
              background: "#2a2a2a", border: "1px solid #3a3a3a",
              borderRadius: 20, padding: "2px 10px", fontSize: 11, color: "#888",
            }}>retrospective</span>
          </div>
          <p style={{ color: "#666", fontSize: 12, margin: 0 }}>
            How long tasks actually took · SaaS Builder Pro
          </p>
        </div>

        <div className="flex items-center gap-2">
          {VIEW_OPTIONS.map(v => (
            <button key={v} onClick={() => v !== "custom" ? navigate(v, 0) : undefined}
              style={{
                background: view === v ? "#e8e8e8" : "transparent",
                color: view === v ? "#111" : "#888",
                border: view === v ? "none" : "1px solid #333",
                borderRadius: 5, padding: "4px 12px",
                fontSize: 12, fontWeight: view === v ? 600 : 400,
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
              }}>
              {v === "custom" && <Calendar size={12} />}
              {VIEW_LABELS[v]}
            </button>
          ))}
          <div style={{ width: 1, height: 20, background: "#333", margin: "0 4px" }} />
          <button
            onClick={() => navigate(view, offset - 1)}
            style={{ background: "none", border: "1px solid #333", borderRadius: 5, padding: "4px 6px", cursor: "pointer", color: "#888" }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: "#ccc", whiteSpace: "nowrap", padding: "0 4px" }}>{rangeLabel}</span>
          <button
            onClick={() => navigate(view, offset + 1)}
            style={{ background: "none", border: "1px solid #333", borderRadius: 5, padding: "4px 6px", cursor: "pointer", color: "#888" }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <span style={{ color: "#666", fontSize: 12, marginRight: 4 }}>Filter:</span>
          {FILTERS.map(f => (
            <button key={f.label}
              onClick={() => setActiveFilter(f.label)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: activeFilter === f.label ? "#2a2a2a" : "transparent",
                border: `1px solid ${activeFilter === f.label ? "#444" : "transparent"}`,
                borderRadius: 20, padding: "3px 10px",
                fontSize: 12, color: activeFilter === f.label ? "#e8e8e8" : "#888",
                cursor: "pointer",
              }}>
              {f.tag && (
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: TAG_STYLES[f.tag].color }} />
              )}
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2" style={{ position: "relative" }}>
          <span style={{ color: "#666", fontSize: 12 }}>Group by:</span>
          <button
            onClick={() => setGroupDropdownOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "#1e1e1e", border: "1px solid #333",
              borderRadius: 5, padding: "4px 10px",
              fontSize: 12, color: "#ccc", cursor: "pointer",
            }}>
            {groupBy} <ChevronDown size={12} />
          </button>
          {groupDropdownOpen && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 9 }}
                onClick={() => setGroupDropdownOpen(false)}
              />
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", right: 0,
                background: "#1e1e1e", border: "1px solid #333",
                borderRadius: 6, overflow: "hidden", zIndex: 10,
                minWidth: 120, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}>
                {GROUP_OPTIONS.map(opt => (
                  <button key={opt}
                    onClick={() => { setGroupBy(opt); setGroupDropdownOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%", padding: "8px 12px",
                      background: "none", border: "none",
                      fontSize: 12, color: groupBy === opt ? "#e8e8e8" : "#888",
                      cursor: "pointer", textAlign: "left",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#2a2a2a")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    <span style={{ width: 14, display: "flex", justifyContent: "center" }}>
                      {groupBy === opt && <Check size={12} color="#60a5fa" />}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#555", letterSpacing: "0.06em", marginBottom: 6 }}>AVG DURATION</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, marginBottom: 2, color: "#e8e8e8" }}>{stats.avgDays}</div>
          <div style={{ fontSize: 12, color: "#666" }}>days / task</div>
        </div>
        <div style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#555", letterSpacing: "0.06em", marginBottom: 6 }}>LONGEST TASK</div>
          {stats.longestTask ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, lineHeight: 1.3, color: "#e8e8e8" }}>{stats.longestTask.name}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ fontSize: 12, color: "#666" }}>{stats.longestTask.duration}</span>
                {stats.longestTask.tags.slice(0, 1).map(t => <TagBadge key={t} tag={t} />)}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: "#555" }}>—</div>
          )}
        </div>
        <div style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#555", letterSpacing: "0.06em", marginBottom: 6 }}>SHORTEST TASK</div>
          {stats.shortestTask ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, lineHeight: 1.3, color: "#e8e8e8" }}>{stats.shortestTask.name}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ fontSize: 12, color: "#666" }}>{stats.shortestTask.duration}</span>
                {stats.shortestTask.tags.slice(0, 1).map(t => <TagBadge key={t} tag={t} />)}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: "#555" }}>—</div>
          )}
        </div>
        <div style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#555", letterSpacing: "0.06em", marginBottom: 6 }}>COMPLETED</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, marginBottom: 2, color: "#e8e8e8" }}>{stats.completedCount}</div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
            tasks{stats.ongoingCount > 0 ? ` · ${stats.ongoingCount} in progress` : ""}
          </div>
          {stats.tagDistribution.length > 0 && (
            <div className="flex gap-1" style={{ height: 4 }}>
              {stats.tagDistribution.map(s => (
                <div key={s.label} style={{ width: `${s.pct}%`, background: s.color, borderRadius: 2 }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Timeline grid */}
      <div style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", borderRadius: 8, overflow: "hidden" }}>
        {filteredTasks.length === 0 ? (
          <div style={{ padding: "40px 16px", textAlign: "center", color: "#555", fontSize: 13 }}>
            No completed or in-progress tasks in this period.
            <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>Move tasks to In Progress or Done to see them here.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: TASK_COL_W + totalWidth + 1 }}>

              {/* Month header */}
              <div className="flex" style={{ borderBottom: "1px solid #2a2a2a", background: "#1a1a1a" }}>
                <div style={{ width: TASK_COL_W, flexShrink: 0, padding: "8px 16px", fontSize: 11, fontWeight: 600, color: "#555" }}>TASK</div>
                <div style={{ flex: 1, position: "relative", display: "flex" }}>
                  {monthGroups.map(({ label, count }) => (
                    <div key={label} style={{
                      width: count * COL_W,
                      padding: "4px 8px",
                      fontSize: 11, fontWeight: 600, color: "#666",
                      borderLeft: "1px solid #2a2a2a",
                    }}>{label}</div>
                  ))}
                </div>
              </div>

              {/* Day header */}
              <div className="flex" style={{ borderBottom: "1px solid #2a2a2a", background: "#1a1a1a" }}>
                <div style={{ width: TASK_COL_W, flexShrink: 0 }} />
                {days.map((d, i) => (
                  <div key={i} style={{
                    width: COL_W, flexShrink: 0, textAlign: "center",
                    padding: "4px 0",
                    borderLeft: "1px solid #2a2a2a",
                  }}>
                    <div style={{ fontSize: 10, color: "#555", lineHeight: 1 }}>{d.weekday}</div>
                    {d.col === todayCol ? (
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: "#d4702a", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700,
                        margin: "2px auto 0",
                      }}>{d.label}</div>
                    ) : (
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#666", marginTop: 2 }}>{d.label}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Task rows (grouped or flat) */}
              {groupedTasks.map(({ groupLabel, tasks: groupTasks }) => (
                <div key={groupLabel ?? "__all"}>
                  {groupLabel && (
                    <div style={{
                      display: "flex", alignItems: "center",
                      background: "#181818",
                      borderBottom: "1px solid #2a2a2a",
                      padding: "5px 16px", gap: 8,
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: TAG_STYLES[groupLabel as TagColor]?.color ?? "#888",
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#666", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                        {groupLabel}
                      </span>
                      <span style={{ fontSize: 11, color: "#444" }}>{groupTasks.length} task{groupTasks.length !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {groupTasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      days={days}
                      todayCol={todayCol}
                      hoveredTask={hoveredTask}
                      setHoveredTask={setHoveredTask}
                      totalDays={totalDays}
                    />
                  ))}
                </div>
              ))}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
