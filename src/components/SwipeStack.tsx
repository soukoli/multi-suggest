"use client";

import { useState, useCallback } from "react";
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
  const [prevFacilities, setPrevFacilities] = useState(facilities);

  // Reset index when facilities array changes
  if (prevFacilities !== facilities) {
    setPrevFacilities(facilities);
    setCurrentIndex(0);
    setDirection(null);
  }

  const currentFacility = facilities[currentIndex];
  const nextFacility = facilities[currentIndex + 1];
  const prevFacility = facilities[currentIndex - 1];

  const handleNext = useCallback(() => {
    if (currentIndex < facilities.length - 1) {
      setDirection("left");
      setCurrentIndex((i) => i + 1);
    } else {
      onEmpty?.();
    }
  }, [currentIndex, facilities.length, onEmpty]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection("right");
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 80;

    if (info.offset.x < -threshold) {
      // Swiped LEFT → next card
      handleNext();
    } else if (info.offset.x > threshold) {
      // Swiped RIGHT → previous card
      handlePrev();
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
      {/* Card Stack - responsive height */}
      <div className="relative h-[calc(100dvh-280px)] min-h-[400px] max-h-[600px]">
        {/* Background card (next or prev depending on direction) */}
        {(direction === "left" ? nextFacility : prevFacility || nextFacility) && (
          <div className="absolute inset-x-2 inset-y-0 translate-y-2 scale-[0.96] opacity-40">
            <FacilityCard
              facility={(direction === "right" && prevFacility) ? prevFacility : (nextFacility || currentFacility)}
              className="h-full"
            />
          </div>
        )}

        {/* Active card */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentFacility.id}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={handleDragEnd}
            initial={{
              x: direction === "left" ? 300 : direction === "right" ? -300 : 0,
              scale: 0.9,
              opacity: 0,
            }}
            animate={{ x: 0, scale: 1, opacity: 1 }}
            exit={{
              x: direction === "left" ? -300 : 300,
              opacity: 0,
              scale: 0.85,
              rotate: direction === "left" ? -6 : 6,
              transition: { duration: 0.3, ease: "easeOut" },
            }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <FacilityCard facility={currentFacility} className="h-full" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Position indicator + counter */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground disabled:opacity-30 transition-opacity"
        >
          <span className="text-sm">←</span>
        </button>
        <span className="text-[12px] font-medium tabular-nums text-muted-foreground">
          {currentIndex + 1} / {facilities.length}
        </span>
        <button
          onClick={handleNext}
          disabled={currentIndex >= facilities.length - 1}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground disabled:opacity-30 transition-opacity"
        >
          <span className="text-sm">→</span>
        </button>
      </div>
    </div>
  );
}
