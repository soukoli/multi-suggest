"use client";

import { CrowdLevel } from "@/lib/types";
import { getCrowdLabel, getCrowdColor, getCrowdDotColor } from "@/lib/crowd-rules";
import { cn } from "@/lib/utils";

interface CrowdBadgeProps {
  level: CrowdLevel;
  goodTimes?: string;
  className?: string;
}

export function CrowdBadge({ level, goodTimes, className }: CrowdBadgeProps) {
  const label = getCrowdLabel(level);
  const textColor = getCrowdColor(level);
  const dotColor = getCrowdDotColor(level);

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="flex items-center gap-2">
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotColor)}
        />
        <span className={cn("text-sm font-medium", textColor)}>
          {label}
        </span>
      </div>
      {goodTimes && (
        <span className="text-[11px] text-muted-foreground pl-3.5">
          Dobré časy: {goodTimes}
        </span>
      )}
    </div>
  );
}
