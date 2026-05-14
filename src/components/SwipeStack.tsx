"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Icon } from "@iconify/react";
import { FacilityWithMeta } from "@/lib/types";
import { FacilityCard } from "./FacilityCard";
import { ICONS } from "@/lib/icons";

interface SwipeStackProps {
  facilities: FacilityWithMeta[];
  onEmpty?: () => void;
}

export function SwipeStack({ facilities, onEmpty }: SwipeStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  // Reset index when facilities change (category filter changed)
  useEffect(() => {
    setCurrentIndex(0);
    setDirection(null);
  }, [facilities]);

  const currentFacility = facilities[currentIndex];
  const nextFacility = facilities[currentIndex + 1];

  const handleNext = useCallback(() => {
    if (currentIndex < facilities.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onEmpty?.();
    }
  }, [currentIndex, facilities.length, onEmpty]);

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 100;

    if (Math.abs(info.offset.x) > threshold) {
      setDirection(info.offset.x > 0 ? "right" : "left");
      handleNext();
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setDirection(null);
  };

  if (!currentFacility) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm text-muted-foreground">Žádná další místa</p>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90 active:scale-[0.97]"
        >
          <Icon icon={ICONS.restart} width={16} height={16} />
          Začít znovu
        </button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-sm px-5">
      {/* Progress indicator */}
      <div className="mb-4 flex items-center justify-center gap-2">
        <div className="h-0.5 flex-1 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground/60 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / facilities.length) * 100}%` }}
          />
        </div>
        <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
          {currentIndex + 1}/{facilities.length}
        </span>
      </div>

      {/* Card Stack */}
      <div className="relative h-[580px]">
        {/* Background card (next) */}
        {nextFacility && (
          <div className="absolute inset-x-2 inset-y-0 translate-y-2 scale-[0.96] opacity-50 blur-[0.5px]">
            <FacilityCard facility={nextFacility} className="h-full" />
          </div>
        )}

        {/* Active card */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentFacility.id}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{
              x: direction === "right" ? 300 : -300,
              opacity: 0,
              scale: 0.85,
              rotate: direction === "right" ? 8 : -8,
              transition: { duration: 0.35, ease: "easeOut" },
            }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
          >
            <FacilityCard facility={currentFacility} className="h-full" />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
