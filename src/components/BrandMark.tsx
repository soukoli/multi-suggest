import { useId } from "react";

/*
 * Sportmapa mark: a dashed "centre-circle" court line (the search radius)
 * with a chalk centre spot. Gaps sit on the cardinal axes so a halfway line
 * can pass through. Colours follow the theme via CSS vars.
 *
 * animated: the ring sweeps in while drawing itself, the spot lands with a
 * small overshoot and sends one "lock-on" ping out to the ring.
 */
const CSS = `
.bm-anim .bm-ring{transform-box:view-box;transform-origin:256px 256px;animation:bm-spin .85s cubic-bezier(.2,.8,.2,1) both}
.bm-anim .bm-draw{animation:bm-draw .75s cubic-bezier(.65,0,.35,1) both}
.bm-anim .bm-spot{transform-box:fill-box;transform-origin:center;animation:bm-land .4s .5s cubic-bezier(.3,1.6,.5,1) both}
.bm-anim .bm-ping{transform-box:fill-box;transform-origin:center;animation:bm-ping .65s .78s cubic-bezier(.2,.7,.3,1) forwards}
.bm-ping{opacity:0}
@keyframes bm-spin{from{transform:rotate(-140deg)}to{transform:none}}
@keyframes bm-draw{from{stroke-dashoffset:943}to{stroke-dashoffset:0}}
@keyframes bm-land{from{transform:scale(0)}to{transform:none}}
@keyframes bm-ping{from{opacity:.6;transform:scale(1)}to{opacity:0;transform:scale(2.55)}}
@media (prefers-reduced-motion:reduce){.bm-anim *{animation:none!important}}
`;

type Props = { size?: number; animated?: boolean; className?: string };

export function BrandMark({ size = 32, animated = false, className = "" }: Props) {
  const mask = `bm${useId().replace(/[^\w-]/g, "")}`;
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      aria-hidden="true"
      className={`${animated ? "bm-anim" : ""} ${className}`}
    >
      {animated && <style>{CSS}</style>}
      {animated && (
        <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
          <circle
            className="bm-draw"
            cx="256"
            cy="256"
            r="150"
            fill="none"
            stroke="#fff"
            strokeWidth="60"
            strokeDasharray="943 943"
            transform="rotate(-90 256 256)"
          />
        </mask>
      )}
      <g className="bm-ring" mask={animated ? `url(#${mask})` : undefined}>
        <circle
          cx="256"
          cy="256"
          r="150"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="26"
          strokeLinecap="round"
          strokeDasharray="62 55.81"
          strokeDashoffset="89.9"
        />
      </g>
      {animated && <circle className="bm-ping" cx="256" cy="256" r="58" fill="none" stroke="var(--accent)" strokeWidth="6" />}
      <g className="bm-spot">
        <circle cx="256" cy="256" r="58" fill="var(--ink)" />
        <circle cx="256" cy="256" r="30" fill="var(--accent)" />
      </g>
    </svg>
  );
}
