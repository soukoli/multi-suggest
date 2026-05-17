"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { FacilityWithMeta, CARD_LABELS, CATEGORY_LABELS } from "@/lib/types";
import { formatDistance } from "@/lib/geo";
import { CrowdBadge } from "./CrowdBadge";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { getPlaceholderImage } from "@/lib/placeholders";

interface FacilityCardProps {
  facility: FacilityWithMeta;
  className?: string;
}

/**
 * Get the best link for a facility (web > facebook > instagram > multisport page)
 */
function getFacilityLink(facility: FacilityWithMeta): string | null {
  if (facility.website_url) return facility.website_url;
  if (facility.facebook_url) return facility.facebook_url;
  if (facility.instagram_url) return facility.instagram_url;
  return null;
}

export const FacilityCard = React.memo(function FacilityCard({ facility, className }: FacilityCardProps) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const fav = isFavorite(facility.id);
  const [imageIndex, setImageIndex] = useState(0);

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`;
  const facilityLink = getFacilityLink(facility);

  // Build image array: main image + gallery
  const allImages: string[] = [];
  if (facility.image_url) allImages.push(facility.image_url);
  if (facility.gallery_images?.length) {
    for (const img of facility.gallery_images) {
      if (img && !allImages.includes(img)) allImages.push(img);
    }
  }
  if (allImages.length === 0) {
    allImages.push(getPlaceholderImage(facility.id, facility.category));
  }

  const currentImage = allImages[imageIndex] || allImages[0];
  const hasMultipleImages = allImages.length > 1;

  // Card type names
  const cardNames = facility.active_cards?.map(c => CARD_LABELS[c.id] || c.name) || [];

  // Social links available
  const hasLinks = facility.website_url || facility.facebook_url || facility.instagram_url;

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[22px] bg-card shadow-lg shadow-black/8 dark:shadow-black/40 ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
        className
      )}
    >
      {/* Image section - taller aspect ratio, more immersive */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={currentImage}
          alt={facility.name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getPlaceholderImage(facility.id, facility.category);
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />

        {/* Gallery dots */}
        {hasMultipleImages && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1">
            {allImages.slice(0, 5).map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setImageIndex(i); }}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i === imageIndex ? "w-4 bg-white" : "w-1 bg-white/40"
                )}
              />
            ))}
          </div>
        )}

        {/* Tap zones for gallery */}
        {hasMultipleImages && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-1/3" onClick={(e) => { e.stopPropagation(); setImageIndex(Math.max(0, imageIndex - 1)); }} />
            <div className="absolute right-0 top-0 bottom-0 w-1/3" onClick={(e) => { e.stopPropagation(); setImageIndex(Math.min(allImages.length - 1, imageIndex + 1)); }} />
          </>
        )}

        {/* Top: distance + category + favorite */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
              {formatDistance(facility.distance)}
            </span>
            <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              {CATEGORY_LABELS[facility.category]}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(facility.id); }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-transform active:scale-90"
          >
            <Icon
              icon={fav ? ICONS.heartFilled : ICONS.heart}
              width={16} height={16}
              className={fav ? "text-red-500" : "text-white"}
            />
          </button>
        </div>

        {/* Bottom overlay: name + address */}
        <div className="absolute inset-x-0 bottom-0 p-4 pb-3">
          <h3 className="text-[17px] font-bold text-white leading-snug drop-shadow-sm">
            {facility.name}
          </h3>
          {facility.address && (
            <p className="mt-0.5 text-[11px] text-white/70 truncate">
              {facility.address}
            </p>
          )}
        </div>
      </div>

      {/* Content section - compact, dense info */}
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        {/* Status badges row */}
        <div className="flex flex-wrap items-center gap-1">
          {!facility.additional_payment ? (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Zdarma
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              {facility.additional_payment_desc || "+ příplatek"}
            </span>
          )}
          {facility.kids_activities && (
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              Děti
            </span>
          )}
          {facility.parking === "Yes" && (
            <span className="rounded-full bg-foreground/8 px-2 py-0.5 text-[10px] font-bold text-foreground">
              P
            </span>
          )}
          {facility.unlimited_oh && (
            <span className="rounded-full bg-foreground/8 px-2 py-0.5 text-[10px] font-semibold text-foreground">
              24/7
            </span>
          )}
          {facility.is_new && (
            <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold text-background uppercase">
              Nové
            </span>
          )}
        </div>

        {/* Cards accepted */}
        {cardNames.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Icon icon={ICONS.card} width={11} height={11} className="shrink-0 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {cardNames.join(" · ")}
            </span>
          </div>
        )}

        {/* Activity summary - compact */}
        {facility.activity_summary ? (
          <p className="text-[11px] leading-snug text-muted-foreground line-clamp-2">
            {facility.activity_summary}
          </p>
        ) : facility.activities.length > 0 ? (
          <p className="text-[11px] text-muted-foreground line-clamp-1">
            {facility.activities.slice(0, 4).join(" · ")}
          </p>
        ) : null}

        {/* Crowd */}
        <CrowdBadge level={facility.crowdLevel} goodTimes={facility.goodTimes} />

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-1">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background transition-all active:scale-[0.97]"
          >
            <Icon icon={ICONS.navigate} width={14} height={14} />
            Navigovat
          </a>
          {hasLinks && (
            <a
              href={facilityLink!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-full border border-border px-3.5 py-2.5 transition-all hover:bg-secondary active:scale-[0.97]"
            >
              <Icon icon={ICONS.externalLink} width={14} height={14} />
            </a>
          )}
        </div>

        {/* Footer: links + updated */}
        <div className="flex items-center justify-between pt-0.5">
          {/* Social links */}
          <div className="flex items-center gap-2">
            {facility.facebook_url && (
              <a href={facility.facebook_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground/60 hover:text-foreground transition-colors">
                <span className="text-[10px] font-medium">FB</span>
              </a>
            )}
            {facility.instagram_url && (
              <a href={facility.instagram_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground/60 hover:text-foreground transition-colors">
                <span className="text-[10px] font-medium">IG</span>
              </a>
            )}
          </div>
          {/* Updated timestamp */}
          {facility.updated_at && (
            <span className="text-[9px] text-muted-foreground/40">
              {new Date(facility.updated_at).toLocaleDateString("cs-CZ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
