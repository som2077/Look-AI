const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// ── Resolver: alias heavy icon library to pre-built CJS bundle ────────────────
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@tabler/icons-react-native": path.resolve(
    __dirname,
    "node_modules/@tabler/icons-react-native/dist/cjs/tabler-icons-react-native.cjs",
  ),
};

// ── Transformer: inline requires so modules load lazily ───────────────────────
config.transformer = {
  ...config.transformer,
  inlineRequires: true,
};



// Apply NativeWind
module.exports = withNativeWind(config, { input: "./global.css" });

