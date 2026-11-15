import { useEffect, useRef, useState } from "react";
import { BrandMark } from "./BrandMark";

/*
 * First-load overlay (~1.25s): a halfway line chalks across the screen, the
 * mark locks on, the scoreboard wordmark rises in, then everything fades.
 * Reduced motion: static final frame, gone after ~250ms.
 */
const CSS = `
.sp-line{transform-origin:center;animation:sp-line .6s cubic-bezier(.65,0,.35,1) both}
.sp-word{animation:sp-word .45s .42s cubic-bezier(.2,.8,.2,1) both}
.sp-out{transition:opacity .25s ease,transform .25s ease;opacity:0;transform:scale(1.04)}
@keyframes sp-line{from{transform:scaleX(0)}to{transform:none}}
@keyframes sp-word{from{clip-path:inset(100% 0 0 0);transform:translateY(.35em)}to{clip-path:inset(0);transform:none}}
@media (prefers-reduced-motion:reduce){.sp-line,.sp-word{animation:none!important}}
`;

const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const [hold, fade] = reduced() ? [150, 100] : [1000, 250];
    const t1 = setTimeout(() => setLeaving(true), hold);
    const t2 = setTimeout(() => done.current(), hold + fade);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      role="status"
      aria-label="Sportmapa"
      className={`fixed inset-0 z-[1000] grid place-items-center overflow-hidden ${leaving ? "sp-out" : ""}`}
      style={{ background: "var(--bg)" }}
    >
      <style>{CSS}</style>
      <div className="relative flex flex-col items-center">
        <div className="relative grid place-items-center">
          <span
            className="sp-line absolute top-1/2 left-1/2 h-[3px] w-[200vw] -translate-x-1/2 -translate-y-1/2"
            style={{ background: "var(--ink)", opacity: 0.1 }}
          />
          <BrandMark size={132} animated className="relative" />
        </div>
        <div
          aria-hidden="true"
          className="sp-word mt-5 font-display text-[44px] leading-none font-extrabold tracking-[0.06em] uppercase"
        >
          Sport<span style={{ color: "var(--accent)" }}>mapa</span>
        </div>
      </div>
    </div>
  );
}
