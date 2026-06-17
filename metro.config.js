const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ── Resolver: alias heavy icon library to pre-built CJS bundle ────────────────
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@tabler/icons-react-native": path.resolve(
    __dirname,
    "node_modules/@tabler/icons-react-native/dist/cjs/tabler-icons-react-native.cjs"
  ),
};

// ── Transformer: inline requires so modules load lazily ───────────────────────
config.transformer = {
  ...config.transformer,
  inlineRequires: true,
};

// ── Resolver: fix Hermes crash on lucide-react-native Infinity icon ───────────
// lucide-react-native exports `const Infinity = createLucideIcon(...)` which
// Hermes parser rejects because `Infinity` is a reserved global property.
// We intercept the request and serve a patched file that renames it.
const INFINITY_ICON_RE = /lucide-react-native[/\\]dist[/\\]esm[/\\]icons[/\\]infinity\.mjs$/;
const PATCHED_INFINITY = path.resolve(__dirname, "patches/lucide-infinity-patched.mjs");

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (INFINITY_ICON_RE.test(context.originModulePath) || INFINITY_ICON_RE.test(moduleName)) {
    return { filePath: PATCHED_INFINITY, type: "sourceFile" };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });

