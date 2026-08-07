const fs = require("fs");
const path = require("path");

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith(".tsx") || file.endsWith(".ts")) {
        results.push(file);
      }
    }
  });
  return results;
}

const dirsToWalk = ["./app", "./components", "./screens"];
let files = [];
dirsToWalk.forEach((dir) => {
  files = files.concat(walk(dir));
});

files.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");
  let changed = false;

  // Soften harsh shadows
  const newOpacity = content.replace(
    /shadowOpacity:\s*0\.[1-9][0-9]*/g,
    "shadowOpacity: 0.04",
  );
  if (newOpacity !== content) {
    content = newOpacity;
    changed = true;
  }

  // Update offset
  const newOffset = content.replace(
    /shadowOffset:\s*{\s*width:\s*\d+,\s*height:\s*[5-9]+\s*}/g,
    "shadowOffset: { width: 0, height: 4 }",
  );
  if (newOffset !== content) {
    content = newOffset;
    changed = true;
  }

  // Reduce elevation for Android
  const newElevation = content.replace(
    /elevation:\s*([4-9]|[1-9][0-9]+)/g,
    "elevation: 2",
  );
  if (newElevation !== content) {
    content = newElevation;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`Updated shadows in ${file}`);
  }
});
