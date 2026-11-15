import { useState } from "react";
import type { Located } from "../lib/types";
import { CAT } from "../lib/categories";
import { directionsUrl } from "../lib/geo";
import { useStore } from "../store";
import { CategoryBadge, Distance } from "./FacilityRow";
import { Icon, type IconName } from "./Icon";
import { CrowdChart, HoursTable, useInsights } from "./Insights";

function Action({ href, icon, label, primary }: { href: string; icon: IconName; label: string; primary?: boolean }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className={`flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-[16px] px-2 py-2.5 text-[12px] font-medium ${primary ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink"}`}
    >
      <Icon name={icon} size={20} />
      {label}
    </a>
  );
}

function Fact({ children }: { children: React.ReactNode }) {
  return <li className="rounded-full bg-surface-2 px-3 py-1 text-[13px]">{children}</li>;
}

// Names as returned by the MultiSport API, with the Czech meaning
const CARD_LABEL: Record<string, string> = {
  Classic: "Classic",
  Silver: "Silver",
  Child: "Dítě",
  Student: "Student",
  FKSP: "FKSP",
  Senior: "Senior",
};

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("cs-CZ", { day: "numeric", month: "long" });
}

export function FacilityDetail({ f, onBack }: { f: Located; onBack: () => void }) {
  const fav = useStore((s) => s.favorites[f.id]);
  const reports = useStore((s) => s.reports[f.id]);
  const { toggleFavorite, logVisit, undoVisit, setNote, report } = useStore();
  const { status } = useInsights(f, reports);
  const [asked, setAsked] = useState<null | "ask" | "thanks">(null);
  const [justLogged, setJustLogged] = useState(false);
  const photos = [f.image, ...f.gallery].filter((x, i, a): x is string => !!x && a.indexOf(x) === i);
  const today = new Date().toDateString();
  const visitedToday = !!fav?.visits.some((v) => new Date(v).toDateString() === today);

  return (
    <article className="pb-6">
      <div className="flex items-center gap-2 px-4 pb-2">
        <button onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full bg-surface-2" aria-label="Zpět na seznam">
          <Icon name="back" />
        </button>
        <span className="flex-1" />
        <button
          onClick={() => toggleFavorite(f.id)}
          aria-pressed={!!fav}
          className={`flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold ${fav ? "bg-fav text-[#2a1d00]" : "bg-surface-2"}`}
        >
          <Icon name="heart" size={18} filled={!!fav} />
          {fav ? "Uloženo" : "Uložit"}
        </button>
      </div>

      {photos.length > 0 && (
        <div className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-3">
          {photos.map((src) => (
            <img key={src} src={src} alt="" loading="lazy" className="h-44 w-[78%] shrink-0 snap-start rounded-[20px] object-cover md:w-[85%]" />
          ))}
        </div>
      )}

      <header className="flex items-start gap-3 px-5">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: CAT[f.category].color }}>
            <CategoryBadge id={f.category} size={22} />
            {CAT[f.category].label}
          </p>
          <h2 className="mt-1.5 font-display text-[34px] leading-[0.95] font-bold">{f.name}</h2>
          <p className="mt-1.5 text-[14px] text-muted">{[f.street, f.city].filter(Boolean).join(", ")}</p>
          {status && (
            <p className={`mt-1 text-[14px] font-semibold ${status.open ? "text-accent" : "text-muted"}`}>{status.text}</p>
          )}
        </div>
        <Distance km={f.distance} big />
      </header>

      <div className="mt-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
        <Action href={directionsUrl(f, f.name)} icon="route" label="Navigovat" primary />
        {f.web && <Action href={f.web} icon="globe" label="Web" />}
        {f.instagram && <Action href={f.instagram} icon="instagram" label="Instagram" />}
        {f.facebook && <Action href={f.facebook} icon="facebook" label="Facebook" />}
        {f.phone && <Action href={`tel:${f.phone.replace(/\s/g, "")}`} icon="phone" label="Volat" />}
        {!f.web && !f.instagram && !f.facebook && (
          <Action href={`https://www.google.com/search?q=${encodeURIComponent(`${f.name} ${f.city ?? ""}`)}`} icon="search" label="Dohledat" />
        )}
      </div>

      {/* personal log: visible once the place is saved */}
      <section className="mx-4 mt-4 rounded-[20px] border border-line p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold">
              {fav?.visits.length ? `Byl/a jsi tu ${fav.visits.length}×` : "Zatím žádná návštěva"}
            </p>
            <p className="text-[13px] text-muted">
              {fav?.visits.length ? `Naposledy ${fmtDate(fav.visits[fav.visits.length - 1])}` : "Zapiš si návštěvu, ať víš, kam chodíš nejčastěji."}
            </p>
          </div>
          {visitedToday && justLogged ? (
            <button onClick={() => { undoVisit(f.id); setJustLogged(false); setAsked(null); }} className="shrink-0 rounded-full bg-surface-2 px-4 py-2 text-[14px] font-semibold">
              Vrátit
            </button>
          ) : (
            <button
              onClick={() => { logVisit(f.id); setJustLogged(true); setAsked("ask"); }}
              disabled={visitedToday}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[14px] font-semibold text-bg disabled:opacity-40"
            >
              <Icon name="check" size={16} />
              {visitedToday ? "Dnes zapsáno" : "Byl/a jsem tu"}
            </button>
          )}
        </div>
        {asked === "ask" && (
          <div className="mt-3 rounded-[14px] bg-surface-2 p-3">
            <p className="text-[14px] font-medium">Jak tam bylo plno?</p>
            <div className="mt-2 flex gap-2">
              {(["Prázdno", "Akorát", "Narváno"] as const).map((label, i) => (
                <button
                  key={label}
                  onClick={() => { report(f.id, i as 0 | 1 | 2); setAsked("thanks"); }}
                  className="flex-1 rounded-full bg-surface px-3 py-2 text-[14px] font-semibold"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        {asked === "thanks" && <p className="mt-3 text-[13px] text-muted">Díky, odhad vytíženosti tady si to zapamatuje.</p>}
        {fav && (
          <textarea
            value={fav.note}
            onChange={(e) => setNote(f.id, e.target.value)}
            placeholder="Poznámka, třeba: nejlíp ráno, skříňky 2 Kč"
            rows={2}
            className="mt-3 w-full resize-none rounded-[12px] bg-surface-2 px-3 py-2 text-[14px] placeholder:text-muted focus:outline-none"
          />
        )}
      </section>

      <CrowdChart f={f} reports={reports} />

      <ul className="mt-4 flex flex-wrap gap-1.5 px-5">
        {f.surcharge ? <Fact>Doplatek{f.surchargeNote ? `: ${f.surchargeNote}` : ""}</Fact> : <Fact>Bez doplatku</Fact>}
        {f.nonstop && <Fact>Otevřeno nonstop</Fact>}
        {f.selfService && <Fact>Samoobslužný vstup{f.selfServiceTimes ? ` ${f.selfServiceTimes}` : ""}</Fact>}
        {f.parking === true && <Fact>Parkování</Fact>}
        {f.kids && <Fact>Aktivity pro děti</Fact>}
        {f.isNew && <Fact>Nový partner</Fact>}
      </ul>

      <HoursTable f={f} />

      {f.activities.length > 0 && (
        <section className="mt-5 px-5">
          <h3 className="text-[13px] font-semibold text-muted">Aktivity s kartou</h3>
          <p className="mt-1 text-[15px] leading-relaxed">{f.activities.join(", ")}</p>
        </section>
      )}
      <section className="mt-5 px-5">
        <h3 className="text-[13px] font-semibold text-muted">Platné karty</h3>
        {f.cards.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {f.cards.map((c) => (
              <li key={c} className="rounded-[8px] border border-line px-2.5 py-1 font-display text-[16px] font-bold tracking-wide">
                {CARD_LABEL[c] ?? c}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[14px] text-muted">Seznam karet zatím nemáme. Doplní se při další aktualizaci dat.</p>
        )}
        {f.virtualOnly && <p className="mt-2 text-[13px]">Vstup jen s virtuální kartou v aplikaci.</p>}
      </section>
      {f.description && (
        <section className="mt-4 px-5">
          <h3 className="text-[13px] font-semibold text-muted">O místě</h3>
          <p className="mt-1 max-w-[65ch] text-[15px] leading-relaxed whitespace-pre-line">{f.description}</p>
        </section>
      )}
      {f.email && (
        <p className="mt-4 px-5 text-[14px]">
          <a className="text-accent underline-offset-2 hover:underline" href={`mailto:${f.email}`}>{f.email}</a>
        </p>
      )}
    </article>
  );
}
