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

| Krok | Skript | Kdy |
|---|---|---|
| Partneři MultiSport, celá ČR (seznam + detail, ~2 900 míst) | `scripts/scrape.mjs` | denně 02:15 UTC |
| Otevírací doba z OpenStreetMap | `scripts/osm-refresh.sh` (Geofabrik extrakt + osmium → `data/osm-pois.json`) a `scripts/enrich-osm.mjs` (párování) | extrakt v neděli, párování denně |
| Převod dat ze staré D1 (594 míst, Praha) | `scripts/import-legacy.mjs` | jednorázově, historické |

GitHub Action `.github/workflows/data.yml` data obnoví a commitne, Vercel pak automaticky nasadí.
Když běh selže, Action založí (nebo doplní) issue „Data update failed“. Aplikace sama ukáže varování,
když jsou data starší než 3 dny. Scraper nezveřejní data, pokud má detail méně než 90 % míst
nebo počet míst klesne o víc než 20 %.

Přihlášení k API mapa.multisport.cz: token podepisuje jejich obfuskovaný `auth.js`, který scraper
(se souhlasem vlastníka) vyhodnotí v izolovaném `vm` kontextu a token každých 40 s obnovuje.

Proč původní data nefungovala: starý scraper bral JWT z mapa.multisport.cz, který platí ~60 s,
a neobnovoval ho, takže z ~625 pražských míst aktualizoval jen prvních 16.
Nový scraper token obnovuje, pokrývá celou ČR a nezveřejní data s pokrytím detailů pod 90 %.

Otevírací doba: © přispěvatelé OpenStreetMap (ODbL).
