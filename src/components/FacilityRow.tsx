import type { Located } from "../lib/types";
import { CAT } from "../lib/categories";
import { formatDistance } from "../lib/geo";
import { GlyphPath, Icon } from "./Icon";
import { NowLine } from "./Insights";
import { useStore } from "../store";

export function Distance({ km, big }: { km: number; big?: boolean }) {
  const d = formatDistance(km);
  return (
    <span className="font-display font-bold leading-none tabular-nums">
      <span className={big ? "text-[32px]" : "text-[22px]"}>{d.value}</span>
      <span className={big ? "ml-0.5 text-base text-muted" : "ml-0.5 text-[13px] text-muted"}>{d.unit}</span>
    </span>
  );
}

export function CategoryBadge({ id, size = 36 }: { id: keyof typeof CAT; size?: number }) {
  const c = CAT[id];
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[12px]"
      style={{ width: size, height: size, background: `${c.color}22`, color: c.color }}
    >
      <GlyphPath d={c.icon} size={Math.round(size * 0.5)} />
    </span>
  );
}

export function FacilityRow({
  f,
  fav,
  visits,
  onOpen,
  onToggleFav,
}: {
  f: Located;
  fav: boolean;
  visits?: number;
  onOpen: () => void;
  onToggleFav: () => void;
}) {
  const reports = useStore((s) => s.reports[f.id]);
  const hover = useStore((s) => s.hover);
  const subtitle = f.activities.length ? f.activities.slice(0, 3).join(", ") : CAT[f.category].label;
  return (
    <li className="group relative">
      <button onClick={onOpen} onMouseEnter={() => hover(f.id)} onMouseLeave={() => hover(null)} onFocus={() => hover(f.id)} onBlur={() => hover(null)} className="flex w-full items-center gap-3 px-5 py-3 text-left active:bg-surface-2 md:hover:bg-surface-2">
        {f.image ? (
          <img src={f.image} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-[14px] object-cover" />
        ) : (
          <CategoryBadge id={f.category} size={56} />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold leading-tight">{f.name}</span>
          <span className="mt-0.5 block truncate text-[13px] text-muted">{subtitle}</span>
          <span className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: CAT[f.category].color }} />
            {f.street || f.city}
            {f.surcharge && <span className="ml-1 rounded-full bg-surface-2 px-1.5 py-px text-[11px] text-ink">doplatek</span>}
            {visits ? <span className="ml-1 text-ink">{visits}× návštěva</span> : null}
          </span>
          <span className="mt-0.5 block"><NowLine f={f} reports={reports} /></span>
        </span>
        <Distance km={f.distance} />
      </button>
      <button
        onClick={onToggleFav}
        aria-label={fav ? "Odebrat z oblíbených" : "Přidat do oblíbených"}
        aria-pressed={fav}
        className={`absolute top-2 left-[58px] grid h-7 w-7 place-items-center rounded-full bg-surface/90 shadow-sm ${fav ? "text-fav" : "text-muted opacity-0 group-hover:opacity-100 max-md:hidden"}`}
      >
        <Icon name="heart" size={15} filled={fav} />
      </button>
    </li>
  );
}
