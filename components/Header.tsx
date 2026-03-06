"use client";
import { useState } from "react";
import { Plus, Tag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatHeaderDate } from "@/lib/helpers";
import NewTaskModal from "./NewTaskModal";
import TagsManagerModal from "./TagsManagerModal";
import ProfileModal, { Avatar, type UserProfile } from "./ProfileModal";

const NAV = [
  { label: "Board",    href: "/board" },
  { label: "Planning", href: "/planning" },
  { label: "Videos",   href: "/videos" },
  { label: "Archive",  href: "/archive" },
];

interface Props {
  user: UserProfile | null;
}

export default function Header({ user }: Props) {
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [localUser, setLocalUser] = useState<UserProfile | null>(user);

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

        <div className="flex items-center gap-2">
          <span style={{ color: "#666", fontSize: 12 }}>{formatHeaderDate()}</span>
          <button
            onClick={() => setTagsOpen(true)}
            title="Manage tags"
            style={{
              display: "flex", alignItems: "center",
              background: "transparent", color: "#666",
              border: "1px solid #2a2a2a", borderRadius: 6,
              padding: "5px 8px", fontSize: 12,
              cursor: "pointer",
            }}>
            <Tag size={13} />
          </button>

          {/* Avatar / profile button */}
          {localUser && (
            <button
              onClick={() => setProfileOpen(true)}
              title="Profile"
              style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <Avatar user={localUser} size={26} />
            </button>
          )}

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
      <TagsManagerModal open={tagsOpen} onClose={() => setTagsOpen(false)} />
      {localUser && (
        <ProfileModal
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          user={localUser}
          onUpdate={updated => setLocalUser(prev => prev ? { ...prev, ...updated } : prev)}
        />
      )}
    </>
  );
}
