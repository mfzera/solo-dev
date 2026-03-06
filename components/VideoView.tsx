"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Plus, Trash2, Video, FileText, Lightbulb, ChevronRight } from "lucide-react";
import type { VideoSessionView, VideoStatus } from "@/lib/types";
import { ALL_VIDEO_STATUSES, VIDEO_STATUS_LABELS } from "@/lib/types";
import {
  createVideoSession,
  updateVideoSession,
  deleteVideoSession,
} from "@/lib/actions";

const STATUS_COLORS: Record<VideoStatus, { bg: string; text: string; dot: string }> = {
  idea:       { bg: "#1e1e1e", text: "#888",    dot: "#555" },
  scripting:  { bg: "#1a1f2e", text: "#6b8cde", dot: "#6b8cde" },
  filming:    { bg: "#1f1a10", text: "#c9843a", dot: "#c9843a" },
  editing:    { bg: "#1a1f1a", text: "#5a9e5a", dot: "#5a9e5a" },
  published:  { bg: "#1a1a2e", text: "#a06cd5", dot: "#a06cd5" },
};

function StatusBadge({ status }: { status: VideoStatus }) {
  const s = STATUS_COLORS[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.text,
      padding: "2px 8px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {VIDEO_STATUS_LABELS[status].toUpperCase()}
    </span>
  );
}

interface Props {
  initialVideos: VideoSessionView[];
}

