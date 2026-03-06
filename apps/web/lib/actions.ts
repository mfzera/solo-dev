"use server";

import { revalidatePath } from "next/cache";
import type { Tag, TaskStatus, VideoStatus, TagConfig } from "./types";
import { createApiClient } from "./api-client";
import { getSession } from "./auth";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/planning");
  revalidatePath("/archive");
  revalidatePath("/videos");
}

async function getApi() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return createApiClient(session.userId);
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
  const api = await getApi();
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
  const api = await getApi();
  await api.updateTask(id, data);
  revalidateAll();
}

export async function deleteTask(id: string) {
  const api = await getApi();
  await api.deleteTask(id);
  revalidateAll();
}

export async function archiveTask(id: string) {
  const api = await getApi();
  await api.archiveTask(id);
  revalidateAll();
}

export async function restoreTask(id: string) {
  const api = await getApi();
  await api.restoreTask(id);
  revalidateAll();
}

export async function moveTask(taskId: string, newStatus: TaskStatus, newSortOrder: number) {
  const api = await getApi();
  await api.moveTask(taskId, newStatus, newSortOrder);
  revalidateAll();
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export async function fetchCompletedTasksOnDay(date: string): Promise<{ id: string; title: string; tags: string }[]> {
  const api = await getApi();
  const tasks = await api.fetchCompletedTasksOnDay(date);
  return tasks.map(t => ({ ...t, tags: JSON.stringify(t.tags) }));
}

// ─── Quick Capture ────────────────────────────────────────────────────────────

export async function addQuickCapture(text: string) {
  const api = await getApi();
  await api.addQuickCapture(text);
  revalidateAll();
}

export async function promoteCapture(captureId: string) {
  const api = await getApi();
  await api.promoteCapture(captureId);
  revalidateAll();
}

// ─── Weekly Plan ──────────────────────────────────────────────────────────────

export async function addWeeklyPlanEntry(dayOfWeek: number, taskTitle: string) {
  const api = await getApi();
  await api.addWeeklyPlanEntry(dayOfWeek, taskTitle);
  revalidateAll();
}

export async function toggleWeeklyPlanDone(entryId: string) {
  const api = await getApi();
  await api.toggleWeeklyPlanDone(entryId);
  revalidateAll();
}

export async function removeWeeklyPlanEntry(entryId: string) {
  const api = await getApi();
  await api.removeWeeklyPlanEntry(entryId);
  revalidateAll();
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export async function getTags(): Promise<TagConfig[]> {
  const api = await getApi();
  return api.getTags();
}

export async function createTag(name: string, color: string): Promise<{ error?: string }> {
  const api = await getApi();
  const result = await api.createTag(name, color);
  if (!result.error) revalidateAll();
  return result;
}

export async function updateTag(id: string, name: string, color: string): Promise<{ error?: string }> {
  const api = await getApi();
  const result = await api.updateTag(id, name, color);
  if (!result.error) revalidateAll();
  return result;
}

export async function deleteTag(id: string) {
  const api = await getApi();
  await api.deleteTag(id);
  revalidateAll();
}

// ─── Video Sessions ───────────────────────────────────────────────────────────

export async function createVideoSession(title: string) {
  const api = await getApi();
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
  const api = await getApi();
  await api.updateVideoSession(id, data);
  revalidateAll();
}

export async function deleteVideoSession(id: string) {
  const api = await getApi();
  await api.deleteVideoSession(id);
  revalidateAll();
}
