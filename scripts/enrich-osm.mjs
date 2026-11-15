#!/usr/bin/env node
/**
 * Add opening hours (and missing web/phone) to public/data/facilities.json
 * from the cached OpenStreetMap extract data/osm-pois.json (see scripts/osm-refresh.sh).
 * Works offline; if the cache is missing, it keeps whatever hours the file already has.
 *
 * Matching needs positive evidence – distance alone is never enough (wrong hours are worse
 * than none). Scores: same website domain +3, same phone +3, a distinctive shared name token +2,
 * one compact name contained in the other +2. Accept ≥2 points within 150 m or ≥3 within 400 m.
 * Assignment is one-to-one (best pairs first), so one OSM venue can't feed several facilities.
 * Data © OpenStreetMap contributors (ODbL) – attributed in the app.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fold } from "./lib/categorize.mjs";

const FILE = "public/data/facilities.json";
const CACHE = "data/osm-pois.json";

const data = JSON.parse(readFileSync(FILE, "utf8"));
const before = data.facilities.filter((f) => f.hours).length;

if (!existsSync(CACHE)) {
  console.warn(`[osm] ${CACHE} missing (run scripts/osm-refresh.sh); keeping existing hours (${before})`);
  process.exit(0);
}
const { pois, fetchedAt } = JSON.parse(readFileSync(CACHE, "utf8"));

// ---- tokens: drop generic sport words and place names, which match unrelated venues
const GENERIC = new Set(
  ("fitness fitko gym studio centrum center centre club klub sport sportovni sportcentrum areal hala " +
    "wellness yoga joga pilates tenis tennis squash badminton padel bazen bazeny koupaliste aquapark " +
    "lazne sauna laser arena bowling jumping park dance tanecni skola school the and pro pod nad pri " +
    "spol sro s.r.o z.s. o.s. city plus").split(" "),
);
const PLACES = new Set();
for (const f of data.facilities) for (const t of fold(f.city).split(/[^a-z0-9]+/)) if (t.length > 2) PLACES.add(t);
// Prague / Brno districts that commonly appear in venue names
for (const t of "praha brno ostrava plzen olomouc liberec chodov hostivar vinohrady zizkov karlin smichov holesovice dejvice vrsovice nusle letnany cerny most stodulky zlicin modrany branik pankrac andel florenc vysocany prosek kobylisy bohnice lisen michle krc haje opatov lesna bystrc zabovresky kralovo pole slatina".split(" "))
  PLACES.add(t);

const tokens = (s) =>
  new Set(fold(s).split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !GENERIC.has(t) && !PLACES.has(t)));
const compact = (s) => fold(s).replace(/[^a-z0-9]/g, "");
const SOCIAL = /facebook\.|instagram\.|linktr\.ee|google\.|youtube\./;
const domain = (u) => {
  if (!u) return null;
  try {
    const h = new URL(/^https?:/.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, "");
    return SOCIAL.test(h) ? null : h;
  } catch {
    return null;
  }
};
const phone9 = (p) => (p ? String(p).replace(/\D/g, "").slice(-9) || null : null);

function dist(a, b) {
  const dLat = (b.lat - a.lat) * 111_320;
  const dLng = (b.lng - a.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

// ---- spatial grid (~0.005° ≈ 400–550 m cells)
const grid = new Map();
const key = (la, ln) => `${la}:${ln}`;
pois.forEach((p, i) => {
  p.i = i;
  const name = [p.t.name, p.t.brand, p.t.operator].filter(Boolean).join(" ");
  p.tok = tokens(name);
  p.cmp = compact(p.t.name);
  p.dom = domain(p.t.website || p.t["contact:website"]);
  p.tel = phone9(p.t.phone || p.t["contact:phone"]);
  const k = key(Math.floor(p.lat * 200), Math.floor(p.lng * 200));
  if (!grid.has(k)) grid.set(k, []);
  grid.get(k).push(p);
});
function near(f) {
  const la = Math.floor(f.lat * 200), ln = Math.floor(f.lng * 200);
  const out = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) out.push(...(grid.get(key(la + i, ln + j)) ?? []));
  return out;
}

// ---- candidate pairs
const pairs = [];
data.facilities.forEach((f, fi) => {
  const ft = tokens(f.name);
  const fc = compact(f.name);
  const fd = domain(f.web);
  const fp = phone9(f.phone);
  const wellness = f.category === "wellness";
  for (const p of near(f)) {
    if (p.t.shop && !(p.t.shop === "massage" && wellness)) continue;
    const d = dist(f, p);
    if (d > 400) continue;
    let score = 0;
    if (fd && p.dom && fd === p.dom) score += 3;
    if (fp && p.tel && fp === p.tel) score += 3;
    if ([...ft].some((t) => p.tok.has(t))) score += 2;
    if (fc.length >= 5 && p.cmp.length >= 5 && (fc.includes(p.cmp) || p.cmp.includes(fc))) score += 2;
    if ((d <= 150 && score >= 2) || score >= 3) pairs.push({ fi, pi: p.i, score, d });
  }
});
pairs.sort((a, b) => b.score - a.score || a.d - b.d);

// ---- one-to-one assignment
const usedF = new Set(), usedP = new Set();
for (const f of data.facilities) delete f.hours;
let matched = 0;
for (const { fi, pi } of pairs) {
  if (usedF.has(fi) || usedP.has(pi)) continue;
  usedF.add(fi);
  usedP.add(pi);
  const f = data.facilities[fi];
  const t = pois[pi].t;
  f.hours = t.opening_hours;
  f.web ??= t.website || t["contact:website"] || null;
  f.phone ??= t.phone || t["contact:phone"] || null;
  matched++;
}

// A sudden collapse means a broken cache or matcher – fail loudly instead of publishing it.
if (before >= 50 && matched < before * 0.5) {
  console.error(`[osm] matched ${matched}, previously ${before} – refusing to drop that many hours`);
  process.exit(1);
}

data.hoursSource = "OpenStreetMap";
data.hoursUpdatedAt = fetchedAt;
writeFileSync(FILE, JSON.stringify(data));
console.log(`[osm] opening hours for ${matched}/${data.facilities.length} facilities (OSM data ${fetchedAt})`);
