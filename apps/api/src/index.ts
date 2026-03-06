import { serve } from "@hono/node-server";
import { env } from "./env.js";
import app from "./app.js";

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`🚀 API running on http://localhost:${info.port}`);
  console.log(`📖 Docs at http://localhost:${info.port}/docs`);
});
