"use client";

import { formatAge, isStale } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SyncBadgeProps {
  lastSync: string | null | undefined;
}

/**
 * Small badge showing sync freshness.
 * Green: <2 days, Orange: 2-7 days, Red: >7 days
 */
export function SyncBadge({ lastSync }: SyncBadgeProps) {
  if (!lastSync) return null;

  const stale2 = isStale(lastSync, 2);
  const stale7 = isStale(lastSync, 7);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium",
        stale7
          ? "bg-red-500/10 text-red-600 dark:text-red-400"
          : stale2
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      )}
    >
      <span className={cn(
        "h-1.5 w-1.5 rounded-full",
        stale7
          ? "bg-red-500"
          : stale2
            ? "bg-amber-500"
            : "bg-emerald-500"
      )} />
      {formatAge(lastSync)}
    </span>
  );
}
