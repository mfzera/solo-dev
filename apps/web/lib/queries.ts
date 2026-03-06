import type { TaskStatus, TaskView, StatsData, ActivityData, WeeklyPlanView, QuickCaptureView, VideoSessionView } from "./types";
import type { TagConfig } from "./types";
import { createApiClient } from "./api-client";
import { getSession } from "./auth";

async function getApi() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return createApiClient(session.userId);
}

export async function getTasksByStatus(): Promise<Record<TaskStatus, TaskView[]>> {
  const api = await getApi();
  return api.getTasksByStatus();
}

export async function getStatsData(): Promise<StatsData> {
  const api = await getApi();
  return api.getStatsData();
}

export async function getActivityData(): Promise<ActivityData> {
  const api = await getApi();
  return api.getActivityData();
}

export async function getWeeklyPlan(): Promise<WeeklyPlanView[]> {
  const api = await getApi();
  return api.getWeeklyPlan();
}

export async function getQuickCaptures(limit = 5): Promise<QuickCaptureView[]> {
  const api = await getApi();
  return api.getQuickCaptures(limit);
}

export async function getArchivedTasks(): Promise<TaskView[]> {
  const api = await getApi();
  return api.getArchivedTasks();
}

export async function getTimelineTasks(): Promise<TaskView[]> {
  const api = await getApi();
  return api.getTimelineTasks();
}

export async function getTagConfigs(): Promise<TagConfig[]> {
  const api = await getApi();
  return api.getTagConfigs();
}

export async function getVideoSessions(): Promise<VideoSessionView[]> {
  const api = await getApi();
  return api.getVideoSessions();
}
