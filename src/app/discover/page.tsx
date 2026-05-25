"use client";

import { Icon } from "@iconify/react";
import { SwipeStack } from "@/components/SwipeStack";
import { CategoryPills } from "@/components/CategoryPills";
import { RadiusSlider } from "@/components/RadiusSlider";
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

      {/* Radius slider + results count */}
      <RadiusSlider totalResults={data?.meta?.total} />

      {/* Card stack */}
      <div className="flex-1 pt-1">
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
