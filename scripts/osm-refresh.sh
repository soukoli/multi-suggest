#!/usr/bin/env bash
# Rebuild data/osm-pois.json from the Geofabrik Czech Republic extract (free, made for downloads).
# Needs osmium-tool (brew install osmium-tool / apt-get install osmium-tool). ~950 MB download.
set -euo pipefail
cd "$(dirname "$0")/.."
TMP="${TMPDIR:-/tmp}/sportmapa-osm"
mkdir -p "$TMP"
URL="https://download.geofabrik.de/europe/czech-republic-latest.osm.pbf"

echo "[osm] downloading extract"
curl -fsSL --retry 3 -A "sportmapa-data/1.0" -o "$TMP/cz.osm.pbf" "$URL"

echo "[osm] filtering sports venues with opening hours"
osmium tags-filter --overwrite -o "$TMP/oh.osm.pbf" "$TMP/cz.osm.pbf" nwr/opening_hours
# Sport venues only (no parks/playgrounds/gardens); shop=massage is kept for wellness matches.
osmium tags-filter --overwrite -o "$TMP/sport.osm.pbf" "$TMP/oh.osm.pbf" \
  nwr/leisure=fitness_centre,sports_centre,sports_hall,swimming_pool,water_park,ice_rink,sauna,bowling_alley,golf_course,miniature_golf,climbing,dance,horse_riding,pitch,track,trampoline_park,fitness_station \
  nwr/sport nwr/amenity=dojo,spa,sauna,public_bath nwr/shop=massage
osmium export --overwrite -f geojsonseq -o "$TMP/sport.geojsonseq" "$TMP/sport.osm.pbf"

# Timestamp of the OSM data itself (replication timestamp in the extract header)
STAMP="$(osmium fileinfo -g header.option.osmosis_replication_timestamp "$TMP/cz.osm.pbf" 2>/dev/null || true)"
node scripts/osm-build-cache.mjs "$TMP/sport.geojsonseq" "${STAMP:-$(date -u +%FT%TZ)}"
rm -f "$TMP"/*.pbf "$TMP"/*.geojsonseq
