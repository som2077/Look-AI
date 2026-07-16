const fs = require("fs");
const path = require("path");

// __dirname may be undefined in some environments (ESM). Use process.cwd() for robustness.
const badgeDir = path.join(process.cwd(), "assets", "badge");

// Colors mapping: Gray -> Gold
const colorMap = {
  "#F2F4F7": "#FFF1D0", // Base hexagon
  "#A6A6A6": "#F4C430", // Border
  "#7A7A7A": "#996515", // Text/Icon
  "#AEAEAE": "#D4AF37", // Shadows/Inner depth
};

function processBadge(filename) {
  if (!filename.endsWith(".svg") || filename.includes("-gold")) return;

  const filePath = path.join(badgeDir, filename);
  let content = fs.readFileSync(filePath, "utf-8");

  for (const [gray, gold] of Object.entries(colorMap)) {
    // Replace exact hex (case-insensitive if needed, though they are uppercase in the svg)
    const regex = new RegExp(gray, "gi");
    content = content.replace(regex, gold);
  }

  const newFileName = filename.replace(".svg", "-gold.svg");
  const newFilePath = path.join(badgeDir, newFileName);
  fs.writeFileSync(newFilePath, content, "utf-8");
  console.log(`Created ${newFileName}`);
}

const files = fs.readdirSync(badgeDir);
files.forEach(processBadge);
console.log("Done.");
