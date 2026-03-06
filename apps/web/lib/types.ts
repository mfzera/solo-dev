export type Tag = string;
export type TaskStatus = "ideas" | "backlog" | "next" | "in-progress" | "review" | "done";

export const ALL_STATUSES: TaskStatus[] = ["ideas", "backlog", "next", "in-progress", "review", "done"];

export interface TagConfig {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  ideas: "IDEAS",
  backlog: "BACKLOG",
  next: "NEXT",
  "in-progress": "IN PROGRESS",
  review: "REVIEW",
  done: "DONE",
};

export const WIP_LIMITS: Partial<Record<TaskStatus, number>> = {
  "in-progress": 2,
};

export interface TaskView {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  tags: Tag[];
  estimate: string | null;
  flagged: boolean;
  blocked: boolean;
  checked: boolean;
  progress: number | null;
  sortOrder: number;
  assignee: string | null;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface StatsData {
  doneToday: number;
  doneThisWeek: number;
  inProgress: number;
  weeklyProductivity: number[];
  devDistribution: { label: string; count: number; color: string; max: number }[];
  progressPct: number;
  totalBacklog: number;
  totalCompleted: number;
  upNext: TaskView[];
}

export interface ActivityCell {
  date: string; // YYYY-MM-DD
  level: number;
  count: number;
}

export interface ActivityData {
  grid: ActivityCell[][];
  totalShipped: number;
  bestWeekLabel: string;
  bestWeekCount: number;
  bestDay: string;
  avgPerWeek: number;
  activeDays: number;
  totalDays: number;
  streakDays: number;
  monthlyOutput: { month: string; value: number; isCurrent: boolean }[];
}

export interface WeeklyPlanView {
  id: string;
  dayOfWeek: number;
  taskTitle: string;
  done: boolean;
  taskId: string | null;
}

export interface QuickCaptureView {
  id: string;
  text: string;
  createdAt: string;
  promotedToTaskId: string | null;
}

export type VideoStatus = "idea" | "scripting" | "filming" | "editing" | "published";
export const ALL_VIDEO_STATUSES: VideoStatus[] = ["idea", "scripting", "filming", "editing", "published"];

export const VIDEO_STATUS_LABELS: Record<VideoStatus, string> = {
  idea: "Idea",
  scripting: "Scripting",
  filming: "Filming",
  editing: "Editing",
  published: "Published",
};

export interface VideoSessionView {
  id: string;
  title: string;
  status: VideoStatus;
  script: string | null;
  ideas: string | null;
  tags: Tag[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
