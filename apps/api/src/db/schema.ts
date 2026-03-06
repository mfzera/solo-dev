import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("User", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("passwordHash"),
  name: text("name"),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").notNull(),
});

export const tasks = pgTable("Task", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("ideas"),
  tags: text("tags").notNull().default("[]"),
  estimate: text("estimate"),
  flagged: boolean("flagged").notNull().default(false),
  blocked: boolean("blocked").notNull().default(false),
  checked: boolean("checked").notNull().default(false),
  progress: integer("progress"),
  sortOrder: integer("sortOrder").notNull().default(0),
  assignee: text("assignee"),
  startDate: timestamp("startDate"),
  dueDate: timestamp("dueDate"),
  archivedAt: timestamp("archivedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const quickCaptures = pgTable("QuickCapture", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  text: text("text").notNull(),
  promotedToTaskId: text("promotedToTaskId"),
  createdAt: timestamp("createdAt").notNull(),
});

export const weeklyPlanEntries = pgTable("WeeklyPlanEntry", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  dayOfWeek: integer("dayOfWeek").notNull(),
  weekStart: timestamp("weekStart").notNull(),
  taskTitle: text("taskTitle").notNull(),
  done: boolean("done").notNull().default(false),
  taskId: text("taskId"),
  sortOrder: integer("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").notNull(),
});

export const activityLogs = pgTable("ActivityLog", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  taskId: text("taskId"),
  action: text("action").notNull(),
  occurredAt: timestamp("occurredAt").notNull(),
});

export const tagConfigs = pgTable("TagConfig", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  sortOrder: integer("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").notNull(),
});

export const videoSessions = pgTable("VideoSession", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("idea"),
  script: text("script"),
  ideas: text("ideas"),
  tags: text("tags").notNull().default("[]"),
  sortOrder: integer("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export type User = typeof users.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type QuickCapture = typeof quickCaptures.$inferSelect;
export type WeeklyPlanEntry = typeof weeklyPlanEntries.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type TagConfig = typeof tagConfigs.$inferSelect;
export type VideoSession = typeof videoSessions.$inferSelect;
