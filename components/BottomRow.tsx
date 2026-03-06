"use client";
import { useState, useTransition } from "react";
import type { WeeklyPlanView, QuickCaptureView } from "@/lib/types";
import { addQuickCapture, promoteCapture, toggleWeeklyPlanDone, addWeeklyPlanEntry } from "@/lib/actions";
import { Plus, Clock, ArrowUpRight } from "lucide-react";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI"];

function WeeklyPlan({ entries }: { entries: WeeklyPlanView[] }) {
  const [adding, setAdding] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  // Group entries by dayOfWeek (0=Mon .. 4=Fri)
  const byDay: Record<number, WeeklyPlanView[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  for (const e of entries) {
    if (byDay[e.dayOfWeek]) byDay[e.dayOfWeek].push(e);
  }

  // Week range label
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

  return (
    <div style={{ background: "#242424", border: "1px solid #2e2e2e", borderRadius: 8, padding: "14px 16px", flex: 1 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ fontWeight: 700, fontSize: 13 }}>Weekly Plan</span>
          <span style={{ color: "#555", fontSize: 11 }}>{rangeLabel}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {DAY_LABELS.map((day, idx) => {
          const dayTasks = byDay[idx] || [];
          return (
            <div key={day} className="flex items-center gap-2">
              <span style={{ width: 28, fontSize: 11, color: "#555", fontWeight: 600 }}>{day}</span>
              <div style={{ flex: 1, display: "flex", gap: 4 }}>
                {dayTasks.map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => handleToggle(entry.id)}
                    style={{
                      flex: 1,
                      background: entry.done ? "#1e2a1e" : "#1e1e1e",
                      border: `1px solid ${entry.done ? "#2a4a2a" : "#2a2a2a"}`,
                      borderRadius: 4,
                      padding: "4px 8px",
                      fontSize: 12,
                      color: entry.done ? "#4ade80" : "#ccc",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      cursor: "pointer",
                      textAlign: "left",
                    }}>
                    {entry.done && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />}
                    {entry.taskTitle}
                  </button>
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

function QuickCapture({ captures }: { captures: QuickCaptureView[] }) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    startTransition(async () => {
      await addQuickCapture(text.trim());
      setText("");
    });
  }

  function handlePromote(id: string) {
    startTransition(async () => {
      await promoteCapture(id);
    });
  }

  return (
    <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, padding: "14px 16px", width: 280 }}>
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontWeight: 700, fontSize: 13 }}>Quick Capture</span>
        <kbd style={{
          background: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: 4,
          padding: "1px 5px", fontSize: 10, color: "#888",
        }}>⌘K</kbd>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{
          background: "#1a1a1a", border: "1px solid #333", borderRadius: 6,
          padding: "7px 10px", marginBottom: 12,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Plus size={13} color="#555" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Drop an idea…"
            style={{
              flex: 1, background: "transparent", border: "none",
              color: "#ccc", fontSize: 12, outline: "none",
            }}
          />
        </div>
      </form>

      <div style={{ color: "#555", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 8 }}>RECENT</div>
      <div className="flex flex-col gap-1.5">
        {captures.map((item) => (
          <div key={item.id} className="flex items-center justify-between" style={{ cursor: "pointer" }}>
            <div className="flex items-center gap-2" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#333", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.text}</span>
            </div>
            <button
              onClick={() => handlePromote(item.id)}
              title="Promote to task"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#555", padding: 2, flexShrink: 0,
              }}>
              <ArrowUpRight size={12} />
            </button>
          </div>
        ))}
        {captures.length === 0 && (
          <span style={{ fontSize: 12, color: "#444" }}>No captures yet</span>
        )}
      </div>
    </div>
  );
}

export default function BottomRow({ weeklyPlan, captures }: { weeklyPlan: WeeklyPlanView[]; captures: QuickCaptureView[] }) {
  return (
    <div className="flex gap-3">
      <WeeklyPlan entries={weeklyPlan} />
      <QuickCapture captures={captures} />
    </div>
  );
}
