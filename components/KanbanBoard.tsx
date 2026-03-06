"use client";
import { useState, useOptimistic, useTransition } from "react";
import type { TaskView, TaskStatus } from "@/lib/types";
import { STATUS_LABELS, WIP_LIMITS, ALL_STATUSES } from "@/lib/types";
import { moveTask } from "@/lib/actions";
import Tag from "./Tag";
import { Plus, SlidersHorizontal, Layers, Check, Flag, AlertCircle } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { getISOWeekNumber } from "@/lib/helpers";

function TaskCard({ task, status, index }: { task: TaskView; status: TaskStatus; index: number }) {
  const isDone = status === "done";
  const isInProgress = status === "in-progress";

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            background: snapshot.isDragging ? "#2a2a2a" : "#1e1e1e",
            border: `1px solid ${task.flagged ? "#4a2a1e" : snapshot.isDragging ? "#444" : "#2a2a2a"}`,
            borderRadius: 6,
            padding: "8px 10px",
            cursor: "grab",
            opacity: isDone ? 0.7 : 1,
            ...provided.draggableProps.style,
          }}>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div style={{ marginTop: 1, flexShrink: 0 }}>
              {isDone ? (
                <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid #4ade80", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={9} color="#4ade80" strokeWidth={3} />
                </div>
              ) : isInProgress ? (
                <div style={{ width: 14, height: 14, borderRadius: "50%", border: `1.5px solid ${task.flagged ? "#d4702a" : "#555"}` }} />
              ) : null}
            </div>
            <span style={{ flex: 1, fontSize: 12, color: isDone ? "#666" : "#d8d8d8", lineHeight: 1.45, textDecoration: isDone ? "line-through" : "none" }}>
              {task.title}
            </span>
            <div className="flex items-center gap-1">
              {task.flagged && <Flag size={11} color="#d4702a" fill="#d4702a" />}
              {task.estimate && <span style={{ color: "#555", fontSize: 11, whiteSpace: "nowrap" }}>{task.estimate}</span>}
            </div>
          </div>

          {task.description && (
            <div style={{ fontSize: 11, color: "#666", marginBottom: 6, lineHeight: 1.4 }}>{task.description}</div>
          )}

          {typeof task.progress === "number" && (
            <div style={{ background: "#2a2a2a", borderRadius: 2, height: 3, marginBottom: 6, overflow: "hidden" }}>
              <div style={{ width: `${task.progress}%`, background: task.flagged ? "#d4702a" : "#555", height: "100%", borderRadius: 2 }} />
            </div>
          )}

          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map(t => <Tag key={t} tag={t} />)}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

function Column({ id, tasks, wip }: { id: TaskStatus; tasks: TaskView[]; wip?: number }) {
  const label = STATUS_LABELS[id];
  const count = tasks.length;
  const isInProgress = id === "in-progress";
  const wipReached = isInProgress && count >= (wip ?? Infinity);

  return (
    <div style={{ flex: "0 0 220px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <div className="flex items-center gap-1.5">
          {isInProgress && (
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#d4702a" }} />
          )}
          <span style={{ fontSize: 11, fontWeight: 600, color: "#888", letterSpacing: "0.05em" }}>{label}</span>
          <span style={{ fontSize: 11, color: "#555" }}>{count}</span>
          {isInProgress && wip && (
            <span style={{ fontSize: 11, color: "#555" }}>{count}/{wip}</span>
          )}
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: 2 }}>
          <Plus size={13} />
        </button>
      </div>

      {wipReached && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#d4702a", padding: "4px 0" }}>
          <AlertCircle size={11} />
          WIP limit reached · {wip} max
        </div>
      )}

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-col gap-2"
            style={{
              minHeight: 40,
              borderRadius: 6,
              background: snapshot.isDraggingOver ? "rgba(212,112,42,0.05)" : "transparent",
              transition: "background 0.15s",
              padding: snapshot.isDraggingOver ? 4 : 0,
            }}>
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} status={id} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function KanbanBoard({ tasks }: { tasks: Record<TaskStatus, TaskView[]> }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(tasks);

  const weekNum = getISOWeekNumber(new Date());

  function handleDragEnd(result: DropResult) {
    const { draggableId, source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcStatus = source.droppableId as TaskStatus;
    const dstStatus = destination.droppableId as TaskStatus;
    const newIndex = destination.index;

    // Optimistic update
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

  return (
    <div style={{ background: "#242424", border: "1px solid #2e2e2e", borderRadius: 8, padding: "14px 16px" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span style={{ fontWeight: 700, fontSize: 14 }}>Board</span>
          <span style={{ color: "#555", fontSize: 12 }}>Week {weekNum} · SaaS Builder Pro</span>
        </div>
        <div className="flex items-center gap-2">
          <button style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#1e1e1e", border: "1px solid #333",
            borderRadius: 5, padding: "4px 10px", color: "#aaa",
            fontSize: 12, cursor: "pointer",
          }}>
            <SlidersHorizontal size={12} /> Filter
          </button>
          <button style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#1e1e1e", border: "1px solid #333",
            borderRadius: 5, padding: "4px 10px", color: "#aaa",
            fontSize: 12, cursor: "pointer",
          }}>
            <Layers size={12} /> Group
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {ALL_STATUSES.map(status => (
            <Column
              key={status}
              id={status}
              tasks={optimisticTasks[status]}
              wip={WIP_LIMITS[status]}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
