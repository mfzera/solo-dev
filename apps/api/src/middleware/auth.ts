import type { MiddlewareHandler } from "hono";
import { env } from "../env.js";
import type { AppEnv } from "../types.js";

export const apiAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token || token !== env.API_SECRET) {
    return c.json({ data: null, error: "Unauthorized", meta: null }, 401);
  }

  await next();
};

export const userScope: MiddlewareHandler<AppEnv> = async (c, next) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) {
    return c.json({ data: null, error: "X-User-Id header required", meta: null }, 401);
  }
  c.set("userId", userId);
  await next();
};
