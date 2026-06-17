/**
 * Patched version of lucide-react-native's Infinity icon.
 * The original uses `const Infinity` which Hermes parser rejects
 * because `Infinity` is a global property. Renamed to `LucideInfinity`.
 */
import createLucideIcon from 'lucide-react-native/dist/esm/createLucideIcon.mjs';

const LucideInfinity = createLucideIcon("Infinity", [
  ["path", { d: "M6 16c5 0 7-8 12-8a4 4 0 0 1 0 8c-5 0-7-8-12-8a4 4 0 1 0 0 8", key: "18ogeb" }]
]);

export { LucideInfinity as Infinity };
export { LucideInfinity as default };
