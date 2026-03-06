"use client";
import { useState, useEffect, useTransition } from "react";
import { X, Plus, Pencil, Trash2, Check } from "lucide-react";
import { getTags, createTag, updateTag, deleteTag } from "@/lib/actions";
import type { TagConfig } from "@/lib/types";

const PRESET_COLORS = [
  "#4ade80", "#60a5fa", "#a78bfa", "#f87171", "#fb923c",
  "#facc15", "#34d399", "#f472b6", "#38bdf8", "#a3e635",
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {PRESET_COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          style={{
            width: 20, height: 20, borderRadius: "50%", background: c, border: "none",
            cursor: "pointer", outline: value === c ? `2px solid ${c}` : "none",
            outlineOffset: 2, flexShrink: 0,
          }}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        title="Custom color"
        style={{
          width: 20, height: 20, borderRadius: "50%", border: "1px solid #444",
          cursor: "pointer", padding: 0, background: "none",
        }}
      />
    </div>
  );
}

type EditState = { id: string; name: string; color: string } | null;

export default function TagsManagerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tags, setTags] = useState<TagConfig[]>([]);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [edit, setEdit] = useState<EditState>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      getTags().then(setTags);
      setNewName("");
      setNewColor(PRESET_COLORS[0]);
      setEdit(null);
      setError("");
    }
  }, [open]);

  if (!open) return null;

  function handleAdd() {
    if (!newName.trim()) return;
    setError("");
    startTransition(async () => {
      const result = await createTag(newName, newColor);
      if (result.error) { setError(result.error); return; }
      setNewName("");
      setNewColor(PRESET_COLORS[0]);
      const updated = await getTags();
      setTags(updated);
    });
  }

  function handleSaveEdit() {
    if (!edit || !edit.name.trim()) return;
    setError("");
    startTransition(async () => {
      const result = await updateTag(edit.id, edit.name, edit.color);
      if (result.error) { setError(result.error); return; }
      setEdit(null);
      const updated = await getTags();
      setTags(updated);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTag(id);
      const updated = await getTags();
      setTags(updated);
    });
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 110,
        background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}>
      <div
        style={{
          background: "#1a1a1a", border: "1px solid #2e2e2e", borderRadius: 12,
          width: 420, maxHeight: "80vh", overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: "16px 20px 12px", borderBottom: "1px solid #252525",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Manage Tags</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>

        {/* Tag list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
          {tags.length === 0 && (
            <div style={{ color: "#555", fontSize: 12, textAlign: "center", padding: "20px 0" }}>No tags yet</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {tags.map(tag => (
              <div key={tag.id}>
                {edit?.id === tag.id ? (
                  /* Edit row */
                  <div style={{ background: "#252525", borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: edit.color, flexShrink: 0 }} />
                      <input
                        value={edit.name}
                        onChange={e => setEdit({ ...edit, name: e.target.value })}
                        autoFocus
                        onKeyDown={e => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") setEdit(null); }}
                        style={{
                          flex: 1, background: "#111", border: "1px solid #3a3a3a", borderRadius: 5,
                          padding: "4px 8px", fontSize: 12, color: "#e8e8e8", outline: "none",
                        }}
                      />
                      <button onClick={handleSaveEdit} disabled={isPending}
                        style={{ background: "#d4702a", border: "none", borderRadius: 5, padding: "4px 8px", cursor: "pointer", color: "#fff", display: "flex" }}>
                        <Check size={13} />
                      </button>
                      <button onClick={() => setEdit(null)}
                        style={{ background: "#333", border: "none", borderRadius: 5, padding: "4px 8px", cursor: "pointer", color: "#888", display: "flex" }}>
                        <X size={13} />
                      </button>
                    </div>
                    <ColorPicker value={edit.color} onChange={color => setEdit({ ...edit, color })} />
                  </div>
                ) : (
                  /* Normal row */
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: 7,
                    background: "#111", border: "1px solid #252525",
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#ddd", flex: 1 }}>{tag.name}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={() => setEdit({ id: tag.id, name: tag.name, color: tag.color })}
                        style={{ background: "none", border: "none", color: "#555", cursor: "pointer", display: "flex", padding: 3 }}>
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        disabled={isPending}
                        style={{ background: "none", border: "none", color: "#555", cursor: "pointer", display: "flex", padding: 3 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add new tag */}
        <div style={{ padding: "12px 20px 16px", borderTop: "1px solid #252525" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#555", letterSpacing: "0.07em", marginBottom: 8 }}>NEW TAG</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: newColor, flexShrink: 0, marginTop: 8 }} />
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
              placeholder="Tag name..."
              style={{
                flex: 1, background: "#111", border: "1px solid #2e2e2e", borderRadius: 6,
                padding: "6px 10px", fontSize: 12, color: "#e8e8e8", outline: "none",
              }}
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || isPending}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                background: newName.trim() ? "#d4702a" : "#333",
                color: newName.trim() ? "#fff" : "#555",
                border: "none", borderRadius: 6, padding: "6px 12px",
                fontSize: 12, fontWeight: 600, cursor: newName.trim() ? "pointer" : "default",
              }}>
              <Plus size={13} /> Add
            </button>
          </div>
          <ColorPicker value={newColor} onChange={setNewColor} />
          {error && <div style={{ color: "#f87171", fontSize: 11, marginTop: 6 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
