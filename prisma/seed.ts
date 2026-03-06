import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.weeklyPlanEntry.deleteMany();
  await prisma.quickCapture.deleteMany();
  await prisma.task.deleteMany();

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // Helper: date N days ago
  function daysAgo(n: number): Date {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d;
  }

  // --- TASKS ---
  const tasks = [
    // Done
    { title: "JWT auth middleware setup",      status: "done", tags: '["backend"]',         estimate: "4h",       checked: true,  completedAt: daysAgo(9), createdAt: daysAgo(9),  sortOrder: 0 },
    { title: "Landing page hero redesign",     status: "done", tags: '["frontend"]',        estimate: "1w",       checked: true,  completedAt: daysAgo(8), createdAt: daysAgo(8),  sortOrder: 1 },
    { title: "Postgres backup cron job",       status: "done", tags: '["infra"]',           estimate: "4h",       checked: true,  completedAt: daysAgo(7), createdAt: daysAgo(8),  sortOrder: 2 },
    // Review
    { title: "User profile settings page",     status: "review", tags: '["frontend"]',      estimate: "2h",       checked: true,  description: "Check responsive layout on mobile", createdAt: daysAgo(5), sortOrder: 0 },
    { title: "Fix: null pointer on empty org query", status: "review", tags: '["bug"]',     estimate: "1h",       createdAt: daysAgo(2), sortOrder: 1 },
    // In progress
    { title: "Subscription plan upgrade flow", status: "in-progress", tags: '["frontend","backend"]', estimate: "full·day", flagged: true, progress: 60, description: "UI + backend state machine for plan changes", createdAt: daysAgo(2), sortOrder: 0 },
    { title: "DB migration: add team roles",   status: "in-progress", tags: '["infra","backend"]',    estimate: "1d",       progress: 30, createdAt: daysAgo(0), sortOrder: 1 },
    // Next
    { title: "Auth: OAuth2 Google login flow", status: "next", tags: '["backend","auth"]',  estimate: "3h",       flagged: true, description: "Needs callback URL config + session handling", createdAt: daysAgo(4), sortOrder: 0 },
    { title: "Billing: Stripe webhook handler", status: "next", tags: '["backend"]',        estimate: "4d",       createdAt: daysAgo(4), sortOrder: 1 },
    { title: "Dashboard: KPI summary cards",   status: "next", tags: '["frontend"]',        estimate: "1h",       createdAt: daysAgo(3), sortOrder: 2 },
    // Backlog
    { title: "Email notifications: digest mode", status: "backlog", tags: '["backend"]',    estimate: "2h",       createdAt: daysAgo(10), sortOrder: 0 },
    { title: "Dark mode toggle + theme persistence", status: "backlog", tags: '["frontend"]', estimate: "1h",     createdAt: daysAgo(10), sortOrder: 1 },
    { title: "Rate limiting on public API endpoints", status: "backlog", tags: '["infra","backend"]', estimate: "1d", createdAt: daysAgo(10), sortOrder: 2 },
    { title: "Onboarding checklist component", status: "backlog", tags: '["frontend"]',     estimate: "2h",       createdAt: daysAgo(9), sortOrder: 3 },
    { title: "Fix: broken pagination on /projects", status: "backlog", tags: '["bug"]',     estimate: "1h",       flagged: true, createdAt: daysAgo(8), sortOrder: 4 },
    // Ideas
    { title: "Multi-tenant workspace support", status: "ideas", tags: '["backend"]',        estimate: "full·day", createdAt: daysAgo(14), sortOrder: 0 },
    { title: "AI-powered search over notes",   status: "ideas", tags: '["frontend"]',       estimate: "2h",       createdAt: daysAgo(14), sortOrder: 1 },
    { title: "Auto-deploy on git push via webhook", status: "ideas", tags: '["infra"]',     estimate: "2h",       createdAt: daysAgo(12), sortOrder: 2 },
    { title: "Usage analytics export to CSV",  status: "ideas", tags: '["backend"]',        estimate: "1h",       createdAt: daysAgo(11), sortOrder: 3 },
  ];

  for (const t of tasks) {
    await prisma.task.create({
      data: {
        title: t.title,
        status: t.status,
        tags: t.tags,
        estimate: t.estimate ?? null,
        flagged: t.flagged ?? false,
        checked: t.checked ?? false,
        progress: t.progress ?? null,
        description: t.description ?? null,
        sortOrder: t.sortOrder,
        completedAt: t.completedAt ?? null,
        createdAt: t.createdAt,
      },
    });
  }

  // --- ACTIVITY LOGS ---
  // Generate realistic activity for the last 26 weeks (~182 days)
  for (let d = 182; d >= 0; d--) {
    const date = daysAgo(d);
    const dayOfWeek = date.getDay(); // 0=Sun
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Lower activity on weekends, recent days more active
    let probability = isWeekend ? 0.3 : 0.75;
    if (d < 14) probability = isWeekend ? 0.4 : 0.9; // streak

    if (Math.random() < probability) {
      const count = isWeekend
        ? Math.ceil(Math.random() * 2)
        : Math.ceil(Math.random() * (d < 14 ? 5 : 4));

      for (let i = 0; i < count; i++) {
        const hour = 8 + Math.floor(Math.random() * 10);
        const logDate = new Date(date);
        logDate.setHours(hour, Math.floor(Math.random() * 60));
        await prisma.activityLog.create({
          data: {
            action: "completed",
            occurredAt: logDate,
          },
        });
      }
    }
  }

  // --- QUICK CAPTURES ---
  await prisma.quickCapture.createMany({
    data: [
      { text: "CLI tool for schema diffs", createdAt: daysAgo(1) },
      { text: "Public changelog page", createdAt: daysAgo(1) },
      { text: "Zapier integration hooks", createdAt: daysAgo(2) },
    ],
  });

  // --- WEEKLY PLAN ---
  const monday = new Date(today);
  const dow = monday.getDay();
  monday.setDate(monday.getDate() - dow + (dow === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);

  await prisma.weeklyPlanEntry.createMany({
    data: [
      { dayOfWeek: 0, weekStart: monday, taskTitle: "JWT auth middleware",          done: true,  sortOrder: 0 },
      { dayOfWeek: 1, weekStart: monday, taskTitle: "Landing page hero",            done: false, sortOrder: 0 },
      { dayOfWeek: 1, weekStart: monday, taskTitle: "Postgres backup",              done: false, sortOrder: 1 },
      { dayOfWeek: 2, weekStart: monday, taskTitle: "Subscription upgrade flow",    done: false, sortOrder: 0 },
      { dayOfWeek: 3, weekStart: monday, taskTitle: "DB migration: team roles",     done: false, sortOrder: 0 },
      { dayOfWeek: 3, weekStart: monday, taskTitle: "OAuth2 flow",                  done: false, sortOrder: 1 },
      { dayOfWeek: 4, weekStart: monday, taskTitle: "Stripe webhooks",              done: false, sortOrder: 0 },
      { dayOfWeek: 4, weekStart: monday, taskTitle: "KPI cards",                    done: false, sortOrder: 1 },
    ],
  });

  console.log("Seed complete!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
