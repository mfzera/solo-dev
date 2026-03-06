"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight, X, Clock } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function pad(n: number) {
  return String(n).padStart(2, "0");
}
function formatDisplay(date: Date, withTime: boolean): string {
  const d = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  if (!withTime) return d;
  return `${d} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function buildISO(year: number, month: number, day: number, h: number, m: number): string {
  return new Date(year, month, day, h, m).toISOString();
}

interface DatePickerProps {
  value: string | null;
  onChange: (iso: string | null) => void;
  placeholder?: string;
  withTime?: boolean;
  label?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  withTime = false,
  label,
  disabled = false,
  minDate,
  maxDate,
}: DatePickerProps) {
  const parsed = value ? new Date(value) : null;

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState((parsed ?? new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState((parsed ?? new Date()).getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(parsed?.getDate() ?? null);
  const [hour, setHour] = useState(parsed?.getHours() ?? 0);
  const [minute, setMinute] = useState(parsed?.getMinutes() ?? 0);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync when value changes externally
  useEffect(() => {
    const d = value ? new Date(value) : null;
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setSelectedDay(d.getDate());
      setHour(d.getHours());
      setMinute(d.getMinutes());
    } else {
      setSelectedDay(null);
    }
  }, [value]);

  // Position popover below trigger using fixed coords
  const positionPopover = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const popoverH = withTime ? 340 : 280;

    if (spaceBelow >= popoverH + 8) {
      setPopoverStyle({ top: rect.bottom + 6, left: rect.left });
    } else {
      setPopoverStyle({ top: rect.top - popoverH - 6, left: rect.left });
    }
  }, [withTime]);

  useEffect(() => {
    if (!open) return;
    positionPopover();
    window.addEventListener("scroll", positionPopover, true);
    window.addEventListener("resize", positionPopover);
    return () => {
      window.removeEventListener("scroll", positionPopover, true);
      window.removeEventListener("resize", positionPopover);
    };
  }, [open, positionPopover]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (
        triggerRef.current?.contains(t) ||
        popoverRef.current?.contains(t)
      ) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function selectDay(day: number) {
    setSelectedDay(day);
    if (!withTime) {
      onChange(buildISO(viewYear, viewMonth, day, 0, 0));
      setOpen(false);
    }
  }

  function confirm() {
    if (selectedDay === null) return;
    onChange(buildISO(viewYear, viewMonth, selectedDay, hour, minute));
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    setSelectedDay(null);
    setOpen(false);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const today = new Date();
  const min = minDate ? new Date(minDate) : null;
  const max = maxDate ? new Date(maxDate) : null;

  function isDisabledDay(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    if (min && d < new Date(min.getFullYear(), min.getMonth(), min.getDate())) return true;
    if (max && d > new Date(max.getFullYear(), max.getMonth(), max.getDate())) return true;
    return false;
  }
  function isToday(day: number) {
    return day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  }
  function isSelected(day: number) {
    if (!parsed) return false;
    return day === parsed.getDate() && viewMonth === parsed.getMonth() && viewYear === parsed.getFullYear();
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const popover = open && (
    <div
      ref={popoverRef}
      style={{
        position: "fixed",
        ...popoverStyle,
        zIndex: 9999,
        background: "#161616",
        border: "1px solid #2a2a2a",
        borderRadius: 10,
        padding: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        width: 260,
      }}
    >
      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button type="button" onClick={prevMonth} style={navBtn}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#e8e8e8" }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={nextMonth} style={navBtn}>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ textAlign: "center", fontSize: 10, color: "#555", fontWeight: 600, padding: "2px 0" }}>
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const sel = isSelected(day);
          const tod = isToday(day);
          const dis = isDisabledDay(day);
          return (
            <button
              key={i}
              type="button"
              disabled={dis}
              onClick={() => !dis && selectDay(day)}
              style={{
                padding: "5px 0", borderRadius: 5, fontSize: 12,
                fontWeight: sel ? 700 : tod ? 600 : 400,
                background: sel ? "#d4702a" : tod ? "rgba(212,112,42,0.15)" : "transparent",
                color: sel ? "#fff" : dis ? "#333" : tod ? "#d4702a" : "#ccc",
                border: "none", cursor: dis ? "default" : "pointer",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Time picker */}
      {withTime && (
        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: "1px solid #2a2a2a",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Clock size={13} style={{ color: "#555", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#666" }}>Time</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
            <select value={hour} onChange={e => setHour(Number(e.target.value))} style={timeSelect}>
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{pad(i)}</option>
              ))}
            </select>
            <span style={{ color: "#555", fontWeight: 700 }}>:</span>
            <select value={minute} onChange={e => setMinute(Number(e.target.value))} style={timeSelect}>
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                <option key={m} value={m}>{pad(m)}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {withTime && (
        <button
          type="button"
          onClick={confirm}
          disabled={selectedDay === null}
          style={{
            marginTop: 10, width: "100%",
            background: selectedDay !== null ? "#d4702a" : "#222",
            border: "none", borderRadius: 6,
            padding: "7px 0", fontSize: 12, fontWeight: 600,
            color: selectedDay !== null ? "#fff" : "#444",
            cursor: selectedDay !== null ? "pointer" : "default",
          }}
        >
          Confirm
        </button>
      )}
    </div>
  );

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {label && (
        <label style={{ fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <Calendar size={11} />
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) { positionPopover(); setOpen(o => !o); } }}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#111", border: `1px solid ${open ? "#d4702a" : "#2e2e2e"}`,
          borderRadius: 6, padding: "6px 10px",
          fontSize: 12, color: parsed ? "#e8e8e8" : "#555",
          cursor: disabled ? "default" : "pointer",
          transition: "border-color 0.15s",
          outline: "none",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={12} style={{ color: parsed ? "#d4702a" : "#444", flexShrink: 0 }} />
          {parsed ? formatDisplay(parsed, withTime) : placeholder}
        </span>
        {parsed && (
          <span onClick={clear} style={{ color: "#444", display: "flex", cursor: "pointer" }}>
            <X size={12} />
          </span>
        )}
      </button>

      {typeof document !== "undefined" && createPortal(popover, document.body)}
    </div>
  );
}

const navBtn: React.CSSProperties = {
  background: "transparent", border: "1px solid #2a2a2a",
  borderRadius: 5, padding: "3px 6px",
  cursor: "pointer", color: "#888",
  display: "flex", alignItems: "center",
};

const timeSelect: React.CSSProperties = {
  background: "#1e1e1e", border: "1px solid #2a2a2a",
  borderRadius: 5, padding: "3px 6px",
  fontSize: 12, color: "#e8e8e8",
  outline: "none", cursor: "pointer",
  colorScheme: "dark",
};
