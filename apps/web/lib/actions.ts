"use server";

import { revalidatePath } from "next/cache";
import type { Tag, TaskStatus, VideoStatus, TagConfig } from "./types";
import * as api from "./api-client";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/planning");
  revalidatePath("/archive");
  revalidatePath("/videos");
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function createTask(data: {
  title: string;
  status: TaskStatus;
  tags: Tag[];
  estimate?: string;
  description?: string;
  flagged?: boolean;
  startDate?: string | null;
  dueDate?: string | null;
}) {
  await api.createTask(data);
  revalidateAll();
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
}) {
  await api.updateTask(id, data);
  revalidateAll();
}

export async function deleteTask(id: string) {
  await api.deleteTask(id);
  revalidateAll();
}

export async function archiveTask(id: string) {
  await api.archiveTask(id);
  revalidateAll();
}

export async function restoreTask(id: string) {
  await api.restoreTask(id);
  revalidateAll();
}

export async function moveTask(taskId: string, newStatus: TaskStatus, newSortOrder: number) {
  await api.moveTask(taskId, newStatus, newSortOrder);
  revalidateAll();
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export async function fetchCompletedTasksOnDay(date: string): Promise<{ id: string; title: string; tags: string }[]> {
  const tasks = await api.fetchCompletedTasksOnDay(date);
  return tasks.map(t => ({ ...t, tags: JSON.stringify(t.tags) }));
}

// ─── Quick Capture ────────────────────────────────────────────────────────────

export async function addQuickCapture(text: string) {
  await api.addQuickCapture(text);
  revalidateAll();
}

export async function promoteCapture(captureId: string) {
  await api.promoteCapture(captureId);
  revalidateAll();
}

// ─── Weekly Plan ──────────────────────────────────────────────────────────────

export async function addWeeklyPlanEntry(dayOfWeek: number, taskTitle: string) {
  await api.addWeeklyPlanEntry(dayOfWeek, taskTitle);
  revalidateAll();
}

export async function toggleWeeklyPlanDone(entryId: string) {
  await api.toggleWeeklyPlanDone(entryId);
  revalidateAll();
}

export async function removeWeeklyPlanEntry(entryId: string) {
  await api.removeWeeklyPlanEntry(entryId);
  revalidateAll();
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export async function getTags(): Promise<TagConfig[]> {
  return api.getTags();
}

export async function createTag(name: string, color: string): Promise<{ error?: string }> {
  const result = await api.createTag(name, color);
  if (!result.error) revalidateAll();
  return result;
}

export async function updateTag(id: string, name: string, color: string): Promise<{ error?: string }> {
  const result = await api.updateTag(id, name, color);
  if (!result.error) revalidateAll();
  return result;
}

export async function deleteTag(id: string) {
  await api.deleteTag(id);
  revalidateAll();
}

// ─── Video Sessions ───────────────────────────────────────────────────────────

export async function createVideoSession(title: string) {
  const video = await api.createVideoSession(title);
  revalidateAll();
  return video;
}

export async function updateVideoSession(id: string, data: {
  title?: string;
  status?: VideoStatus;
  script?: string | null;
  ideas?: string | null;
}) {
  await api.updateVideoSession(id, data);
  revalidateAll();
}

export async function deleteVideoSession(id: string) {
  await api.deleteVideoSession(id);
  revalidateAll();
}
