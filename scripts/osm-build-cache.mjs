#!/usr/bin/env node
// Convert osmium geojsonseq output into the compact data/osm-pois.json cache.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const [src, fetchedAt = new Date().toISOString()] = process.argv.slice(2);
const KEEP = ["name", "opening_hours", "website", "contact:website", "phone", "contact:phone", "leisure", "sport", "shop", "amenity"];
const round = (x) => Math.round(x * 1e6) / 1e6;

function centroid(geom) {
  const pts = [];
  const walk = (c) => (typeof c[0] === "number" ? pts.push(c) : c.forEach(walk));
  walk(geom.coordinates);
  const lng = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const lat = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return { lat: round(lat), lng: round(lng) };
}

const seen = new Set();
const pois = [];
for (const line of readFileSync(src, "utf8").split("\n")) {
  const s = line.replace(/^\x1e/, "").trim(); // geojsonseq record separator
  if (!s) continue;
  const f = JSON.parse(s);
  const tags = f.properties ?? {};
  if (!tags.name || !tags.opening_hours || !f.geometry) continue;
  const { lat, lng } = centroid(f.geometry);
  const key = `${tags.name}|${lat.toFixed(4)}|${lng.toFixed(4)}`; // area + node duplicates
  if (seen.has(key)) continue;
  seen.add(key);
  pois.push({ lat, lng, t: Object.fromEntries(KEEP.filter((k) => tags[k]).map((k) => [k, tags[k]])) });
}
if (pois.length < 1000) throw new Error(`Only ${pois.length} POIs – refusing to overwrite the cache`);
mkdirSync("data", { recursive: true });
writeFileSync("data/osm-pois.json", JSON.stringify({ fetchedAt, pois }));
console.log(`[osm] cache: ${pois.length} POIs`);
