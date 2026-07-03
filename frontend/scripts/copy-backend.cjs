/**
 * Copies backend/src into frontend/server at build time.
 * This allows Vercel serverless functions in frontend/api/ to require("../server/app")
 */
const fs = require("fs");
const path = require("path");

const srcDir = path.resolve(__dirname, "../../backend/src");
const destDir = path.resolve(__dirname, "../server");

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log("📦 Copying backend/src → frontend/server...");
copyDir(srcDir, destDir);
console.log("✅ Backend copied successfully.");
