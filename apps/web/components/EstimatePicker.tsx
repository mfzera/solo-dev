"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Clock, X } from "lucide-react";

type Unit = "m" | "h" | "d" | "w";

const PRIMARY_UNITS: { unit: Unit; label: string }[] = [
  { unit: "m", label: "min" },
  { unit: "h", label: "hrs" },
  { unit: "d", label: "days" },
  { unit: "w", label: "wks" },
];

const PRIMARY_NUMBERS: Record<Unit, number[]> = {
  m: [15, 30, 45, 60, 90, 120],
  h: [1, 2, 3, 4, 5, 6, 8, 10, 12],
  d: [1, 2, 3, 4, 5, 6, 7],
  w: [1, 2, 3, 4],
};

// secondary unit per primary
const SECONDARY: Record<Unit, { unit: Unit; label: string; values: number[] } | null> = {
  m: null,
  h: { unit: "m", label: "+ min", values: [15, 30, 45] },
  d: { unit: "h", label: "+ hrs", values: [1, 2, 3, 4, 6, 8] },
  w: { unit: "d", label: "+ days", values: [1, 2, 3, 4, 5] },
};

function buildValue(pn: number | null, pu: Unit, sn: number | null): string {
  if (!pn) return "";
  const primary = `${pn}${pu}`;
  if (!sn) return primary;
  const sec = SECONDARY[pu];
  return sec ? `${primary} ${sn}${sec.unit}` : primary;
}

interface EstimatePickerProps {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  disabled?: boolean;
}

export default function EstimatePicker({ value, onChange, label, disabled = false }: EstimatePickerProps) {
  const [open, setOpen] = useState(false);
  const [primaryUnit, setPrimaryUnit] = useState<Unit>("h");
  const [primaryNum, setPrimaryNum] = useState<number | null>(null);
  const [secondaryNum, setSecondaryNum] = useState<number | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const positionPopover = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const popoverH = 260;
    if (spaceBelow >= popoverH + 8) {
      setPopoverStyle({ top: rect.bottom + 6, left: rect.left });
    } else {
      setPopoverStyle({ top: rect.top - popoverH - 6, left: rect.left });
    }
  }, []);

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

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handlePrimaryUnit(u: Unit) {
    setPrimaryUnit(u);
    setSecondaryNum(null);
  }

  function handlePrimaryNum(n: number) {
    const next = primaryNum === n ? null : n;
    setPrimaryNum(next);
    setSecondaryNum(null);
    const v = buildValue(next, primaryUnit, null);
    onChange(v);
  }

  function handleSecondaryNum(n: number) {
    const next = secondaryNum === n ? null : n;
    setSecondaryNum(next);
    const v = buildValue(primaryNum, primaryUnit, next);
    onChange(v);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setPrimaryNum(null);
    setSecondaryNum(null);
  }

  function handleOpen() {
    if (disabled) return;
    positionPopover();
    setOpen(o => !o);
  }

  const secondary = SECONDARY[primaryUnit];
  const preview = buildValue(primaryNum, primaryUnit, secondaryNum);

  const popover = open && (
    <div
      ref={popoverRef}
      style={{
        position: "fixed", ...popoverStyle, zIndex: 9999,
        background: "#161616", border: "1px solid #2a2a2a",
        borderRadius: 10, padding: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        width: 256,
      }}
    >
      {/* Unit tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {PRIMARY_UNITS.map(({ unit, label: lbl }) => (
          <button key={unit} type="button" onClick={() => handlePrimaryUnit(unit)}
            style={{
              flex: 1, padding: "5px 0", borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: primaryUnit === unit ? "1px solid #d4702a" : "1px solid #2a2a2a",
              background: primaryUnit === unit ? "rgba(212,112,42,0.15)" : "transparent",
              color: primaryUnit === unit ? "#d4702a" : "#666",
              cursor: "pointer",
            }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Primary numbers */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: secondary ? 12 : 0 }}>
        {PRIMARY_NUMBERS[primaryUnit].map(n => (
          <button key={n} type="button" onClick={() => handlePrimaryNum(n)}
            style={{
              padding: "5px 10px", borderRadius: 5, fontSize: 12, fontWeight: 500,
              border: primaryNum === n ? "1px solid #d4702a" : "1px solid #2a2a2a",
              background: primaryNum === n ? "rgba(212,112,42,0.15)" : "transparent",
              color: primaryNum === n ? "#d4702a" : "#888",
              cursor: "pointer",
            }}>
            {n}{primaryUnit}
          </button>
        ))}
      </div>

      {/* Secondary numbers */}
      {secondary && primaryNum !== null && (
        <>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#555", letterSpacing: "0.07em", marginBottom: 8 }}>
            {secondary.label}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {secondary.values.map(n => (
              <button key={n} type="button" onClick={() => handleSecondaryNum(n)}
                style={{
                  padding: "5px 10px", borderRadius: 5, fontSize: 12, fontWeight: 500,
                  border: secondaryNum === n ? "1px solid #d4702a" : "1px solid #2a2a2a",
                  background: secondaryNum === n ? "rgba(212,112,42,0.15)" : "transparent",
                  color: secondaryNum === n ? "#d4702a" : "#888",
                  cursor: "pointer",
                }}>
                {n}{secondary.unit}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Preview */}
      {preview && (
        <div style={{
          marginTop: 12, paddingTop: 10, borderTop: "1px solid #2a2a2a",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 11, color: "#555" }}>Selected</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#d4702a" }}>{preview}</span>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {label && (
        <label style={{ fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <Clock size={11} />
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#111", border: `1px solid ${open ? "#d4702a" : "#2e2e2e"}`,
          borderRadius: 6, padding: "6px 10px",
          fontSize: 12, color: value ? "#e8e8e8" : "#555",
          cursor: disabled ? "default" : "pointer",
          transition: "border-color 0.15s", outline: "none",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={12} style={{ color: value ? "#d4702a" : "#444", flexShrink: 0 }} />
          {value || "No estimate"}
        </span>
        {value && (
          <span onClick={clear} style={{ color: "#444", display: "flex", cursor: "pointer" }}>
            <X size={12} />
          </span>
        )}
      </button>
      {typeof document !== "undefined" && createPortal(popover, document.body)}
    </div>
  );
}
