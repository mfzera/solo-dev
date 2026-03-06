import type { Context } from "hono";

export function ok<T>(c: Context, data: T, meta?: Record<string, unknown>, status: 200 | 201 = 200) {
  return c.json({ data, error: null, meta: meta ?? null }, status);
}

export function err(c: Context, message: string, status: 400 | 401 | 403 | 404 | 409 | 500 = 400) {
  return c.json({ data: null, error: message, meta: null }, status);
}
