// Shared category taxonomy for the scraper and the legacy importer.
// Maps MultiSport icon names (ASCII) and activity names (Czech, with diacritics) to our categories.
// All text is folded (lowercase, no diacritics) before matching, so the rules stay ASCII.

export const fold = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export const CATEGORY_RULES = [
  ["swimming", /\bbazen|vodni|plav|aqua|swim|koupal|whirlpool|paddle|kajak|canoe|\bsup\b|\blode/],
  ["wellness", /wellness|relax|sauna|\bpara\b|masaz|massage|soln|\bspa\b|lazn|kryo|cervene svetlo/],
  ["climbing", /lezeck|lezeni|horolez|boulder|climb/],
  ["yoga", /\bjog|yoga|pilates|zdravotni|zdrava zada|kompenzac|stretch|barre|mobilit|meditac|rehab|fyziotren|sm system|health exercise|tai.?chi|tehotn|senior|fitmami|port de bras/],
  ["group", /skupinov|tanecni|dance|tanec|zumba|aerob|spinning|cycling|bodystyl|bodyform|kruhov|crossfit|cross trenink|bojov|\bbox|fitbox|kickbox|thai|martial|mma|jiu.?jitsu|sambo|sebeobran|tabata|hiit|intervalov|pump|\bstep\b|les mills|bodycombat|grit|jumping|trampol|kangoo|piloxing|flowin|body balance|body workout|bosu|core training|\btrx|h\.e\.a\.t|hyrox|\bocr\b|taebo|brisni tan|p-class|zpevnovani|spalovac/],
  ["racket", /raketov|tenis|tennis|squash|badminton|padel|ping.?pong|pickleball/],
  ["fitness", /posilovn|silov|\bgym|fitness|fitko|functional|funkcn|circuit|kondicn|kettlebell|kardio|cardio|inbody|alpinning|problemove partie|bricho|kalistenik|fit.?ball|body ball|deep work/],
  ["outdoor", /sezonn|brusl|skating|\blyz|\bski|golf|bowling|kuzelk|\bbike|\bkolo|volejbal|laser|turistik|hrady|\bzoo|jeskyn|lanovk|bobov|pixel|pujcovn|\bbeh|nextbike|rekola|cyklistik|hiking/],
  ["kids", /rodic|\bdeti|detmi|detsk|kids|maminky/],
];

const match = (text) => CATEGORY_RULES.find(([, re]) => re.test(text))?.[0];

export function categorize(iconName, activities, name) {
  const byIcon = match(fold(iconName));
  if (byIcon) return byIcon;
  // "mix_aktivit" → dominant activity icon
  const counts = {};
  for (const a of activities) {
    const k = fold(a.icon_name);
    if (k) counts[k] = (counts[k] || 0) + 1;
  }
  for (const [k] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    const c = match(k);
    if (c) return c;
  }
  return match(fold(`${activities.map((a) => a.name).join(" ")} ${name}`)) ?? "other";
}

export function categoriesFor(activities) {
  const set = new Set();
  for (const a of activities) {
    const s = fold(`${a.icon_name || ""} ${a.name || ""}`);
    for (const [cat, re] of CATEGORY_RULES) if (re.test(s)) set.add(cat);
  }
  return [...set];
}
