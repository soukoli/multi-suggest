"use client";

import { useEffect } from "react";
import { SwipeStack } from "@/components/SwipeStack";
import { CategoryPills } from "@/components/CategoryPills";
import { useFacilities } from "@/hooks/useFacilities";
import { useLocationStore } from "@/store/useLocationStore";
import { Loader2 } from "lucide-react";

export default function DiscoverPage() {
  const { requestLocation } = useLocationStore();
  const { data, isLoading, error } = useFacilities();

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="px-4 pt-4 pb-1">
        <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
        <p className="text-sm text-muted-foreground">
          Kam dnes s MultiSport kartou?
        </p>
      </header>

      {/* Category filter */}
      <CategoryPills />

      {/* Card stack */}
      <div className="flex-1 pt-2">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
