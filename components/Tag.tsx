import { type Tag as TagType } from "@/lib/types";

const STYLES: Record<TagType, { bg: string; color: string }> = {
  frontend: { bg: "#1e3a2f", color: "#4ade80" },
  backend:  { bg: "#1e2a3a", color: "#60a5fa" },
  infra:    { bg: "#2a1e3a", color: "#a78bfa" },
  bug:      { bg: "#3a1e1e", color: "#f87171" },
  auth:     { bg: "#3a2a1e", color: "#fb923c" },
};

export default function Tag({ tag }: { tag: TagType }) {
  const s = STYLES[tag];
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "1px 6px", borderRadius: 3,
      fontSize: 11, fontWeight: 500,
      display: "inline-flex", alignItems: "center",
    }}>
      {tag}
    </span>
  );
}
