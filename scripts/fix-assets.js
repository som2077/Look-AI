const fs = require("fs");
const path = require("path");
const { fileURLToPath } = require("url");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "src");

function replaceInFile(filePath) {
  if (fs.statSync(filePath).isDirectory()) {
    fs.readdirSync(filePath).forEach((f) =>
      replaceInFile(path.join(filePath, f)),
    );
    return;
  }

  if (
    filePath.endsWith(".ts") ||
    filePath.endsWith(".tsx") ||
    filePath.endsWith(".js") ||
    filePath.endsWith(".jsx")
  ) {
    let content = fs.readFileSync(filePath, "utf8");
    let changed = false;

    const pattern = /require\(['"]\.\.\/?(\.\.\/)*assets\/(.*?)['"]\)/g;

    if (pattern.test(content)) {
      content = content.replace(pattern, 'require("@/assets/$2")');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log("Fixed assets imports in", filePath);
    }
  }
}

replaceInFile(root);
console.log("Finished updating asset imports.");
