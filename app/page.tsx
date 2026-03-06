import Link from "next/link";

export default function HomePage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: "#f0ede8" }}
    >
      <div className="flex flex-col items-center text-center gap-6">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-7 h-7 rounded"
            style={{ backgroundColor: "#e85d26" }}
          />
          <span
            className="font-semibold text-sm tracking-wide"
            style={{ color: "#111" }}
          >
            solo.dev
          </span>
        </div>

        <h1
          className="font-black leading-none"
          style={{ fontSize: "72px", color: "#111", letterSpacing: "-3px" }}
        >
          Ship without
          <br />
          <span style={{ color: "#e85d26" }}>the noise.</span>
        </h1>

        <p className="text-sm max-w-xs leading-relaxed" style={{ color: "#888" }}>
          One workspace for your backlog, timeline, and focus.
          <br />
          Built for developers who work alone and ship fast.
        </p>

        <Link
          href="/login"
          className="px-8 py-3 rounded font-semibold text-sm mt-2"
          style={{ backgroundColor: "#e85d26", color: "white" }}
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
