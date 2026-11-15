import type { Category } from "./types";

/**
 * Occupancy ESTIMATE. No public live data exists for MultiSport venues, so we model
 * typical hourly load (0–100) per venue type, separately for weekdays and weekends,
 * and blend in the user's own "how busy was it" reports for that place.
 */
type Profile = { wd: number[]; we: number[] }; // index = hour 0..23

// Hand-tuned from typical gym/pool/studio patterns in Czech cities.
// prettier-ignore
const P: Record<Category, Profile> = {
  fitness:  { wd: [0,0,0,0,0,5,25,40,30,22,20,22,30,25,22,30,55,85,95,80,55,30,10,0], we: [0,0,0,0,0,0,5,15,35,55,65,60,50,40,35,40,45,45,40,30,20,10,0,0] },
  swimming: { wd: [0,0,0,0,0,10,45,40,25,20,25,30,35,35,40,60,75,80,70,55,40,20,5,0], we: [0,0,0,0,0,0,10,25,50,70,80,80,75,75,75,70,60,45,30,20,10,0,0,0] },
  wellness: { wd: [0,0,0,0,0,0,5,10,15,20,25,30,30,30,35,45,60,80,90,85,70,45,15,0], we: [0,0,0,0,0,0,0,10,25,45,60,70,75,75,75,70,65,60,50,40,25,10,0,0] },
  yoga:     { wd: [0,0,0,0,0,0,30,45,35,20,25,20,30,20,15,20,35,80,90,70,40,10,0,0], we: [0,0,0,0,0,0,0,20,50,70,65,45,25,15,15,20,30,35,25,10,0,0,0,0] },
  group:    { wd: [0,0,0,0,0,0,20,35,25,20,25,20,25,20,15,20,40,85,95,80,45,15,0,0], we: [0,0,0,0,0,0,0,15,40,65,70,55,35,20,15,20,25,30,20,10,0,0,0,0] },
  racket:   { wd: [0,0,0,0,0,0,25,40,30,25,25,25,35,30,30,40,60,85,95,90,70,40,10,0], we: [0,0,0,0,0,0,10,30,55,75,80,75,65,60,60,60,60,55,45,30,15,5,0,0] },
  climbing: { wd: [0,0,0,0,0,0,5,15,15,15,20,25,30,25,25,35,55,80,90,85,65,35,10,0], we: [0,0,0,0,0,0,0,10,30,55,75,80,80,75,70,65,55,45,35,20,10,0,0,0] },
  outdoor:  { wd: [0,0,0,0,0,0,10,20,20,20,25,30,35,35,40,50,60,65,60,50,35,15,5,0], we: [0,0,0,0,0,0,5,15,35,60,75,80,80,80,75,70,60,45,30,15,5,0,0,0] },
  kids:     { wd: [0,0,0,0,0,0,0,10,30,45,50,35,20,25,40,65,80,75,50,25,5,0,0,0], we: [0,0,0,0,0,0,0,15,45,75,85,80,60,55,65,70,60,40,20,5,0,0,0,0] },
  other:    { wd: [0,0,0,0,0,0,15,30,25,20,20,25,30,25,25,35,55,80,85,70,45,20,5,0], we: [0,0,0,0,0,0,5,15,35,55,65,60,50,45,45,45,45,40,30,20,10,0,0,0] },
};

export type CrowdReport = { ts: number; level: 0 | 1 | 2 }; // 0 prázdno, 1 akorát, 2 narváno
export type CrowdLevel = "quiet" | "ok" | "busy" | "packed";

export const LEVEL_LABEL: Record<CrowdLevel, string> = {
  quiet: "Spíš prázdno",
  ok: "Akorát",
  busy: "Rušněji",
  packed: "Nejspíš plno",
};
export const LEVEL_COLOR: Record<CrowdLevel, string> = {
  quiet: "#3CC48E",
  ok: "#9BC53D",
  busy: "#F2A93B",
  packed: "#F25C3B",
};

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

export function hourlyProfile(category: Category, date: Date, reports: CrowdReport[] = []): number[] {
  const base = [...(isWeekend(date) ? P[category].we : P[category].wd)];
  if (!reports.length) return base;
  // Personal calibration: reports from the same day type pull nearby hours toward the reported level.
  const we = isWeekend(date);
  for (const r of reports) {
    const d = new Date(r.ts);
    if (isWeekend(d) !== we) continue;
    const target = [12, 50, 92][r.level];
    const h = d.getHours();
    for (let k = -1; k <= 1; k++) {
      const i = h + k;
      if (i < 0 || i > 23 || base[i] === 0) continue;
      const w = k === 0 ? 0.5 : 0.25;
      base[i] = Math.round(base[i] * (1 - w) + target * w);
    }
  }
  return base;
}

export function levelOf(v: number): CrowdLevel {
  return v < 30 ? "quiet" : v < 55 ? "ok" : v < 78 ? "busy" : "packed";
}

/** Best (quietest) upcoming hour today among open hours, if notably better than now. */
export function quietTip(profile: number[], now: Date, open?: (h: number) => boolean): number | null {
  const h0 = now.getHours();
  let best: number | null = null;
  for (let h = h0 + 1; h <= 22; h++) {
    if (profile[h] === 0 || (open && !open(h))) continue;
    if (best === null || profile[h] < profile[best]) best = h;
  }
  if (best === null) return null;
  return profile[best] + 15 < profile[h0] ? best : null;
}
