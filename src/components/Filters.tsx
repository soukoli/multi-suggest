import { CATEGORIES } from "../lib/categories";
import { useStore } from "../store";
import { GlyphPath } from "./Icon";

export const RADII = [1, 2, 3, 5, 10, 20, 50];

export function CategoryRail({ counts }: { counts: Record<string, number> }) {
  const { categories, toggleCategory, clearCategories } = useStore();
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-1" role="group" aria-label="Kategorie">
      <button
        onClick={clearCategories}
        aria-pressed={categories.length === 0}
        className={`h-11 shrink-0 rounded-full px-4 md:h-9 text-[14px] font-semibold ${categories.length === 0 ? "bg-ink text-bg" : "bg-surface-2"}`}
      >
        Vše
      </button>
      {CATEGORIES.filter((c) => counts[c.id] || categories.includes(c.id)).map((c) => {
        const on = categories.includes(c.id);
        return (
          <button
            key={c.id}
            onClick={() => toggleCategory(c.id)}
            aria-pressed={on}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-full pr-3.5 pl-2.5 md:h-9 text-[14px] font-medium transition-colors"
            style={on ? { background: c.color, color: "#0b1a22" } : { background: "var(--surface-2)" }}
          >
            <span style={{ color: on ? "#0b1a22" : c.color }}>
              <GlyphPath d={c.icon} size={16} />
            </span>
            {c.label}
            <span className={`text-[12px] tabular-nums ${on ? "opacity-70" : "text-muted"}`}>{counts[c.id] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

export function RadiusControl() {
  const { radiusKm, setRadius } = useStore();
  return (
    <div className="flex items-center gap-1 rounded-full bg-surface-2 p-1" role="radiogroup" aria-label="Okruh hledání">
      {RADII.map((r) => (
        <button
          key={r}
          role="radio"
          aria-checked={radiusKm === r}
          onClick={() => setRadius(r)}
          className={`h-11 min-w-11 rounded-full px-2 font-display md:h-8 md:min-w-9 text-[16px] font-bold tabular-nums ${radiusKm === r ? "bg-accent text-accent-ink" : "text-muted"}`}
        >
          {r}
        </button>
      ))}
      <span className="pr-2 pl-0.5 text-[12px] text-muted">km</span>
    </div>
  );
}

export function FlagToggles() {
  const s = useStore();
  const flags = [
    ["noSurcharge", "Bez doplatku"],
    ["parking", "Parkování"],
    ["nonstop", "Nonstop"],
    ["kidsOnly", "Pro děti"],
  ] as const;
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-1">
      {flags.map(([k, label]) => (
        <button
          key={k}
          onClick={() => s.toggleFlag(k)}
          aria-pressed={s[k]}
          className={`h-11 shrink-0 rounded-full border px-3.5 md:h-8 text-[13px] font-medium ${s[k] ? "border-ink bg-ink text-bg" : "border-line text-muted"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
