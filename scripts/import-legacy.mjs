#!/usr/bin/env node
/**
 * One-off: convert the export from the old multi-suggest Worker/D1
 * (data/legacy-d1-export.json, Prague only) into the app's index format.
 * Used until the new scraper (scripts/scrape.mjs) can run for the whole CZ.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { categorize, categoriesFor } from "./lib/categorize.mjs";

const rows = JSON.parse(readFileSync("data/legacy-d1-export.json", "utf8"));
const url = (s) => (!s || !s.trim() ? null : /^https?:\/\//i.test(s) ? s.trim() : `https://${s.trim()}`);

const facilities = rows.map((r) => {
  const acts = (r.activities || []).map((name) => ({ name }));
  const [street, city] = (r.address || "").split(/,\s*(?=[^,]*$)/);
  const legacyCat = r.category === "sports" ? "racket" : r.category;
  return {
    id: String(r.id),
    name: r.name.trim(),
    street: (street || "").trim(),
    city: (city || r.city || "Praha").trim(),
    lat: r.lat,
    lng: r.lng,
    category: legacyCat && legacyCat !== "other" ? legacyCat : categorize("", acts, r.name),
    categories: categoriesFor(acts),
    activities: r.activities || [],
    image: r.image_url,
    gallery: (r.gallery_images || []).slice(0, 8),
    web: url(r.website_url),
    facebook: url(r.facebook_url),
    instagram: url(r.instagram_url),
    phone: r.phone,
    email: r.email,
    description: r.description,
    surcharge: !!r.additional_payment,
    surchargeNote: r.additional_payment_desc,
    kids: !!r.kids_activities,
    virtualOnly: !!r.only_virtual_card,
    parking: r.parking === "Yes" ? true : r.parking === "No" ? false : null,
    selfService: !!r.self_service,
    selfServiceTimes: r.self_service_times,
    nonstop: !!r.unlimited_oh,
    isNew: !!r.is_new,
    recommended: !!r.recommended,
    cards: (r.active_cards || []).map((c) => c.name).filter(Boolean),
  };
});
facilities.sort((a, b) => a.name.localeCompare(b.name, "cs"));
mkdirSync("public/data", { recursive: true });
writeFileSync(
  "public/data/facilities.json",
  JSON.stringify({ updatedAt: rows.reduce((m, r) => (r.updated_at > m ? r.updated_at : m), ""), source: "legacy", count: facilities.length, facilities }),
);
const c = {};
facilities.forEach((f) => (c[f.category] = (c[f.category] || 0) + 1));
console.log(facilities.length, c);
