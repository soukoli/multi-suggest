"use client";

import { Icon } from "@iconify/react";
import { SwipeStack } from "@/components/SwipeStack";
import { CategoryPills } from "@/components/CategoryPills";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SyncBadge } from "@/components/SyncBadge";
import { useFacilities } from "@/hooks/useFacilities";
import { ICONS } from "@/lib/icons";

export default function DiscoverPage() {
  const { data, isLoading, error } = useFacilities();

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
          <SyncBadge lastSync={data?.meta?.last_sync} />
        </div>
        <ThemeToggle />
      </header>

      {/* Category + toggle filters */}
      <CategoryPills />

      {/* Results count */}
      {data?.meta && (
        <div className="px-5 pb-1">
          <span className="text-[11px] text-muted-foreground">
            {data.meta.total} {data.meta.total === 1 ? "místo" : data.meta.total < 5 ? "místa" : "míst"} v okruhu {data.meta.radius_km} km
          </span>
        </div>
      )}

      {/* Card stack */}
      <div className="flex-1 pt-2">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Icon icon={ICONS.spinner} width={24} height={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="px-4 py-20 text-center">
            <p className="text-sm text-destructive">
              Nepodařilo se načíst místa
            </p>
          </div>
        )}

        {data?.facilities && data.facilities.length > 0 && (
          <SwipeStack facilities={data.facilities} />
        )}

        {data?.facilities && data.facilities.length === 0 && (
          <div className="px-4 py-20 text-center">
            <p className="text-muted-foreground">
              Žádná místa v této kategorii
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
