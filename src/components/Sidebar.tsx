"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/discover", label: "Discover", icon: ICONS.discover, activeIcon: ICONS.discoverActive },
  { href: "/nearby", label: "Nearby", icon: ICONS.nearby, activeIcon: ICONS.nearbyActive },
  { href: "/favorites", label: "Favorites", icon: ICONS.favorites, activeIcon: ICONS.favoritesActive },
  { href: "/booking", label: "Booking", icon: ICONS.calendar, activeIcon: ICONS.calendar },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-full border-r border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[200px]"
      )}
    >
      {/* Logo/Brand */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border/30">
        {!collapsed && (
          <span className="text-base font-bold tracking-tight">MultiSuggest</span>
        )}
        {collapsed && (
          <span className="text-base font-bold mx-auto">M</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 p-2 pt-4">
        {navItems.map(({ href, label, icon, activeIcon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              )}
            >
              <Icon
                icon={isActive ? activeIcon : icon}
                width={20}
                height={20}
                className="shrink-0"
              />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-border/30">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
        >
          <span className="shrink-0 text-[16px]">{collapsed ? "→" : "←"}</span>
          {!collapsed && <span>Skrýt</span>}
        </button>
      </div>
    </aside>
  );
}
