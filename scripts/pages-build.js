/**
 * Копирует статику в dist/ для Cloudflare Pages (output directory = dist).
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

var SKIP = new Set([
  "node_modules",
  "dist",
  ".git",
  "scripts",
  ".cursor",
  "Night-Store-Marketplace",
  ".github",
]);

function copyEntry(name) {
  if (SKIP.has(name)) return;
  var src = path.join(root, name);
  var dest = path.join(dist, name);
  var st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.cpSync(src, dest, { recursive: true, errorOnExist: false });
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
}
fs.mkdirSync(dist, { recursive: true });

fs.readdirSync(root).forEach(copyEntry);
console.log("Night Store: copied static files to dist/");
