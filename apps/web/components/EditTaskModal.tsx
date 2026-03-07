"use client";
import { useState, useEffect, useTransition } from "react";
import { X, Flag, AlertCircle, Archive, Trash2, User } from "lucide-react";
import DatePicker from "./DatePicker";
import EstimatePicker from "./EstimatePicker";
import { updateTask, archiveTask, deleteTask, getTags } from "@/lib/actions";
import type { Tag, TaskStatus, TaskView, TagConfig } from "@/lib/types";
import { ALL_STATUSES, STATUS_LABELS } from "@/lib/types";

export default function EditTaskModal({
  task,
  onClose,
}: {
  task: TaskView;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(task.tags);
  const [estimate, setEstimate] = useState(task.estimate ?? "");
  const [assignee, setAssignee] = useState(task.assignee ?? "");
  const [startDate, setStartDate] = useState<string | null>(task.startDate ?? null);
  const [dueDate, setDueDate] = useState<string | null>(task.dueDate ?? null);
  const [flagged, setFlagged] = useState(task.flagged);
  const [blocked, setBlocked] = useState(task.blocked);
  const [progress, setProgress] = useState(task.progress ?? 0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [tagConfigs, setTagConfigs] = useState<TagConfig[]>([]);

  useEffect(() => {
    getTags().then(setTagConfigs);
  }, []);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const toggleTag = (tag: Tag) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  function handleSave() {
    if (!title.trim()) return;
    startTransition(async () => {
      await updateTask(task.id, {
        title: title.trim(),
        description: description || null,
        tags: selectedTags,
        estimate: estimate || null,
        assignee: assignee || null,
        startDate: startDate || null,
        dueDate: dueDate || null,
        flagged,
        blocked,
        progress,
      });
      onClose();
    });
  }

  function handleArchive() {
    startTransition(async () => {
      await archiveTask(task.id);
      onClose();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteTask(task.id);
      onClose();
    });
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}>
      <div
        style={{
          background: "#1a1a1a", border: "1px solid #2e2e2e", borderRadius: 12,
          width: 520, maxHeight: "88vh", overflowY: "auto",
          display: "flex", flexDirection: "column",
        }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid #252525",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{
                width: "100%", background: "transparent", border: "none",
                fontSize: 16, fontWeight: 700, color: "#e8e8e8",
                outline: "none", lineHeight: 1.3,
              }}
              placeholder="Task title..."
            />
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                style={{
                  background: "#252525", border: "1px solid #333",
                  borderRadius: 5, padding: "3px 8px",
                  fontSize: 11, color: "#aaa", outline: "none", cursor: "pointer",
                }}>
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              {flagged && (
                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#c0392b" }}>
                  <Flag size={10} fill="#c0392b" /> Flagged
                </span>
              )}
              {blocked && (
                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#f87171" }}>
                  <AlertCircle size={10} /> Blocked
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 2, flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Planning dates — central for Gantt */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#555", letterSpacing: "0.07em", marginBottom: 8 }}>PLANNING</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <DatePicker
                  label="Start date"
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="No start date"
                />
              </div>
              <div style={{ flex: 1 }}>
                <DatePicker
                  label="Due date"
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder="No due date"
                  minDate={startDate ?? undefined}
                />
              </div>
              <div style={{ flex: 1 }}>
                <EstimatePicker label="Estimate" value={estimate} onChange={setEstimate} />
              </div>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label style={{ fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
              <User size={11} /> Assignee
            </label>
            <input
              value={assignee}
              onChange={e => setAssignee(e.target.value)}
              placeholder="Name or @handle"
              style={{
                width: "100%", background: "#111", border: "1px solid #2e2e2e",
                borderRadius: 6, padding: "6px 10px", fontSize: 12,
                color: "#e8e8e8", outline: "none",
              }}
            />
          </div>

          {/* Tags */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#555", letterSpacing: "0.07em", marginBottom: 8 }}>TAGS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {tagConfigs.map(tc => (
                <button
                  key={tc.id}
                  type="button"
                  onClick={() => toggleTag(tc.name)}
                  style={{
                    padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 500,
                    border: selectedTags.includes(tc.name) ? `1px solid ${tc.color}` : "1px solid #2e2e2e",
                    background: selectedTags.includes(tc.name) ? `${tc.color}22` : "#111",
                    color: selectedTags.includes(tc.name) ? tc.color : "#666",
                    cursor: "pointer",
                  }}>
                  {tc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#555", letterSpacing: "0.07em", marginBottom: 8 }}>NOTES</div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add notes..."
              rows={3}
              style={{
                width: "100%", background: "#111", border: "1px solid #2e2e2e",
                borderRadius: 6, padding: "7px 10px", fontSize: 12,
                color: "#e8e8e8", outline: "none", resize: "vertical",
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Progress */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#555", letterSpacing: "0.07em" }}>PROGRESS</div>
              <span style={{ fontSize: 11, color: "#888", fontVariantNumeric: "tabular-nums" }}>{progress}%</span>
            </div>
            <input
              type="range"
              min={0} max={100} step={5}
              value={progress}
              onChange={e => setProgress(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#c0392b" }}
            />
            <div style={{ background: "#252525", borderRadius: 3, height: 4, marginTop: 4, overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, background: "#c0392b", height: "100%", borderRadius: 3, transition: "width 0.1s" }} />
            </div>
          </div>

          {/* Flags */}
          <div style={{ display: "flex", gap: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={flagged}
                onChange={e => setFlagged(e.target.checked)}
                style={{ accentColor: "#c0392b" }}
              />
              <span style={{ fontSize: 12, color: "#aaa" }}>Important</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={blocked}
                onChange={e => setBlocked(e.target.checked)}
                style={{ accentColor: "#f87171" }}
              />
              <span style={{ fontSize: 12, color: "#aaa" }}>Blocked</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid #252525",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={handleArchive}
              disabled={isPending}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "#252525", border: "1px solid #333",
                borderRadius: 6, padding: "5px 10px",
                fontSize: 12, color: "#888", cursor: "pointer",
              }}>
              <Archive size={12} /> Archive
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "#252525", border: "1px solid #333",
                  borderRadius: 6, padding: "5px 10px",
                  fontSize: 12, color: "#888", cursor: "pointer",
                }}>
                <Trash2 size={12} /> Delete
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, color: "#aaa" }}>Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  style={{
                    background: "#3a1e1e", border: "1px solid #5a2a2a",
                    borderRadius: 6, padding: "5px 10px",
                    fontSize: 12, color: "#f87171", cursor: "pointer", fontWeight: 600,
                  }}>
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    background: "#252525", border: "1px solid #333",
                    borderRadius: 6, padding: "5px 10px",
                    fontSize: 12, color: "#888", cursor: "pointer",
                  }}>
                  No
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                background: "#252525", border: "1px solid #333",
                borderRadius: 6, padding: "6px 14px",
                fontSize: 12, color: "#888", cursor: "pointer",
              }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || isPending}
              style={{
                background: title.trim() ? "#c0392b" : "#333",
                border: "none", borderRadius: 6, padding: "6px 16px",
                fontSize: 12, fontWeight: 600,
                color: title.trim() ? "#fff" : "#666",
                cursor: title.trim() ? "pointer" : "default",
              }}>
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
