/**
 * Minimal OSM opening_hours parser for the common forms, e.g.
 *   "Mo-Fr 06:00-22:00; Sa,Su 08:00-20:00", "24/7", "Mo-Su 07:00-12:00,14:00-21:00; PH off"
 * Anything it can't understand returns null and the raw string is shown instead.
 */
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Jun-Aug", "Oct-Apr" (wraps), "Dec" → does it include month m (0–11)? */
function monthsInclude(spec: string, m: number): boolean {
  return spec.split(",").some((seg) => {
    const [a, b] = seg.split("-").map((x) => MONTHS.indexOf(x.trim()));
    if (a < 0) return false;
    if (b === undefined || b < 0) return a === m;
    return a <= b ? m >= a && m <= b : m >= a || m <= b;
  });
}
export const DAY_CS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

export type Week = [number, number][][]; // per day (Mo=0): list of [startMin, endMin]

export function parseHours(src: string | null | undefined, now: Date = new Date()): Week | null {
  if (!src) return null;
  const s = src.trim();
  const week: Week = Array.from({ length: 7 }, () => []);
  if (s === "24/7") return week.map(() => [[0, 1440]]) as Week;
  // "Mo 09:00-23:00, Tu-Th 07:00-23:00" → rules separated by commas before a weekday
  const norm = s
    .replace(/"[^"]*"|\([^)]*\)/g, "") // comments
    .replace(/\s*,\s*PH\b|\bPH\s*,\s*/g, "") // holidays inside a day list
    .replace(/\s+open\b/g, "") // explicit "open" keyword
    .replace(/(\d)\s+(?=(Mo|Tu|We|Th|Fr|Sa|Su)\b)/g, "$1;") // "Mo-Fr 06:00-22:00 Sa-Su …" (missing ;)
    .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su),\s+(?=(Mo|Tu|We|Th|Fr|Sa|Su)\b)/g, "$1,") // "Sa, Su"
    .replace(/(?<=\d),\s*(?=(Mo|Tu|We|Th|Fr|Sa|Su)\b)/g, ";") // "…23:00, Tu-Th …"
    .trim();
  if (/sunrise|sunset|dawn|dusk|week\s*\d/i.test(norm)) return null; // not supported → show raw text
  const rules = norm.split(";");
  let hadRule = false;
  for (const raw of rules) {
    let rule = raw.trim();
    // seasonal rules: "Jun-Aug: Mo-Su 09:00-20:00", "Oct-Apr Mo-Fr …" – apply only in season
    const season = rule.match(/^((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))?(?:,(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))?)*):?\s+(?=[A-Z][a-z]|\d|off|closed)/);
    if (season) {
      if (!monthsInclude(season[1], now.getMonth())) {
        hadRule = true; // a valid rule, just not for this month
        continue;
      }
      rule = rule.slice(season[0].length);
    }
    // skip public holidays and specific dates ("PH off", "Jan 1 off", "Dec 24-25 off")
    if (!rule || /^(PH|SH|easter)\b/.test(rule) || /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d/.test(rule)) continue;
    const m = rule.match(/^((?:[A-Z][a-z](?:-[A-Z][a-z])?)(?:,[A-Z][a-z](?:-[A-Z][a-z])?)*)?\s*(.*)$/);
    if (!m) return null;
    const daysPart = m[1];
    const timePart = m[2].trim();
    const days = new Set<number>();
    if (!daysPart) DAYS.forEach((_, i) => days.add(i));
    else
      for (const seg of daysPart.split(",")) {
        const [a, b] = seg.split("-").map((d) => DAYS.indexOf(d));
        if (a < 0 || (b !== undefined && b < 0)) return null;
        if (b === undefined) days.add(a);
        else for (let i = a; ; i = (i + 1) % 7) { days.add(i); if (i === b) break; }
      }
    if (/^(off|closed)$/i.test(timePart)) { days.forEach((d) => (week[d] = [])); hadRule = true; continue; }
    const spans: [number, number][] = [];
    for (const t of timePart.split(",")) {
      const tm = t.trim().match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\+?$/);
      if (!tm) return null;
      const a = +tm[1] * 60 + +tm[2];
      let b = +tm[3] * 60 + +tm[4];
      if (b <= a) b += 1440;
      spans.push([a, b]);
    }
    days.forEach((d) => (week[d] = spans));
    hadRule = true;
  }
  // Comment-only values ("dle domluvy") or nothing usable: let the UI show the raw text.
  if (!hadRule || week.every((d) => d.length === 0)) return null;
  return week;
}

const dayIdx = (d: Date) => (d.getDay() + 6) % 7;
const fmt = (m: number) => `${Math.floor((m % 1440) / 60)}:${String(m % 60).padStart(2, "0")}`;

export function isOpenAt(week: Week, d: Date): boolean {
  const min = d.getHours() * 60 + d.getMinutes();
  const today = week[dayIdx(d)];
  if (today.some(([a, b]) => min >= a && min < b)) return true;
  const y = week[(dayIdx(d) + 6) % 7]; // spans past midnight from yesterday
  return y.some(([, b]) => b > 1440 && min < b - 1440);
}

export function openStatus(week: Week, now: Date): { open: boolean; text: string } {
  const min = now.getHours() * 60 + now.getMinutes();
  const today = week[dayIdx(now)];
  if (today.length === 1 && today[0][0] === 0 && today[0][1] >= 1440 && week.every((d) => d.length)) return { open: true, text: "Nonstop" };
  const cur = today.find(([a, b]) => min >= a && min < b);
  if (cur) return { open: true, text: `Otevřeno do ${fmt(cur[1])}` };
  const late = week[(dayIdx(now) + 6) % 7].find(([, b]) => b > 1440 && min < b - 1440); // after midnight
  if (late) return { open: true, text: `Otevřeno do ${fmt(late[1])}` };
  const next = today.find(([a]) => a > min);
  if (next) return { open: false, text: `Otevírá v ${fmt(next[0])}` };
  for (let k = 1; k <= 7; k++) {
    const d = week[(dayIdx(now) + k) % 7];
    if (d.length) return { open: false, text: `Otevírá ${k === 1 ? "zítra" : DAY_CS[(dayIdx(now) + k) % 7]} v ${fmt(d[0][0])}` };
  }
  return { open: false, text: "Zavřeno" };
}

export function formatDay(spans: [number, number][]): string {
  return spans.length ? spans.map(([a, b]) => `${fmt(a)}–${fmt(b)}`).join(", ") : "zavřeno";
}

export function openHour(week: Week, d: Date, hour: number): boolean {
  const x = new Date(d);
  x.setHours(hour, 30, 0, 0);
  return isOpenAt(week, x);
}
