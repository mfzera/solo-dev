"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from "lucide-react";

type TagColor = "frontend" | "backend" | "infra" | "bug";

const TAG_STYLES: Record<TagColor, { bg: string; color: string }> = {
  frontend: { bg: "#1e3a2f", color: "#4ade80" },
  backend:  { bg: "#1e2a3a", color: "#60a5fa" },
  infra:    { bg: "#2a1e3a", color: "#a78bfa" },
  bug:      { bg: "#3a1e1e", color: "#f87171" },
};

const BAR_COLORS: Record<TagColor, { bg: string; border: string }> = {
  frontend: { bg: "#2563eb", border: "#3b82f6" },
  backend:  { bg: "#7c3aed", border: "#8b5cf6" },
  infra:    { bg: "#15803d", border: "#22c55e" },
  bug:      { bg: "#b91c1c", border: "#ef4444" },
};

// Days: Feb 24 = col 0, Feb 25 = col 1 ... Mar 9 = col 13
const DAYS = [
  { label: "24", month: "FEB", col: 0 },
  { label: "25", month: "FEB", col: 1 },
  { label: "26", month: "FEB", col: 2 },
  { label: "27", month: "FEB", col: 3 },
  { label: "28", month: "FEB", col: 4 },
  { label: "1",  month: "MAR", col: 5 },
  { label: "2",  month: "MAR", col: 6 },
  { label: "3",  month: "MAR", col: 7 },
  { label: "4",  month: "MAR", col: 8 },
  { label: "5",  month: "MAR", col: 9 },  // TODAY
  { label: "6",  month: "MAR", col: 10 },
  { label: "7",  month: "MAR", col: 11 },
  { label: "8",  month: "MAR", col: 12 },
  { label: "9",  month: "MAR", col: 13 },
];

const WEEKDAYS = ["M","T","W","T","F","S","S","M","T","W","T","F","S","S"];
const TODAY_COL = 9; // Mar 5

interface Task {
  id: string;
  name: string;
  tags: TagColor[];
  dateLabel: string;
  duration: string;
  startCol: number;
  spanCols: number;
  barLabel: string;
  ongoing?: boolean;
  highlighted?: boolean;
}

const TASKS: Task[] = [
  { id:"t1", name:"JWT auth middleware",        tags:["backend"],           dateLabel:"Feb 24 · 7h",        duration:"7h",        startCol:0, spanCols:1,  barLabel:"7h" },
  { id:"t2", name:"Landing page hero redesign", tags:["frontend"],          dateLabel:"Feb 25 · 5h",        duration:"5h",        startCol:1, spanCols:1,  barLabel:"5h" },
  { id:"t3", name:"Postgres backup cron job",   tags:["infra"],             dateLabel:"Feb 25–26 · 10h",    duration:"10h",       startCol:1, spanCols:2,  barLabel:"10h" },
  { id:"t4", name:"Onboarding checklist comp",  tags:["frontend"],          dateLabel:"Feb 26–27 · 8h",     duration:"8h",        startCol:2, spanCols:2,  barLabel:"8h" },
  { id:"t5", name:"Fix: pagination /projects",  tags:["bug"],               dateLabel:"Feb 27 · 2h",        duration:"2h",        startCol:3, spanCols:1,  barLabel:"2h" },
  { id:"t6", name:"Rate limiting endpoints",    tags:["backend"],           dateLabel:"Feb 27–28 · 6h",     duration:"6h",        startCol:3, spanCols:2,  barLabel:"6h" },
  { id:"t7", name:"User profile settings page", tags:["frontend"],          dateLabel:"Feb 28–Mar 3 · 14h", duration:"14h",       startCol:4, spanCols:5,  barLabel:"14h · 3.5 days", highlighted:true },
  { id:"t8", name:"Fix: null ptr on org query", tags:["bug"],               dateLabel:"Mar 3 · 1.5h",       duration:"1.5h",      startCol:7, spanCols:1,  barLabel:"1.5h" },
  { id:"t9", name:"Subscription upgrade flow",  tags:["frontend"],          dateLabel:"Mar 3 · ongoing · 2d+", duration:"2d+",   startCol:7, spanCols:7,  barLabel:"2d+ ongoing", ongoing:true },
  { id:"t10",name:"DB migration: team roles",   tags:["infra","backend"],   dateLabel:"Mar 5 · ongoing · 1d+", duration:"1d+",   startCol:9, spanCols:5,  barLabel:"1d+ ongoing", ongoing:true },
];

