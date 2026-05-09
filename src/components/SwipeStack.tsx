"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { FacilityWithMeta } from "@/lib/types";
import { FacilityCard } from "./FacilityCard";
import { RefreshCw } from "lucide-react";

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
        <p className="text-muted-foreground">Žádná další místa</p>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/80"
        >
          <RefreshCw className="h-4 w-4" />
          Začít znovu
        </button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-sm px-4">
      {/* Counter */}
      <div className="mb-3 text-center">
        <span className="text-xs text-muted-foreground">
          {currentIndex + 1} / {facilities.length}
        </span>
      </div>

      {/* Card Stack */}
      <div className="relative h-[520px]">
        {/* Background card (next) */}
        {nextFacility && (
          <div className="absolute inset-0 scale-[0.95] opacity-60">
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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{
              x: direction === "right" ? 300 : -300,
              opacity: 0,
              scale: 0.8,
              transition: { duration: 0.3 },
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <FacilityCard facility={currentFacility} className="h-full" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Swipe hint */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Swipni pro další
      </p>
    </div>
  );
}
