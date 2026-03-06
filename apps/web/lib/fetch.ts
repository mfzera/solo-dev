const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const API_SECRET = process.env.API_SECRET ?? "";

if (!API_SECRET && typeof window === "undefined") {
  console.warn("[api] API_SECRET is not set — all API requests will return 401");
}

type FetchInit = RequestInit & { userId?: string };

/** Throws on non-OK responses. Use in server actions and API client. */
export async function apiFetch<T>(path: string, init?: FetchInit): Promise<T> {
  const { userId, ...restInit } = init ?? {};
  const res = await fetch(`${API_URL}${path}`, {
    ...restInit,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_SECRET}`,
      ...(userId ? { "X-User-Id": userId } : {}),
      ...restInit?.headers,
    },
    cache: "no-store",
  });

  const body = await res.json() as { data: T; error: string | null };
  if (!res.ok || body.error) throw new Error(body.error ?? `API error ${res.status}`);
  return body.data;
}

/** Returns null on any error. Use in NextAuth callbacks where failures must not throw. */
export async function apiFetchSafe<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_SECRET}`,
        ...init?.headers,
      },
    });
    const body = await res.json() as { data: T; error: string | null };
    if (!res.ok || body.error) return null;
    return body.data;
  } catch {
    return null;
  }
}
