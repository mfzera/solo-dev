"use client";
import { useState, useRef, useEffect, useTransition } from "react";
import type { ActivityData } from "@/lib/types";
import { fetchCompletedTasksOnDay } from "@/lib/actions";
import { parseTags } from "@/lib/helpers";

const HEAT_COLORS = ["#1e1e1e", "#3a2410", "#6b3d18", "#9e5a24", "#d4702a"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
}

function formatTooltip(dateStr: string, count: number) {
  const d = new Date(dateStr + "T12:00:00Z");
  const day = d.getDate();
  const month = d.toLocaleDateString("en", { month: "long" });
  const suffix = day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th";
  return count === 0
    ? `No tasks on ${day}${suffix} ${month}`
    : `${count} task${count > 1 ? "s" : ""} on ${day}${suffix} ${month}`;
}

type DayTask = { id: string; title: string; tags: string };

const TODAY = new Date().toISOString().slice(0, 10);

export default function ActivitySection({ data, tagColors = {} }: { data: ActivityData; tagColors?: Record<string, string> }) {
  const { grid, totalShipped, bestWeekLabel, bestWeekCount, bestDay, avgPerWeek, activeDays, totalDays, streakDays, monthlyOutput } = data;
  const monthlyMax = Math.max(...monthlyOutput.map(m => m.value), 1);

  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null);
  const [popover, setPopover] = useState<{ date: string; tasks: DayTask[]; x: number; y: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleCellClick(date: string, level: number, e: React.MouseEvent) {
    if (level === 0) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current!.getBoundingClientRect();
    const x = rect.left - containerRect.left + rect.width / 2;
    const y = rect.top - containerRect.top;

    startTransition(async () => {
      const tasks = await fetchCompletedTasksOnDay(date);
      setPopover({ date, tasks, x, y });
    });
  }

  return (
    <div ref={containerRef} style={{ background: "#242424", border: "1px solid #2e2e2e", borderRadius: 8, padding: "14px 16px", position: "relative" }}>
      <div className="flex items-start gap-8">
        {/* Heatmap */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span style={{ color: "#666", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em" }}>ACTIVITY</span>
              {streakDays > 0 && (
                <span style={{ background: "#2e2010", color: "#d4702a", fontSize: 10, padding: "1px 6px", borderRadius: 10, fontWeight: 600 }}>
                  {streakDays}d streak
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: "#555", fontSize: 11 }}>Less</span>
              <div className="flex gap-0.5">
                {HEAT_COLORS.map((c, i) => (
                  <div key={i} style={{ width: 10, height: 10, background: c, borderRadius: 2 }} />
                ))}
              </div>
              <span style={{ color: "#555", fontSize: 11 }}>More</span>
            </div>
          </div>
          {/* Month labels */}
          <div style={{ display: "flex", marginBottom: 4, width: 52 * 14 - 2 }}>
            {monthlyOutput.map(({ month }, i) => (
              <div key={i} style={{ flex: "1 1 0", fontSize: 10, color: "#555" }}>{month}</div>
            ))}
          </div>
          {/* Grid */}
          <div style={{ display: "grid", gridTemplateRows: "repeat(7, 12px)", gridAutoFlow: "column", gridAutoColumns: "12px", gap: 2 }}>
            {grid.map((week, wi) =>
              week.map(({ date, level, count }, di) => (
                <div
                  key={`${wi}-${di}`}
                  onClick={(e) => handleCellClick(date, level, e)}
                  style={{
                    width: 12,
                    height: 12,
                    background: date > TODAY ? "transparent" : HEAT_COLORS[level],
                    borderRadius: 2,
                    cursor: level > 0 ? "pointer" : "default",
                    transition: "filter 0.1s",
                  }}
                  onMouseEnter={e => {
                    if (date > TODAY) return;
                    if (level > 0) (e.target as HTMLElement).style.filter = "brightness(1.3)";
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    const containerRect = containerRef.current!.getBoundingClientRect();
                    setTooltip({
                      label: formatTooltip(date, count),
                      x: rect.left - containerRect.left + rect.width / 2,
                      y: rect.top - containerRect.top,
                    });
                  }}
                  onMouseLeave={e => {
                    (e.target as HTMLElement).style.filter = "";
                    setTooltip(null);
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ minWidth: 180 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{totalShipped}</div>
            <div style={{ color: "#666", fontSize: 11 }}>tasks shipped · 52 weeks</div>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: "Best week",   value: `${bestWeekLabel} · ${bestWeekCount} tasks` },
              { label: "Best day",    value: bestDay },
              { label: "Avg / week",  value: `${avgPerWeek} tasks` },
              { label: "Active days", value: `${activeDays} / ${totalDays}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-6">
                <span style={{ color: "#666", fontSize: 12 }}>{label}</span>
                <span style={{ fontSize: 12, color: "#ccc" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly output */}
        <div style={{ minWidth: 200 }}>
          <div style={{ color: "#555", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 8 }}>MONTHLY OUTPUT</div>
          <div className="flex items-end gap-2" style={{ height: 48 }}>
            {monthlyOutput.map(({ month, value, isCurrent }) => (
              <div key={month} className="flex flex-col items-center gap-1 flex-1">
                <div style={{
                  width: "100%", borderRadius: "2px 2px 0 0",
                  height: `${(value / monthlyMax) * 40}px`,
                  background: isCurrent ? "#d4702a" : "#333",
                  minHeight: 3,
                }} />
                <span style={{ color: "#555", fontSize: 10 }}>{month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {tooltip && !popover && (
        <div style={{
          position: "absolute",
          left: tooltip.x,
          top: tooltip.y - 6,
          transform: "translate(-50%, -100%)",
          background: "#111",
          border: "1px solid #2e2e2e",
          borderRadius: 5,
          padding: "4px 8px",
          fontSize: 11,
          color: "#bbb",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          zIndex: 40,
        }}>
          {tooltip.label}
        </div>
      )}

      {/* Popover */}
      {popover && (
        <div
          style={{
            position: "absolute",
            left: Math.min(popover.x, (containerRef.current?.offsetWidth ?? 600) - 220),
            top: popover.y - 8,
            transform: "translate(-50%, -100%)",
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 8,
            padding: "10px 12px",
            minWidth: 200,
            maxWidth: 280,
            zIndex: 50,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ color: "#888", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 8 }}>
            {formatDate(popover.date)}
          </div>
          {isPending ? (
            <div style={{ color: "#555", fontSize: 12 }}>Loading…</div>
          ) : popover.tasks.length === 0 ? (
            <div style={{ color: "#555", fontSize: 12 }}>No tasks found</div>
          ) : (
            <div className="flex flex-col gap-2">
              {popover.tasks.map(task => {
                const tags = parseTags(task.tags);
                return (
                  <div key={task.id} className="flex items-start gap-2">
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#d4702a", marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, color: "#ddd", lineHeight: 1.4 }}>{task.title}</div>
                      {tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {tags.map(tag => (
                            <span key={tag} style={{ fontSize: 10, color: tagColors[tag] ?? "#888", background: "#252525", padding: "1px 5px", borderRadius: 4 }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Arrow */}
          <div style={{
            position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)",
            width: 10, height: 10, background: "#1a1a1a", border: "1px solid #333",
            borderTop: "none", borderLeft: "none",
            rotate: "45deg",
          }} />
        </div>
      )}
    </div>
  );
}
