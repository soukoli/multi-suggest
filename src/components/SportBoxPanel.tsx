"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useSportBoxSlots, buildBookingUrl, SportBoxSlot } from "@/hooks/useSportBoxSlots";
import { useProfileStore } from "@/store/useProfileStore";
import { ICONS } from "@/lib/icons";

interface SportBoxPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SportBoxPanel({ open, onClose }: SportBoxPanelProps) {
  const { data, isLoading, error } = useSportBoxSlots();
  const profile = useProfileStore();
  const [showSettings, setShowSettings] = useState(!profile.isComplete());

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
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col bg-background"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/30">
            <div>
              <h2 className="text-lg font-bold">SportBox Chodov</h2>
              <p className="text-[11px] text-muted-foreground">Roztylská 2321/19, Praha 4</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=50.0311,14.5053"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background"
              >
                <Icon icon={ICONS.navigate} width={16} height={16} />
              </a>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary"
              >
                <Icon icon={ICONS.close} width={18} height={18} className="text-foreground" />
              </button>
            </div>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Profile settings (collapsible) */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex w-full items-center justify-between rounded-xl bg-secondary/50 px-3 py-2.5 mb-3"
            >
              <span className="text-[12px] font-medium">
                {profile.isComplete() ? `${profile.fullName} · ${profile.cardNumber}` : "⚙️ Nastavit profil"}
              </span>
              <span className="text-[10px] text-muted-foreground">{showSettings ? "▲" : "▼"}</span>
            </button>

            {showSettings && (
              <div className="flex flex-col gap-2 mb-4 p-3 rounded-xl bg-secondary/30">
                <input
                  type="text"
                  placeholder="Jméno a příjmení"
                  value={profile.fullName}
                  onChange={(e) => profile.setProfile({ fullName: e.target.value })}
                  className="w-full rounded-lg bg-background px-3 py-2.5 text-sm border border-border/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
                <input
                  type="text"
                  placeholder="Číslo MultiSport karty (8 nebo 12 číslic)"
                  value={profile.cardNumber}
                  onChange={(e) => profile.setProfile({ cardNumber: e.target.value })}
                  className="w-full rounded-lg bg-background px-3 py-2.5 text-sm border border-border/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
                <input
                  type="email"
                  placeholder="E-mail"
                  value={profile.email}
                  onChange={(e) => profile.setProfile({ email: e.target.value })}
                  className="w-full rounded-lg bg-background px-3 py-2.5 text-sm border border-border/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
                <input
                  type="tel"
                  placeholder="Telefon (+420...)"
                  value={profile.phone}
                  onChange={(e) => profile.setProfile({ phone: e.target.value })}
                  className="w-full rounded-lg bg-background px-3 py-2.5 text-sm border border-border/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
                <p className="text-[10px] text-muted-foreground">
                  Údaje se ukládají lokálně v prohlížeči. Slouží pro rychlejší rezervaci.
                </p>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-center py-10">
                <Icon icon={ICONS.spinner} width={20} height={20} className="animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-center text-sm text-destructive py-6">
                Nepodařilo se načíst termíny
              </p>
            )}

            {/* Slots by date */}
            {data && Object.keys(slotsByDate).length > 0 && (
              <div className="flex flex-col gap-4">
                {Object.entries(slotsByDate).map(([date, slots]) => (
                  <div key={date}>
                    <h3 className="text-[13px] font-semibold mb-2">{formatDate(date)}</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={`${slot.date}-${slot.hour}`}
                          onClick={() => handleSlotClick(slot)}
                          className="flex flex-col items-center rounded-xl bg-card/80 backdrop-blur-sm px-3 py-2.5 ring-1 ring-black/[0.06] dark:ring-white/[0.08] transition-all active:scale-95 hover:bg-foreground/5"
                        >
                          <span className="text-[14px] font-semibold">{slot.hour}</span>
                          <span className="text-[9px] text-muted-foreground">
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
              <p className="text-center text-sm text-muted-foreground py-6">
                Žádné volné termíny
              </p>
            )}

            {/* Info footer */}
            {data && (
              <p className="text-[9px] text-muted-foreground/50 text-center mt-4">
                Aktualizováno: {new Date(data.fetched_at).toLocaleTimeString("cs-CZ")}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
