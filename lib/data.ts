export type Tag = "frontend" | "backend" | "infra" | "bug" | "auth";
export type TaskStatus = "ideas" | "backlog" | "next" | "in-progress" | "review" | "done";

export interface Task {
  id: string;
  title: string;
  tags: Tag[];
  estimate?: string;
  flagged?: boolean;
  blocked?: boolean;
  checked?: boolean;
  progress?: number;
  wipMax?: number;
  description?: string;
}

export const COLUMNS: { id: TaskStatus; label: string; count: number; wip?: number }[] = [
  { id: "ideas",       label: "IDEAS",       count: 4 },
  { id: "backlog",     label: "BACKLOG",     count: 5 },
  { id: "next",        label: "NEXT",        count: 3 },
  { id: "in-progress", label: "IN PROGRESS", count: 2, wip: 2 },
  { id: "review",      label: "REVIEW",      count: 2 },
  { id: "done",        label: "DONE",        count: 3 },
];

export const TASKS: Record<TaskStatus, Task[]> = {
  ideas: [
    { id: "i1", title: "Multi-tenant workspace support",        tags: ["backend"],            estimate: "full·day" },
    { id: "i2", title: "AI-powered search over notes",          tags: ["frontend"],           estimate: "2h" },
    { id: "i3", title: "Auto-deploy on git push via webhook",   tags: ["infra"],              estimate: "2h" },
    { id: "i4", title: "Usage analytics export to CSV",         tags: ["backend"],            estimate: "1h" },
  ],
  backlog: [
    { id: "b1", title: "Email notifications: digest mode",      tags: ["backend"],            estimate: "2h" },
    { id: "b2", title: "Dark mode toggle + theme persistence",  tags: ["frontend"],           estimate: "1h" },
    { id: "b3", title: "Rate limiting on public API endpoints", tags: ["infra", "backend"],   estimate: "1d" },
    { id: "b4", title: "Onboarding checklist component",        tags: ["frontend"],           estimate: "2h" },
    { id: "b5", title: "Fix: broken pagination on /projects",   tags: ["bug"],                estimate: "1h", flagged: true },
  ],
  next: [
    { id: "n1", title: "Auth: OAuth2 Google login flow",        tags: ["backend", "auth"],    estimate: "3h", flagged: true, description: "Needs callback URL config + session handling" },
    { id: "n2", title: "Billing: Stripe webhook handler",       tags: ["backend"],            estimate: "4d" },
    { id: "n3", title: "Dashboard: KPI summary cards",          tags: ["frontend"],           estimate: "1h" },
  ],
  "in-progress": [
    { id: "ip1", title: "Subscription plan upgrade flow",       tags: ["frontend", "backend"], estimate: "full·day", flagged: true, progress: 60, description: "UI + backend state machine for plan changes" },
    { id: "ip2", title: "DB migration: add team roles",         tags: ["infra", "backend"],   estimate: "1d",       progress: 30 },
  ],
  review: [
    { id: "r1", title: "User profile settings page",            tags: ["frontend"],           estimate: "2h", checked: true, description: "Check responsive layout on mobile" },
    { id: "r2", title: "Fix: null pointer on empty org query",  tags: ["bug"],                estimate: "1h" },
  ],
  done: [
    { id: "d1", title: "JWT auth middleware setup",             tags: ["backend"],            estimate: "4h", checked: true },
    { id: "d2", title: "Landing page hero redesign",            tags: ["frontend"],           estimate: "1w", checked: true },
    { id: "d3", title: "Postgres backup cron job",              tags: ["infra"],              estimate: "4h", checked: true },
  ],
};

export const WEEKLY_PLAN = [
  { day: "MON", tasks: [{ title: "JWT auth middleware", done: true }],                            extra: [] },
  { day: "TUE", tasks: [{ title: "Landing page hero", done: false }],                             extra: [{ title: "Postgres backup" }] },
  { day: "WED", tasks: [{ title: "Subscription upgrade flow", done: false }],                     extra: [] },
  { day: "THU", tasks: [{ title: "DB migration: team roles", done: false }],                      extra: [{ title: "OAuth2 flow" }] },
  { day: "FRI", tasks: [{ title: "Stripe webhooks", done: false }],                               extra: [{ title: "KPI cards" }] },
];

export const UP_NEXT = [
  { id: "n1", title: "Auth: OAuth2 Google login flow",    tags: ["backend", "auth"] as Tag[], estimate: "2h" },
  { id: "n2", title: "Billing: Stripe webhook handler",   tags: ["backend"] as Tag[],         estimate: "1d" },
  { id: "n3", title: "Dashboard: KPI summary cards",      tags: ["frontend"] as Tag[],        estimate: "1h" },
];

export const QUICK_CAPTURE_RECENT = [
  "CLI tool for schema diffs",
  "Public changelog page",
  "Zapier integration hooks",
];

export const DEV_DISTRIBUTION = [
  { label: "Frontend", count: 8, color: "#4ade80",  max: 10 },
  { label: "Backend",  count: 5, color: "#60a5fa",  max: 10 },
  { label: "Infra",    count: 3, color: "#a78bfa",  max: 10 },
  { label: "Bugs",     count: 2, color: "#f87171",  max: 10 },
];

// Activity grid — 26 weeks of data
export function generateActivityData() {
  const weeks: number[][] = [];
  for (let w = 0; w < 26; w++) {
    const days: number[] = [];
    for (let d = 0; d < 7; d++) {
      const r = Math.random();
      days.push(r < 0.15 ? 0 : r < 0.4 ? 1 : r < 0.65 ? 2 : r < 0.82 ? 3 : 4);
    }
    weeks.push(days);
  }
  // Last 14 days — high activity streak
  for (let w = 24; w < 26; w++) {
    for (let d = 0; d < 7; d++) weeks[w][d] = d < 5 ? 3 + Math.floor(Math.random() * 2) : 1;
  }
  return weeks;
}
