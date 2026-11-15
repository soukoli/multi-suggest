import { cardLink } from "../lib/multisport";

/** The one-tap "show my card" control. Opens the official My MultiSport app. */
export function CardButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={cardLink()}
      aria-label="Ukázat kartu v aplikaci My MultiSport"
      className={`group relative flex h-14 items-center gap-3 overflow-hidden rounded-[18px] pr-5 pl-3 text-white shadow-float transition-transform active:scale-[0.97] ${className}`}
      style={{ background: "linear-gradient(135deg,#1b3a4d 0%,#0f5f63 55%,#14a39a 100%)" }}
    >
      {/* card chip + lane stripes, to read as a physical card */}
      <span className="absolute inset-y-0 right-0 w-24 opacity-25" style={{ background: "repeating-linear-gradient(115deg,transparent 0 9px,#fff 9px 11px)" }} />
      <span className="relative grid h-8 w-11 place-items-center rounded-[7px] bg-white/15 ring-1 ring-white/30">
        <span className="h-4 w-6 rounded-[3px] bg-gradient-to-br from-amber-200 to-amber-400" />
      </span>
      <span className="relative leading-tight">
        <span className="block font-display text-[19px] font-bold tracking-wide">Karta</span>
        <span className="block text-[11px] whitespace-nowrap text-white/75">My MultiSport</span>
      </span>
    </a>
  );
}
