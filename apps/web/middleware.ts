import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Generate a random nonce for this request (base64-encoded 16 random bytes)
  const nonce = btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))),
  );

  const csp = [
    "default-src 'self'",
    // 'strict-dynamic' lets trusted (nonce-bearing) scripts load further scripts,
    // which is required for Next.js chunk loading.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // nonce covers Next.js inline styles; fonts.googleapis.com for Google Fonts.
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com",
    // Allow images from same origin, data URIs, and any HTTPS source (avatars, etc.)
    "img-src 'self' data: https:",
    // API calls go to same origin or the configured API URL
    `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL ?? ""}`.trim(),
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ]
    .join("; ");

  const requestHeaders = new Headers(request.headers);
  // Pass nonce to Server Components via a request header
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and Next.js internals.
     * CSP with nonce only makes sense for HTML responses; static assets
     * don't need (or benefit from) a per-request nonce.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)$).*)",
  ],
};
