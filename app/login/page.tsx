"use client";

import { useActionState } from "react";
import { login } from "@/lib/auth-actions";
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
          <div
            className="w-7 h-7 rounded"
            style={{ backgroundColor: "#e85d26" }}
          />
          <span className="text-white font-semibold text-sm tracking-wide">
            solo.dev
          </span>
        </div>

        <div>
          <h1
            className="text-white font-black leading-none mb-4"
            style={{ fontSize: "64px", letterSpacing: "-2px" }}
          >
            Ship without
            <br />
            <span style={{ color: "#e85d26" }}>the noise.</span>
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
              style={{ color: "#e85d26", letterSpacing: "-1px" }}
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
                placeholder="you@solo.dev"
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
                backgroundColor: "#e85d26",
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
