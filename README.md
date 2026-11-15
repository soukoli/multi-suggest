# Sportmapa

Osobní mapa partnerů MultiSport: najdi místa podle kategorie v okruhu kolem sebe, podívej se,
jestli je otevřeno a kdy tam bývá plno, ulož si oblíbená s poznámkou a počtem návštěv
a jedním klepnutím otevři kartu v oficiální aplikaci My MultiSport.

Nástupce původního MultiSuggest (stejný repozitář, kompletně přepsáno).

## Co aplikace umí

- Mapa vždy viditelná, na mobilu bottom sheet (3 polohy), na desktopu levý panel
- Kategorie (vícenásobný výběr, počty v okruhu), okruh 1–50 km, filtry doplatek / parkování / nonstop / děti
- Fulltext přes název, aktivitu a ulici (hledá v celé databázi)
- Detail: fotky, navigace, web / Instagram / Facebook / telefon, platné karty, aktivity, otevírací doba
- **Vytíženost**: odhad po hodinách podle typu místa a dne; po check-inu můžeš nahlásit „prázdno / akorát / narváno“ a odhad se pro to místo zpřesní
- **Oblíbené**: poznámky, počet návštěv, datum poslední, řazení podle vzdálenosti nebo četnosti
- **Karta**: odkaz `https://my.multisport.cz/mobile/` – universal/app link, který otevře nainstalovanou
  aplikaci My MultiSport (doména publikuje apple-app-site-association a assetlinks.json)
- Světlý / tmavý režim, PWA (přidat na plochu)

## Vývoj

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # statický web do dist/
```

Stack: Vite + React 19 + TypeScript + Tailwind v4, MapLibre GL + OpenFreeMap (bez API klíče), Zustand.
Oblíbené, návštěvy a hlášení se ukládají v prohlížeči (localStorage).

## Nasazení

Push do `main` → Vercel (git integrace) postaví a nasadí. Nastavení je ve `vercel.json`.

## Data

`public/data/facilities.json` je jediný zdroj dat pro aplikaci.

| Krok | Skript | Stav |
|---|---|---|
| Partneři MultiSport (seznam + detail) | `scripts/scrape.mjs` | ⚠️ podpis tokenu neodpovídá aktuálnímu `auth.js` (401) – zatím vypnuto |
| Otevírací doba z OpenStreetMap | `scripts/enrich-osm.mjs` | ✅ běží v CI (Po + Čt) |
| Převod dat ze staré D1 (594 míst, Praha) | `scripts/import-legacy.mjs` | jednorázově |

GitHub Action `.github/workflows/data.yml` data obnoví a commitne, Vercel pak automaticky nasadí.
Scraper lze spustit ručně (Actions → Update facility data → scrape = true), až bude opravené přihlášení.

Proč původní data nefungovala: starý scraper bral JWT z mapa.multisport.cz, který platí ~60 s,
a neobnovoval ho, takže z ~625 pražských míst aktualizoval jen prvních 16.
Nový scraper token obnovuje, pokrývá celou ČR a nezveřejní data s pokrytím detailů pod 90 %.

Otevírací doba: © přispěvatelé OpenStreetMap (ODbL).
