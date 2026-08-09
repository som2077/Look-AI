/**
 * Formats a Date object to a local YYYY-MM-DD string.
 * This avoids the timezone issues of `Date.toISOString()` which uses UTC.
 */
export const toLocalDateString = (d: Date = new Date()): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
