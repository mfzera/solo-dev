import type {
  TaskView, StatsData, ActivityData, WeeklyPlanView,
  QuickCaptureView, TagConfig, VideoSessionView, TaskStatus, VideoStatus, Tag,
} from "./types";
import { apiFetch } from "./fetch";

export function createApiClient(userId: string) {
  function fetch<T>(path: string, init?: RequestInit): Promise<T> {
    return apiFetch<T>(path, { ...init, userId });
  }

  return {
    // ─── Tasks ───────────────────────────────────────────────────────────────

    getTasksByStatus(): Promise<Record<TaskStatus, TaskView[]>> {
      return fetch("/tasks");
    },

    getArchivedTasks(): Promise<TaskView[]> {
      return fetch("/tasks?archived=true");
    },

    async getTimelineTasks(): Promise<TaskView[]> {
      const grouped = await fetch<Record<TaskStatus, TaskView[]>>("/tasks");
      return Object.values(grouped).flat();
    },

    createTask(data: {
      title: string;
      status: TaskStatus;
      tags: Tag[];
      estimate?: string;
      description?: string;
      flagged?: boolean;
      startDate?: string | null;
      dueDate?: string | null;
    }): Promise<TaskView> {
      return fetch("/tasks", { method: "POST", body: JSON.stringify(data) });
    },

    updateTask(id: string, data: {
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
      return fetch(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) });
    },

    deleteTask(id: string): Promise<void> {
      return fetch(`/tasks/${id}`, { method: "DELETE" });
    },

    archiveTask(id: string): Promise<void> {
      return fetch(`/tasks/${id}/archive`, { method: "POST" });
    },

    restoreTask(id: string): Promise<void> {
      return fetch(`/tasks/${id}/restore`, { method: "POST" });
    },

    moveTask(taskId: string, newStatus: TaskStatus, newSortOrder: number): Promise<void> {
      return fetch(`/tasks/${taskId}/move`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus, sortOrder: newSortOrder }),
      });
    },

    // ─── Stats ───────────────────────────────────────────────────────────────

    getStatsData(): Promise<StatsData> {
      return fetch("/stats");
    },

    // ─── Activity ─────────────────────────────────────────────────────────────

    getActivityData(): Promise<ActivityData> {
      return fetch("/activity/heatmap");
    },

    fetchCompletedTasksOnDay(date: string): Promise<{ id: string; title: string; tags: string[] }[]> {
      return fetch(`/activity/day?date=${encodeURIComponent(date)}`);
    },

    // ─── Tags ─────────────────────────────────────────────────────────────────

    getTagConfigs(): Promise<TagConfig[]> {
      return fetch("/tags");
    },

    getTags(): Promise<TagConfig[]> {
      return fetch("/tags");
    },

    async createTag(name: string, color: string): Promise<{ error?: string }> {
      try {
        await fetch("/tags", { method: "POST", body: JSON.stringify({ name, color }) });
        return {};
      } catch (e: unknown) {
        return { error: e instanceof Error ? e.message : "Unknown error" };
      }
    },

    async updateTag(id: string, name: string, color: string): Promise<{ error?: string }> {
      try {
        await fetch(`/tags/${id}`, { method: "PATCH", body: JSON.stringify({ name, color }) });
        return {};
      } catch (e: unknown) {
        return { error: e instanceof Error ? e.message : "Unknown error" };
      }
    },

    deleteTag(id: string): Promise<void> {
      return fetch(`/tags/${id}`, { method: "DELETE" });
    },

    // ─── Videos ──────────────────────────────────────────────────────────────

    getVideoSessions(): Promise<VideoSessionView[]> {
      return fetch("/videos");
    },

    createVideoSession(title: string): Promise<VideoSessionView> {
      return fetch("/videos", { method: "POST", body: JSON.stringify({ title }) });
    },

    updateVideoSession(id: string, data: {
      title?: string;
      status?: VideoStatus;
      script?: string | null;
      ideas?: string | null;
    }): Promise<void> {
      return fetch(`/videos/${id}`, { method: "PATCH", body: JSON.stringify(data) });
    },

    deleteVideoSession(id: string): Promise<void> {
      return fetch(`/videos/${id}`, { method: "DELETE" });
    },

    // ─── Planning ─────────────────────────────────────────────────────────────

    getWeeklyPlan(): Promise<WeeklyPlanView[]> {
      return fetch("/planning");
    },

    addWeeklyPlanEntry(dayOfWeek: number, taskTitle: string): Promise<void> {
      return fetch("/planning", { method: "POST", body: JSON.stringify({ dayOfWeek, taskTitle }) });
    },

    toggleWeeklyPlanDone(entryId: string): Promise<void> {
      return fetch(`/planning/${entryId}/toggle`, { method: "PATCH" });
    },

    removeWeeklyPlanEntry(entryId: string): Promise<void> {
      return fetch(`/planning/${entryId}`, { method: "DELETE" });
    },

    // ─── Captures ─────────────────────────────────────────────────────────────

    getQuickCaptures(limit = 5): Promise<QuickCaptureView[]> {
      return fetch(`/captures?limit=${limit}`);
    },

    addQuickCapture(text: string): Promise<void> {
      return fetch("/captures", { method: "POST", body: JSON.stringify({ text }) });
    },

    promoteCapture(captureId: string): Promise<void> {
      return fetch(`/captures/${captureId}/promote`, { method: "POST" });
    },
  };
}
