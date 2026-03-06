import type { Tag } from "./types";

export function parseTags(json: string): Tag[] {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

export function serializeTags(tags: Tag[]): string {
  return JSON.stringify(tags);
}

export function getISOWeekNumber(d: Date): number {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

export function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatHeaderDate(): string {
  const now = new Date();
  const dayName = now.toLocaleDateString("en", { weekday: "short" }).toUpperCase();
  const week = getISOWeekNumber(now);
  const month = now.toLocaleDateString("en", { month: "short" }).toUpperCase();
  const day = String(now.getDate()).padStart(2, "0");
  return `${dayName} · W${week} · ${month} ${day}`;
}

export function startOfDay(d: Date = new Date()): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}