const FILTERS: { label: string; tag?: TagColor }[] = [
  { label: "All tasks" },
  { label: "Frontend", tag: "frontend" },
  { label: "Backend",  tag: "backend" },
  { label: "Infra",    tag: "infra" },
  { label: "Bugs",     tag: "bug" },
];

const COL_W = 64; // px per day column
const TASK_COL_W = 240;

function TagBadge({ tag }: { tag: TagColor }) {
  const s = TAG_STYLES[tag];
  return (
    <span style={{ background: s.bg, color: s.color, padding: "1px 5px", borderRadius: 3, fontSize: 10, fontWeight: 500 }}>
      {tag}
    </span>
  );
}

function TaskBar({ task, onHover, hovered }: { task: Task; onHover: (id: string | null) => void; hovered: boolean }) {
  const primary = task.tags[0];
  const color = BAR_COLORS[primary];
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
      {/* Tooltip */}
      {hovered && (
        <div style={{
          position: "absolute", top: -36, left: "50%", transform: "translateX(-50%)",
          background: "#111", border: "1px solid #333", borderRadius: 6,
          padding: "5px 10px", whiteSpace: "nowrap", zIndex: 20,
          fontSize: 11, color: "#ddd", pointerEvents: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}>
          {task.name} · {task.dateLabel.split(" · ")[0].replace("–","–")} · <strong>{task.duration} total</strong>
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

export default function PlanningPage() {
  const [activeFilter, setActiveFilter] = useState("All tasks");
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [activeView, setActiveView] = useState("2 Weeks");

  const filteredTasks = activeFilter === "All tasks"
    ? TASKS
    : TASKS.filter(t => t.tags.includes(activeFilter.toLowerCase() as TagColor) ||
        (activeFilter === "Bugs" && t.tags.includes("bug")));

  const totalWidth = DAYS.length * COL_W;

  // Month groups for header
  const monthGroups = [
    { label: "FEB", from: 0, count: 5 },
    { label: "MAR", from: 5, count: 9 },
  ];

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
            How long tasks actually took · W9–W10 · SaaS Builder Pro
          </p>
        </div>

        {/* View controls */}
        <div className="flex items-center gap-2">
          {["Week","2 Weeks","Month","Custom"].map(v => (
            <button key={v} onClick={() => setActiveView(v)}
                    style={{
                      background: activeView === v ? "#e8e8e8" : "transparent",
                      color: activeView === v ? "#111" : "#888",
                      border: activeView === v ? "none" : "1px solid #333",
                      borderRadius: 5, padding: "4px 12px",
                      fontSize: 12, fontWeight: activeView === v ? 600 : 400,
                      cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
              {v === "Custom" && <Calendar size={12} />}
              {v}
            </button>
          ))}
          <div style={{ width: 1, height: 20, background: "#333", margin: "0 4px" }} />
          <button style={{ background: "none", border: "1px solid #333", borderRadius: 5, padding: "4px 6px", cursor: "pointer", color: "#888" }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: "#ccc", whiteSpace: "nowrap", padding: "0 4px" }}>Feb 24 – Mar 9</span>
          <button style={{ background: "none", border: "1px solid #333", borderRadius: 5, padding: "4px 6px", cursor: "pointer", color: "#888" }}>
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
        <div className="flex items-center gap-2">
          <span style={{ color: "#666", fontSize: 12 }}>Group by:</span>
          <button style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "#1e1e1e", border: "1px solid #333",
            borderRadius: 5, padding: "4px 10px",
            fontSize: 12, color: "#ccc", cursor: "pointer",
          }}>
            Category <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {/* Avg duration */}
        <div style={{ background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 8, padding: "14px 16px", color: "#111" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#999", letterSpacing: "0.06em", marginBottom: 6 }}>AVG DURATION</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, marginBottom: 2 }}>1.8</div>
          <div style={{ fontSize: 12, color: "#666" }}>days / task</div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>+12.6h actual work</div>
        </div>
        {/* Longest */}
        <div style={{ background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 8, padding: "14px 16px", color: "#111" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#999", letterSpacing: "0.06em", marginBottom: 6 }}>LONGEST TASK</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>User profile settings</div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12, color: "#555" }}>14h · 3.5 days</span>
            <span style={{ background: TAG_STYLES.frontend.bg, color: TAG_STYLES.frontend.color, padding: "1px 5px", borderRadius: 3, fontSize: 10 }}>frontend</span>
          </div>
        </div>
        {/* Shortest */}
        <div style={{ background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 8, padding: "14px 16px", color: "#111" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#999", letterSpacing: "0.06em", marginBottom: 6 }}>SHORTEST TASK</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Fix: null ptr on org</div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12, color: "#555" }}>1.5h · same day</span>
            <span style={{ background: TAG_STYLES.bug.bg, color: TAG_STYLES.bug.color, padding: "1px 5px", borderRadius: 3, fontSize: 10 }}>bug</span>
          </div>
        </div>
        {/* Completed */}
        <div style={{ background: "#f9f9f9", border: "1px solid #e5e5e5", borderRadius: 8, padding: "14px 16px", color: "#111" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#999", letterSpacing: "0.06em", marginBottom: 6 }}>COMPLETED</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, marginBottom: 2 }}>8</div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>tasks · 2 in progress</div>
          <div className="flex gap-1" style={{ height: 4 }}>
            {[
              { w: "35%", c: "#4ade80" }, { w: "25%", c: "#60a5fa" },
              { w: "25%", c: "#a78bfa" }, { w: "15%", c: "#f87171" },
            ].map((s, i) => (
              <div key={i} style={{ width: s.w, background: s.c, borderRadius: 2 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Timeline grid */}
      <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 8, overflow: "hidden", color: "#111" }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: TASK_COL_W + totalWidth + 1 }}>

            {/* Month header row */}
            <div className="flex" style={{ borderBottom: "1px solid #e5e5e5", background: "#fafafa" }}>
              <div style={{ width: TASK_COL_W, flexShrink: 0, padding: "8px 16px", fontSize: 11, fontWeight: 600, color: "#999" }}>TASK</div>
              <div style={{ flex: 1, position: "relative", display: "flex" }}>
                {monthGroups.map(({ label, count }) => (
                  <div key={label} style={{
                    width: count * COL_W,
                    padding: "4px 8px",
                    fontSize: 11, fontWeight: 600, color: "#aaa",
                    borderLeft: "1px solid #eee",
                  }}>{label}</div>
                ))}
              </div>
            </div>

            {/* Day header row */}
            <div className="flex" style={{ borderBottom: "1px solid #e5e5e5", background: "#fafafa" }}>
              <div style={{ width: TASK_COL_W, flexShrink: 0 }} />
              {DAYS.map((d, i) => (
                <div key={i} style={{
                  width: COL_W, flexShrink: 0, textAlign: "center",
                  padding: "4px 0",
                  borderLeft: "1px solid #eee",
                  position: "relative",
                }}>
                  <div style={{ fontSize: 10, color: "#aaa", lineHeight: 1 }}>{WEEKDAYS[i]}</div>
                  {d.col === TODAY_COL ? (
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: "#d4702a", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700,
                      margin: "2px auto 0",
                    }}>{d.label}</div>
                  ) : (
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#555", marginTop: 2 }}>{d.label}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Task rows */}
            {filteredTasks.map((task) => (
              <div key={task.id}
                   style={{
                     display: "flex", alignItems: "stretch",
                     borderBottom: "1px solid #f0f0f0",
                     background: task.highlighted ? "#f0f4ff" : "transparent",
                     minHeight: 48,
                   }}>
                {/* Task info */}
                <div style={{ width: TASK_COL_W, flexShrink: 0, padding: "8px 16px", borderRight: "1px solid #eee" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {!task.ongoing && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#111", lineHeight: 1.3 }}>{task.name}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {task.tags.map(t => <TagBadge key={t} tag={t} />)}
                    <span style={{ fontSize: 10, color: "#aaa" }}>{task.dateLabel}</span>
                  </div>
                </div>

                {/* Bar area */}
                <div style={{ flex: 1, position: "relative", display: "flex" }}>
                  {/* Column lines */}
                  {DAYS.map((d, i) => (
                    <div key={i} style={{
                      width: COL_W, flexShrink: 0,
                      borderLeft: "1px solid #f0f0f0",
                      background: d.col === TODAY_COL ? "rgba(212,112,42,0.04)" : "transparent",
                    }} />
                  ))}
                  {/* Today line */}
                  <div style={{
                    position: "absolute",
                    left: TODAY_COL * COL_W,
                    top: 0, bottom: 0,
                    width: 1,
                    background: "rgba(212,112,42,0.3)",
                    pointerEvents: "none",
                  }} />
                  {/* Bar */}
                  <TaskBar task={task} onHover={setHoveredTask} hovered={hoveredTask === task.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
