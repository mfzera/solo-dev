"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatHeaderDate } from "@/lib/helpers";
import NewTaskModal from "./NewTaskModal";

const NAV = [
  { label: "Board",    href: "/" },
  { label: "Planning", href: "/planning" },
  { label: "Archive",  href: "/archive" },
];

export default function Header() {
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <header style={{ background: "#111", borderBottom: "1px solid #2a2a2a" }}
              className="flex items-center justify-between px-4 h-10 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div style={{ width: 22, height: 22, background: "#d4702a", borderRadius: 5 }} />
            <span style={{ fontWeight: 600, fontSize: 13, color: "#e8e8e8" }}>solo.dev</span>
          </div>
          <nav className="flex items-center gap-1">
            {NAV.map(({ label, href }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                      style={{
                        padding: "3px 10px", borderRadius: 5,
                        fontWeight: active ? 600 : 400, fontSize: 13,
                        background: active ? "#2a2a2a" : "transparent",
                        color: active ? "#e8e8e8" : "#888",
                        textDecoration: "none",
                      }}>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span style={{ color: "#666", fontSize: 12 }}>{formatHeaderDate()}</span>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "#d4702a", color: "#fff",
              border: "none", borderRadius: 6,
              padding: "5px 12px", fontSize: 12, fontWeight: 600,
              cursor: "pointer",
            }}>
            <Plus size={13} strokeWidth={2.5} />
            New Task
          </button>
        </div>
      </header>
      <NewTaskModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