export default function VideoView({ initialVideos }: Props) {
  const [videos, setVideos] = useState<VideoSessionView[]>(initialVideos);
  const [selectedId, setSelectedId] = useState<string | null>(initialVideos[0]?.id ?? null);
  const [isPending, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const newInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) newInputRef.current?.focus();
  }, [adding]);

  const selected = videos.find(v => v.id === selectedId) ?? null;

  function optimisticUpdate(id: string, data: Partial<VideoSessionView>) {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));
  }

  function handleCreate() {
    const title = newTitle.trim();
    if (!title) { setAdding(false); return; }
    startTransition(async () => {
      const created = await createVideoSession(title);
      const entry: VideoSessionView = {
        id: created.id,
        title: created.title,
        status: created.status as VideoStatus,
        script: created.script,
        ideas: created.ideas,
        tags: [],
        sortOrder: created.sortOrder,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
      setVideos(prev => [...prev, entry]);
      setSelectedId(entry.id);
      setNewTitle("");
      setAdding(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteVideoSession(id);
      setVideos(prev => {
        const next = prev.filter(v => v.id !== id);
        if (selectedId === id) setSelectedId(next[0]?.id ?? null);
        return next;
      });
    });
  }

  function handleStatusChange(id: string, status: VideoStatus) {
    optimisticUpdate(id, { status });
    startTransition(() => updateVideoSession(id, { status }));
  }

  function handleTitleChange(id: string, title: string) {
    optimisticUpdate(id, { title });
    startTransition(() => updateVideoSession(id, { title }));
  }

  function handleScriptChange(id: string, script: string) {
    optimisticUpdate(id, { script });
    startTransition(() => updateVideoSession(id, { script: script || null }));
  }

  function handleIdeasChange(id: string, ideas: string) {
    optimisticUpdate(id, { ideas });
    startTransition(() => updateVideoSession(id, { ideas: ideas || null }));
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 40px)", background: "#111", color: "#e8e8e8" }}>
      {/* Sidebar */}
      <aside style={{
        width: 260, flexShrink: 0,
        borderRight: "1px solid #2a2a2a",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "14px 16px 10px",
          borderBottom: "1px solid #1e1e1e",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Video size={14} color="#d4702a" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#aaa", letterSpacing: "0.06em" }}>
              VIDEOS
            </span>
          </div>
          <button
            onClick={() => setAdding(true)}
            title="New video"
            style={{
              background: "transparent", border: "none",
              color: "#555", cursor: "pointer",
              padding: 2, display: "flex", alignItems: "center",
            }}>
            <Plus size={15} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {videos.length === 0 && !adding && (
            <p style={{ color: "#444", fontSize: 12, padding: "12px 16px", textAlign: "center" }}>
              No videos yet.
            </p>
          )}
          {videos.map(v => (
            <button
              key={v.id}
              onClick={() => setSelectedId(v.id)}
              style={{
                width: "100%", textAlign: "left",
                background: selectedId === v.id ? "#1e1e1e" : "transparent",
                border: "none", borderLeft: selectedId === v.id ? "2px solid #d4702a" : "2px solid transparent",
                padding: "8px 14px",
                cursor: "pointer",
                display: "flex", flexDirection: "column", gap: 4,
              }}>
              <span style={{ fontSize: 13, color: selectedId === v.id ? "#e8e8e8" : "#aaa", fontWeight: 500, lineHeight: 1.3 }}>
                {v.title}
              </span>
              <StatusBadge status={v.status} />
            </button>
          ))}

          {adding && (
            <div style={{ padding: "6px 12px" }}>
              <input
                ref={newInputRef}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") { setAdding(false); setNewTitle(""); } }}
                onBlur={handleCreate}
                placeholder="Video title..."
                style={{
                  width: "100%", background: "#1e1e1e", border: "1px solid #d4702a",
                  borderRadius: 5, padding: "6px 8px", color: "#e8e8e8",
                  fontSize: 12, outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          )}
        </div>

        <div style={{ padding: "10px 16px", borderTop: "1px solid #1e1e1e" }}>
          <button
            onClick={() => setAdding(true)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 6,
              background: "#d4702a", border: "none", borderRadius: 6,
              color: "#fff", fontSize: 12, fontWeight: 600,
              padding: "7px 12px", cursor: "pointer",
            }}>
            <Plus size={13} strokeWidth={2.5} />
            New Video
          </button>
        </div>
      </aside>

      {/* Editor */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!selected ? (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 12,
            color: "#444",
          }}>
            <Video size={32} />
            <p style={{ fontSize: 13 }}>Select a video or create a new one</p>
          </div>
        ) : (
          <VideoEditor
            key={selected.id}
            video={selected}
            onTitleChange={t => handleTitleChange(selected.id, t)}
            onStatusChange={s => handleStatusChange(selected.id, s)}
            onScriptChange={sc => handleScriptChange(selected.id, sc)}
            onIdeasChange={id => handleIdeasChange(selected.id, id)}
            onDelete={() => handleDelete(selected.id)}
          />
        )}
      </main>
    </div>
  );
}

function VideoEditor({
  video,
  onTitleChange,
  onStatusChange,
  onScriptChange,
  onIdeasChange,
  onDelete,
}: {
  video: VideoSessionView;
  onTitleChange: (t: string) => void;
  onStatusChange: (s: VideoStatus) => void;
  onScriptChange: (s: string) => void;
  onIdeasChange: (s: string) => void;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<"script" | "ideas">("script");
  const [titleDraft, setTitleDraft] = useState(video.title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync title if video changes (e.g., from server)
  useEffect(() => { setTitleDraft(video.title); }, [video.id]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Editor header */}
      <div style={{
        padding: "16px 24px 12px",
        borderBottom: "1px solid #1e1e1e",
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <input
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={() => { if (titleDraft.trim()) onTitleChange(titleDraft.trim()); }}
            onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
            style={{
              flex: 1, background: "transparent", border: "none",
              color: "#e8e8e8", fontSize: 20, fontWeight: 700,
              outline: "none", padding: 0,
            }}
          />
          {confirmDelete ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#888" }}>Delete?</span>
              <button onClick={onDelete} style={{ fontSize: 11, color: "#e05252", background: "none", border: "1px solid #e05252", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}>Yes</button>
              <button onClick={() => setConfirmDelete(false)} style={{ fontSize: 11, color: "#888", background: "none", border: "1px solid #333", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}>No</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} title="Delete video" style={{ background: "none", border: "none", color: "#444", cursor: "pointer", padding: 4 }}>
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Status pipeline */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          {ALL_VIDEO_STATUSES.map((s, i) => {
            const active = s === video.status;
            const past = ALL_VIDEO_STATUSES.indexOf(s) < ALL_VIDEO_STATUSES.indexOf(video.status);
            const sc = STATUS_COLORS[s];
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {i > 0 && <ChevronRight size={10} color="#333" />}
                <button
                  onClick={() => onStatusChange(s)}
                  style={{
                    background: active ? sc.bg : "transparent",
                    border: active ? `1px solid ${sc.dot}` : "1px solid #2a2a2a",
                    borderRadius: 20,
                    color: active ? sc.text : past ? "#555" : "#444",
                    fontSize: 11, fontWeight: active ? 700 : 500,
                    padding: "2px 10px", cursor: "pointer",
                    letterSpacing: "0.03em",
                    textDecoration: past ? "line-through" : "none",
                  }}>
                  {VIDEO_STATUS_LABELS[s]}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 0,
        borderBottom: "1px solid #1e1e1e",
        padding: "0 24px",
      }}>
        {([
          { key: "script", label: "Script", icon: FileText },
          { key: "ideas",  label: "Ideas",  icon: Lightbulb },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "transparent", border: "none",
              borderBottom: tab === key ? "2px solid #d4702a" : "2px solid transparent",
              color: tab === key ? "#e8e8e8" : "#555",
              fontSize: 12, fontWeight: tab === key ? 600 : 400,
              padding: "10px 14px 8px", cursor: "pointer",
              marginBottom: -1,
            }}>
            <Icon size={13} />
            {label}
            {key === "script" && video.script && (
              <span style={{ background: "#d4702a22", color: "#d4702a", borderRadius: 10, fontSize: 10, padding: "0 5px" }}>
                {video.script.length > 0 ? "✓" : ""}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {tab === "script" ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px 24px" }}>
            <div style={{ paddingTop: 8, paddingBottom: 6 }}>
              <span style={{ fontSize: 11, color: "#555", fontWeight: 500 }}>ROTEIRO / SCRIPT</span>
            </div>
            <textarea
              key={video.id + "-script"}
              defaultValue={video.script ?? ""}
              onChange={e => onScriptChange(e.target.value)}
              placeholder={`Write your script here...\n\nExample:\n[INTRO]\nHey! Today we're going to...\n\n[MAIN]\n...\n\n[OUTRO]\n...`}
              style={{
                flex: 1, background: "#161616", border: "1px solid #222",
                borderRadius: 8, color: "#d8d8d8",
                fontSize: 13, lineHeight: 1.7,
                padding: "16px", resize: "none", outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 24px 24px" }}>
            <div style={{ paddingTop: 8, paddingBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "#555", fontWeight: 500 }}>IDEAS & NOTES</span>
              <span style={{ fontSize: 11, color: "#444" }}>Use • or - for bullet points</span>
            </div>
            <textarea
              key={video.id + "-ideas"}
              defaultValue={video.ideas ?? ""}
              onChange={e => onIdeasChange(e.target.value)}
              placeholder={`Dump your ideas here...\n\n• Hook idea: start with a question\n• Show a demo first\n• Reference: link or article\n• Thumbnail concept\n• SEO keywords`}
              style={{
                flex: 1, background: "#161616", border: "1px solid #222",
                borderRadius: 8, color: "#d8d8d8",
                fontSize: 13, lineHeight: 1.7,
                padding: "16px", resize: "none", outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
