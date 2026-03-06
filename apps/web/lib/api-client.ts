import type {
  TaskView, StatsData, ActivityData, WeeklyPlanView,
  QuickCaptureView, TagConfig, VideoSessionView, TaskStatus, VideoStatus, Tag,
} from "./types";
import { apiFetch } from "./fetch";

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function getTasksByStatus(): Promise<Record<TaskStatus, TaskView[]>> {
  return apiFetch<Record<TaskStatus, TaskView[]>>("/tasks");
}

export async function getArchivedTasks(): Promise<TaskView[]> {
  return apiFetch<TaskView[]>("/tasks?archived=true");
}

export async function getTimelineTasks(): Promise<TaskView[]> {
  const grouped = await apiFetch<Record<TaskStatus, TaskView[]>>("/tasks");
  return Object.values(grouped).flat();
}

export async function createTask(data: {
  title: string;
  status: TaskStatus;
  tags: Tag[];
  estimate?: string;
  description?: string;
  flagged?: boolean;
  startDate?: string | null;
  dueDate?: string | null;
}): Promise<TaskView> {
  return apiFetch<TaskView>("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTask(id: string, data: {
  title?: string;
  description?: string | null;
  tags?: Tag[];
  estimate?: string | null;
  flagged?: boolean;
  blocked?: boolean;
  checked?: boolean;
  progress?: number;
  assignee?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
}): Promise<TaskView> {
  return apiFetch<TaskView>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id: string): Promise<void> {
  await apiFetch(`/tasks/${id}`, { method: "DELETE" });
}

export async function archiveTask(id: string): Promise<void> {
  await apiFetch(`/tasks/${id}/archive`, { method: "POST" });
}

export async function restoreTask(id: string): Promise<void> {
  await apiFetch(`/tasks/${id}/restore`, { method: "POST" });
}

export async function moveTask(taskId: string, newStatus: TaskStatus, newSortOrder: number): Promise<void> {
  await apiFetch(`/tasks/${taskId}/move`, {
    method: "PATCH",
    body: JSON.stringify({ status: newStatus, sortOrder: newSortOrder }),
  });
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function getStatsData(): Promise<StatsData> {
  return apiFetch<StatsData>("/stats");
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export async function getActivityData(): Promise<ActivityData> {
  return apiFetch<ActivityData>("/activity/heatmap");
}

export async function fetchCompletedTasksOnDay(date: string): Promise<{ id: string; title: string; tags: string[] }[]> {
  return apiFetch(`/activity/day?date=${encodeURIComponent(date)}`);
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export async function getTagConfigs(): Promise<TagConfig[]> {
  return apiFetch<TagConfig[]>("/tags");
}

export async function getTags(): Promise<TagConfig[]> {
  return getTagConfigs();
}

export async function createTag(name: string, color: string): Promise<{ error?: string }> {
  try {
    await apiFetch("/tags", { method: "POST", body: JSON.stringify({ name, color }) });
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateTag(id: string, name: string, color: string): Promise<{ error?: string }> {
  try {
    await apiFetch(`/tags/${id}`, { method: "PATCH", body: JSON.stringify({ name, color }) });
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteTag(id: string): Promise<void> {
  await apiFetch(`/tags/${id}`, { method: "DELETE" });
}

// ─── Videos ──────────────────────────────────────────────────────────────────

export async function getVideoSessions(): Promise<VideoSessionView[]> {
  return apiFetch<VideoSessionView[]>("/videos");
}

export async function createVideoSession(title: string): Promise<VideoSessionView> {
  return apiFetch<VideoSessionView>("/videos", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function updateVideoSession(id: string, data: {
  title?: string;
  status?: VideoStatus;
  script?: string | null;
  ideas?: string | null;
}): Promise<void> {
  await apiFetch(`/videos/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteVideoSession(id: string): Promise<void> {
  await apiFetch(`/videos/${id}`, { method: "DELETE" });
}

// ─── Planning ─────────────────────────────────────────────────────────────────

export async function getWeeklyPlan(): Promise<WeeklyPlanView[]> {
  return apiFetch<WeeklyPlanView[]>("/planning");
}

export async function addWeeklyPlanEntry(dayOfWeek: number, taskTitle: string): Promise<void> {
  await apiFetch("/planning", {
    method: "POST",
    body: JSON.stringify({ dayOfWeek, taskTitle }),
  });
}

export async function toggleWeeklyPlanDone(entryId: string): Promise<void> {
  await apiFetch(`/planning/${entryId}/toggle`, { method: "PATCH" });
}

export async function removeWeeklyPlanEntry(entryId: string): Promise<void> {
  await apiFetch(`/planning/${entryId}`, { method: "DELETE" });
}

// ─── Captures ─────────────────────────────────────────────────────────────────

export async function getQuickCaptures(limit = 5): Promise<QuickCaptureView[]> {
  return apiFetch<QuickCaptureView[]>(`/captures?limit=${limit}`);
}

export async function addQuickCapture(text: string): Promise<void> {
  await apiFetch("/captures", { method: "POST", body: JSON.stringify({ text }) });
}

export async function promoteCapture(captureId: string): Promise<void> {
  await apiFetch(`/captures/${captureId}/promote`, { method: "POST" });
}
