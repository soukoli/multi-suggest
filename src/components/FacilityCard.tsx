"use client";

import { FacilityWithMeta } from "@/lib/types";
import { formatDistance } from "@/lib/geo";
import { CrowdBadge } from "./CrowdBadge";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { Heart, Navigation, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { getPlaceholderImage } from "@/lib/placeholders";

interface FacilityCardProps {
  facility: FacilityWithMeta;
  className?: string;
}

export function FacilityCard({ facility, className }: FacilityCardProps) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const fav = isFavorite(facility.id);

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`;
  const imageUrl = facility.image_url || getPlaceholderImage(facility.id, facility.category);

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-3xl bg-card shadow-xl border border-border/50",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={facility.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />

        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(facility.id);
          }}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-transform active:scale-90"
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-colors",
              fav ? "fill-red-500 text-red-500" : "text-foreground"
            )}
          />
        </button>

        {/* Distance badge */}
        <div className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 backdrop-blur-sm">
          <span className="text-xs font-medium">
            {formatDistance(facility.distance)}
          </span>
        </div>

        {/* New badge */}
        {facility.is_new && (
          <div className="absolute left-3 bottom-3">
            <Badge variant="default" className="bg-emerald-500 text-white">
              Nové
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Name + address */}
        <div>
          <h3 className="text-lg font-semibold leading-tight">
            {facility.name}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {facility.address}
          </p>
        </div>

        {/* Crowd indicator */}
        <CrowdBadge
          level={facility.crowdLevel}
          goodTimes={facility.goodTimes}
        />

        {/* Activity tags */}
        <div className="flex flex-wrap gap-1.5">
          {facility.activities.slice(0, 4).map((activity) => (
            <Badge
              key={activity}
              variant="secondary"
              className="text-xs font-normal"
            >
              {activity}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 active:opacity-80"
          >
            <Navigation className="h-4 w-4" />
            Navigovat
          </a>
          {facility.website_url && (
            <a
              href={facility.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-xl border border-border px-4 py-3 transition-colors hover:bg-secondary"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
