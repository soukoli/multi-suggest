import { Category, CrowdLevel } from "./types";

type TimeRange = [number, number]; // [startHour, endHour)

interface CrowdSchedule {
  empty: TimeRange[];
  ok: TimeRange[];
  busy: TimeRange[];
  full: TimeRange[];
}

const CROWD_RULES: Record<Category, CrowdSchedule> = {
  fitness: {
    empty: [[7, 9]],
    ok: [
      [9, 12],
      [13, 16],
      [20, 22],
    ],
    busy: [[12, 13]],
    full: [[17, 20]],
  },
  swimming: {
    empty: [[6, 9]],
    ok: [
      [9, 11],
      [11, 14],
      [20, 22],
    ],
    busy: [[14, 16]],
    full: [[16, 20]],
  },
  wellness: {
    empty: [
      [9, 11],
      [14, 16],
    ],
    ok: [
      [7, 9],
      [11, 14],
      [20, 22],
    ],
    busy: [[16, 18]],
    full: [[18, 21]],
  },
  yoga: {
    empty: [
      [6, 8],
      [10, 12],
    ],
    ok: [
      [12, 17],
      [20, 22],
    ],
    busy: [[8, 10]],
    full: [[17, 20]],
  },
  water: {
    empty: [[6, 9]],
    ok: [[9, 16]],
    busy: [[16, 19]],
    full: [],
  },
  group: {
    empty: [[6, 8], [14, 16]],
    ok: [[8, 10], [12, 14], [20, 22]],
    busy: [[10, 12]],
    full: [[17, 20]],
  },
  sports: {
    empty: [[7, 9]],
    ok: [[9, 16], [21, 23]],
    busy: [[16, 18]],
    full: [[18, 21]],
  },
  climbing: {
    empty: [[7, 10]],
    ok: [[10, 16], [20, 22]],
    busy: [[16, 18]],
    full: [[18, 20]],
  },
  kids: {
    empty: [[7, 9]],
    ok: [[9, 11], [14, 16]],
    busy: [[11, 14]],
    full: [[16, 18]],
  },
  outdoor: {
    empty: [[6, 9]],
    ok: [[9, 17]],
    busy: [[17, 20]],
    full: [],
  },
  other: {
    empty: [[7, 9]],
    ok: [
      [9, 12],
      [13, 17],
      [20, 22],
    ],
    busy: [[12, 13]],
    full: [[17, 20]],
  },
};

function isInRanges(hour: number, ranges: TimeRange[]): boolean {
  return ranges.some(([start, end]) => hour >= start && hour < end);
}

export function getCrowdLevel(category: Category, hour?: number): CrowdLevel {
  const h = hour ?? new Date().getHours();
  const schedule = CROWD_RULES[category];

  if (isInRanges(h, schedule.empty)) return "empty";
  if (isInRanges(h, schedule.full)) return "full";
  if (isInRanges(h, schedule.busy)) return "busy";
  if (isInRanges(h, schedule.ok)) return "ok";

  // Default for hours not covered (e.g., 22-6)
  return "ok";
}

export function getCrowdLabel(level: CrowdLevel): string {
  switch (level) {
    case "empty":
      return "Skoro prázdno";
    case "ok":
      return "V pohodě";
    case "busy":
      return "Dost lidí";
    case "full":
      return "Plno";
  }
}

export function getCrowdColor(level: CrowdLevel): string {
  switch (level) {
    case "empty":
      return "text-emerald-500";
    case "ok":
      return "text-green-500";
    case "busy":
      return "text-amber-500";
    case "full":
      return "text-red-500";
  }
}

export function getCrowdDotColor(level: CrowdLevel): string {
  switch (level) {
    case "empty":
      return "bg-emerald-500";
    case "ok":
      return "bg-green-500";
    case "busy":
      return "bg-amber-500";
    case "full":
      return "bg-red-500";
  }
}

export function getGoodTimes(category: Category): string {
  const schedule = CROWD_RULES[category];
  const times = [...schedule.empty, ...schedule.ok]
    .sort((a, b) => a[0] - b[0])
    .map(([start, end]) => `${start}:00–${end}:00`);

  return times.slice(0, 3).join(", ");
}

export function isGoodTime(category: Category, hour?: number): boolean {
  const level = getCrowdLevel(category, hour);
  return level === "empty" || level === "ok";
}
