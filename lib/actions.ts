"use server";

import { prisma } from "./db";
import { serializeTags } from "./helpers";
import type { Tag, TaskStatus } from "./types";
import { revalidatePath } from "next/cache";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/planning");
  revalidatePath("/archive");
}

// --- TASK CRUD ---

export async function createTask(data: {
  title: string;
  status: TaskStatus;
  tags: Tag[];
  estimate?: string;
  description?: string;
  flagged?: boolean;
}) {
  const maxOrder = await prisma.task.aggregate({
    where: { status: data.status, archivedAt: null },
    _max: { sortOrder: true },
  });

  await prisma.task.create({
    data: {
      title: data.title,
      status: data.status,
      tags: serializeTags(data.tags),
      estimate: data.estimate || null,
      description: data.description || null,
      flagged: data.flagged || false,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  await prisma.activityLog.create({
    data: { action: "created" },
  });

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
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description ?? null;
  if (data.tags !== undefined) updateData.tags = serializeTags(data.tags);
  if (data.estimate !== undefined) updateData.estimate = data.estimate || null;
  if (data.flagged !== undefined) updateData.flagged = data.flagged;
  if (data.blocked !== undefined) updateData.blocked = data.blocked;
  if (data.checked !== undefined) updateData.checked = data.checked;
  if (data.progress !== undefined) updateData.progress = data.progress;
  if (data.assignee !== undefined) updateData.assignee = data.assignee || null;
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

  await prisma.task.update({ where: { id }, data: updateData });
  revalidateAll();
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
  revalidateAll();
}

export async function archiveTask(id: string) {
  await prisma.task.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  await prisma.activityLog.create({
    data: { taskId: id, action: "archived" },
  });

  revalidateAll();
}

export async function restoreTask(id: string) {
  await prisma.task.update({
    where: { id },
    data: { archivedAt: null },
  });
  revalidateAll();
}

// --- KANBAN MOVEMENT ---

export async function moveTask(taskId: string, newStatus: TaskStatus, newSortOrder: number) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return;

  const isMovingToDone = newStatus === "done" && task.status !== "done";
  const isLeavingDone = task.status === "done" && newStatus !== "done";

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      sortOrder: newSortOrder,
      ...(isMovingToDone ? { completedAt: new Date(), checked: true } : {}),
      ...(isLeavingDone ? { completedAt: null, checked: false } : {}),
    },
  });

  // Reorder siblings in target column
  const siblings = await prisma.task.findMany({
    where: { status: newStatus, archivedAt: null, id: { not: taskId } },
    orderBy: { sortOrder: "asc" },
  });

  for (let i = 0; i < siblings.length; i++) {
    const order = i >= newSortOrder ? i + 1 : i;
    if (siblings[i].sortOrder !== order) {
      await prisma.task.update({
        where: { id: siblings[i].id },
        data: { sortOrder: order },
      });
    }
  }

  if (isMovingToDone) {
    await prisma.activityLog.create({
      data: { taskId, action: "completed" },
    });
  } else {
    await prisma.activityLog.create({
      data: { taskId, action: "moved" },
    });
  }

  revalidateAll();
}

// --- QUICK CAPTURE ---

export async function addQuickCapture(text: string) {
  await prisma.quickCapture.create({ data: { text } });
  revalidateAll();
}

export async function promoteCapture(captureId: string) {
  const capture = await prisma.quickCapture.findUnique({ where: { id: captureId } });
  if (!capture) return;

  const maxOrder = await prisma.task.aggregate({
    where: { status: "ideas", archivedAt: null },
    _max: { sortOrder: true },
  });

  const task = await prisma.task.create({
    data: {
      title: capture.text,
      status: "ideas",
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  await prisma.quickCapture.update({
    where: { id: captureId },
    data: { promotedToTaskId: task.id },
  });

  revalidateAll();
}

// --- WEEKLY PLAN ---

export async function addWeeklyPlanEntry(dayOfWeek: number, taskTitle: string) {
  const now = new Date();
  const monday = new Date(now);
  const dow = monday.getDay();
  monday.setDate(monday.getDate() - dow + (dow === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);

  const maxOrder = await prisma.weeklyPlanEntry.aggregate({
    where: { dayOfWeek },
    _max: { sortOrder: true },
  });

  await prisma.weeklyPlanEntry.create({
    data: {
      dayOfWeek,
      weekStart: monday,
      taskTitle,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  revalidateAll();
}

export async function toggleWeeklyPlanDone(entryId: string) {
  const entry = await prisma.weeklyPlanEntry.findUnique({ where: { id: entryId } });
  if (!entry) return;

  await prisma.weeklyPlanEntry.update({
    where: { id: entryId },
    data: { done: !entry.done },
  });

  revalidateAll();
}

export async function removeWeeklyPlanEntry(entryId: string) {
  await prisma.weeklyPlanEntry.delete({ where: { id: entryId } });
  revalidateAll();
}
