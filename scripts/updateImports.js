const fs = require("fs");
const path = require("path");

const dirsToScan = [
  "app",
  "components",
  "billing",
  "hooks",
  "store",
  "lib",
  "services",
];
const extensions = [".ts", ".tsx"];

const replacements = [
  { from: /backend\/store/g, to: "store" },
  { from: /backend\/hooks/g, to: "hooks" },
  { from: /backend\/api/g, to: "lib" },
  { from: /src\/services/g, to: "services" },
];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (extensions.includes(path.extname(fullPath))) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  for (const r of replacements) {
    const regex = new RegExp(r.from.source, r.from.flags);
    if (regex.test(content)) {
      content = content.replace(regex, r.to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Updated imports in: ${filePath}`);
  }
}

dirsToScan.forEach((dir) => {
  if (fs.existsSync(dir)) {
    scanDir(dir);
  }
});

console.log("Import update complete.");
