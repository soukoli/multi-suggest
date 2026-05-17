"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { FacilityWithMeta, CARD_LABELS } from "@/lib/types";
import { formatDistance } from "@/lib/geo";
import { getPlaceholderImage } from "@/lib/placeholders";
import { CrowdBadge } from "./CrowdBadge";
import { ICONS } from "@/lib/icons";

interface FacilityListItemProps {
  facility: FacilityWithMeta;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const FacilityListItem = React.memo(function FacilityListItem({
  facility,
  isFavorite,
  onToggleFavorite,
}: FacilityListItemProps) {
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`;
  const cardNames = facility.active_cards?.map(c => CARD_LABELS[c.id] || c.name) || [];
  const facilityLink = facility.website_url || facility.facebook_url || facility.instagram_url;

  return (
    <div className="flex gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
      {/* Thumbnail */}
      <a
        href={facilityLink || mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-muted"
      >
        <img
          src={facility.image_url || getPlaceholderImage(facility.id, facility.category)}
          alt={facility.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </a>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <a
              href={facilityLink || mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-semibold leading-tight hover:underline truncate"
            >
              {facility.name}
            </a>
            <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
              {formatDistance(facility.distance)}
            </span>
          </div>
          {/* Badges */}
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {!facility.additional_payment ? (
              <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                Zdarma
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                Příplatek
              </span>
            )}
            {facility.kids_activities && (
              <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600 dark:text-blue-400">
                Děti
              </span>
            )}
            {facility.parking === "Yes" && (
              <span className="rounded-full bg-foreground/8 px-1.5 py-0.5 text-[9px] font-bold text-foreground">P</span>
            )}
            {cardNames.length > 0 && (
              <span className="text-[9px] text-muted-foreground truncate max-w-[100px]">
                {cardNames.join(" · ")}
              </span>
            )}
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between">
          <CrowdBadge level={facility.crowdLevel} />
          <div className="flex gap-1">
            <button
              onClick={onToggleFavorite}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary transition-colors"
            >
              <Icon
                icon={isFavorite ? ICONS.heartFilled : ICONS.heart}
                width={12} height={12}
                className={isFavorite ? "text-red-500" : "text-muted-foreground"}
              />
            </button>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background"
            >
              <Icon icon={ICONS.navigate} width={12} height={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});
