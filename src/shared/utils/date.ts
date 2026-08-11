/**
 * Formats a Date object to a local YYYY-MM-DD string.
 * This avoids the timezone issues of `Date.toISOString()` which uses UTC.
 */
export const toLocalDateString = (d: Date = new Date()): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Returns a copy of `date` normalized to local midnight. */
export const startOfDay = (d: Date): Date => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/** Whole days between `a` and `b` (absolute difference, in local time). */
export const daysBetween = (a: Date, b: Date): number => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round(Math.abs(a.getTime() - b.getTime()) / msPerDay);
};

/** Returns Monday of the week (Mon-Sun) containing `date`. */
export const getStartOfWeek = (date: Date): Date => {
  const reference = startOfDay(date);
  const dayOfWeek = reference.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  reference.setDate(reference.getDate() + offset);
  return reference;
};

/** Local short time string, e.g. "9:41 AM". */
export const formatTimeShort = (d: Date = new Date()): string =>
  d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
