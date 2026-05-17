/**
 * Format a date string as human-friendly relative time.
 * Examples: "před 3 min", "před 2 hod", "před 5 dny"
 */
export function formatAge(dateStr: string | null | undefined): string {
  if (!dateStr) return "";

  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return "právě teď";

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "právě teď";
  if (minutes < 60) return `před ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `před ${hours} hod`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "včera";
  if (days < 7) return `před ${days} dny`;

  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "před týdnem";
  if (weeks < 5) return `před ${weeks} týdny`;

  const months = Math.floor(days / 30);
  if (months === 1) return "před měsícem";
  return `před ${months} měsíci`;
}

/**
 * Returns true if the date is older than the given threshold (in days).
 */
export function isStale(dateStr: string | null | undefined, thresholdDays = 7): boolean {
  if (!dateStr) return true;
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff > thresholdDays * 24 * 60 * 60 * 1000;
}
