// Shared category taxonomy for the scraper and the legacy importer.
// Our own taxonomy, mapped from MultiSport icon names / activity names.
export const CATEGORY_RULES = [
  ["swimming", /bazen|vodni|plav|aqua|swim|paddle|kajak|canoe|sup\b|lodě/],
  ["wellness", /wellness|relax|sauna|masáž|massage|salt|solná|spa\b|lázn|kryo/],
  ["climbing", /lezeck|lezení|boulder|climb/],
  ["yoga", /joga|jóga|yoga|pilates|zdravotni|health exercise|stretch/],
  ["group", /skupinove|tanecni|dance|tanec|zumba|aerob|spinning|indoor cycling|bodystyling|kruhov|crossfit|bojov|box|martial|kickbox|thai/],
  ["racket", /raketove|tenis|tennis|squash|badminton|padel|ping|stolní/],
  ["fitness", /posilovn|silove|gym|fitness|fitko|functional|circuit/],
  ["outdoor", /sezonni|brusl|skating|lyž|ski|golf|bowling|kuželk|bike|kolo/],
  ["kids", /rodice|deti|detmi|dětsk|kids/],
];

export function categorize(iconName, activities, name) {
  const icon = (iconName || "").toLowerCase();
  for (const [cat, re] of CATEGORY_RULES) if (re.test(icon)) return cat;
  // mix_aktivit → dominant activity icon
  const counts = {};
  for (const a of activities) {
    const k = (a.icon_name || "").toLowerCase();
    if (k) counts[k] = (counts[k] || 0) + 1;
  }
  for (const [k] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    for (const [cat, re] of CATEGORY_RULES) if (re.test(k)) return cat;
  }
  const text = `${activities.map((a) => a.name).join(" ")} ${name}`.toLowerCase();
  for (const [cat, re] of CATEGORY_RULES) if (re.test(text)) return cat;
  return "other";
}

export function categoriesFor(activities) {
  const set = new Set();
  for (const a of activities) {
    const s = `${a.icon_name || ""} ${a.name || ""}`.toLowerCase();
    for (const [cat, re] of CATEGORY_RULES) if (re.test(s)) set.add(cat);
  }
  return [...set];
}

