"use client";
import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { createTask, getTags } from "@/lib/actions";
import type { Tag, TaskStatus, TagConfig } from "@/lib/types";
import { ALL_STATUSES, STATUS_LABELS } from "@/lib/types";
import DatePicker from "./DatePicker";
import EstimatePicker from "./EstimatePicker";

export default function NewTaskModal({ open, onClose, initialStatus = "ideas" }: { open: boolean; onClose: () => void; initialStatus?: TaskStatus }) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [estimate, setEstimate] = useState("");
  const [description, setDescription] = useState("");
  const [flagged, setFlagged] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tagConfigs, setTagConfigs] = useState<TagConfig[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (open) {
      setStatus(initialStatus);
      getTags().then(setTagConfigs);
    }
  }, [open, initialStatus]);

  if (!open) return null;

  const toggleTag = (tag: Tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    await createTask({ title: title.trim(), status, tags: selectedTags, estimate: estimate || undefined, description: description || undefined, flagged, startDate, dueDate });
    setTitle(""); setStatus("ideas"); setSelectedTags([]); setEstimate(""); setDescription(""); setFlagged(false); setStartDate(null); setDueDate(null);
    setSubmitting(false);
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#1e1e1e", border: "1px solid #333", borderRadius: 10,
        width: 440, maxHeight: "80vh", overflow: "auto",
        padding: 20,
      }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>New Task</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit}>
          {/* Title */}
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Task title..."
            autoFocus
            style={{
              width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6,
              padding: "8px 10px", fontSize: 13, color: "#e8e8e8", outline: "none",
              marginBottom: 12,
            }}
          />

          {/* Status */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Status</label>
            <select
              value={status} onChange={e => setStatus(e.target.value as TaskStatus)}
              style={{
                width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6,
                padding: "6px 10px", fontSize: 12, color: "#e8e8e8", outline: "none",
              }}>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {tagConfigs.map(tc => (
                <button type="button" key={tc.id} onClick={() => toggleTag(tc.name)}
                  style={{
                    padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500,
                    border: selectedTags.includes(tc.name) ? `1px solid ${tc.color}` : "1px solid #333",
                    background: selectedTags.includes(tc.name) ? `${tc.color}22` : "transparent",
                    color: selectedTags.includes(tc.name) ? tc.color : "#888",
                    cursor: "pointer",
                  }}>
                  {tc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div style={{ marginBottom: 12, display: "flex", gap: 10 }}>
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
          </div>

          {/* Estimate */}
          <div style={{ marginBottom: 12 }}>
            <EstimatePicker label="Estimate" value={estimate} onChange={setEstimate} />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4 }}>Description</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              style={{
                width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6,
                padding: "6px 10px", fontSize: 12, color: "#e8e8e8", outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          {/* Flagged */}
          <label className="flex items-center gap-2" style={{ marginBottom: 16, cursor: "pointer" }}>
            <input type="checkbox" checked={flagged} onChange={e => setFlagged(e.target.checked)} />
            <span style={{ fontSize: 12, color: "#aaa" }}>Flag as important</span>
          </label>

          {/* Submit */}
          <button type="submit" disabled={!title.trim() || submitting}
            style={{
              width: "100%", padding: "8px 0", borderRadius: 6,
              background: title.trim() ? "#d4702a" : "#333",
              color: title.trim() ? "#fff" : "#666",
              border: "none", fontSize: 13, fontWeight: 600, cursor: title.trim() ? "pointer" : "default",
            }}>
            {submitting ? "Creating..." : "Create Task"}
          </button>
        </form>
      </div>
    </div>
  );
}
