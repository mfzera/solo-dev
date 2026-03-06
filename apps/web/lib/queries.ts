import type { TaskStatus, TaskView, StatsData, ActivityData, WeeklyPlanView, QuickCaptureView, VideoSessionView } from "./types";
import type { TagConfig } from "./types";
import {
  getTasksByStatus as apiGetTasksByStatus,
  getArchivedTasks as apiGetArchivedTasks,
  getTimelineTasks as apiGetTimelineTasks,
  getStatsData as apiGetStatsData,
  getActivityData as apiGetActivityData,
  getWeeklyPlan as apiGetWeeklyPlan,
  getQuickCaptures as apiGetQuickCaptures,
  getTagConfigs as apiGetTagConfigs,
  getVideoSessions as apiGetVideoSessions,
} from "./api-client";

export async function getTasksByStatus(): Promise<Record<TaskStatus, TaskView[]>> {
  return apiGetTasksByStatus();
}

export async function getStatsData(): Promise<StatsData> {
  return apiGetStatsData();
}

export async function getActivityData(): Promise<ActivityData> {
  return apiGetActivityData();
}

export async function getWeeklyPlan(): Promise<WeeklyPlanView[]> {
  return apiGetWeeklyPlan();
}

export async function getQuickCaptures(limit = 5): Promise<QuickCaptureView[]> {
  return apiGetQuickCaptures(limit);
}

export async function getArchivedTasks(): Promise<TaskView[]> {
  return apiGetArchivedTasks();
}

export async function getTimelineTasks(): Promise<TaskView[]> {
  return apiGetTimelineTasks();
}

export async function getTagConfigs(): Promise<TagConfig[]> {
  return apiGetTagConfigs();
}

export async function getVideoSessions(): Promise<VideoSessionView[]> {
  return apiGetVideoSessions();
}
