export type Tag = "frontend" | "backend" | "infra" | "bug" | "auth";
export type TaskStatus = "ideas" | "backlog" | "next" | "in-progress" | "review" | "done";

export const ALL_TAGS: Tag[] = ["frontend", "backend", "infra", "bug", "auth"];
export const ALL_STATUSES: TaskStatus[] = ["ideas", "backlog", "next", "in-progress", "review", "done"];

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

export interface ActivityData {
  grid: number[][];
  totalShipped: number;
  bestWeekLabel: string;
  bestWeekCount: number;
  bestDay: string;
  avgPerWeek: number;
  activeDays: number;
  totalDays: number;
  streakDays: number;
  monthlyOutput: { month: string; value: number }[];
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
