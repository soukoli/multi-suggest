"use client";

import { useState } from "react";
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

export function FacilityCard({ facility, className }: FacilityCardProps) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const fav = isFavorite(facility.id);
  const [imageIndex, setImageIndex] = useState(0);

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}`;

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

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[24px] bg-card border border-border/40 shadow-xl shadow-black/5 dark:shadow-black/30",
        className
      )}
    >
      {/* Image section */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <img
          src={currentImage}
          alt={facility.name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getPlaceholderImage(facility.id, facility.category);
          }}
        />

        {/* Dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/20" />

        {/* Gallery dots */}
        {hasMultipleImages && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1">
            {allImages.slice(0, 5).map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setImageIndex(i); }}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i === imageIndex ? "w-3.5 bg-white" : "w-1 bg-white/50"
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

        {/* Top: distance + favorite */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex items-center gap-1">
            <div className="rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm">
              <span className="text-[11px] font-semibold text-white">
                {formatDistance(facility.distance)}
              </span>
            </div>
            {facility.is_new && (
              <div className="rounded-full bg-white/90 px-2 py-1 backdrop-blur-sm">
                <span className="text-[10px] font-bold text-black uppercase">Nové</span>
              </div>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(facility.id); }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform active:scale-90"
          >
            <Icon
              icon={fav ? ICONS.heartFilled : ICONS.heart}
              width={16} height={16}
              className={fav ? "text-red-500" : "text-white"}
            />
          </button>
        </div>

        {/* Bottom: name + address on image */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-lg font-bold text-white leading-tight drop-shadow-sm">
            {facility.name}
          </h3>
          {facility.address && (
            <p className="mt-0.5 text-[12px] text-white/75 truncate">
              {facility.address}
            </p>
          )}
        </div>
      </div>

      {/* Content section */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        {/* Info badges row - compact icons with labels */}
        <div className="flex flex-wrap items-center gap-1.5">
          {!facility.additional_payment ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
              <Icon icon={ICONS.freeEntry} width={10} height={10} />
              Zdarma
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
              + {facility.additional_payment_desc || "příplatek"}
            </span>
          )}
          {facility.kids_activities && (
            <span className="flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400">
              <Icon icon={ICONS.kids} width={10} height={10} />
              Děti
            </span>
          )}
          {facility.parking === "Yes" && (
            <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
              P
            </span>
          )}
          {facility.unlimited_oh && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
              24/7
            </span>
          )}
          {facility.self_service && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
              Self-service
            </span>
          )}
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
            {CATEGORY_LABELS[facility.category]}
          </span>
        </div>

        {/* Cards accepted */}
        {cardNames.length > 0 && (
          <div className="flex items-center gap-1">
            <Icon icon={ICONS.card} width={12} height={12} className="shrink-0 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {cardNames.map((name) => (
                <span key={name} className="text-[10px] font-medium text-muted-foreground">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Activity summary */}
        {facility.activity_summary ? (
          <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
            {facility.activity_summary}
          </p>
        ) : facility.activities.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {facility.activities.slice(0, 3).map((activity) => (
              <span key={activity} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                {activity}
              </span>
            ))}
            {facility.activities.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{facility.activities.length - 3}</span>
            )}
          </div>
        ) : null}

        {/* Crowd estimate */}
        <CrowdBadge level={facility.crowdLevel} goodTimes={facility.goodTimes} />

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-1">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-background transition-all hover:opacity-90 active:scale-[0.97]"
          >
            <Icon icon={ICONS.navigate} width={14} height={14} />
            Navigovat
          </a>
          {facility.website_url && (
            <a
              href={facility.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-full border border-border px-3.5 py-3 transition-all hover:bg-secondary active:scale-[0.97]"
            >
              <Icon icon={ICONS.externalLink} width={14} height={14} />
            </a>
          )}
        </div>

        {/* Updated timestamp */}
        {facility.updated_at && (
          <p className="text-center text-[9px] text-muted-foreground/50">
            Aktualizováno {new Date(facility.updated_at).toLocaleDateString("cs-CZ")}
          </p>
        )}
      </div>
    </div>
  );
}
