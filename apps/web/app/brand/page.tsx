export default function BrandPage() {
  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh", color: "#e8e8e8", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>

      {/* Top bar */}
      <div style={{ borderBottom: "1px solid #1e1e1e", padding: "18px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/name.svg" alt="honja" style={{ height: 18, width: "auto", display: "block" }} />
        </div>
        <span style={{ fontSize: 11, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase" }}>Brand Identity</span>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "64px 48px 96px" }}>

        {/* Hero */}
        <div style={{ marginBottom: 80 }}>
          <p style={{ fontSize: 11, color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 24 }}>Visual Identity System</p>
          <div style={{ marginBottom: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/name.svg" alt="honja" style={{ height: 56, width: "auto", display: "block" }} />
          </div>
          <p style={{ marginTop: 8, fontSize: 14, color: "#666", maxWidth: 420, lineHeight: 1.7 }}>
            One workspace for your backlog, timeline, and focus. Built for developers who work alone and ship fast.
          </p>
        </div>

        <Divider label="Logotype" />

        {/* Logo variants */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, marginBottom: 64 }}>
          <LogoPanel bg="#0e0e0e" label="On dark">
            <LogoMark variant="red" />
          </LogoPanel>
          <LogoPanel bg="#c0392b" label="On brand">
            <LogoMark variant="white" />
          </LogoPanel>
          <LogoPanel bg="#f5f5f5" label="On light">
            <LogoMark variant="red" />
          </LogoPanel>
          <LogoPanel bg="#fff" label="On white">
            <LogoMark variant="black" />
          </LogoPanel>
        </div>

        <Divider label="Color" />

        {/* Primary palette */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Primary</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 2 }}>
            <Swatch hex="#7b0d0d" name="Red 900" />
            <Swatch hex="#a31515" name="Red 700" />
            <Swatch hex="#c0392b" name="Red 600" label="Primary" />
            <Swatch hex="#e74c3c" name="Red 400" />
            <Swatch hex="#f87171" name="Red 300" />
          </div>
        </div>

        {/* Neutral palette */}
        <div style={{ marginBottom: 64 }}>
          <p style={{ fontSize: 11, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Neutral</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 2 }}>
            <Swatch hex="#0e0e0e" name="900" />
            <Swatch hex="#1a1a1a" name="800" />
            <Swatch hex="#2a2a2a" name="700" />
            <Swatch hex="#444" name="500" />
            <Swatch hex="#888" name="300" />
            <Swatch hex="#e8e8e8" name="100" dark />
          </div>
        </div>

        <Divider label="Typography" />

        {/* Type scale */}
        <div style={{ marginBottom: 64, display: "flex", flexDirection: "column", gap: 24 }}>
          <TypeRow size="72px" weight={900} tracking="-3px" label="Display / 72 Black">Ship without</TypeRow>
          <TypeRow size="40px" weight={700} tracking="-1.5px" label="Heading / 40 Bold">The noise is optional.</TypeRow>
          <TypeRow size="24px" weight={600} tracking="-0.5px" label="Title / 24 Semibold">Your backlog, your rules.</TypeRow>
          <TypeRow size="14px" weight={400} tracking="0" label="Body / 14 Regular">One workspace for your backlog, timeline, and focus. Built for developers who work alone and ship fast.</TypeRow>
          <TypeRow size="11px" weight={600} tracking="0.1em" label="Label / 11 Semibold" upper>Tasks shipped · Active streak · Current run</TypeRow>
        </div>

        <Divider label="Components" />

        {/* Components */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, marginBottom: 64 }}>

          {/* Buttons */}
          <ComponentPanel label="Buttons">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button style={{ background: "#c0392b", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "fit-content" }}>
                Primary
              </button>
              <button style={{ background: "transparent", color: "#c0392b", border: "1px solid #c0392b", borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "fit-content" }}>
                Outline
              </button>
              <button style={{ background: "#1e1e1e", color: "#e8e8e8", border: "1px solid #2a2a2a", borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", width: "fit-content" }}>
                Secondary
              </button>
              <button style={{ background: "transparent", color: "#555", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 400, cursor: "pointer", width: "fit-content" }}>
                Ghost
              </button>
            </div>
          </ComponentPanel>

          {/* Tags */}
          <ComponentPanel label="Tags">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span className="tag tag-frontend">frontend</span>
              <span className="tag tag-backend">backend</span>
              <span className="tag tag-infra">infra</span>
              <span className="tag tag-bug">bug</span>
              <span className="tag tag-auth">auth</span>
              <span style={{ background: "#3a1010", color: "#e74c3c", display: "inline-flex", alignItems: "center", padding: "1px 6px", borderRadius: 3, fontSize: 11, fontWeight: 500 }}>
                flagged
              </span>
            </div>
          </ComponentPanel>

          {/* Status */}
          <ComponentPanel label="Status Indicators">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { dot: "#c0392b", label: "In Progress", sub: "3 tasks active" },
                { dot: "#4ade80", label: "Completed", sub: "12 tasks done" },
                { dot: "#444", label: "Backlog", sub: "8 tasks queued" },
              ].map(({ dot, label, sub }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#e8e8e8" }}>{label}</div>
                    <div style={{ fontSize: 11, color: "#555" }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </ComponentPanel>

          {/* Badge & Heat */}
          <ComponentPanel label="Activity & Badges">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {["#1e1e1e", "#3a1010", "#6b1818", "#9e2424", "#c0392b"].map((c, i) => (
                  <div key={i} style={{ width: 18, height: 18, borderRadius: 3, background: c }} title={c} />
                ))}
                <span style={{ fontSize: 11, color: "#444", marginLeft: 8, alignSelf: "center" }}>heat scale</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ background: "#2e1010", color: "#c0392b", fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>42 streak</span>
                <span style={{ background: "#1e3a2f", color: "#4ade80", fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>shipped</span>
                <span style={{ background: "#1e1e1e", color: "#888", fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 600, border: "1px solid #2a2a2a" }}>draft</span>
              </div>
            </div>
          </ComponentPanel>

        </div>

        <Divider label="Voice" />

        {/* Taglines */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, marginBottom: 64 }}>
          {[
            { line: "Ship without the noise.", sub: "Primary tagline" },
            { line: "Work alone. Ship fast.", sub: "Secondary tagline" },
            { line: "Your backlog, your rules.", sub: "Alt tagline" },
          ].map(({ line, sub }) => (
            <div key={sub} style={{ background: "#141414", border: "1px solid #1e1e1e", padding: "24px", borderRadius: 4 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.3, margin: "0 0 12px" }}>{line}</p>
              <p style={{ fontSize: 11, color: "#444", margin: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>{sub}</p>
            </div>
          ))}
        </div>

      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #1a1a1a", padding: "20px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/name.svg" alt="honja" style={{ height: 10, width: "auto", display: "block", opacity: 0.25 }} />
        </div>
        <span style={{ fontSize: 11, color: "#333" }}>Brand Guidelines v1</span>
      </div>

    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
      <span style={{ fontSize: 11, color: "#333", letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
    </div>
  )
}

function LogoPanel({ bg, children, label }: { bg: string; children: React.ReactNode; label?: string }) {
  return (
    <div style={{ background: bg, padding: "48px 40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, border: "1px solid #1a1a1a" }}>
      {children}
      {label && <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.3, color: bg === "#fff" || bg === "#f5f5f5" ? "#000" : "#fff" }}>{label}</span>}
    </div>
  )
}

/** filter values for SVG color transforms */
const FILTER = {
  white: "brightness(0) invert(1)",
  black: "brightness(0)",
  red: "none",
}

function LogoMark({ variant = "red" }: { variant?: "red" | "white" | "black" }) {
  const f = FILTER[variant]
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/name.svg" alt="honja" style={{ height: 22, width: "auto", display: "block", filter: f }} />
  )
}

function Swatch({ hex, name, label, dark }: { hex: string; name: string; label?: string; dark?: boolean }) {
  return (
    <div>
      <div style={{ background: hex, height: 64, borderRadius: 4, marginBottom: 8 }} />
      <div style={{ fontSize: 11, fontWeight: label ? 700 : 400, color: label ? "#e8e8e8" : "#555" }}>{name}</div>
      {label && <div style={{ fontSize: 10, color: "#c0392b", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>{label}</div>}
      <div style={{ fontSize: 10, color: "#333", marginTop: 2, fontFamily: "var(--font-dm-mono), monospace" }}>{hex}</div>
    </div>
  )
}

function TypeRow({ size, weight, tracking, label, children, upper }: {
  size: string; weight: number; tracking: string; label: string; children: React.ReactNode; upper?: boolean
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 24, borderBottom: "1px solid #141414", paddingBottom: 20 }}>
      <div style={{ width: 180, flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: "#333", letterSpacing: "0.08em" }}>{label}</div>
      </div>
      <div style={{ fontSize: size, fontWeight: weight, letterSpacing: tracking, color: "#e8e8e8", lineHeight: 1.2, textTransform: upper ? "uppercase" : "none" }}>
        {children}
      </div>
    </div>
  )
}

function ComponentPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#141414", border: "1px solid #1e1e1e", padding: "28px" }}>
      <p style={{ fontSize: 10, color: "#333", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px" }}>{label}</p>
      {children}
    </div>
  )
}
