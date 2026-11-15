import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useDataset, useResults, withDistance } from "./data";
import { useStore } from "./store";
import type { Category, LngLat, Located } from "./lib/types";
import { distanceKm } from "./lib/geo";
import { APP_STORE, PLAY_STORE } from "./lib/multisport";
import { MapView } from "./components/MapView";
import { Sheet, type Snap } from "./components/Sheet";
import { FacilityRow } from "./components/FacilityRow";
import { FacilityDetail } from "./components/FacilityDetail";
import { CategoryRail, FlagToggles, RadiusControl } from "./components/Filters";
import { CardButton } from "./components/CardButton";
import { Icon } from "./components/Icon";
import { BrandMark } from "./components/BrandMark";
import { Splash } from "./components/Splash";

function useDark() {
  const theme = useStore((s) => s.theme);
  const [sys, setSys] = useState(() => matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    const m = matchMedia("(prefers-color-scheme: dark)");
    const h = () => setSys(m.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);
  const dark = theme === "dark" || (theme === "system" && sys);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  return dark;
}

function useIsDesktop() {
  const [d, setD] = useState(() => matchMedia("(min-width: 768px)").matches);
  useEffect(() => {
    const m = matchMedia("(min-width: 768px)");
    const h = () => setD(m.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);
  return d;
}

export default function App() {
  const dark = useDark();
  const desktop = useIsDesktop();
  const { data, error } = useDataset();
  const s = useStore();
  const results = useResults(data?.facilities);

  const [me, setMe] = useState<LngLat | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<LngLat>(s.center);
  const [snap, setSnap] = useState<Snap>("half");
  const [sheetH, setSheetH] = useState(300);
  const [fitKey, setFitKey] = useState(0);
  const [favSort, setFavSort] = useState<"near" | "often">("near");
  const [showInfo, setShowInfo] = useState(false);
  const [splash, setSplash] = useState(true);

  // --- location
  function locate(fit = true) {
    if (!("geolocation" in navigator)) return setGeoError("Prohlížeč nepodporuje určení polohy.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMe(p);
        s.setCenter(p, "gps");
        setMapCenter(p);
        setGeoError(null);
        setLocating(false);
        if (fit) setFitKey((k) => k + 1);
      },
      () => {
        setLocating(false);
        setGeoError("Polohu se nepodařilo zjistit. Povol ji v nastavení, nebo posuň mapu a hledej v oblasti.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }
  useEffect(() => {
    locate(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setFitKey((k) => k + 1), [s.radiusKm, s.tab]);

  // --- derived
  const byId = useMemo(() => new Map((data?.facilities ?? []).map((f) => [f.id, f])), [data]);
  const favList = useMemo(() => {
    const list = withDistance(
      Object.keys(s.favorites).map((id) => byId.get(id)).filter((f): f is NonNullable<typeof f> => !!f),
      me ?? s.center,
    );
    if (favSort === "often") list.sort((a, b) => (s.favorites[b.id]?.visits.length ?? 0) - (s.favorites[a.id]?.visits.length ?? 0));
    return list;
  }, [s.favorites, byId, me, s.center, favSort]);

  const favIds = useMemo(() => new Set(Object.keys(s.favorites)), [s.favorites]);
  const explore = s.tab === "explore";
  const shown: Located[] = explore ? results : favList;

  const selected = useMemo(() => {
    if (!s.selectedId) return null;
    const f = byId.get(s.selectedId);
    return f ? { ...f, distance: distanceKm(me ?? s.center, f) } : null;
  }, [s.selectedId, byId, me, s.center]);

  // category counts within the radius (ignoring the category filter itself)
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of data?.facilities ?? []) {
      if (distanceKm(s.center, f) > s.radiusKm) continue;
      c[f.category] = (c[f.category] || 0) + 1;
      for (const x of f.categories) if (x !== f.category) c[x] = (c[x] || 0) + 1;
    }
    return c as Record<Category, number>;
  }, [data, s.center, s.radiusKm]);

  const movedAway = explore && !s.query && distanceKm(mapCenter, s.center) > Math.max(0.6, s.radiusKm * 0.45);

  const filtered = s.categories.length > 0 || s.noSurcharge || s.kidsOnly || s.nonstop || s.parking;
  function clearFilters() {
    s.clearCategories();
    (["noSurcharge", "kidsOnly", "nonstop", "parking"] as const).forEach((k) => s[k] && s.toggleFlag(k));
  }

  function open(id: string) {
    s.select(id);
    if (!desktop && snap === "peek") setSnap("half");
  }

  // --- pieces
  const searchBar = (
    <div className="flex items-center gap-2">
      <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full bg-surface px-4 shadow-float focus-within:ring-2 focus-within:ring-accent md:bg-surface-2 md:shadow-none">
        <Icon name="search" size={18} className="shrink-0 text-muted" />
        <input
          value={s.query}
          onChange={(e) => s.setQuery(e.target.value)}
          placeholder="Název, aktivita nebo ulice"
          className="min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-muted focus:outline-none focus-visible:outline-none"
          enterKeyHint="search"
          aria-label="Hledat sportoviště"
        />
        {s.query && (
          <button onClick={() => s.setQuery("")} aria-label="Smazat hledání" className="text-muted">
            <Icon name="close" size={18} />
          </button>
        )}
      </label>
      <button
        onClick={() => s.setTheme(dark ? "light" : "dark")}
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface shadow-float md:shadow-none md:bg-surface-2"
        aria-label={dark ? "Světlý režim" : "Tmavý režim"}
      >
        <Icon name={dark ? "sun" : "moon"} />
      </button>
    </div>
  );

  const listHeader = explore ? (
    <div className="px-5 pb-2">
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-[30px] leading-none font-bold">
          {s.query ? `${results.length} výsledků` : `${results.length} míst`}
          <span className="ml-2 font-sans text-[14px] font-medium text-muted">
            {s.query ? "v celé databázi" : s.centerSource === "gps" ? "kolem tebe" : "v oblasti"}
          </span>
        </h1>
      </div>
      {!s.query && (
        <div className="mt-3">
          <RadiusControl />
        </div>
      )}
    </div>
  ) : (
    <div className="flex items-end justify-between px-5 pb-2">
      <h1 className="font-display text-[30px] leading-none font-bold">
        Oblíbené <span className="text-muted tabular-nums">{favList.length}</span>
      </h1>
      <div className="flex rounded-full bg-surface-2 p-1 text-[13px] font-medium" role="radiogroup" aria-label="Řazení">
        {(["near", "often"] as const).map((k) => (
          <button key={k} role="radio" aria-checked={favSort === k} onClick={() => setFavSort(k)} className={`rounded-full px-3 py-1 ${favSort === k ? "bg-surface shadow-sm" : "text-muted"}`}>
            {k === "near" ? "Nejblíž" : "Nejčastěji"}
          </button>
        ))}
      </div>
    </div>
  );

  const list = (
    <>
      {!s.introSeen && <Intro onClose={s.dismissIntro} />}
      {explore && <FlagToggles />}
      {error && <Empty title="Data se nenačetla" body={`Zkus stránku obnovit. (${error})`} />}
      {!data && !error && <p className="px-5 py-8 text-muted">Načítám sportoviště…</p>}
      {data && shown.length === 0 && (explore ? (
        <Empty
          title={s.query ? `Nic pro „${s.query}“` : "V okruhu nic není"}
          body={filtered ? "Některé filtry jsou zapnuté a mohou místa skrývat." : s.query ? "Zkus jiný název nebo aktivitu." : "Zvětši okruh."}
          action={
            filtered ? (
              <button className="rounded-full bg-accent px-4 py-2 font-semibold text-accent-ink" onClick={clearFilters}>Hledat bez filtrů</button>
            ) : !s.query && s.radiusKm < 50 ? (
              <button className="rounded-full bg-accent px-4 py-2 font-semibold text-accent-ink" onClick={() => s.setRadius(Math.min(50, s.radiusKm * 2))}>Zvětšit okruh</button>
            ) : null
          }
        />
      ) : (
        <Empty title="Zatím nic uloženého" body="Klepni na srdíčko u místa, kam chceš chodit. Tady pak uvidíš, jak daleko to máš a kolikrát jsi tam byl/a." action={<button className="rounded-full bg-accent px-4 py-2 font-semibold text-accent-ink" onClick={() => s.setTab("explore")}>Najít místa</button>} />
      ))}
      <ul className="mt-1">
        {shown.slice(0, 300).map((f) => (
          <FacilityRow
            key={f.id}
            f={f}
            fav={favIds.has(f.id)}
            visits={s.favorites[f.id]?.visits.length}
            onOpen={() => open(f.id)}
            onToggleFav={() => s.toggleFavorite(f.id)}
          />
        ))}
      </ul>
      {shown.length > 300 && <p className="px-5 py-3 text-[13px] text-muted">Zobrazeno 300 nejbližších z {shown.length}. Zmenši okruh nebo vyber kategorii.</p>}
      {data && (
        <p className="px-5 pt-4 text-[12px] text-muted">
          {Date.now() - new Date(data.updatedAt.replace(" ", "T")).getTime() > 3 * 864e5 && (
            <span className="mb-1 block font-semibold text-ink">Data nejsou aktuální, poslední obnova proběhla před víc než 3 dny.</span>
          )}
          Data partnerů MultiSport z {new Date(data.updatedAt.replace(" ", "T")).toLocaleDateString("cs-CZ")}
          {data.source === "legacy" ? " · zatím jen Praha" : ""}
          {data.hoursSource ? " · otevírací doba © OpenStreetMap" : ""} ·{" "}
          <button className="underline" onClick={() => setShowInfo(true)}>o kartě</button>
        </p>
      )}
    </>
  );

  const panelBody = selected ? <FacilityDetail f={selected} onBack={() => s.select(null)} /> : list;

  const tabs = (
    <div className="flex h-14 items-center rounded-[18px] bg-surface p-1 shadow-float md:bg-surface-2 md:shadow-none">
      {(["explore", "favorites"] as const).map((t) => (
        <button
          key={t}
          onClick={() => s.setTab(t)}
          aria-pressed={s.tab === t}
          className={`flex h-full flex-1 items-center justify-center gap-1.5 rounded-[14px] px-3 text-[14px] font-semibold ${s.tab === t ? "bg-ink text-bg" : "text-muted"}`}
        >
          <Icon name={t === "explore" ? "map" : "heart"} size={18} filled={t === "favorites" && s.tab === t} />
          {t === "explore" ? "Okolí" : "Oblíbené"}
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 md:left-[440px]">
        <MapView
          facilities={shown}
          favoriteIds={favIds}
          selectedId={s.selectedId}
          hoverId={s.hoverId}
          center={s.center}
          radiusKm={s.radiusKm}
          showRadius={explore && !s.query}
          me={me}
          dark={dark}
          padding={desktop ? { top: 20, bottom: 20, left: 0 } : { top: 130, bottom: sheetH, left: 0 }}
          onSelect={(id) => (id ? open(id) : s.select(null))}
          onViewChange={setMapCenter}
          fitKey={fitKey}
        />
      </div>

      {/* floating map controls */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 pt-[calc(env(safe-area-inset-top)+12px)] md:left-[440px]">
        <div className="px-4 md:hidden">{<div className="pointer-events-auto">{searchBar}</div>}</div>
        {explore && (
          <div className="pointer-events-auto mt-2 md:hidden">
            <CategoryRail counts={counts} />
          </div>
        )}
        {movedAway && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => { s.setCenter(mapCenter, "map"); s.select(null); setFitKey((k) => k + 1); }}
              className="pointer-events-auto flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-[14px] font-semibold text-bg shadow-float"
            >
              <Icon name="search" size={16} />
              Hledat v této oblasti
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => locate(true)}
        className="absolute right-4 z-10 grid h-12 w-12 place-items-center rounded-full bg-surface shadow-float"
        style={{ bottom: desktop ? 24 : sheetH + 16 }}
        aria-label="Moje poloha"
      >
        <Icon name="locate" className={locating ? "animate-spin text-accent" : me ? "text-accent" : ""} />
      </button>

      {geoError && (
        <div className="absolute inset-x-4 z-30 rounded-[16px] bg-ink p-3 text-[13px] text-bg shadow-float md:left-[460px] md:max-w-sm" style={{ top: desktop ? 16 : 170 }} role="status">
          {geoError}
          <button className="ml-2 font-semibold underline" onClick={() => setGeoError(null)}>OK</button>
        </div>
      )}

      {/* desktop side panel */}
      <aside className="absolute inset-y-0 left-0 z-20 hidden w-[440px] flex-col border-r border-line bg-surface md:flex">
        <div className="space-y-3 px-4 pt-5 pb-2">
          <div className="flex items-center gap-2 px-1">
            <BrandMark size={30} />
            <span className="font-display text-[24px] font-extrabold tracking-wide">Sportmapa</span>
          </div>
          {searchBar}
        </div>
        {explore && !selected && <CategoryRail counts={counts} />}
        <div className="pt-3">{!selected && listHeader}</div>
        <div key={selected?.id ?? s.tab} className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-4">{panelBody}</div>
        <div className="flex gap-2 border-t border-line p-3">
          <div className="flex-1">{tabs}</div>
          <CardButton />
        </div>
      </aside>

      {/* mobile sheet */}
      {!desktop && (
        <Sheet snap={snap} onSnap={setSnap} onHeight={setSheetH} header={selected ? null : listHeader} contentKey={selected?.id ?? s.tab}>
          {panelBody}
        </Sheet>
      )}

      {/* mobile dock */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex gap-2 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+10px)] md:hidden" style={{ background: "linear-gradient(to top, var(--surface) 65%, transparent)" }}>
        <div className="flex-1">{tabs}</div>
        <CardButton />
      </nav>

      {showInfo && <CardInfo onClose={() => setShowInfo(false)} />}
      {splash && <Splash onDone={() => setSplash(false)} />}
    </div>
  );
}

function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="font-display text-[24px] font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-[32ch] text-[14px] text-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function CardInfo({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 md:place-items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-[28px] bg-surface p-6 pb-[calc(env(safe-area-inset-bottom)+24px)] md:rounded-[28px]" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="O kartě">
        <h2 className="font-display text-[28px] font-bold">Karta MultiSport</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Tlačítko Ukázat kartu otevře oficiální aplikaci My MultiSport, kde je tvůj platný QR kód pro vstup. Pokud se místo aplikace otevře web, nainstaluj si ji:
        </p>
        <div className="mt-4 flex gap-2">
          <a className="flex-1 rounded-full bg-surface-2 px-4 py-2.5 text-center font-semibold" href={APP_STORE} target="_blank" rel="noreferrer">App Store</a>
          <a className="flex-1 rounded-full bg-surface-2 px-4 py-2.5 text-center font-semibold" href={PLAY_STORE} target="_blank" rel="noreferrer">Google Play</a>
        </div>
        <button className="mt-4 w-full rounded-full bg-ink py-3 font-semibold text-bg" onClick={onClose}>Zavřít</button>
      </div>
    </div>
  );
}

/** First-run card: what this app adds on top of the official MultiSport map. */
function Intro({ onClose }: { onClose: () => void }) {
  const points = [
    ["Kdy je tam plno", "Odhad vytíženosti po hodinách, zpřesněný tvými hlášeními."],
    ["Otevřeno teď?", "Otevírací doba a nejbližší klidnější hodina."],
    ["Tvoje místa", "Oblíbené s poznámkou a počtem návštěv, seřazené podle vzdálenosti."],
    ["Karta na jedno klepnutí", "Tlačítko Karta otevře My MultiSport s QR kódem."],
  ];
  return (
    <section className="mx-4 mb-2 rounded-[20px] border border-line p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-[22px] leading-tight font-bold">Víc než mapa partnerů</h2>
        <button onClick={onClose} aria-label="Skrýt" className="-mt-1 -mr-1 grid h-8 w-8 place-items-center rounded-full text-muted">
          <Icon name="close" size={18} />
        </button>
      </div>
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
        {points.map(([t, d]) => (
          <div key={t}>
            <dt className="text-[14px] font-semibold">{t}</dt>
            <dd className="text-[13px] text-muted">{d}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
