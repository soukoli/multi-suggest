"use client";

import { useFilterStore } from "@/store/useFilterStore";

interface RadiusSliderProps {
  totalResults?: number;
}

/**
 * Compact radius slider showing distance range and result count.
 */
export function RadiusSlider({ totalResults }: RadiusSliderProps) {
  const { radius, setRadius } = useFilterStore();

  return (
    <div className="flex items-center gap-3 px-5 pb-2">
      {/* Radius label */}
      <span className="shrink-0 text-[11px] font-medium tabular-nums text-foreground">
        {radius} km
      </span>

      {/* Slider */}
      <input
        type="range"
        min={1}
        max={20}
        step={1}
        value={radius}
        onChange={(e) => setRadius(parseInt(e.target.value))}
        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-foreground [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
      />

      {/* Results count */}
      {totalResults !== undefined && (
        <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
          {totalResults} míst
        </span>
      )}
    </div>
  );
}
