import "./env.js"; // validate env first
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { apiReference } from "@scalar/hono-api-reference";
import { env } from "./env.js";
import { apiAuth, userScope } from "./middleware/auth.js";
import { tasksRouter } from "./routes/tasks.js";
import { tagsRouter } from "./routes/tags.js";
import { videosRouter } from "./routes/videos.js";
import { planningRouter } from "./routes/planning.js";
import { capturesRouter } from "./routes/captures.js";
import { activityRouter } from "./routes/activity.js";
import { usersRouter } from "./routes/users.js";
import { statsRouter } from "./routes/stats.js";
import { serve } from "@hono/node-server";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGINS.split(",").map((o) => o.trim()),
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// Health check (public)
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// OpenAPI spec (public)
app.get("/openapi.json", (c) =>
  c.json({
    openapi: "3.1.0",
    info: {
      title: "Solo Dev API",
      version: "1.0.0",
      description: "Internal API for the Solo Dev dashboard — tasks, videos, planning, activity & more.",
    },
    servers: [{ url: `http://localhost:${env.PORT}`, description: "Local" }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer" },
      },
    },
    paths: {
      "/health": { get: { summary: "Health check", responses: { "200": { description: "OK" } } } },
      "/tasks": {
        get: { summary: "List tasks", tags: ["Tasks"], parameters: [{ name: "status", in: "query", schema: { type: "string" } }, { name: "archived", in: "query", schema: { type: "boolean" } }], responses: { "200": { description: "Task list or grouped by status" } } },
        post: { summary: "Create task", tags: ["Tasks"], responses: { "201": { description: "Created task" } } },
      },
      "/tasks/{id}": {
        get: { summary: "Get task", tags: ["Tasks"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Task" }, "404": { description: "Not found" } } },
        patch: { summary: "Update task", tags: ["Tasks"], responses: { "200": { description: "Updated task" } } },
        delete: { summary: "Delete task", tags: ["Tasks"], responses: { "200": { description: "Deleted" } } },
      },
      "/tasks/{id}/archive": { post: { summary: "Archive task", tags: ["Tasks"], responses: { "200": { description: "Archived" } } } },
      "/tasks/{id}/restore": { post: { summary: "Restore task", tags: ["Tasks"], responses: { "200": { description: "Restored" } } } },
      "/tasks/{id}/move": { patch: { summary: "Move task (kanban)", tags: ["Tasks"], responses: { "200": { description: "Moved task" } } } },
      "/tags": {
        get: { summary: "List tags", tags: ["Tags"], responses: { "200": { description: "Tag list" } } },
        post: { summary: "Create tag", tags: ["Tags"], responses: { "201": { description: "Created tag" } } },
      },
      "/tags/{id}": {
        patch: { summary: "Update tag", tags: ["Tags"], responses: { "200": { description: "Updated tag" } } },
        delete: { summary: "Delete tag", tags: ["Tags"], responses: { "200": { description: "Deleted" } } },
      },
      "/videos": {
        get: { summary: "List video sessions", tags: ["Videos"], responses: { "200": { description: "Video list" } } },
        post: { summary: "Create video session", tags: ["Videos"], responses: { "201": { description: "Created" } } },
      },
      "/videos/{id}": {
        get: { summary: "Get video session", tags: ["Videos"], responses: { "200": { description: "Video" } } },
        patch: { summary: "Update video session", tags: ["Videos"], responses: { "200": { description: "Updated" } } },
        delete: { summary: "Delete video session", tags: ["Videos"], responses: { "200": { description: "Deleted" } } },
      },
      "/planning": {
        get: { summary: "List weekly plan entries", tags: ["Planning"], parameters: [{ name: "weekStart", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Plan entries" } } },
        post: { summary: "Add plan entry", tags: ["Planning"], responses: { "201": { description: "Created" } } },
      },
      "/planning/{id}/toggle": { patch: { summary: "Toggle done state", tags: ["Planning"], responses: { "200": { description: "Updated" } } } },
      "/planning/{id}": { delete: { summary: "Remove plan entry", tags: ["Planning"], responses: { "200": { description: "Deleted" } } } },
      "/captures": {
        get: { summary: "List captures", tags: ["Captures"], responses: { "200": { description: "Capture list" } } },
        post: { summary: "Add capture", tags: ["Captures"], responses: { "201": { description: "Created" } } },
      },
      "/captures/{id}/promote": { post: { summary: "Promote capture to task", tags: ["Captures"], responses: { "200": { description: "Promoted" } } } },
      "/captures/{id}": { delete: { summary: "Delete capture", tags: ["Captures"], responses: { "200": { description: "Deleted" } } } },
      "/activity/heatmap": { get: { summary: "52-week activity heatmap", tags: ["Activity"], responses: { "200": { description: "Heatmap data" } } } },
      "/activity/day": { get: { summary: "Tasks completed on a day", tags: ["Activity"], parameters: [{ name: "date", in: "query", required: true, schema: { type: "string", example: "2026-03-06" } }], responses: { "200": { description: "Task list" } } } },
      "/activity": { post: { summary: "Log activity event", tags: ["Activity"], responses: { "201": { description: "Created" } } } },
      "/users/profile": {
        get: { summary: "Get user profile", tags: ["Users"], parameters: [{ name: "id", in: "query", schema: { type: "string" } }, { name: "email", in: "query", schema: { type: "string" } }], responses: { "200": { description: "User profile" } } },
        patch: { summary: "Update user profile", tags: ["Users"], responses: { "200": { description: "Updated profile" } } },
      },
      "/users/verify": { post: { summary: "Verify credentials", tags: ["Users"], responses: { "200": { description: "User data" }, "401": { description: "Invalid credentials" } } } },
      "/stats": { get: { summary: "Dashboard stats", tags: ["Stats"], responses: { "200": { description: "Stats data" } } } },
    },
  }),
);

// Scalar docs UI (public)
app.get(
  "/docs",
  apiReference({
    theme: "saturn",
    spec: { url: "/openapi.json" },
    pageTitle: "Solo Dev API Docs",
  }),
);

// Protected routes — data routes require both API_SECRET and X-User-Id
app.use("/tasks/*", apiAuth, userScope);
app.use("/tags/*", apiAuth, userScope);
app.use("/videos/*", apiAuth, userScope);
app.use("/planning/*", apiAuth, userScope);
app.use("/captures/*", apiAuth, userScope);
app.use("/activity/*", apiAuth, userScope);
app.use("/stats/*", apiAuth, userScope);
// User management routes: API_SECRET only (used by NextAuth, no userId yet)
app.use("/users/*", apiAuth);

app.route("/tasks", tasksRouter);
app.route("/tags", tagsRouter);
app.route("/videos", videosRouter);
app.route("/planning", planningRouter);
app.route("/captures", capturesRouter);
app.route("/activity", activityRouter);
app.route("/users", usersRouter);
app.route("/stats", statsRouter);

// 404 handler
app.notFound((c) => c.json({ data: null, error: "Not found", meta: null }, 404));

// Error handler
app.onError((e, c) => {
  console.error(e);
  return c.json({ data: null, error: "Internal server error", meta: null }, 500);
});

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`🚀 API running on http://localhost:${info.port}`);
  console.log(`📖 Docs at http://localhost:${info.port}/docs`);
});

export default app;
