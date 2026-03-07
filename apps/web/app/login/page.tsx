"use client";

import { useActionState } from "react";
import { login } from "@/lib/auth-actions";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const initialState = { error: undefined as string | undefined };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await login(formData);
      return result ?? initialState;
    },
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden md:flex flex-col justify-between w-[560px] shrink-0 p-10"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/name.svg" alt="honja" style={{ height: 18, width: "auto", display: "block", filter: "brightness(0) invert(1)" }} />
        </div>

        <div>
          <h1
            className="text-white font-black leading-none mb-4"
            style={{ fontSize: "64px", letterSpacing: "-2px" }}
          >
            Ship without
            <br />
            <span style={{ color: "#e74c3c" }}>the noise.</span>
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#888" }}>
            One workspace for your backlog, timeline, and focus.
            <br />
            Built for developers who work alone and ship fast.
          </p>
        </div>

        <div className="flex gap-10">
          <div>
            <div
              className="text-4xl font-black"
              style={{ color: "white", letterSpacing: "-1px" }}
            >
              312
            </div>
            <div
              className="text-xs font-semibold tracking-widest mt-1"
              style={{ color: "#555" }}
            >
              TASKS SHIPPED
            </div>
          </div>
          <div>
            <div
              className="text-4xl font-black"
              style={{ color: "white", letterSpacing: "-1px" }}
            >
              26w
            </div>
            <div
              className="text-xs font-semibold tracking-widest mt-1"
              style={{ color: "#555" }}
            >
              STREAK ACTIVE
            </div>
          </div>
          <div>
            <div
              className="text-4xl font-black"
              style={{ color: "#e74c3c", letterSpacing: "-1px" }}
            >
              14d
            </div>
            <div
              className="text-xs font-semibold tracking-widest mt-1"
              style={{ color: "#555" }}
            >
              CURRENT RUN
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div
        className="flex-1 flex items-center justify-center p-8"
        style={{ backgroundColor: "#f0ede8" }}
      >
        <div className="w-full max-w-sm">
          <h2
            className="font-bold mb-1"
            style={{ fontSize: "28px", color: "#111", letterSpacing: "-0.5px" }}
          >
            Welcome back
          </h2>
          <p className="text-sm mb-8" style={{ color: "#888" }}>
            Sign in to continue to your workspace
          </p>

          {/* OAuth buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={() => signIn("github", { callbackUrl: "/board" })}
              className="w-full py-3 rounded font-semibold text-sm flex items-center justify-center gap-3 transition-opacity hover:opacity-80"
              style={{
                backgroundColor: "#24292e",
                color: "white",
                border: "1px solid #24292e",
              }}
            >
              <GitHubIcon />
              Continue with GitHub
            </button>
            <button
              onClick={() => signIn("discord", { callbackUrl: "/board" })}
              className="w-full py-3 rounded font-semibold text-sm flex items-center justify-center gap-3 transition-opacity hover:opacity-80"
              style={{
                backgroundColor: "#5865f2",
                color: "white",
                border: "1px solid #5865f2",
              }}
            >
              <DiscordIcon />
              Continue with Discord
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ backgroundColor: "#e0dbd3" }} />
            <span className="text-xs font-semibold tracking-widest" style={{ color: "#aaa" }}>
              OR
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: "#e0dbd3" }} />
          </div>

          {/* Email/password form */}
          <form action={formAction} className="flex flex-col gap-4">
            {state.error && (
              <div
                className="text-sm px-4 py-3 rounded"
                style={{
                  backgroundColor: "#fde8e8",
                  color: "#c0392b",
                  border: "1px solid #f5c6c6",
                }}
              >
                {state.error}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label
                className="text-xs font-semibold tracking-widest"
                style={{ color: "#666" }}
              >
                EMAIL
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@honja"
                required
                className="w-full px-4 py-3 rounded text-sm outline-none"
                style={{
                  backgroundColor: "white",
                  border: "1px solid #e0dbd3",
                  color: "#111",
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label
                  className="text-xs font-semibold tracking-widest"
                  style={{ color: "#666" }}
                >
                  PASSWORD
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  className="w-full px-4 py-3 rounded text-sm outline-none pr-11"
                  style={{
                    backgroundColor: "white",
                    border: "1px solid #e0dbd3",
                    color: "#111",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#999" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full py-3 rounded font-semibold text-sm mt-2 transition-opacity"
              style={{
                backgroundColor: "#e74c3c",
                color: "white",
                opacity: pending ? 0.7 : 1,
              }}
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
    </svg>
  );
}
