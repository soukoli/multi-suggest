#!/usr/bin/env node
/**
 * Seed D1 database from local facilities.json
 * 
 * Usage: node scripts/seed-d1.mjs
 * 
 * This reads the scraped data from src/data/facilities.json and 
 * inserts it into the remote D1 database via Wrangler CLI.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, "../src/data/facilities.json");

const raw = JSON.parse(readFileSync(dataPath, "utf8"));
const facilities = Array.isArray(raw) ? raw : raw.facilities;

console.log(`[Seed] Loaded ${facilities.length} facilities from JSON`);

// Generate SQL statements in batches
const BATCH_SIZE = 50;
let totalBatches = Math.ceil(facilities.length / BATCH_SIZE);

for (let batch = 0; batch < totalBatches; batch++) {
  const start = batch * BATCH_SIZE;
  const end = Math.min(start + BATCH_SIZE, facilities.length);
  const slice = facilities.slice(start, end);

  let sql = "";
  for (const f of slice) {
    const esc = (v) => v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`;
    const escJson = (v) => `'${JSON.stringify(v || []).replace(/'/g, "''")}'`;
    
    sql += `INSERT OR REPLACE INTO facilities (id, name, address, city, lat, lng, category, activities, image_url, website_url, phone, description, is_new, recommended, additional_payment, additional_payment_desc, active_cards, kids_activities, gallery_images, email, parking, only_virtual_card, activity_summary, self_service, self_service_times, unlimited_oh, facebook_url, instagram_url, updated_at) VALUES (${esc(f.id)}, ${esc(f.name)}, ${esc(f.address)}, ${esc(f.city)}, ${f.lat}, ${f.lng}, ${esc(f.category)}, ${escJson(f.activities)}, ${esc(f.image_url)}, ${esc(f.website_url)}, ${esc(f.phone)}, ${esc(f.description)}, ${f.is_new ? 1 : 0}, ${f.recommended ? 1 : 0}, ${f.additional_payment ? 1 : 0}, ${esc(f.additional_payment_desc)}, ${escJson(f.active_cards)}, ${f.kids_activities ? 1 : 0}, ${escJson(f.gallery_images)}, ${esc(f.email)}, ${esc(f.parking || 'Unknown')}, ${f.only_virtual_card ? 1 : 0}, ${esc(f.activity_summary)}, ${f.self_service ? 1 : 0}, ${esc(f.self_service_times)}, ${f.unlimited_oh ? 1 : 0}, ${esc(f.facebook_url)}, ${esc(f.instagram_url)}, datetime('now'));\n`;
  }

  // Write to temp file and execute
  const tmpFile = resolve(__dirname, `../migrations/_seed_batch_${batch}.sql`);
  writeFileSync(tmpFile, sql);

  try {
    console.log(`[Seed] Batch ${batch + 1}/${totalBatches} (${slice.length} records)...`);
    execSync(`npx wrangler d1 execute multisuggest-db --file=${tmpFile} --remote`, {
      cwd: resolve(__dirname, ".."),
      stdio: "pipe",
    });
  } catch (err) {
    console.error(`[Seed] Batch ${batch + 1} failed:`, err.stderr?.toString().slice(0, 200));
  }

  // Clean up temp file
  try { execSync(`rm ${tmpFile}`); } catch {}
}

console.log(`[Seed] Done! Seeded ${facilities.length} facilities into D1.`);
