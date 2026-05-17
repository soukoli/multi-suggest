"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface MapSheetLayoutProps {
  mapContent: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Responsive layout:
 * - Mobile (<640px): No map, just scrollable list (full height)
 * - Tablet+ (>=640px): Map on top (expandable) + list below
 */
export function MapSheetLayout({ mapContent, children }: MapSheetLayoutProps) {
  const [mapExpanded, setMapExpanded] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] overflow-hidden">
      {/* Map section - hidden on mobile, visible on sm+ */}
      <motion.div
        className="hidden sm:block shrink-0 overflow-hidden"
        animate={{ height: mapExpanded ? "55%" : "35%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {mapContent}
      </motion.div>

      {/* Divider handle - only on sm+ where map is visible */}
      <button
        onClick={() => setMapExpanded(!mapExpanded)}
        className="hidden sm:flex items-center justify-center py-2 bg-background border-t border-border/50 shrink-0"
      >
        <div className="h-1 w-8 rounded-full bg-muted-foreground/25" />
      </button>

      {/* List section - scrollable, full height on mobile */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  );
}
