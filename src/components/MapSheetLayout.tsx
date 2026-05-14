"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface MapSheetLayoutProps {
  mapContent: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Layout with map on top and scrollable list below.
 * Map can be expanded/collapsed by tapping the handle.
 */
export function MapSheetLayout({ mapContent, children }: MapSheetLayoutProps) {
  const [mapExpanded, setMapExpanded] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] overflow-hidden">
      {/* Map section - animated height */}
      <motion.div
        className="shrink-0 overflow-hidden"
        animate={{ height: mapExpanded ? "55%" : "30%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {mapContent}
      </motion.div>

      {/* Divider handle - tap to toggle */}
      <button
        onClick={() => setMapExpanded(!mapExpanded)}
        className="flex items-center justify-center py-2 bg-background border-t border-border/50 shrink-0"
      >
        <div className="h-1 w-8 rounded-full bg-muted-foreground/30" />
      </button>

      {/* List section - scrollable */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  );
}
