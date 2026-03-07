"use client";
import { useState, useTransition, useEffect } from "react";
import { X, Camera } from "lucide-react";
import { updateProfile, logout } from "@/lib/auth-actions";

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdate: (updated: Partial<UserProfile>) => void;
}

function Avatar({ user, size = 64 }: { user: UserProfile; size?: number }) {
  const initials = (user.name || user.email)
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0].toUpperCase())
    .join("");

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name || user.email}
        style={{
          width: size, height: size, borderRadius: "50%",
          objectFit: "cover", border: "2px solid #2a2a2a",
        }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "#c0392b", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.35, flexShrink: 0,
      border: "2px solid #2a2a2a",
    }}>
      {initials}
    </div>
  );
}

export { Avatar };

export default function ProfileModal({ open, onClose, user, onUpdate }: Props) {
  const [name, setName] = useState(user.name ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setName(user.name ?? "");
      setBio(user.bio ?? "");
      setAvatarUrl(user.avatarUrl ?? "");
      setError("");
      setSaved(false);
    }
  }, [open, user]);

  if (!open) return null;

  function handleSave() {
    startTransition(async () => {
      const result = await updateProfile({
        name: name.trim() || undefined,
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onUpdate({
        name: name.trim() || null,
        bio: bio.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 1200);
    });
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#161616", border: "1px solid #2a2a2a",
        borderRadius: 10, width: 420, padding: 24,
        display: "flex", flexDirection: "column", gap: 20,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#e8e8e8", fontWeight: 600, fontSize: 14 }}>Profile</span>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer", padding: 2 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Avatar preview */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar user={{ ...user, name: name || null, avatarUrl: avatarUrl || null }} size={56} />
          <div style={{ flex: 1 }}>
            <label style={{ color: "#666", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
              Avatar URL
            </label>
            <div style={{ position: "relative" }}>
              <Camera size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#555" }} />
              <input
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                style={{
                  width: "100%", background: "#1e1e1e", border: "1px solid #2a2a2a",
                  borderRadius: 6, color: "#e8e8e8", fontSize: 12,
                  padding: "7px 10px 7px 30px", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label style={{ color: "#666", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
            Email
          </label>
          <div style={{
            background: "#1a1a1a", border: "1px solid #222", borderRadius: 6,
            color: "#555", fontSize: 12, padding: "7px 10px",
          }}>
            {user.email}
          </div>
        </div>

        {/* Name */}
        <div>
          <label style={{ color: "#666", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
            Name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            style={{
              width: "100%", background: "#1e1e1e", border: "1px solid #2a2a2a",
              borderRadius: 6, color: "#e8e8e8", fontSize: 13,
              padding: "7px 10px", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Bio */}
        <div>
          <label style={{ color: "#666", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
            Bio
          </label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="A short description about yourself"
            rows={3}
            style={{
              width: "100%", background: "#1e1e1e", border: "1px solid #2a2a2a",
              borderRadius: 6, color: "#e8e8e8", fontSize: 13,
              padding: "7px 10px", outline: "none", resize: "vertical",
              boxSizing: "border-box", fontFamily: "inherit",
            }}
          />
        </div>

        {error && <span style={{ color: "#f87171", fontSize: 12 }}>{error}</span>}

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <form action={logout}>
            <button
              type="submit"
              style={{
                background: "transparent", border: "none",
                color: "#555", fontSize: 12, cursor: "pointer",
                fontFamily: "inherit", padding: 0,
              }}
            >
              Sign out
            </button>
          </form>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                background: "transparent", border: "1px solid #2a2a2a",
                borderRadius: 6, color: "#888", fontSize: 12,
                padding: "6px 14px", cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              style={{
                background: saved ? "#16a34a" : "#c0392b",
                border: "none", borderRadius: 6, color: "#fff",
                fontSize: 12, fontWeight: 600,
                padding: "6px 16px", cursor: isPending ? "default" : "pointer",
                opacity: isPending ? 0.7 : 1,
                transition: "background 0.2s",
              }}
            >
              {saved ? "Saved!" : isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
