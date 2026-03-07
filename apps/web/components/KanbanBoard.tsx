"use client";
import { useState, useOptimistic, useTransition, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { TaskView, TaskStatus, TagConfig } from "@/lib/types";
import { STATUS_LABELS, WIP_LIMITS, ALL_STATUSES } from "@/lib/types";
import { moveTask, archiveTask, deleteTask } from "@/lib/actions";
import Tag from "./Tag";
import NewTaskModal from "./NewTaskModal";
import EditTaskModal from "./EditTaskModal";
import { Plus, SlidersHorizontal, Layers, Check, Flag, AlertCircle, Archive, Trash2, X } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { getISOWeekNumber } from "@/lib/helpers";

type GroupBy = "status" | "tag" | "assignee" | "estimate";
interface FilterState { tags: string[]; flagged: boolean | null; blocked: boolean | null; estimates: string[]; }
const EMPTY_FILTER: FilterState = { tags: [], flagged: null, blocked: null, estimates: [] };
const ESTIMATE_OPTIONS = ["30m", "1h", "2h", "4h", "1d", "2d", "3d", "1w"];

// ─── Portal dropdown ──────────────────────────────────────────────────────────
function Dropdown({ triggerRef, open, children, dataAttr }: {
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean; children: React.ReactNode; dataAttr: string;
}) {
  const [style, setStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setStyle({ position: "fixed", top: rect.bottom + 6, left: rect.left, zIndex: 9999 });
  }, [open, triggerRef]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div style={{ ...style, background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, padding: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", minWidth: 220 }} {...{ [dataAttr]: "" }}>
      {children}
    </div>,
    document.body
  );
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────
function TaskCard({ task, status, index, onArchive, onDelete, onEdit, tagConfigs }: {
  task: TaskView; status: string; index: number;
  onArchive: (id: string) => void; onDelete: (id: string) => void;
  onEdit: (task: TaskView) => void; tagConfigs: TagConfig[];
}) {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isDone = status === "done";
  const isInProgress = status === "in-progress";
  const colorMap = Object.fromEntries(tagConfigs.map(t => [t.name, t.color]));

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
          onDoubleClick={() => onEdit(task)}
          style={{
            background: snapshot.isDragging ? "#2a2a2a" : "#1e1e1e",
            border: `1px solid ${task.flagged ? "#4a2a1e" : snapshot.isDragging ? "#444" : "#2a2a2a"}`,
            borderRadius: 6, padding: "8px 10px", cursor: "grab",
            opacity: isDone ? 0.7 : 1, position: "relative", ...provided.draggableProps.style,
          }}>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div style={{ marginTop: 1, flexShrink: 0 }}>
              {isDone ? (
                <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid #4ade80", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={9} color="#4ade80" strokeWidth={3} />
                </div>
              ) : isInProgress ? (
                <div style={{ width: 14, height: 14, borderRadius: "50%", border: `1.5px solid ${task.flagged ? "#c0392b" : "#555"}` }} />
              ) : null}
            </div>
            <span style={{ flex: 1, fontSize: 12, color: isDone ? "#666" : "#d8d8d8", lineHeight: 1.45, textDecoration: isDone ? "line-through" : "none" }}>
              {task.title}
            </span>
            <div className="flex items-center gap-1">
              {task.flagged && <Flag size={11} color="#c0392b" fill="#c0392b" />}
              {task.estimate && <span style={{ color: "#555", fontSize: 11, whiteSpace: "nowrap" }}>{task.estimate}</span>}
            </div>
          </div>
          {task.description && <div style={{ fontSize: 11, color: "#666", marginBottom: 6, lineHeight: 1.4 }}>{task.description}</div>}
          {typeof task.progress === "number" && task.progress > 0 && (
            <div style={{ background: "#2a2a2a", borderRadius: 2, height: 3, marginBottom: 6, overflow: "hidden" }}>
              <div style={{ width: `${task.progress}%`, background: task.flagged ? "#c0392b" : "#555", height: "100%", borderRadius: 2 }} />
            </div>
          )}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map(t => <Tag key={t} tag={t} color={colorMap[t]} />)}
            </div>
          )}
          {hovered && !snapshot.isDragging && !confirmDelete && (
            <div style={{ position: "absolute", top: 5, right: 5, display: "flex", gap: 2 }}>
              <button onClick={(e) => { e.stopPropagation(); onArchive(task.id); }}
                style={{ background: "#2a2a2a", border: "1px solid #333", borderRadius: 4, padding: "2px 5px", cursor: "pointer", color: "#777", display: "flex", alignItems: "center" }}>
                <Archive size={11} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                style={{ background: "#2a2a2a", border: "1px solid #333", borderRadius: 4, padding: "2px 5px", cursor: "pointer", color: "#777", display: "flex", alignItems: "center" }}>
                <Trash2 size={11} />
              </button>
            </div>
          )}
          {confirmDelete && (
            <div style={{ position: "absolute", top: 5, right: 5, display: "flex", alignItems: "center", gap: 4, background: "#1e1e1e", padding: "2px 4px" }}>
              <span style={{ fontSize: 10, color: "#aaa" }}>Delete?</span>
              <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                style={{ background: "#3a1e1e", border: "1px solid #5a2a2a", borderRadius: 4, padding: "2px 6px", cursor: "pointer", color: "#f87171", fontSize: 10, fontWeight: 600 }}>Yes</button>
              <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                style={{ background: "#2a2a2a", border: "1px solid #333", borderRadius: 4, padding: "2px 6px", cursor: "pointer", color: "#888", fontSize: 10 }}>No</button>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────
function Column({ id, label, tasks, wip, onAddTask, onArchive, onDelete, onEdit, tagConfigs }: {
  id: string; label: string; tasks: TaskView[]; wip?: number; onAddTask?: () => void;
  onArchive: (id: string) => void; onDelete: (id: string) => void;
  onEdit: (task: TaskView) => void; tagConfigs: TagConfig[];
}) {
  const count = tasks.length;
  const isInProgress = id === "in-progress";
  const wipReached = isInProgress && count >= (wip ?? Infinity);

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <div className="flex items-center gap-1.5">
          {isInProgress && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c0392b" }} />}
          <span style={{ fontSize: 11, fontWeight: 600, color: "#888", letterSpacing: "0.05em" }}>{label}</span>
          <span style={{ fontSize: 11, color: "#555" }}>{count}</span>
          {isInProgress && wip && <span style={{ fontSize: 11, color: "#555" }}>{count}/{wip}</span>}
        </div>
        {onAddTask && (
          <button onClick={onAddTask} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: 2 }}>
            <Plus size={13} />
          </button>
        )}
      </div>
      {wipReached && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#c0392b", padding: "4px 0" }}>
          <AlertCircle size={11} /> WIP limit reached · {wip} max
        </div>
      )}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-2"
            style={{ minHeight: 40, borderRadius: 6, background: snapshot.isDraggingOver ? "rgba(192,57,43,0.05)" : "transparent", transition: "background 0.15s", padding: snapshot.isDraggingOver ? 4 : 0 }}>
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} status={id} index={index}
                onArchive={onArchive} onDelete={onDelete} onEdit={onEdit} tagConfigs={tagConfigs} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function applyFilter(tasks: TaskView[], f: FilterState): TaskView[] {
  return tasks.filter(t => {
    if (f.tags.length > 0 && !f.tags.some(tag => t.tags.includes(tag))) return false;
    if (f.flagged === true && !t.flagged) return false;
    if (f.blocked === true && !t.blocked) return false;
    if (f.estimates.length > 0 && !f.estimates.includes(t.estimate ?? "")) return false;
    return true;
  });
}
function countActive(f: FilterState) {
  return f.tags.length + (f.flagged !== null ? 1 : 0) + (f.blocked !== null ? 1 : 0) + f.estimates.length;
}
function buildGroups(all: Record<TaskStatus, TaskView[]>, groupBy: GroupBy, filter: FilterState) {
  if (groupBy === "status") {
    return ALL_STATUSES.map(s => ({ id: s, label: STATUS_LABELS[s], tasks: applyFilter(all[s], filter), wip: WIP_LIMITS[s] }));
  }
  const flat = applyFilter(ALL_STATUSES.flatMap(s => all[s]), filter);
  if (groupBy === "tag") {
    const tags = [...new Set(flat.flatMap(t => t.tags))];
    const groups = tags.map(tag => ({ id: `tag:${tag}`, label: tag.toUpperCase(), tasks: flat.filter(t => t.tags.includes(tag)), wip: undefined }));
    const untagged = flat.filter(t => t.tags.length === 0);
    if (untagged.length) groups.push({ id: "tag:__none__", label: "UNTAGGED", tasks: untagged, wip: undefined });
    return groups;
  }
  if (groupBy === "assignee") {
    const assignees = [...new Set(flat.map(t => t.assignee ?? "").filter(Boolean))];
    const groups = assignees.map(a => ({ id: `a:${a}`, label: a.toUpperCase(), tasks: flat.filter(t => t.assignee === a), wip: undefined }));
    const unassigned = flat.filter(t => !t.assignee);
    if (unassigned.length || !groups.length) groups.push({ id: "a:__none__", label: "UNASSIGNED", tasks: unassigned, wip: undefined });
    return groups;
  }
  if (groupBy === "estimate") {
    const used = ESTIMATE_OPTIONS.filter(e => flat.some(t => t.estimate === e));
    const groups = used.map(e => ({ id: `e:${e}`, label: e.toUpperCase(), tasks: flat.filter(t => t.estimate === e), wip: undefined }));
    const none = flat.filter(t => !t.estimate);
    if (none.length) groups.push({ id: "e:__none__", label: "NO ESTIMATE", tasks: none, wip: undefined });
    return groups;
  }
  return [];
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function KanbanBoard({ tasks, tagConfigs = [] }: { tasks: Record<TaskStatus, TaskView[]>; tagConfigs?: TagConfig[] }) {
  const [, startTransition] = useTransition();
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(tasks);
  const [modalStatus, setModalStatus] = useState<TaskStatus | null>(null);
  const [editingTask, setEditingTask] = useState<TaskView | null>(null);
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [groupBy, setGroupBy] = useState<GroupBy>("status");
  const [filterOpen, setFilterOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const groupBtnRef = useRef<HTMLButtonElement>(null);
  const weekNum = getISOWeekNumber(new Date());
  const activeFilters = countActive(filter);

  useEffect(() => {
    function handler(e: MouseEvent) {
      const el = e.target as HTMLElement;
      if (!filterBtnRef.current?.contains(el) && !el.closest("[data-filter-drop]")) setFilterOpen(false);
      if (!groupBtnRef.current?.contains(el) && !el.closest("[data-group-drop]")) setGroupOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggleTag(tag: string) { setFilter(f => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag] })); }
  function toggleEstimate(e: string) { setFilter(f => ({ ...f, estimates: f.estimates.includes(e) ? f.estimates.filter(x => x !== e) : [...f.estimates, e] })); }

  function handleDragEnd(result: DropResult) {
    const { draggableId, source, destination } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;
    if (groupBy !== "status") return;
    const srcStatus = source.droppableId as TaskStatus;
    const dstStatus = destination.droppableId as TaskStatus;
    const newIndex = destination.index;
    startTransition(async () => {
      setOptimisticTasks(prev => {
        const next = { ...prev };
        const srcList = [...next[srcStatus]];
        const [moved] = srcList.splice(source.index, 1);
        next[srcStatus] = srcList;
        const dstList = srcStatus === dstStatus ? srcList : [...next[dstStatus]];
        dstList.splice(newIndex, 0, { ...moved, status: dstStatus });
        next[dstStatus] = dstList;
        return next;
      });
      await moveTask(draggableId, dstStatus, newIndex);
    });
  }

  function handleArchive(taskId: string) {
    startTransition(async () => {
      setOptimisticTasks(prev => { const next = { ...prev } as Record<TaskStatus, TaskView[]>; for (const s of ALL_STATUSES) next[s] = next[s].filter(t => t.id !== taskId); return next; });
      await archiveTask(taskId);
    });
  }
  function handleDelete(taskId: string) {
    startTransition(async () => {
      setOptimisticTasks(prev => { const next = { ...prev } as Record<TaskStatus, TaskView[]>; for (const s of ALL_STATUSES) next[s] = next[s].filter(t => t.id !== taskId); return next; });
      await deleteTask(taskId);
    });
  }

  const groups = buildGroups(optimisticTasks, groupBy, filter);

  return (
    <>
      <div style={{ background: "#242424", border: "1px solid #2e2e2e", borderRadius: 8, padding: "14px 16px" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span style={{ fontWeight: 700, fontSize: 14 }}>Board</span>
            <span style={{ color: "#555", fontSize: 12 }}>Week {weekNum} · SaaS Builder Pro</span>
            {activeFilters > 0 && (
              <button onClick={() => setFilter(EMPTY_FILTER)}
                style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(192,57,43,0.12)", border: "1px solid #c0392b", borderRadius: 10, padding: "2px 8px", fontSize: 11, color: "#c0392b", cursor: "pointer" }}>
                {activeFilters} filter{activeFilters > 1 ? "s" : ""} active <X size={10} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button ref={filterBtnRef} onClick={() => { setFilterOpen(o => !o); setGroupOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 5, background: filterOpen || activeFilters > 0 ? "rgba(192,57,43,0.1)" : "#1e1e1e", border: `1px solid ${filterOpen || activeFilters > 0 ? "#c0392b" : "#333"}`, borderRadius: 5, padding: "4px 10px", color: filterOpen || activeFilters > 0 ? "#c0392b" : "#aaa", fontSize: 12, cursor: "pointer" }}>
              <SlidersHorizontal size={12} /> Filter
              {activeFilters > 0 && <span style={{ background: "#c0392b", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{activeFilters}</span>}
            </button>
            <button ref={groupBtnRef} onClick={() => { setGroupOpen(o => !o); setFilterOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 5, background: groupOpen || groupBy !== "status" ? "rgba(192,57,43,0.1)" : "#1e1e1e", border: `1px solid ${groupOpen || groupBy !== "status" ? "#c0392b" : "#333"}`, borderRadius: 5, padding: "4px 10px", color: groupOpen || groupBy !== "status" ? "#c0392b" : "#aaa", fontSize: 12, cursor: "pointer" }}>
              <Layers size={12} /> Group
              {groupBy !== "status" && <span style={{ fontSize: 10 }}>· {groupBy}</span>}
            </button>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div style={{ display: "flex", gap: 12 }}>
            {groups.map(g => (
              <Column key={g.id} id={g.id} label={g.label} tasks={g.tasks} wip={g.wip}
                onAddTask={groupBy === "status" ? () => setModalStatus(g.id as TaskStatus) : undefined}
                onArchive={handleArchive} onDelete={handleDelete} onEdit={setEditingTask} tagConfigs={tagConfigs} />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Filter dropdown */}
      <Dropdown triggerRef={filterBtnRef} open={filterOpen} dataAttr="data-filter-drop">
        <div data-filter-drop="">
          <div style={{ fontSize: 10, fontWeight: 600, color: "#555", letterSpacing: "0.07em", marginBottom: 10 }}>FILTER BY</div>
          {tagConfigs.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>Tags</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {tagConfigs.map(tc => (
                  <button key={tc.id} onClick={() => toggleTag(tc.name)}
                    style={{ padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500, border: filter.tags.includes(tc.name) ? `1px solid ${tc.color}` : "1px solid #2a2a2a", background: filter.tags.includes(tc.name) ? `${tc.color}22` : "transparent", color: filter.tags.includes(tc.name) ? tc.color : "#888", cursor: "pointer" }}>
                    {tc.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>Estimate</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {ESTIMATE_OPTIONS.map(e => (
                <button key={e} onClick={() => toggleEstimate(e)}
                  style={{ padding: "3px 8px", borderRadius: 4, fontSize: 11, border: filter.estimates.includes(e) ? "1px solid #c0392b" : "1px solid #2a2a2a", background: filter.estimates.includes(e) ? "rgba(192,57,43,0.15)" : "transparent", color: filter.estimates.includes(e) ? "#c0392b" : "#888", cursor: "pointer" }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: activeFilters > 0 ? 10 : 0 }}>
            <button onClick={() => setFilter(f => ({ ...f, flagged: f.flagged === true ? null : true }))}
              style={{ flex: 1, padding: "5px 0", borderRadius: 5, fontSize: 11, border: filter.flagged === true ? "1px solid #c0392b" : "1px solid #2a2a2a", background: filter.flagged === true ? "rgba(192,57,43,0.15)" : "transparent", color: filter.flagged === true ? "#c0392b" : "#888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Flag size={11} /> Flagged
            </button>
            <button onClick={() => setFilter(f => ({ ...f, blocked: f.blocked === true ? null : true }))}
              style={{ flex: 1, padding: "5px 0", borderRadius: 5, fontSize: 11, border: filter.blocked === true ? "1px solid #f87171" : "1px solid #2a2a2a", background: filter.blocked === true ? "rgba(248,113,113,0.12)" : "transparent", color: filter.blocked === true ? "#f87171" : "#888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <AlertCircle size={11} /> Blocked
            </button>
          </div>
          {activeFilters > 0 && (
            <button onClick={() => setFilter(EMPTY_FILTER)}
              style={{ width: "100%", padding: "5px 0", borderRadius: 5, fontSize: 11, border: "1px solid #2a2a2a", background: "transparent", color: "#666", cursor: "pointer" }}>
              Clear all
            </button>
          )}
        </div>
      </Dropdown>

      {/* Group dropdown */}
      <Dropdown triggerRef={groupBtnRef} open={groupOpen} dataAttr="data-group-drop">
        <div data-group-drop="">
          <div style={{ fontSize: 10, fontWeight: 600, color: "#555", letterSpacing: "0.07em", marginBottom: 10 }}>GROUP BY</div>
          {(["status", "tag", "assignee", "estimate"] as GroupBy[]).map(opt => (
            <button key={opt} onClick={() => { setGroupBy(opt); setGroupOpen(false); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "7px 10px", borderRadius: 6, marginBottom: 2, background: groupBy === opt ? "rgba(192,57,43,0.1)" : "transparent", border: groupBy === opt ? "1px solid #c0392b" : "1px solid transparent", color: groupBy === opt ? "#c0392b" : "#aaa", fontSize: 12, cursor: "pointer", textAlign: "left", fontWeight: groupBy === opt ? 600 : 400 }}>
              {{ status: "Status", tag: "Tag", assignee: "Assignee", estimate: "Estimate" }[opt]}
              {groupBy === opt && <Check size={12} />}
            </button>
          ))}
        </div>
      </Dropdown>

      <NewTaskModal key={modalStatus ?? "closed"} open={modalStatus !== null} initialStatus={modalStatus ?? "ideas"} onClose={() => setModalStatus(null)} />
      {editingTask && <EditTaskModal key={editingTask.id} task={editingTask} onClose={() => setEditingTask(null)} />}
    </>
  );
}
