import { useEffect, useRef, useState, type ReactNode } from "react";

export type Snap = "peek" | "half" | "full";

/**
 * Mobile bottom sheet with three snap points (map stays visible behind it).
 * Drag the header area; tap the handle to cycle. Reports its visible height
 * so the map can pad its camera.
 */
export function Sheet({
  snap,
  onSnap,
  header,
  children,
  onHeight,
  contentKey,
}: {
  contentKey?: string;
  snap: Snap;
  onSnap: (s: Snap) => void;
  header: ReactNode;
  children: ReactNode;
  onHeight: (px: number) => void;
}) {
  const [vh, setVh] = useState(() => window.innerHeight);
  const [drag, setDrag] = useState<number | null>(null);
  const start = useRef<{ y: number; h: number } | null>(null);
  const moved = useRef(false);

  useEffect(() => {
    const r = () => setVh(window.innerHeight);
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  const heights: Record<Snap, number> = { peek: 200, half: Math.round(vh * 0.5), full: vh - 64 };
  const h = drag ?? heights[snap];

  useEffect(() => {
    if (drag === null) onHeight(Math.min(heights[snap], heights.half));
  }, [snap, vh, drag]); // eslint-disable-line react-hooks/exhaustive-deps

  function down(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("input,button,a,label")) return;
    start.current = { y: e.clientY, h };
    moved.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    if (!start.current) return;
    const dy = start.current.y - e.clientY;
    if (Math.abs(dy) > 4) moved.current = true;
    setDrag(Math.max(110, Math.min(heights.full, start.current.h + dy)));
  }
  function up() {
    if (!start.current) return;
    const cur = drag ?? h;
    const vel = cur - start.current.h;
    start.current = null;
    setDrag(null);
    if (!moved.current) return;
    // pick nearest snap, biased in the direction of the gesture
    const order: Snap[] = ["peek", "half", "full"];
    const target = cur + Math.sign(vel) * 60;
    const next = order.reduce((best, s) => (Math.abs(heights[s] - target) < Math.abs(heights[best] - target) ? s : best), "peek" as Snap);
    onSnap(next);
  }

  return (
    <section
      className="fixed inset-x-0 bottom-0 z-20 flex flex-col rounded-t-[28px] bg-surface shadow-float md:hidden"
      style={{ height: h, transition: drag === null ? "height 320ms cubic-bezier(.2,.9,.25,1)" : "none" }}
      aria-label="Seznam míst"
    >
      <div className="touch-none select-none" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <button
          className="mx-auto mt-2 mb-1 block h-5 w-16"
          aria-label={snap === "full" ? "Zmenšit seznam" : "Zvětšit seznam"}
          onClick={() => onSnap(snap === "peek" ? "half" : snap === "half" ? "full" : "peek")}
        >
          <span className="mx-auto block h-1.5 w-10 rounded-full bg-line" />
        </button>
        {header}
      </div>
      <div key={contentKey} className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+96px)]">
        {children}
      </div>
    </section>
  );
}
