"use client";

import { useRef, useState } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";

interface DraggableSheetProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Bottom sheet that can be dragged up/down.
 * - Default: half screen (shows map above, list below)
 * - Drag up: full list (covers map)
 * - Drag down: minimal list (shows full map)
 */
export function DraggableSheet({ children, className }: DraggableSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [snapPoint, setSnapPoint] = useState<"half" | "full" | "mini">("half");

  // Snap positions (from top of container)
  // mini = 70% from top (map visible), half = 40% from top, full = 0% (list covers all)
  const snapPositions = { mini: 70, half: 40, full: 5 };
  const currentSnap = snapPositions[snapPoint];

  const y = useMotionValue(0);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    if (velocity < -300 || offset < -80) {
      // Swiped up -> go to next higher snap
      if (snapPoint === "mini") setSnapPoint("half");
      else setSnapPoint("full");
    } else if (velocity > 300 || offset > 80) {
      // Swiped down -> go to next lower snap
      if (snapPoint === "full") setSnapPoint("half");
      else setSnapPoint("mini");
    }
  };

  return (
    <motion.div
      ref={sheetRef}
      className={`absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-[20px] bg-background shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] ${className || ""}`}
      style={{ top: `${currentSnap}%` }}
      animate={{ top: `${currentSnap}%` }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
    >
      {/* Handle */}
      <div className="flex justify-center py-2.5 cursor-grab active:cursor-grabbing">
        <div className="h-1 w-9 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-24">
        {children}
      </div>
    </motion.div>
  );
}
