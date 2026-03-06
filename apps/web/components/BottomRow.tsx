"use client";
import { useState, useTransition } from "react";
import type { WeeklyPlanView } from "@/lib/types";
import { toggleWeeklyPlanDone, addWeeklyPlanEntry, removeWeeklyPlanEntry } from "@/lib/actions";
import { Plus, X } from "lucide-react";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI"];

export default function BottomRow({ weeklyPlan }: { weeklyPlan: WeeklyPlanView[] }) {
  const [adding, setAdding] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const byDay: Record<number, WeeklyPlanView[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  for (const e of weeklyPlan) {
    if (byDay[e.dayOfWeek]) byDay[e.dayOfWeek].push(e);
  }

  const now = new Date();
  const monday = new Date(now);
  const dow = monday.getDay();
  monday.setDate(monday.getDate() - dow + (dow === 0 ? -6 : 1));
  const friday = new Date(monday);
  friday.setDate(friday.getDate() + 4);
  const rangeLabel = `${monday.toLocaleDateString("en", { month: "short", day: "2-digit" })}–${friday.toLocaleDateString("en", { day: "2-digit" })}`;

  function handleAdd(dayOfWeek: number) {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      await addWeeklyPlanEntry(dayOfWeek, newTitle.trim());
      setNewTitle("");
      setAdding(null);
    });
  }

  function handleToggle(entryId: string) {
    startTransition(async () => {
      await toggleWeeklyPlanDone(entryId);
    });
  }

  function handleRemove(entryId: string) {
    startTransition(async () => {
      await removeWeeklyPlanEntry(entryId);
    });
  }

  return (
    <div style={{ background: "#242424", border: "1px solid #2e2e2e", borderRadius: 8, padding: "14px 16px" }}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontWeight: 700, fontSize: 13 }}>Weekly Plan</span>
        <span style={{ color: "#555", fontSize: 11 }}>{rangeLabel}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {DAY_LABELS.map((day, idx) => {
          const dayTasks = byDay[idx] || [];
          return (
            <div key={day} className="flex items-center gap-2">
              <span style={{ width: 28, fontSize: 11, color: "#555", fontWeight: 600 }}>{day}</span>
              <div style={{ flex: 1, display: "flex", gap: 4 }}>
                {dayTasks.map(entry => (
                  <div
                    key={entry.id}
                    style={{
                      flex: 1,
                      background: entry.done ? "#1e2a1e" : "#1e1e1e",
                      border: `1px solid ${entry.done ? "#2a4a2a" : "#2a2a2a"}`,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      overflow: "hidden",
                    }}>
                    <button
                      onClick={() => handleToggle(entry.id)}
                      style={{
                        flex: 1, background: "none", border: "none",
                        padding: "4px 8px", fontSize: 12,
                        color: entry.done ? "#4ade80" : "#ccc",
                        display: "flex", alignItems: "center", gap: 4,
                        cursor: "pointer", textAlign: "left",
                      }}>
                      {entry.done && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />}
                      {entry.taskTitle}
                    </button>
                    <button
                      onClick={() => handleRemove(entry.id)}
                      style={{
                        background: "none", border: "none",
                        padding: "4px 5px", cursor: "pointer",
                        color: "#444", flexShrink: 0,
                        display: "flex", alignItems: "center",
                      }}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {dayTasks.length === 0 && adding !== idx && (
                  <button
                    onClick={() => setAdding(idx)}
                    style={{
                      flex: 1, background: "#1a1a1a", border: "1px dashed #2a2a2a",
                      borderRadius: 4, padding: "4px 8px", fontSize: 12, color: "#444",
                      cursor: "pointer",
                    }}>
                    —
                  </button>
                )}
                {adding === idx && (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleAdd(idx); }}
                    style={{ flex: 1, display: "flex", gap: 4 }}
                  >
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onBlur={() => { if (!newTitle.trim()) setAdding(null); }}
                      placeholder="Task title..."
                      style={{
                        flex: 1, background: "#1e1e1e", border: "1px solid #444",
                        borderRadius: 4, padding: "4px 8px", fontSize: 12,
                        color: "#ccc", outline: "none",
                      }}
                    />
                  </form>
                )}
                {dayTasks.length > 0 && (
                  <button
                    onClick={() => setAdding(idx)}
                    style={{
                      background: "none", border: "1px dashed #2a2a2a",
                      borderRadius: 4, padding: "2px 6px",
                      cursor: "pointer", color: "#444",
                    }}>
                    <Plus size={11} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
