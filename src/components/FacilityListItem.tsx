"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { FacilityWithMeta, CARD_LABELS } from "@/lib/types";
import { formatDistance } from "@/lib/geo";
import { formatAge } from "@/lib/format";
import { getPlaceholderImage } from "@/lib/placeholders";
import { ICONS } from "@/lib/icons";

interface FacilityListItemProps {
  facility: FacilityWithMeta;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShowOnMap?: () => void;
}

export const FacilityListItem = React.memo(function FacilityListItem({
  facility,
  isFavorite,
  onToggleFavorite,
  onShowOnMap,
}: FacilityListItemProps) {
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`;
  const cardNames = facility.active_cards?.map(c => CARD_LABELS[c.id] || c.name) || [];
  const facilityLink = facility.website_url || facility.facebook_url || facility.instagram_url;

  return (
    <div className="flex gap-3 rounded-2xl bg-card/80 backdrop-blur-md p-3 shadow-sm ring-1 ring-black/[0.06] dark:ring-white/[0.08] dark:bg-card/60">
      {/* Thumbnail */}
      <a
        href={facilityLink || mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="h-[68px] w-[68px] shrink-0 overflow-hidden rounded-xl bg-muted/50 ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
        onClick={(e) => e.stopPropagation()}
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
        {/* Top */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <a
              href={facilityLink || mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-semibold leading-tight hover:underline truncate text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              {facility.name}
            </a>
            <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
              {formatDistance(facility.distance)}
            </span>
          </div>

          {/* Badges */}
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {!facility.additional_payment ? (
              <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
                Zdarma
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:text-amber-400">
                Příplatek
              </span>
            )}
            {facility.kids_activities && (
              <span className="rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 dark:text-blue-400">
                Děti
              </span>
            )}
            {facility.parking === "Yes" && (
              <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[9px] font-bold text-foreground/70">P</span>
            )}
            {cardNames.length > 0 && (
              <span className="text-[9px] text-muted-foreground/70 truncate max-w-[90px]">
                {cardNames.join(" · ")}
              </span>
            )}
            {facility.updated_at && (
              <span className="text-[8px] text-muted-foreground/40 ml-auto">
                {formatAge(facility.updated_at)}
              </span>
            )}
          </div>
        </div>

        {/* Actions - 3 buttons, well spaced */}
        <div className="mt-2 flex items-center gap-2.5">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/80 backdrop-blur-sm transition-all active:scale-90 ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
            aria-label={isFavorite ? "Odebrat z oblíbených" : "Přidat do oblíbených"}
          >
            <Icon
              icon={isFavorite ? ICONS.heartFilled : ICONS.heart}
              width={16} height={16}
              className={isFavorite ? "text-red-500" : "text-muted-foreground"}
            />
          </button>

          {onShowOnMap && (
            <button
              onClick={(e) => { e.stopPropagation(); onShowOnMap(); }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/80 backdrop-blur-sm transition-all active:scale-90 ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
              aria-label="Zobrazit na mapě"
            >
              <Icon icon={ICONS.nearby} width={16} height={16} className="text-muted-foreground" />
            </button>
          )}

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all active:scale-90 shadow-sm"
            aria-label="Navigovat"
          >
            <Icon icon={ICONS.navigate} width={16} height={16} />
          </a>
        </div>
      </div>
    </div>
  );
});
