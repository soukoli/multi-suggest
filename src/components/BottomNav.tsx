"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/discover", label: "Discover", icon: ICONS.discover, activeIcon: ICONS.discoverActive },
  { href: "/nearby", label: "Nearby", icon: ICONS.nearby, activeIcon: ICONS.nearbyActive },
  { href: "/favorites", label: "Favorites", icon: ICONS.favorites, activeIcon: ICONS.favoritesActive },
  { href: "/booking", label: "Booking", icon: ICONS.calendar, activeIcon: ICONS.calendar },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/70 backdrop-blur-xl backdrop-saturate-150 md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ href, label, icon, activeIcon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2.5 transition-all",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center rounded-full px-3 py-1 transition-all",
                isActive && "bg-foreground/8"
              )}>
                <Icon
                  icon={isActive ? activeIcon : icon}
                  width={20}
                  height={20}
                />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
