"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { useSportBoxSlots, buildBookingUrl, SportBoxSlot } from "@/hooks/useSportBoxSlots";
import { useProfileStore } from "@/store/useProfileStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ICONS } from "@/lib/icons";
import { cn } from "@/lib/utils";

export default function BookingPage() {
  const { data, isLoading, error, refetch } = useSportBoxSlots();
  const profile = useProfileStore();
  const [showProfile, setShowProfile] = useState(!profile.isComplete());

  // Group slots by date
  const slotsByDate: Record<string, SportBoxSlot[]> = {};
  if (data?.slots) {
    for (const slot of data.slots) {
      if (!slotsByDate[slot.date]) slotsByDate[slot.date] = [];
      slotsByDate[slot.date].push(slot);
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.getTime() === today.getTime()) return "Dnes";
    if (d.getTime() === tomorrow.getTime()) return "Zítra";
    return d.toLocaleDateString("cs-CZ", { weekday: "short", day: "numeric", month: "numeric" });
  };

  const handleSlotClick = (slot: SportBoxSlot) => {
    window.open(buildBookingUrl(slot), "_blank");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/30">
        <div>
          <h1 className="text-xl font-bold tracking-tight">SportBox Chodov</h1>
          <p className="text-[12px] text-muted-foreground">Roztylská 2321/19, Praha 4</p>
        </div>
        <div className="flex items-center gap-1">
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=50.0311,14.5053"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background transition-all active:scale-95"
            aria-label="Navigovat"
          >
            <Icon icon={ICONS.navigate} width={16} height={16} />
          </a>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Profile section */}
        <div className="mb-5">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex w-full items-center justify-between rounded-xl bg-secondary/60 backdrop-blur-sm px-4 py-3 ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
          >
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium">
                {profile.isComplete()
                  ? `${profile.fullName} · ${profile.cardNumber.slice(0, 4)}...`
                  : "Nastavit profil pro rychlou rezervaci"}
              </span>
            </div>
            <span className={cn(
              "text-xs text-muted-foreground transition-transform",
              showProfile && "rotate-180"
            )}>▼</span>
          </button>

          {showProfile && (
            <div className="mt-3 flex flex-col gap-2.5 rounded-xl bg-card/80 backdrop-blur-sm p-4 ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
              <input
                type="text"
                placeholder="Jméno a příjmení"
                value={profile.fullName}
                onChange={(e) => profile.setProfile({ fullName: e.target.value })}
                className="w-full rounded-xl bg-background px-4 py-3 text-sm border border-border/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
              <input
                type="text"
                placeholder="Číslo MultiSport karty (8 nebo 12 číslic)"
                value={profile.cardNumber}
                onChange={(e) => profile.setProfile({ cardNumber: e.target.value })}
                className="w-full rounded-xl bg-background px-4 py-3 text-sm border border-border/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
              <input
                type="email"
                placeholder="E-mail"
                value={profile.email}
                onChange={(e) => profile.setProfile({ email: e.target.value })}
                className="w-full rounded-xl bg-background px-4 py-3 text-sm border border-border/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
              <input
                type="tel"
                placeholder="Telefon (+420...)"
                value={profile.phone}
                onChange={(e) => profile.setProfile({ phone: e.target.value })}
                className="w-full rounded-xl bg-background px-4 py-3 text-sm border border-border/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
              <p className="text-[10px] text-muted-foreground/60">
                Údaje se ukládají pouze lokálně v prohlížeči.
              </p>
            </div>
          )}
        </div>

        {/* Slots section */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold">Volné termíny</h2>
          <button
            onClick={() => refetch()}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Obnovit
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Icon icon={ICONS.spinner} width={22} height={22} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-500/10 px-4 py-3 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">Nepodařilo se načíst termíny</p>
          </div>
        )}

        {/* Slots by date */}
        {data && Object.keys(slotsByDate).length > 0 && (
          <div className="flex flex-col gap-5">
            {Object.entries(slotsByDate).map(([date, slots]) => (
              <div key={date}>
                <h3 className="text-[13px] font-semibold mb-2.5 text-muted-foreground">{formatDate(date)}</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={`${slot.date}-${slot.hour}`}
                      onClick={() => handleSlotClick(slot)}
                      className="flex flex-col items-center justify-center rounded-xl bg-card/80 backdrop-blur-sm px-3 py-3 ring-1 ring-black/[0.06] dark:ring-white/[0.08] transition-all active:scale-95 hover:bg-foreground/5 hover:ring-foreground/20"
                    >
                      <span className="text-[15px] font-semibold">{slot.hour}</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">
                        {slot.available === 1 ? "1 místo" : `${slot.available} místa`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {data && data.slots.length === 0 && (
          <div className="rounded-xl bg-secondary/50 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">Žádné volné termíny</p>
          </div>
        )}

        {/* Footer info */}
        {data && (
          <p className="text-[9px] text-muted-foreground/40 text-center mt-6">
            Aktualizováno {new Date(data.fetched_at).toLocaleTimeString("cs-CZ")} · sport-box.cz
          </p>
        )}
      </div>
    </div>
  );
}
