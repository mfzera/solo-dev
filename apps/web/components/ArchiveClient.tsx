"use client";
import { useTransition } from "react";
import type { TaskView } from "@/lib/types";
import { restoreTask, deleteTask } from "@/lib/actions";
import Tag from "./Tag";
import { ArchiveRestore, Trash2, Flag } from "lucide-react";

export default function ArchiveClient({ tasks }: { tasks: TaskView[] }) {
  const [isPending, startTransition] = useTransition();

  function handleRestore(id: string) {
    startTransition(async () => {
      await restoreTask(id);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Permanently delete this task?")) return;
    startTransition(async () => {
      await deleteTask(id);
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Archive</h1>
        <span style={{
          background: "#2a2a2a", border: "1px solid #3a3a3a",
          borderRadius: 20, padding: "2px 10px", fontSize: 11, color: "#888",
        }}>{tasks.length} tasks</span>
      </div>

      {tasks.length === 0 ? (
        <div style={{ color: "#555", fontSize: 13, paddingTop: 40, textAlign: "center" }}>
          No archived tasks yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2" style={{ opacity: isPending ? 0.6 : 1 }}>
          {tasks.map(task => (
            <div key={task.id} style={{
              background: "#1e1e1e", border: "1px solid #2a2a2a",
              borderRadius: 8, padding: "10px 14px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2 mb-1">
                  {task.flagged && <Flag size={11} color="#c0392b" fill="#c0392b" />}
                  <span style={{ fontSize: 13, color: "#bbb", fontWeight: 500 }}>{task.title}</span>
                </div>
                {task.description && (
                  <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>{task.description}</div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {task.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {task.tags.map(t => <Tag key={t} tag={t} />)}
                    </div>
                  )}
                  {task.estimate && <span style={{ fontSize: 11, color: "#555" }}>{task.estimate}</span>}
                  <span style={{ fontSize: 11, color: "#444" }}>
                    created {new Date(task.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRestore(task.id)}
                  title="Restore to board"
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "#2a2a2a", border: "1px solid #333",
                    borderRadius: 5, padding: "4px 10px",
                    fontSize: 12, color: "#aaa", cursor: "pointer",
                  }}>
                  <ArchiveRestore size={12} /> Restore
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  title="Delete permanently"
                  style={{
                    display: "flex", alignItems: "center",
                    background: "#2a1e1e", border: "1px solid #3a2a2a",
                    borderRadius: 5, padding: "4px 7px",
                    cursor: "pointer", color: "#f87171",
                  }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
