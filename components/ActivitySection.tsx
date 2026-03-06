"use client";
import type { ActivityData } from "@/lib/types";

const MONTHS = ["Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
const HEAT_COLORS = ["#1e1e1e", "#3a2410", "#6b3d18", "#9e5a24", "#d4702a"];

export default function ActivitySection({ data }: { data: ActivityData }) {
  const { grid, totalShipped, bestWeekLabel, bestWeekCount, bestDay, avgPerWeek, activeDays, totalDays, streakDays, monthlyOutput } = data;
  const monthlyMax = Math.max(...monthlyOutput.map(m => m.value), 1);

  return (
    <div style={{ background: "#242424", border: "1px solid #2e2e2e", borderRadius: 8, padding: "14px 16px" }}>
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
          <div className="flex gap-0.5 mb-1 ml-3">
            {MONTHS.map((m, i) => (
              <div key={i} style={{ flex: "0 0 calc(100%/7)", fontSize: 10, color: "#555", textAlign: "center" }}>{m}</div>
            ))}
          </div>
          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${grid.length}, 1fr)`, gap: 2 }}>
            {grid.map((week, wi) =>
              week.map((level, di) => (
                <div key={`${wi}-${di}`}
                     style={{ width: "100%", aspectRatio: "1", background: HEAT_COLORS[level], borderRadius: 2 }} />
              ))
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ minWidth: 180 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{totalShipped}</div>
            <div style={{ color: "#666", fontSize: 11 }}>tasks shipped · 26 weeks</div>
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
            {monthlyOutput.map(({ month, value }) => (
              <div key={month} className="flex flex-col items-center gap-1 flex-1">
                <div style={{
                  width: "100%", borderRadius: "2px 2px 0 0",
                  height: `${(value / monthlyMax) * 40}px`,
                  background: month === "Mar" ? "#d4702a" : "#333",
                  minHeight: 3,
                }} />
                <span style={{ color: "#555", fontSize: 10 }}>{month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
