import { useMemo } from "react";
import type { Facility } from "../lib/types";
import { hourlyProfile, levelOf, LEVEL_COLOR, LEVEL_LABEL, quietTip, type CrowdReport } from "../lib/crowd";
import { DAY_CS, formatDay, openHour, openStatus, parseHours } from "../lib/hours";

export function useInsights(f: Facility, reports: CrowdReport[] | undefined, now = new Date()) {
  return useMemo(() => {
    const week = f.nonstop ? parseHours("24/7") : parseHours(f.hours);
    const status = week ? openStatus(week, now) : null;
    const profile = hourlyProfile(f.category, now, reports);
    if (week) for (let h = 0; h < 24; h++) if (!openHour(week, now, h)) profile[h] = 0;
    const h = now.getHours();
    const closedNow = status ? !status.open : profile[h] === 0;
    const level = closedNow ? null : levelOf(profile[h]);
    const tip = quietTip(profile, now, week ? (x) => openHour(week, now, x) : undefined);
    return { week, status, profile, level, tip, calibrated: (reports?.length ?? 0) > 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, reports, now.getHours()]);
}

/** Compact one-line status for list rows: open state + crowd now. */
export function NowLine({ f, reports }: { f: Facility; reports?: CrowdReport[] }) {
  const { status, level } = useInsights(f, reports);
  if (!status && !level) return null;
  return (
    <span className="flex items-center gap-1.5 text-[12px]">
      {status && <span className={status.open ? "text-ink" : "text-muted"}>{status.text}</span>}
      {status && level && <span className="text-line">|</span>}
      {level && (
        <span className="flex items-center gap-1" style={{ color: LEVEL_COLOR[level] }}>
          <CrowdBars v={["quiet", "ok", "busy", "packed"].indexOf(level)} />
          {LEVEL_LABEL[level]}
        </span>
      )}
    </span>
  );
}

function CrowdBars({ v }: { v: number }) {
  return (
    <span className="flex items-end gap-[2px]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="w-[3px] rounded-full" style={{ height: 4 + i * 2.5, background: "currentColor", opacity: i <= v ? 1 : 0.25 }} />
      ))}
    </span>
  );
}

const fmtH = (h: number) => `${h}:00`;

/** Popular-times style chart for today with a "now" marker. */
export function CrowdChart({ f, reports }: { f: Facility; reports?: CrowdReport[] }) {
  const now = new Date();
  const { profile, level, tip, calibrated, status } = useInsights(f, reports, now);
  const hours = Array.from({ length: 18 }, (_, i) => i + 5); // 5:00–22:00
  const h0 = now.getHours();
  return (
    <section className="mx-4 mt-4 rounded-[20px] bg-surface-2 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-semibold">
          {level ? (
            <>
              Teď: <span style={{ color: LEVEL_COLOR[level] }}>{LEVEL_LABEL[level].toLowerCase()}</span>
            </>
          ) : status && !status.open ? (
            "Teď zavřeno"
          ) : (
            "Vytíženost během dne"
          )}
        </h3>
        <span className="text-[12px] text-muted">{calibrated ? "odhad + tvá hlášení" : "odhad"}</span>
      </div>
      <div className="mt-3 flex h-20 items-end gap-[3px]" role="img" aria-label={`Odhad vytíženosti podle hodin: ${hours.filter((h) => profile[h] > 0).map((h) => `${h}:00 ${LEVEL_LABEL[levelOf(profile[h])].toLowerCase()}`).join(", ")}`}>
        {hours.map((h) => {
          const v = profile[h];
          const isNow = h === h0;
          return (
            <div key={h} className="flex h-full flex-1 flex-col justify-end">
              <div
                className="rounded-[3px]"
                style={{
                  height: `${Math.max(v, v ? 6 : 3)}%`,
                  background: isNow ? LEVEL_COLOR[levelOf(v)] : v ? "var(--muted)" : "var(--line)",
                  opacity: isNow ? 1 : v ? 0.45 : 1,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="relative mt-1 h-4 text-[11px] text-muted">
        {[6, 12, 18].map((h) => (
          <span key={h} className="absolute -translate-x-1/2" style={{ left: `${((h - 5 + 0.5) / hours.length) * 100}%` }}>
            {h}:00
          </span>
        ))}
      </div>
      {tip !== null && (
        <p className="mt-2 text-[13px]">
          Klidněji bývá kolem <strong>{fmtH(tip)}</strong>.
        </p>
      )}
    </section>
  );
}

export function HoursTable({ f }: { f: Facility }) {
  const week = f.nonstop ? parseHours("24/7") : parseHours(f.hours);
  const today = (new Date().getDay() + 6) % 7;
  if (!week && !f.hours && !f.selfServiceTimes) return null;
  return (
    <section className="mt-5 px-5">
      <h3 className="text-[13px] font-semibold text-muted">Otevírací doba</h3>
      {week ? (
        <table className="mt-1 w-full max-w-xs text-[14px]">
          <tbody>
            {week.map((spans, i) => (
              <tr key={i} className={i === today ? "font-semibold" : ""}>
                <td className="w-10 py-0.5">{DAY_CS[i]}</td>
                <td className={`py-0.5 ${spans.length ? "" : "text-muted"}`}>{formatDay(spans)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : f.hours ? (
        <p className="mt-1 text-[14px]">{f.hours}</p>
      ) : null}
      {f.selfServiceTimes && <p className="mt-1 text-[13px] text-muted">Samoobslužný vstup: {f.selfServiceTimes}</p>}
      {f.hours && !f.nonstop && <p className="mt-1 text-[12px] text-muted">Zdroj: OpenStreetMap, ověř si na webu místa.</p>}
    </section>
  );
}
