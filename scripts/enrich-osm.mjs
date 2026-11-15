#!/usr/bin/env node
/**
 * Enrich public/data/facilities.json with opening hours (and missing web/phone)
 * from OpenStreetMap via the free Overpass API.
 *
 * Matching: an OSM sport/leisure POI within 150 m whose name shares a meaningful
 * token with the facility name, or any such POI within 20 m.
 * Data © OpenStreetMap contributors (ODbL) – attributed in the app.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const FILE = "public/data/facilities.json";
const MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const UA = "sportmapa-enrich/1.0 (personal, non-commercial)";

const data = JSON.parse(readFileSync(FILE, "utf8"));
const fac = data.facilities;

// Whole Czech Republic as 1° tiles (lat 48–50, lng 12–18).
const tiles = new Set();
for (let la = 48; la <= 50; la++) for (let ln = 12; ln <= 18; ln++) tiles.add(`${la}:${ln}`);

async function overpass(bbox) {
  const q = `[out:json][timeout:180][bbox:${bbox}];(nwr["leisure"]["name"]["opening_hours"];nwr["sport"]["name"]["opening_hours"];nwr["amenity"~"^(dojo|spa|sauna|public_bath)$"]["name"]["opening_hours"];nwr["shop"="massage"]["name"]["opening_hours"];);out tags center;`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const url = MIRRORS[attempt % MIRRORS.length];
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(q),
      });
      if (res.ok) {
        const j = await res.json();
        if (!j.remark) return j.elements;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
  }
  throw new Error(`Overpass failed for ${bbox}`);
}

const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const STOP = new Set(["fitness", "studio", "centrum", "center", "centre", "club", "klub", "sport", "sportovni", "praha", "gym", "the", "and", "a", "s", "yoga", "joga", "wellness", "areal", "tj", "sk", "z.s.", "zs", "s.r.o.", "sro", "cz"]);
const tokens = (s) => new Set(fold(s).split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOP.has(t)));

function dist(a, b) {
  const dLat = (b.lat - a.lat) * 111_320;
  const dLng = (b.lng - a.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

// POIs are cached in the repo (data/osm-pois.json) and refreshed weekly with --refresh.
// The public Overpass API is shared and often at capacity, so a failed refresh keeps the
// previous cache instead of failing the data pipeline.
const CACHE = "data/osm-pois.json";
const KEEP = ["name", "opening_hours", "website", "contact:website", "phone", "contact:phone", "leisure", "sport", "shop", "amenity"];
const cached = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : null;
let pois = cached?.pois ?? [];

if (!cached && !process.argv.includes("--refresh")) {
  console.warn("[osm] no cached POIs yet (run with --refresh); skipping opening hours");
  process.exit(0);
}
if (process.argv.includes("--refresh")) {
  try {
    const fresh = [];
    let i = 0;
    for (const k of tiles) {
      const [la, ln] = k.split(":").map(Number);
      for (const e of await overpass(`${la},${ln},${la + 1},${ln + 1}`)) {
        const lat = e.lat ?? e.center?.lat;
        const lng = e.lon ?? e.center?.lon;
        if (lat == null) continue;
        const t = Object.fromEntries(KEEP.filter((key) => e.tags[key]).map((key) => [key, e.tags[key]]));
        fresh.push({ lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6, t });
      }
      process.stdout.write(`\r[osm] tile ${++i}/${tiles.size}  pois ${fresh.length}   `);
      await new Promise((r) => setTimeout(r, 3000)); // be polite to the shared API
    }
    process.stdout.write("\n");
    pois = fresh;
    mkdirSync("data", { recursive: true });
    writeFileSync(CACHE, JSON.stringify({ fetchedAt: new Date().toISOString(), pois }));
    console.log(`[osm] cache refreshed: ${pois.length} POIs`);
  } catch (e) {
    console.warn(`\n[osm] refresh failed (${e.message}); using cached POIs from ${cached?.fetchedAt ?? "nowhere"}`);
    if (!cached) process.exit(0); // no hours this time, but don't break the pipeline
  }
}
for (const p of pois) p.tok = tokens(p.t.name);

let matched = 0;
for (const f of fac) {
  const ft = tokens(f.name);
  let best = null;
  for (const p of pois) {
    const d = dist(f, p);
    if (d > 150) continue;
    const shared = [...ft].some((t) => p.tok.has(t));
    const score = (shared ? 0 : 1000) + d;
    if ((shared || d <= 20) && (!best || score < best.score)) best = { p, score };
  }
  delete f.hours;
  if (!best) continue;
  const t = best.p.t;
  if (t.shop && !t.leisure && !t.sport) continue;
  f.hours = t.opening_hours;
  f.web ??= t.website || t["contact:website"] || null;
  f.phone ??= t.phone || t["contact:phone"] || null;
  matched++;
}
data.hoursSource = "OpenStreetMap";
writeFileSync(FILE, JSON.stringify(data));
console.log(`[osm] opening hours for ${matched}/${fac.length} facilities`);
